/*
 * 화면 표시 함수 (DOM 조작만 담당)
 */
(function (root) {
  const $ = (id) => document.getElementById(id);

  const fmtMm = (v) => `${Math.round(v).toLocaleString()} mm`;
  const fmtM = (v) => `${v.toFixed(2)} m`;
  const fmtPct = (n) => (n > 0 ? `+${n}` : `${n}`);

  function fillSelect(select, items, getValue, getLabel) {
    select.innerHTML = '';
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = getValue(item);
      opt.textContent = getLabel(item);
      select.appendChild(opt);
    });
  }

  function renderSeries(series) {
    fillSelect($('seriesSelect'), series, (s) => s.id, (s) => s.label);
  }

  function renderProjectorList(list) {
    const select = $('projectorSelect');
    if (list.length === 0) {
      fillSelect(select, [null], () => '', () => '검색된 모델이 없습니다.');
      return;
    }
    fillSelect(select, list, (p) => p.id, (p) => `${p.model} (${p.lm} / ${p.res})`);
  }

  function renderLensList(lenses, show) {
    $('lensField').style.display = show ? 'block' : 'none';
    if (show) fillSelect($('lensSelect'), lenses, (l) => l.id, (l) => l.name);
  }

  function shiftPctText(range) {
    if (!range) return '자료 없음';
    if (range[0] === 0 && range[1] === 0) return '없음';
    if (range[0] === -range[1]) return `±${range[1]}%`;
    return `${fmtPct(range[0])}% ~ ${fmtPct(range[1])}%`;
  }

  function formulaText(pt) {
    const sign = pt.b < 0 ? '-' : '+';
    return `${pt.a} × 인치 ${sign} ${Math.abs(pt.b)} cm`;
  }

  function renderSpecs(p, lens, lensClass) {
    $('specLumens').textContent = p.lm;
    $('specRes').textContent = `${p.res} (패널 ${p.nativeAspect})`;
    $('specWeight').textContent = p.wt;
    $('specLensType').innerHTML = p.type === 'FIXED'
      ? '<span class="badge badge-fixed">고정 렌즈형</span>'
      : '<span class="badge badge-inter">렌즈 교체형</span>';

    const shift = lens.shift || { v: null, h: null };
    $('specOptics').textContent =
      `${lens.name} / 투사비 ${lens.trText}:1 / 시프트 상하 ${shiftPctText(shift.v)}, 좌우 ${shiftPctText(shift.h)}`;

    const lines = lensClass
      ? [`패널 등급: ${lensClass.label}`, `출처: ${lensClass.source}`]
      : ['출처: 원본 파일 값 (공식 자료와 대조하지 않음)'];
    if (lensClass) lines.push(`거리 공식: Wide ${formulaText(lens.wide)} / Tele ${formulaText(lens.tele)} (인치 = 패널 영상 대각선)`);
    if (lens.shiftNote) lines.push(`시프트 참고: ${lens.shiftNote}`);
    $('specSource').textContent = lines.join('\n');
  }

  function renderWarnings(list) {
    const box = $('warnBox');
    box.innerHTML = '';
    list.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg;
      box.appendChild(li);
    });
    box.style.display = list.length ? 'block' : 'none';
  }

  // 부호: 수직은 + 가 위, 수평은 + 가 오른쪽
  function shiftMmText(rangeMm, rangePct) {
    if (!rangePct) return '자료 없음';
    if (rangePct[0] === 0 && rangePct[1] === 0) return '없음';
    const [a, b] = rangeMm.map((v) => Math.round(v));
    if (a === -b) return `±${b.toLocaleString()} mm (${shiftPctText(rangePct)})`;
    return `${fmtPct(a)} ~ ${fmtPct(b)} mm (${shiftPctText(rangePct)})`;
  }

  function renderResult(res, lens) {
    $('resDistMin').textContent = fmtM(res.distWide);
    $('resDistMax').textContent = fmtM(res.distTele);
    $('resWidth').textContent = fmtMm(res.screen.w);
    $('resHeight').textContent = fmtMm(res.screen.h);
    $('resDiagonal').textContent = `약 ${res.screen.diagInch.toFixed(1)} 인치`;
    $('resAspect').textContent = `${(res.screen.w / res.screen.h).toFixed(2)} : 1`;
    $('resPanel').textContent =
      `${fmtMm(res.panel.w)} × ${fmtMm(res.panel.h)} (${res.panel.fit === 'WIDTH' ? '가로 맞춤' : '세로 맞춤'})`;
    const shift = lens.shift || { v: null, h: null };
    $('resVShift').textContent = shiftMmText(res.shiftV, shift.v);
    $('resHShift').textContent = shiftMmText(res.shiftH, shift.h);
  }

  function clearResult() {
    ['resDistMin', 'resDistMax', 'resWidth', 'resHeight', 'resDiagonal', 'resAspect', 'resPanel', 'resVShift', 'resHShift']
      .forEach((id) => { $(id).textContent = '-'; });
  }

  function setMode(mode) {
    $('tabInch').classList.toggle('active', mode === 'INCH');
    $('tabCustom').classList.toggle('active', mode === 'CUSTOM');
    $('inchInputSection').style.display = mode === 'INCH' ? 'block' : 'none';
    $('customInputSection').style.display = mode === 'CUSTOM' ? 'block' : 'none';
  }

  root.EPC = root.EPC || {};
  root.EPC.ui = {
    $, renderSeries, renderProjectorList, renderLensList, renderSpecs,
    renderWarnings, renderResult, clearResult, setMode
  };
})(window);
