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
    const S = makeScale(0, d.distTele * 1.05, yMin, yMax, true);

    let b = '';
    if (d.hasFloor) b += line(S.X(d.distTele * 1.05), S.Y(0), S.X(0), S.Y(0), C.line, 1.5) + text(S.X(d.distTele * 1.05), S.Y(0) + FONT + 2, '바닥');
    if (d.ceiling) b += line(S.X(d.distTele * 1.05), S.Y(d.ceiling), S.X(0), S.Y(d.ceiling), C.line, 1.5) + text(S.X(d.distTele * 1.05), S.Y(d.ceiling) - 4, '천장');

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
    const xHalf = Math.max(d.panelW / 2, Math.abs(xr[0]), Math.abs(xr[1])) * 1.05;
    const S = makeScale(-xHalf, xHalf, Math.min(...yVals), Math.max(...yVals), false);

    let b = '';
    if (d.hasFloor) b += line(S.X(-xHalf), S.Y(0), S.X(xHalf), S.Y(0), C.line, 1.5) + text(S.X(-xHalf), S.Y(0) + FONT + 2, '바닥');
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

  const api = { sideView, frontView };
  root.EPC = root.EPC || {};
  root.EPC.diagram = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
