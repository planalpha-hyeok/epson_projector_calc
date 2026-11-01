/*
 * 측면도 / 정면도 SVG 생성 (DOM 사용 안 함, SVG 문자열 반환)
 *
 * 좌표는 모두 mm.
 *   측면도: x = 스크린에서 프로젝터 쪽으로의 거리, y = 높이
 *   정면도: x = 스크린 중심 기준 좌우(+ 오른쪽), y = 높이
 * 렌즈 중심 가능 영역은 사각형으로 그린다. 실제로는 상하·좌우를 동시에 최대로 쓸 수 없어 더 좁다.
 */
(function (root) {
  const U = root.EPC.units;
  const W = 600;
  const H = 320;
  const FONT = 17;
  const PAD = { l: 84, r: 24, t: 26, b: 52 };
  // 색은 CSS 클래스(d-*)로 지정한다 (css/style.css 의 테마 토큰 사용, 다크 모드 대응)
  const C = { screen: 'screen', panel: 'panel', region: 'region', beam: 'beam', line: 'line', text: 'text' };

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = (v) => Math.round(v * 10) / 10;

  /** 실제 범위 → SVG 좌표 변환기 (x, y 같은 배율, y 는 위로 증가) */
  function makeScale(xMin, xMax, yMin, yMax, flipX) {
    const sx = (W - PAD.l - PAD.r) / Math.max(xMax - xMin, 1);
    const sy = (H - PAD.t - PAD.b) / Math.max(yMax - yMin, 1);
    const s = Math.min(sx, sy);
    const usedW = (xMax - xMin) * s;
    const usedH = (yMax - yMin) * s;
    const ox = PAD.l + (W - PAD.l - PAD.r - usedW) / 2;
    const oy = PAD.t + (H - PAD.t - PAD.b - usedH) / 2;
    return {
      X: (x) => n(flipX ? ox + (xMax - x) * s : ox + (x - xMin) * s),
      Y: (y) => n(oy + (yMax - y) * s)
    };
  }

  const line = (x1, y1, x2, y2, cls, w, dash) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-${cls}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  // 채움색도 클래스로 지정 (두 번째 색 인자는 사용하지 않음, 호출부 호환용)
  const rect = (x1, y1, x2, y2, cls, _fill, dash) =>
    `<rect x="${Math.min(x1, x2)}" y="${Math.min(y1, y2)}" width="${n(Math.abs(x2 - x1))}" height="${n(Math.abs(y2 - y1))}" class="d-${cls}" stroke-width="1.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const text = (x, y, s, anchor, cls) =>
    `<text x="${x}" y="${y}" font-size="${FONT}" class="d-${cls || C.text}" text-anchor="${anchor || 'start'}">${esc(s)}</text>`;
  const svg = (title, body) =>
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}">${body}</svg>`;

  /**
   * 측면도
   * @param {object} d
   *   screenBottom, screenH, panelH, distWide, distTele (mm)
   *   lensMin, lensMax (mm, 바닥 기준) 또는 null
   *   ceiling (mm) 또는 null, hasFloor (바닥 높이 입력 여부), unit
   */
  function sideView(d) {
    const f = (mm) => U.format(mm, d.unit);
    const center = d.screenBottom + d.screenH / 2;
    const pTop = center + d.panelH / 2;
    const pBot = center - d.panelH / 2;
    const top = d.screenBottom + d.screenH;
    const hasLens = d.lensMin !== null && d.lensMax !== null;
    const lMin = hasLens ? d.lensMin : center;
    const lMax = hasLens ? d.lensMax : center;

    const yVals = [pBot, pTop, lMin, lMax, d.screenBottom, top];
    if (d.hasFloor) yVals.push(0);
    if (d.ceiling) yVals.push(d.ceiling);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);
    // 뒷벽(방 깊이)이 있으면 그림 범위에 포함
    const xEnd = Math.max(d.distTele * 1.05, d.depth ? d.depth * 1.03 : 0);
    const S = makeScale(0, xEnd, yMin, yMax, true);

    let b = '';
    if (d.hasFloor) b += line(S.X(xEnd), S.Y(0), S.X(0), S.Y(0), C.line, 1.5) + text(S.X(xEnd), S.Y(0) + FONT + 2, '바닥');
    // 천장 글자는 렌즈 높이 숫자와 겹치지 않도록 가운데에 표시
    if (d.ceiling) b += line(S.X(xEnd), S.Y(d.ceiling), S.X(0), S.Y(d.ceiling), C.line, 1.5) + text((S.X(xEnd) + S.X(0)) / 2, S.Y(d.ceiling) - 4, '천장', 'middle');

    if (d.depth) {
      b += line(S.X(d.depth), S.Y(yMax), S.X(d.depth), S.Y(yMin), C.line, 1.5, '6 3') + text(S.X(d.depth) + 4, S.Y(yMax) + FONT, '뒷벽', 'start');
    }

    // 빔: WIDE 위치, 렌즈 범위 중앙에서 패널 상하단으로
    const bx = S.X(d.distWide);
    const by = S.Y((lMin + lMax) / 2);
    b += line(bx, by, S.X(0), S.Y(pTop), C.beam, 1, '4 3') + line(bx, by, S.X(0), S.Y(pBot), C.beam, 1, '4 3');

    // 스크린 / 패널 영상
    b += line(S.X(0), S.Y(pBot), S.X(0), S.Y(pTop), C.panel, 2, '3 3');
    b += line(S.X(0), S.Y(d.screenBottom), S.X(0), S.Y(top), C.screen, 5);
    b += text(S.X(0) - 6, S.Y(top) - 4, `스크린 ${f(d.screenH)}`, 'end', C.screen);
    if (d.hasFloor) b += text(S.X(0) - 6, S.Y(d.screenBottom) + FONT + 2, `하단 ${f(d.screenBottom)}`, 'end', C.screen);

    // 렌즈 중심 가능 영역
    // WIDE = TELE (고정 초점) 이면 폭 0 이 되므로 최소 4px 로 그림
    const xT = S.X(d.distTele);
    const xW = Math.abs(S.X(d.distWide) - xT) < 4 ? xT + 4 : S.X(d.distWide);
    if (hasLens) {
      b += rect(xT, S.Y(lMax), xW, S.Y(lMin), C.region, null);
      if (d.hasFloor) {
        b += text(S.X(d.distTele) - 4, S.Y(lMax) + 4, f(lMax), 'end', C.region);
        b += text(S.X(d.distTele) - 4, S.Y(lMin) + 4, f(lMin), 'end', C.region);
      }
    } else {
      b += line(S.X(d.distTele), by, S.X(d.distWide), by, C.region, 3);
    }

    // 거리 표시 (두 위치가 가까우면 글자가 겹치므로 한 줄로 표시)
    const dy = H - 10;
    if (Math.abs(S.X(d.distWide) - S.X(d.distTele)) < 150) {
      const label = d.distWide === d.distTele ? `거리 ${f(d.distWide)}` : `거리 ${f(d.distWide)} ~ ${f(d.distTele)}`;
      b += text((S.X(d.distWide) + S.X(d.distTele)) / 2, dy, label, 'middle');
    } else {
      b += line(S.X(d.distWide), dy - FONT, S.X(d.distWide), dy - FONT + 8, C.line, 1) + line(S.X(d.distTele), dy - FONT, S.X(d.distTele), dy - FONT + 8, C.line, 1);
      b += text(S.X(d.distWide), dy, `WIDE ${f(d.distWide)}`, 'middle');
      b += text(S.X(d.distTele), dy, `TELE ${f(d.distTele)}`, 'middle');
    }
    return svg('측면도', b);
  }

  /**
   * 정면도
   * @param {object} d
   *   screenBottom, screenW, screenH, panelW, panelH (mm)
   *   lensYMin, lensYMax (mm, 바닥 기준) 또는 null
   *   hRangePct ([하한%, 상한%] 또는 null), hasFloor, unit
   */
  function frontView(d) {
    const f = (mm) => U.format(mm, d.unit);
    const center = d.screenBottom + d.screenH / 2;
    const hasLensY = d.lensYMin !== null && d.lensYMax !== null;
    const xr = d.hRangePct ? [-d.hRangePct[1] / 100 * d.panelW, -d.hRangePct[0] / 100 * d.panelW] : [0, 0];

    const yVals = [center - d.panelH / 2, center + d.panelH / 2];
    if (hasLensY) yVals.push(d.lensYMin, d.lensYMax);
    if (d.hasFloor) yVals.push(0);
    if (d.ceiling) yVals.push(d.ceiling);
    const walls = d.wallLeft !== null && d.wallLeft !== undefined;
    const xHalf = Math.max(d.panelW / 2, Math.abs(xr[0]), Math.abs(xr[1]),
      walls ? Math.max(Math.abs(d.wallLeft), Math.abs(d.wallRight)) : 0) * 1.05;
    const yLo = Math.min(...yVals);
    const yHi = Math.max(...yVals);
    const S = makeScale(-xHalf, xHalf, yLo, yHi, false);

    let b = '';
    if (d.hasFloor) b += line(S.X(-xHalf), S.Y(0), S.X(xHalf), S.Y(0), C.line, 1.5) + text(S.X(-xHalf), S.Y(0) + FONT + 2, '바닥');
    if (d.ceiling) b += line(S.X(-xHalf), S.Y(d.ceiling), S.X(xHalf), S.Y(d.ceiling), C.line, 1.5) + text(S.X(-xHalf), S.Y(d.ceiling) - 4, '천장');
    if (walls) {
      b += line(S.X(d.wallLeft), S.Y(yHi), S.X(d.wallLeft), S.Y(yLo), C.line, 1.5, '6 3');
      b += line(S.X(d.wallRight), S.Y(yHi), S.X(d.wallRight), S.Y(yLo), C.line, 1.5, '6 3');
    }
    b += rect(S.X(-d.panelW / 2), S.Y(center + d.panelH / 2), S.X(d.panelW / 2), S.Y(center - d.panelH / 2), C.panel, 'none', '4 3');
    b += rect(S.X(-d.screenW / 2), S.Y(d.screenBottom + d.screenH), S.X(d.screenW / 2), S.Y(d.screenBottom), C.screen, null);

    if (hasLensY) {
      if (d.hRangePct) {
        b += rect(S.X(xr[0]), S.Y(d.lensYMax), S.X(xr[1]), S.Y(d.lensYMin), C.region, null);
        b += text(S.X(xr[1]) + 4, S.Y(d.lensYMin) + FONT, `좌우 ±${f(Math.max(Math.abs(xr[0]), Math.abs(xr[1])))}`, 'start', C.region);
      } else {
        b += line(S.X(0), S.Y(d.lensYMax), S.X(0), S.Y(d.lensYMin), C.region, 3);
        b += text(S.X(0) + 6, S.Y(d.lensYMin) + FONT, '좌우 자료 없음', 'start', C.region);
      }
    }
    // 스크린 크기 글자는 빨간 영역 위에 보이도록 마지막에 그림
    b += text(S.X(0), S.Y(d.screenBottom + d.screenH) - 6, `스크린 ${f(d.screenW)} × ${f(d.screenH)}`, 'middle', C.screen);
    b += text(PAD.l, H - 10, '빨간 영역: 렌즈 중심 위치 가능 범위', 'start', C.region);
    return svg('정면도', b);
  }

  /**
   * 평면도 (위에서 본 모습). 오른쪽이 화면, 위쪽이 화면을 바라볼 때의 왼쪽.
   * @param {object} d
   *   screenW, panelW, distWide, distTele (mm)
   *   lensXMin, lensXMax (mm, 화면 중심 기준 오른쪽 +) 또는 null
   *   wallLeft, wallRight (mm, 화면 중심 기준) 또는 null, depth (mm) 또는 null, unit
   */
  function topView(d) {
    const f = (mm) => U.format(mm, d.unit);
    const walls = d.wallLeft !== null && d.wallLeft !== undefined;
    const hasLensX = d.lensXMin !== null && d.lensXMin !== undefined;
    // 그림 좌표: y = -좌우위치 (오른쪽이 아래로 가도록)
    const lat = [d.panelW / 2, -d.panelW / 2];
    if (hasLensX) lat.push(d.lensXMin, d.lensXMax);
    if (walls) lat.push(d.wallLeft, d.wallRight);
    const yMin = -Math.max(...lat);
    const yMax = -Math.min(...lat);
    const pad = (yMax - yMin) * 0.06;
    const xEnd = Math.max(d.distTele * 1.05, d.depth ? d.depth * 1.03 : 0);
    const S = makeScale(0, xEnd, yMin - pad, yMax + pad, true);
    const Y = (lateral) => S.Y(-lateral);

    let b = '';
    if (walls) {
      b += line(S.X(xEnd), Y(d.wallLeft), S.X(0), Y(d.wallLeft), C.line, 1.5) + text(S.X(xEnd), Y(d.wallLeft) - 4, '왼쪽 벽');
      b += line(S.X(xEnd), Y(d.wallRight), S.X(0), Y(d.wallRight), C.line, 1.5) + text(S.X(xEnd), Y(d.wallRight) + FONT + 2, '오른쪽 벽');
    }
    if (d.depth) {
      const top = walls ? Y(d.wallLeft) : S.Y(yMax + pad);
      const bot = walls ? Y(d.wallRight) : S.Y(yMin - pad);
      b += line(S.X(d.depth), top, S.X(d.depth), bot, C.line, 1.5, '6 3') + text(S.X(d.depth) + 4, top + FONT + 2, '뒷벽', 'start');
    }
    // 빔: WIDE 위치, 렌즈 좌우 범위 중앙에서 패널 좌우 끝으로
    const lx = hasLensX ? (d.lensXMin + d.lensXMax) / 2 : 0;
    b += line(S.X(d.distWide), Y(lx), S.X(0), Y(-d.panelW / 2), C.beam, 1, '4 3') + line(S.X(d.distWide), Y(lx), S.X(0), Y(d.panelW / 2), C.beam, 1, '4 3');
    b += line(S.X(0), Y(-d.panelW / 2), S.X(0), Y(d.panelW / 2), C.panel, 2, '3 3');
    b += line(S.X(0), Y(-d.screenW / 2), S.X(0), Y(d.screenW / 2), C.screen, 5);
    b += text(S.X(0) - 6, Y(-d.screenW / 2) - 4, `화면 ${f(d.screenW)}`, 'end', C.screen);
    // 렌즈 중심 가능 영역 (거리 WIDE~TELE × 좌우 시프트 범위)
    const xT = S.X(d.distTele);
    const xW = Math.abs(S.X(d.distWide) - xT) < 4 ? xT + 4 : S.X(d.distWide);
    if (hasLensX && d.lensXMin !== d.lensXMax) b += rect(xT, Y(d.lensXMin), xW, Y(d.lensXMax), C.region, null);
    else b += line(xT, Y(lx), xW, Y(lx), C.region, 3);
    const dy = H - 10;
    b += text((S.X(d.distWide) + S.X(d.distTele)) / 2, dy, `거리 ${f(d.distWide)} ~ ${f(d.distTele)}`, 'middle');
    return svg('평면도', b);
  }

  const api = { sideView, frontView, topView };
  root.EPC = root.EPC || {};
  root.EPC.diagram = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
