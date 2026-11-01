/*
 * 3단계 기능 화면 처리: 계획 위치 확인(기울기·키스톤), 엣지 블렌딩, 밝기·대비 판정
 * 계산은 tilt.js / blend.js / brightness.js 가 하고, 여기서는 입력을 읽고 결과를 표시한다.
 */
(function (root) {
  const { calc, tilt, blend, brightness, units, catalog, KEYSTONE } = root.EPC;
  const $ = (id) => document.getElementById(id);

  // 길이 입력 (선택 단위). 음수 허용 여부 선택
  function readLen(id, unit, allowNegative) {
    const raw = $(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    if (!isFinite(v) || (!allowNegative && v < 0)) return null;
    return units.toMm(v, unit);
  }
  function readNum(id) {
    const raw = $(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    return isFinite(v) ? v : null;
  }
  const pct = (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
  function setState(id, text, state) {
    const el = $(id);
    el.textContent = text;
    el.className = `small${state ? ` state-${state}` : ''}`;
  }

  /** 렌즈 항목에 해당하는 키스톤 범위 [수직°, 수평°] (모델 여러 개면 첫 번째 모델 기준) */
  function keystoneFor(p, lens) {
    const row = KEYSTONE[p.id];
    if (!row) return null;
    const m = catalog.lensModels(lens).find((x) => row.lenses[x]);
    return m ? row.lenses[m] : null;
  }

  function axisText(r, dirPlus, dirMinus) {
    if (!r.known) return { text: `필요 시프트 ${pct(r.needPct)} / 시프트 범위 자료 없음`, state: 'warn' };
    if (r.inShift) return { text: `필요 시프트 ${pct(r.needPct)} → 시프트 범위 안 (기울기 불필요)`, state: 'ok' };
    const dir = r.tiltDeg > 0 ? dirPlus : dirMinus;
    let t = `필요 시프트 ${pct(r.needPct)} → 범위 초과. 시프트 ${pct(r.shiftUsedPct)} 사용 후 ${dir} 약 ${Math.abs(r.tiltDeg).toFixed(1)}° 기울여야 함`;
    if (r.keystoneOk === null) return { text: `${t} / 키스톤 범위 자료 없음`, state: 'warn' };
    if (r.keystoneOk) return { text: `${t} → 키스톤 보정 범위(±${r.keystoneDeg}°) 안`, state: 'warn' };
    return { text: `${t} → 키스톤 보정 범위(±${r.keystoneDeg}°) 초과, 설치 불가`, state: 'bad' };
  }

  /** 계획 위치 확인 */
  function updatePlacement(c, lines) {
    const ids = ['placeV', 'placeH'];
    const msg = (t) => ids.forEach((id) => setState(id, t, ''));
    if (!c.res || c.mode === 'DIST') return msg('스크린 크기 입력 모드에서 사용할 수 있습니다');
    if (c.p.type === 'FIXED') return msg('고정 렌즈 기종은 오프셋 자료가 없어 계산하지 않습니다');
    const lensY = readLen('planLensY', c.unit, true);
    const lensX = readLen('planLensX', c.unit, true) || 0;
    if (c.inst.screenBottomMm === null) return msg('위의 "바닥 ~ 스크린 하단" 높이를 먼저 입력하세요');
    if (lensY === null) return msg('렌즈 중심 높이를 입력하세요');
    let distMm = readLen('planDist', c.unit, false);
    const wide = c.res.distWide * 1000;
    const tele = c.res.distTele * 1000;
    if (!(distMm > 0)) distMm = (wide + tele) / 2;

    const r = tilt.checkPlacement({
      screenCenterY: c.inst.screenBottomMm + c.res.screen.h / 2,
      panelW: c.res.panel.w, panelH: c.res.panel.h, distMm,
      lensY, lensX, mount: c.inst.mount, shift: c.lens.shift, keystone: keystoneFor(c.p, c.lens)
    });
    // 천장 설치는 상하 반전이므로 기울이는 방향 표현도 반대
    const v = c.inst.mount === 'CEILING' ? axisText(r.v, '아래로', '위로') : axisText(r.v, '위로', '아래로');
    const h = axisText(r.h, '오른쪽으로', '왼쪽으로');
    let vText = v.text;
    if (distMm < wide - 1 || distMm > tele + 1) {
      vText += ` / 주의: 투사거리 ${units.format(distMm, c.unit)} 는 이 렌즈 범위(${units.format(wide, c.unit)} ~ ${units.format(tele, c.unit)}) 밖`;
    }
    setState('placeV', vText, v.state);
    setState('placeH', h.text, h.state);
    lines.push(`계획 위치(렌즈 높이 ${units.format(lensY, c.unit)}, 좌우 ${units.format(lensX, c.unit)}, 거리 ${units.format(distMm, c.unit)})`);
    lines.push(`  수직: ${vText}`);
    lines.push(`  수평: ${h.text}`);
  }

  /** 엣지 블렌딩 */
  function updateBlend(c, lines) {
    const out = ['blendPanel', 'blendWidth', 'blendDist', 'blendCanvas'];
    const clear = () => out.forEach((id) => { $(id).textContent = '-'; });
    if (!c.res || c.mode === 'DIST') return clear();
    const cols = Math.round(readNum('blendCols') || 0);
    const rows = Math.round(readNum('blendRows') || 0);
    const ov = readNum('blendOverlap');
    if (cols < 1 || rows < 1 || ov === null || ov < 0 || ov >= 100 || cols * rows < 2) {
      clear();
      $('blendPanel').textContent = '가로·세로 대수(합계 2대 이상)와 블렌드 폭(0~99%)을 확인하세요';
      return;
    }
    const L = blend.layout({ screenW: c.res.screen.w, screenH: c.res.screen.h, cols, rows, overlapPct: ov,
      nativeAspect: c.p.nativeAspect, resText: c.p.res });
    const one = calc.calculate({ w: L.panel.w, h: L.panel.h }, c.p.nativeAspect, c.lens);
    const f = (mm) => units.format(mm, c.unit);
    $('blendPanel').textContent = `약 ${L.panel.diagInch.toFixed(1)}" (${f(L.panel.w)} × ${f(L.panel.h)})`;
    const px = L.blendPx ? ` (${L.blendPx.x} / ${L.blendPx.y} px)` : '';
    $('blendWidth').textContent = `${f(L.blendMm.x)} / ${f(L.blendMm.y)}${px}`;
    $('blendDist').textContent = `${f(one.distWide * 1000)} ~ ${f(one.distTele * 1000)}`;
    let canvasText = `${f(L.canvas.w)} × ${f(L.canvas.h)} (${L.fit === 'WIDTH' ? '가로 맞춤' : '세로 맞춤'})`;
    const sw = c.res.screen.w;
    const sh = c.res.screen.h;
    if (L.canvas.w > sw * 1.01 || L.canvas.h > sh * 1.01) {
      canvasText += ` / 주의: 전체 영상이 스크린(${f(sw)} × ${f(sh)})보다 커서 ${L.canvas.w > sw * 1.01 ? '좌우' : '위아래'}가 스크린 밖으로 나갑니다. 스크린 비율을 확인하세요`;
    }
    $('blendCanvas').textContent = canvasText;
    lines.push(`엣지 블렌딩: ${cols}×${rows} (${L.count}대), 블렌드 ${ov}%, 1대당 약 ${L.panel.diagInch.toFixed(1)}", 거리 ${f(one.distWide * 1000)} ~ ${f(one.distTele * 1000)}`);
  }

  /** 밝기·대비 */
  function updateBrightness(c, lines) {
    const ids = ['briLux', 'briContrast', 'briLevel'];
    // 기본 밝기: 사양서 렌즈별 밝기(첫 모델) > 본체 표기 밝기(미검증)
    let defLm = null;
    let src = '';
    if (c.light && c.light.items.length) {
      defLm = c.light.items[0].lm;
      src = `기본값 ${defLm.toLocaleString()} lm: ${c.light.items[0].model} 장착 시 (${c.light.source})`;
    } else {
      const n = Number(String(c.p.lm).replace(/[^0-9]/g, ''));
      if (n > 0) { defLm = n; src = `기본값 ${n.toLocaleString()} lm: 본체 표기 밝기 (미검증)`; }
    }
    $('lumenInput').placeholder = defLm ? String(defLm) : '';
    const userLm = readNum('lumenInput');
    const lm = userLm && userLm > 0 ? userLm : defLm;
    $('lumenSource').textContent = userLm && userLm > 0 ? `입력한 밝기 ${userLm.toLocaleString()} lm 사용` : src;

    if (!c.res || c.mode === 'DIST' || !lm) { ids.forEach((id) => setState(id, '-', '')); return; }
    const gain = readNum('gainInput');
    const amb = readNum('ambientInput');
    if (!(gain > 0)) { ids.forEach((id) => setState(id, '-', '')); setState('briLevel', '스크린 게인을 입력하세요', ''); return; }
    const r = brightness.evaluate({ lumens: lm, panelWmm: c.res.panel.w, panelHmm: c.res.panel.h, gain, ambientLux: amb || 0 });
    setState('briLux', `${Math.round(r.projLux).toLocaleString()} lux / ${Math.round(r.nit).toLocaleString()} cd/m²`, '');
    if (amb === null) {
      setState('briContrast', '주변광(lux)을 입력하세요', '');
      setState('briLevel', '-', '');
      return;
    }
    setState('briContrast', isFinite(r.contrast) ? `${r.contrast.toFixed(1)} : 1` : '주변광 0 (암실)', '');
    setState('briLevel', r.level, r.contrast >= 15 ? 'ok' : r.meets ? 'warn' : 'bad');
    lines.push(`밝기: ${lm.toLocaleString()} lm, 스크린 ${Math.round(r.projLux)} lux / ${Math.round(r.nit)} cd/m², 주변광 ${amb} lux, 대비 약 ${isFinite(r.contrast) ? r.contrast.toFixed(1) : '∞'}:1 → ${r.level}`);
  }

  /**
   * @param {object} c  p, lens, res, mode, unit, inst{mount, screenBottomMm, ceilingMm}, light
   * @returns {string[]} 결과 복사에 덧붙일 줄
   */
  function update(c) {
    const lines = [];
    updatePlacement(c, lines);
    updateBlend(c, lines);
    updateBrightness(c, lines);
    return lines;
  }

  // 단위 변환 대상 길이 입력칸 (main.js 가 단위 변경 시 환산)
  const LENGTH_INPUTS = ['planLensY', 'planLensX', 'planDist'];
  const OTHER_INPUTS = ['blendCols', 'blendRows', 'blendOverlap', 'lumenInput', 'gainInput', 'ambientInput'];

  root.EPC = root.EPC || {};
  root.EPC.extras = { update, keystoneFor, LENGTH_INPUTS, OTHER_INPUTS };
})(window);
