/*
 * 진입점: 상태 관리 + 이벤트 연결
 */
(function (root) {
  const { LENS_CLASSES, SERIES, PROJECTORS, LIGHT_OUTPUT, calc, catalog, install, match, diagram, units, report, ui, extras } = root.EPC;
  const $ = ui.$;

  // 선택 단위로 입력받는 칸 (단위 변경 시 값을 환산해 유지)
  const LENGTH_INPUTS = ['customWidth', 'customHeight', 'distInput', 'screenBottomInput', 'ceilingInput', 'matchDistInput',
    ...extras.LENGTH_INPUTS];
  const MATCH_LIMIT = 60;

  const state = {
    mode: 'INCH',
    unit: 'm',
    ratioTouched: false, // 사용자가 종횡비를 직접 바꾼 뒤에는 기종 변경 시 자동으로 덮어쓰지 않음
    lastReport: ''
  };

  function currentProjector() {
    return PROJECTORS.find((p) => p.id === $('projectorSelect').value) || null;
  }

  const lensesFor = (p) => catalog.lensesFor(p, LENS_CLASSES);

  function currentLens(p) {
    const list = lensesFor(p);
    return list.find((l) => l.id === $('lensSelect').value) || list[0];
  }

  /** 길이 입력칸 → mm. 비었거나 잘못되면 null */
  function readLengthMm(id) {
    const raw = $(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    if (!isFinite(v) || v < 0) return null;
    return units.toMm(v, state.unit);
  }

  /** 입력값 → 스크린 mm. 잘못된 입력이면 null */
  function readScreen() {
    if (state.mode === 'INCH') {
      const inch = Number($('inchInput').value);
      const aspect = calc.parseAspect($('screenRatio').value);
      if (!(inch > 0) || !isFinite(inch)) return null;
      return calc.screenFromDiagonal(inch, aspect);
    }
    const w = readLengthMm('customWidth');
    const h = readLengthMm('customHeight');
    if (!(w > 0) || !(h > 0)) return null;
    return { w: w, h: h };
  }

  function buildWarnings(p, lens, res) {
    const out = [];
    if (p.note) out.push(p.verified ? `[참고] ${p.note}` : `[미검증] ${p.note}`);

    if (res) {
      const native = calc.parseAspect(p.nativeAspect);
      const screenAspect = res.screen.w / res.screen.h;
      if (Math.abs(screenAspect - native) > 0.01) {
        out.push(res.panel.fit === 'WIDTH'
          ? `[비율] 스크린이 패널(${p.nativeAspect})보다 가로로 넓어 가로 맞춤으로 계산했습니다. 패널의 남는 위아래 부분(검은 여백)은 스크린 밖으로 나갑니다.`
          : `[비율] 스크린이 패널(${p.nativeAspect})보다 세로로 길어 세로 맞춤으로 계산했습니다. 패널의 남는 좌우 부분(검은 여백)은 스크린 밖으로 나갑니다.`);
      }
    }

    if (lens.zoomNote) out.push(`[줌] ${lens.zoomNote}`);
    if (p.series === 'UST') {
      out.push('[초단초점] 초단초점 기종은 거리 측정 기준점이 기종마다 다릅니다. 설치 전 해당 매뉴얼의 투사거리 표를 확인하세요.');
    }
    return out;
  }

  /** 설치 높이 계산 → 화면 표시, 보고서용 값 반환 */
  function updateInstall(p, res, lens) {
    const mount = $('mountSelect').value;
    const bottomMm = readLengthMm('screenBottomInput');
    const ceilingMm = readLengthMm('ceilingInput');
    const ctx = { mount, screenBottomMm: bottomMm, ceilingMm, height: null };

    if (state.mode === 'DIST') {
      ui.renderInstall(null, '투사거리 입력 모드에서는 계산하지 않습니다', mount, ceilingMm, state.unit);
      return ctx;
    }
    ui.renderUst(null, state.unit);
    if (!p.verified && p.type === 'FIXED') {
      // 공식 자료로 대조하지 않은 고정 렌즈 기종은 오프셋 자료가 없어 높이를 계산하면 틀린 값이 나옴
      ui.renderInstall(null, '공식 자료로 확인하지 않은 고정 렌즈 기종은 계산하지 않습니다 (매뉴얼 확인)', mount, ceilingMm, state.unit);
      return ctx;
    }
    if (!res) {
      ui.renderInstall(null, '-', mount, ceilingMm, state.unit);
      return ctx;
    }
    if (lens.ust) {
      ui.renderInstall(null, '초단초점은 렌즈 시프트가 없습니다. 아래 b, c 값을 사용하세요', mount, ceilingMm, state.unit);
      ui.renderUst(install.ustOffsets(lens.ust, res.panel.diagInch, res.panel.h, res.screen.h), state.unit);
      return ctx;
    }
    const v = lens.shift ? lens.shift.v : null;
    if (!v) {
      ui.renderInstall(null, '수직 시프트 자료가 없어 계산할 수 없습니다', mount, ceilingMm, state.unit);
      return ctx;
    }
    if (bottomMm === null) {
      ui.renderInstall(null, '바닥 ~ 스크린 하단 높이를 입력하세요', mount, ceilingMm, state.unit);
      return ctx;
    }
    ctx.height = install.lensHeightRange(bottomMm, res.screen.h, res.panel.h, v, mount);
    ui.renderInstall(ctx.height, '', mount, ceilingMm, state.unit);
    return ctx;
  }

  /** 설치 그림 (측면도/정면도) */
  function updateDiagrams(p, res, lens, inst) {
    if (state.mode === 'DIST') { ui.renderDiagrams(null, null, '투사거리 입력 모드에서는 그리지 않습니다.'); return; }
    if (!res) { ui.renderDiagrams(null, null, '화면 크기를 입력하세요.'); return; }
    if (p.type === 'FIXED' && !p.verified) {
      ui.renderDiagrams(null, null, '공식 자료로 확인하지 않은 고정 렌즈 기종은 그리지 않습니다.');
      return;
    }
    if (lens.ust) {
      ui.renderDiagrams(null, null, '초단초점은 그림 대신 5번 카드의 b, c 값을 사용하세요.');
      return;
    }
    const hasFloor = inst.screenBottomMm !== null;
    const bottom = hasFloor ? inst.screenBottomMm : 0;
    const v = lens.shift ? lens.shift.v : null;
    const h = lens.shift ? lens.shift.h : null;
    const range = install.lensHeightRange(bottom, res.screen.h, res.panel.h, v, inst.mount);
    const ceiling = inst.mount === 'CEILING' && inst.ceilingMm > 0 && hasFloor ? inst.ceilingMm : null;
    const side = diagram.sideView({
      screenBottom: bottom, screenH: res.screen.h, panelH: res.panel.h,
      distWide: res.distWide * 1000, distTele: res.distTele * 1000,
      lensMin: range ? range.min : null, lensMax: range ? range.max : null,
      ceiling, hasFloor, unit: state.unit
    });
    const front = diagram.frontView({
      screenBottom: bottom, screenW: res.screen.w, screenH: res.screen.h, panelW: res.panel.w, panelH: res.panel.h,
      lensYMin: range ? range.min : null, lensYMax: range ? range.max : null,
      hRangePct: h, hasFloor, unit: state.unit
    });
    ui.renderDiagrams(side, front, v ? '' : '수직 시프트 자료가 없어 렌즈 높이 범위는 표시하지 않습니다.');
  }

  /** 같은 조건으로 설치 가능한 기종 */
  function updateMatches(screen) {
    if (state.mode === 'DIST' || !screen) {
      ui.renderMatches([], '대각선 인치 또는 가로/세로 입력 모드에서 사용할 수 있습니다.', state.unit);
      return;
    }
    const distMm = readLengthMm('matchDistInput');
    if (!(distMm > 0)) {
      ui.renderMatches([], '현재 스크린 크기에서, 입력한 거리가 렌즈의 WIDE ~ TELE 범위 안에 드는 기종과 렌즈를 보여줍니다.', state.unit);
      return;
    }
    const list = match.findMatches(screen, distMm / 1000, PROJECTORS, LENS_CLASSES)
      .sort((a, b) => (b.p.verified - a.p.verified) || a.p.model.localeCompare(b.p.model));
    const shown = list.slice(0, MATCH_LIMIT);
    let msg = `${list.length}개 조합이 가능합니다.`;
    if (list.length > MATCH_LIMIT) msg += ` 앞의 ${MATCH_LIMIT}개만 표시합니다.`;
    if (!list.length) msg = '이 조건으로 설치 가능한 조합이 없습니다.';
    ui.renderMatches(shown, msg, state.unit);
  }

  /** 공식 자료가 없는 기종: 모든 계산 칸을 비우고 "자료 없음" 표시 */
  function showNoData(p) {
    const msg = '공식 자료 없음';
    ui.renderNoData(p);
    ui.clearResult();
    ui.renderWarnings([`[자료 없음] ${p.note}`]);
    ui.renderUst(null, state.unit);
    ui.renderInstall(null, msg, $('mountSelect').value, null, state.unit);
    ui.renderDiagrams(null, null, '공식 자료가 없는 기종이라 그리지 않습니다.');
    ui.renderMatches([], '공식 자료가 없는 기종은 비교할 수 없습니다.', state.unit);
    extras.clear(msg);
    state.lastReport = '';
  }

  function update() {
    const p = currentProjector();
    if (!p) { ui.clearResult(); ui.renderWarnings([]); state.lastReport = ''; return; }

    if (p.noData) { showNoData(p); return; }

    const lens = currentLens(p);
    const cls = p.type === 'FIXED' ? null : LENS_CLASSES[p.lensClass];
    ui.renderSpecs(p, lens, cls);

    const light = p.type === 'FIXED' ? null : catalog.lightOutputFor(p, lens, LIGHT_OUTPUT);
    const base = { p, lens, unit: state.unit, mode: state.mode, light };
    ui.renderLight(light);
    let res = null;
    let rev = null;
    let distMm = null;

    if (state.mode === 'DIST') {
      distMm = readLengthMm('distInput');
      const aspect = calc.parseAspect($('screenRatio').value);
      rev = distMm > 0 ? calc.screenFromDistance(distMm / 1000, p.nativeAspect, aspect, lens) : null;
      if (!rev) {
        ui.renderReverse(null, state.unit);
        ui.renderWarnings(['[입력] 투사거리를 0보다 큰 숫자로 입력하세요. 너무 짧은 거리는 계산되지 않습니다.']);
        updateInstall(p, null, lens);
        updateDiagrams(p, null, lens, null);
        updateMatches(null);
        extras.update({ p, lens, res: null, mode: state.mode, unit: state.unit, inst: { screenBottomMm: null }, light });
        state.lastReport = '';
        return;
      }
      ui.renderReverse(rev, state.unit);
    } else {
      const screen = readScreen();
      if (!screen) {
        ui.clearResult();
        ui.renderWarnings(['[입력] 화면 크기를 0보다 큰 숫자로 입력하세요.']);
        updateInstall(p, null, lens);
        updateDiagrams(p, null, lens, null);
        updateMatches(null);
        extras.update({ p, lens, res: null, mode: state.mode, unit: state.unit, inst: { screenBottomMm: null }, light });
        state.lastReport = '';
        return;
      }
      res = calc.calculate(screen, p.nativeAspect, lens);
      ui.renderResult(res, lens, state.unit);
      updateMatches(screen);
    }

    const warnings = buildWarnings(p, lens, res);
    ui.renderWarnings(warnings);
    const inst = updateInstall(p, res, lens);
    updateDiagrams(p, res, lens, inst);
    if (state.mode === 'DIST') updateMatches(null);
    const extraLines = extras.update({ p, lens, res, mode: state.mode, unit: state.unit, inst, light });
    state.lastReport = report.build(Object.assign(base, inst, { res, rev, distMm, warnings, extraLines }));
  }

  function onProjectorChange() {
    const p = currentProjector();
    if (!p) { ui.renderLensList([], false); update(); return; }
    if (!state.ratioTouched) $('screenRatio').value = p.nativeAspect;
    ui.renderLensList(lensesFor(p), p.type !== 'FIXED');
    update();
  }

  function onFilterChange() {
    const series = $('seriesSelect').value;
    const q = $('modelSearch').value.trim().toLowerCase();
    const list = PROJECTORS.filter((p) =>
      (series === 'ALL' || p.series === series) &&
      (q === '' || p.model.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)));
    ui.renderProjectorList(list);
    onProjectorChange();
  }

  function setMode(mode) {
    state.mode = mode;
    ui.setMode(mode);
    update();
  }

  /** 단위 변경: 입력칸 값을 새 단위로 환산해 같은 실제 길이를 유지 */
  function onUnitChange() {
    const next = $('unitSelect').value;
    LENGTH_INPUTS.forEach((id) => {
      const raw = $(id).value.trim();
      const v = Number(raw);
      if (raw !== '' && isFinite(v)) $(id).value = units.inputValue(units.toMm(v, state.unit), next);
    });
    state.unit = next;
    ui.setUnitLabels(next);
    update();
  }

  function copyText(text) {
    if (navigator.clipboard && root.isSecureContext) return navigator.clipboard.writeText(text);
    // 대체 방식 (일부 브라우저의 file:// 환경)
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function onCopy() {
    if (!state.lastReport) {
      const p = currentProjector();
      ui.setCopyStatus(p && p.noData ? '공식 자료가 없는 기종이라 복사할 결과가 없습니다.' : '복사할 결과가 없습니다. 입력값을 확인하세요.');
      return;
    }
    copyText(state.lastReport)
      .then(() => ui.setCopyStatus('복사했습니다. 메신저나 메모에 붙여넣기 하세요.'))
      .catch(() => ui.setCopyStatus('복사에 실패했습니다. 브라우저 권한을 확인하세요.'));
  }

  function init() {
    ui.renderSeries(SERIES);
    $('seriesSelect').addEventListener('change', onFilterChange);
    $('modelSearch').addEventListener('input', onFilterChange);
    $('projectorSelect').addEventListener('change', onProjectorChange);
    $('lensSelect').addEventListener('change', update);
    $('screenRatio').addEventListener('change', () => { state.ratioTouched = true; update(); });
    $('unitSelect').addEventListener('change', onUnitChange);
    ['inchInput', ...LENGTH_INPUTS].forEach((id) => $(id).addEventListener('input', update));
    $('mountSelect').addEventListener('change', update);
    $('tabInch').addEventListener('click', () => setMode('INCH'));
    $('tabCustom').addEventListener('click', () => setMode('CUSTOM'));
    $('tabDist').addEventListener('click', () => setMode('DIST'));
    $('copyBtn').addEventListener('click', onCopy);
    $('printBtn').addEventListener('click', () => root.print());
    extras.OTHER_INPUTS.forEach((id) => $(id).addEventListener('input', update));
    state.unit = $('unitSelect').value;
    ui.setUnitLabels(state.unit);
    onFilterChange();
  }

  init();
})(window);
