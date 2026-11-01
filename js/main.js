/*
 * 진입점: 상태 관리 + 이벤트 연결
 */
(function (root) {
  const { LENS_CLASSES, SERIES, PROJECTORS, calc, ui } = root.EPC;
  const $ = ui.$;

  const state = {
    mode: 'INCH',
    ratioTouched: false // 사용자가 종횡비를 직접 바꾼 뒤에는 기종 변경 시 자동으로 덮어쓰지 않음
  };

  function currentProjector() {
    return PROJECTORS.find((p) => p.id === $('projectorSelect').value) || null;
  }

  function lensesFor(p) {
    if (p.type === 'FIXED') return [p.lens];
    const cls = LENS_CLASSES[p.lensClass];
    const hideShift = (cls.shiftUnknownFor || []).includes(p.id);
    return cls.lenses
      .filter((l) => !l.onlyFor || l.onlyFor.includes(p.id))
      .map((l) => (hideShift ? Object.assign({}, l, { shift: null, shiftNote: '이 기종의 시프트 수치는 사양서로 확인하지 못함' }) : l));
  }

  function currentLens(p) {
    const list = lensesFor(p);
    return list.find((l) => l.id === $('lensSelect').value) || list[0];
  }

  /** 입력값 → 스크린 mm. 잘못된 입력이면 null */
  function readScreen() {
    if (state.mode === 'INCH') {
      const inch = Number($('inchInput').value);
      const aspect = calc.parseAspect($('screenRatio').value);
      if (!(inch > 0) || !isFinite(inch)) return null;
      return calc.screenFromDiagonal(inch, aspect);
    }
    const w = Number($('customWidth').value);
    const h = Number($('customHeight').value);
    if (!(w > 0) || !(h > 0) || !isFinite(w) || !isFinite(h)) return null;
    return { w: w, h: h };
  }

  function buildWarnings(p, res) {
    const out = [];
    if (p.note) out.push(p.verified ? `[참고] ${p.note}` : `[미검증] ${p.note}`);

    const native = calc.parseAspect(p.nativeAspect);
    const screenAspect = res.screen.w / res.screen.h;
    if (Math.abs(screenAspect - native) > 0.01) {
      out.push(res.panel.fit === 'WIDTH'
        ? `[비율] 스크린이 패널(${p.nativeAspect})보다 가로로 넓어 가로 맞춤으로 계산했습니다. 패널의 남는 위아래 부분(검은 여백)은 스크린 밖으로 나갑니다.`
        : `[비율] 스크린이 패널(${p.nativeAspect})보다 세로로 길어 세로 맞춤으로 계산했습니다. 패널의 남는 좌우 부분(검은 여백)은 스크린 밖으로 나갑니다.`);
    }

    if (p.series === 'UST') {
      out.push('[초단초점] 초단초점 기종은 거리 측정 기준점이 기종마다 다릅니다. 설치 전 해당 매뉴얼의 투사거리 표를 확인하세요.');
    }
    return out;
  }

  function update() {
    const p = currentProjector();
    if (!p) { ui.clearResult(); ui.renderWarnings([]); return; }

    const lens = currentLens(p);
    const cls = p.type === 'FIXED' ? null : LENS_CLASSES[p.lensClass];
    ui.renderSpecs(p, lens, cls);

    const screen = readScreen();
    if (!screen) {
      ui.clearResult();
      ui.renderWarnings(['[입력] 화면 크기를 0보다 큰 숫자로 입력하세요.']);
      return;
    }

    const res = calc.calculate(screen, p.nativeAspect, lens);
    ui.renderResult(res, lens);
    ui.renderWarnings(buildWarnings(p, res));
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

  function init() {
    ui.renderSeries(SERIES);
    $('seriesSelect').addEventListener('change', onFilterChange);
    $('modelSearch').addEventListener('input', onFilterChange);
    $('projectorSelect').addEventListener('change', onProjectorChange);
    $('lensSelect').addEventListener('change', update);
    $('screenRatio').addEventListener('change', () => { state.ratioTouched = true; update(); });
    $('inchInput').addEventListener('input', update);
    $('customWidth').addEventListener('input', update);
    $('customHeight').addEventListener('input', update);
    $('tabInch').addEventListener('click', () => setMode('INCH'));
    $('tabCustom').addEventListener('click', () => setMode('CUSTOM'));
    onFilterChange();
  }

  init();
})(window);
