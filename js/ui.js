/*
 * 화면 표시 함수 (DOM 조작만 담당)
 */
(function (root) {
  const $ = (id) => document.getElementById(id);
  const U = root.EPC.units;

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
    $('lensField').style.display = show ? '' : 'none';
    if (show) fillSelect($('lensSelect'), lenses, (l) => l.id, (l) => l.name);
  }

  function shiftPctText(range) {
    if (!range) return '자료 없음';
    if (range[0] === 0 && range[1] === 0) return '없음';
    if (range[0] === range[1]) return `고정 ${fmtPct(range[0])}% (시프트 없음)`;
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
      `${lens.name} / ${lens.trText ? `투사비 ${lens.trText}:1` : '투사비: 사양서 a 공식 사용 (초단초점)'} / 시프트 상하 ${shiftPctText(shift.v)}, 좌우 ${shiftPctText(shift.h)}`;

    let lines;
    if (lensClass) lines = [`패널 등급: ${lensClass.label}`, `출처: ${lensClass.source}`];
    else if (p.verified) lines = [`출처: ${p.source}`];
    else lines = ['출처: 원본 파일 값 (공식 자료와 대조하지 않음)'];
    if (lensClass || p.verified) {
      lines.push(`거리 공식: Wide ${formulaText(lens.wide)} / Tele ${formulaText(lens.tele)} (인치 = 패널 영상 대각선)`);
    }
    if (lens.zoomNote) lines.push(`줌 참고: ${lens.zoomNote}`);
    if (lens.shiftNote) lines.push(`시프트 참고: ${lens.shiftNote}`);
    $('specSource').textContent = lines.join('\n');
  }

  /** 공식 자료가 없는 기종: 제원만 표시하고 광학 정보는 "자료 없음" */
  function renderNoData(p) {
    $('specLumens').textContent = p.lm;
    $('specRes').textContent = `${p.res} (패널 ${p.nativeAspect})`;
    $('specWeight').textContent = p.wt;
    $('specLensType').innerHTML = '<span class="badge badge-fixed">고정 렌즈형</span>';
    $('specOptics').textContent = '공식 자료 없음';
    $('specLight').textContent = '공식 자료 없음';
    $('specSource').textContent = '엡손 공식 사양서를 찾지 못한 기종입니다. 투사거리·시프트·설치 높이를 계산하지 않습니다.';
  }

  /** 주의 사항: 평소에는 "주의 N건"만 보이고, 누르면 펼쳐짐 */
  function renderWarnings(list) {
    const box = $('warnBox');
    box.innerHTML = '';
    list.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg;
      box.appendChild(li);
    });
    $('warnDetails').hidden = !list.length;
    // 첫 항목의 [분류]만 요약에 보여줌
    const tags = list.map((m) => (m.match(/^\[([^\]]+)\]/) || [])[1]).filter(Boolean);
    $('warnSummary').textContent = `주의 ${list.length}건${tags.length ? `: ${Array.from(new Set(tags)).join(', ')}` : ''}`;
  }

  // 부호: 수직은 + 가 위, 수평은 + 가 오른쪽
  function shiftMmText(rangeMm, rangePct, unit) {
    if (!rangePct) return '자료 없음';
    if (rangePct[0] === 0 && rangePct[1] === 0) return '없음';
    if (rangePct[0] === rangePct[1]) return shiftPctText(rangePct);
    const [a, b] = rangeMm;
    if (Math.abs(a + b) < 0.5) return `±${U.format(b, unit)} (${shiftPctText(rangePct)})`;
    const sg = (v) => (v > 0 ? '+' : '');
    return `${sg(a)}${U.format(a, unit)} ~ ${sg(b)}${U.format(b, unit)} (${shiftPctText(rangePct)})`;
  }

  function sizeText(s, unit) {
    return `${U.format(s.w, unit)} × ${U.format(s.h, unit)}`;
  }

  function renderResult(res, lens, unit) {
    $('normalResult').style.display = 'block';
    $('reverseResult').style.display = 'none';
    $('resDistMin').textContent = U.format(res.distWide * 1000, unit);
    $('resDistMax').textContent = U.format(res.distTele * 1000, unit);
    $('resWidth').textContent = U.format(res.screen.w, unit);
    $('resHeight').textContent = U.format(res.screen.h, unit);
    $('resDiagonal').textContent = `약 ${res.screen.diagInch.toFixed(1)} 인치`;
    $('resAspect').textContent = `${(res.screen.w / res.screen.h).toFixed(2)} : 1`;
    $('resPanel').textContent = `${sizeText(res.panel, unit)} (${res.panel.fit === 'WIDTH' ? '가로 맞춤' : '세로 맞춤'})`;
    const shift = lens.shift || { v: null, h: null };
    $('resVShift').textContent = shiftMmText(res.shiftV, shift.v, unit);
    $('resHShift').textContent = shiftMmText(res.shiftH, shift.h, unit);
  }

  function renderReverse(rev, unit) {
    $('normalResult').style.display = 'none';
    $('reverseResult').style.display = 'block';
    if (!rev) { clearResult(); return; }
    $('revWideInch').textContent = `약 ${rev.wide.screen.diagInch.toFixed(1)} 인치`;
    $('revTeleInch').textContent = `약 ${rev.tele.screen.diagInch.toFixed(1)} 인치`;
    $('revWideSize').textContent = sizeText(rev.wide.screen, unit);
    $('revTeleSize').textContent = sizeText(rev.tele.screen, unit);
  }

  function clearResult() {
    ['resDistMin', 'resDistMax', 'resWidth', 'resHeight', 'resDiagonal', 'resAspect', 'resPanel', 'resVShift', 'resHShift',
      'revWideInch', 'revTeleInch', 'revWideSize', 'revTeleSize']
      .forEach((id) => { $(id).textContent = '-'; });
  }

  /**
   * 설치 높이 표시
   * @param {object|null} h  install.lensHeightRange 결과
   * @param {string} msg     h 가 없을 때 표시할 문구
   */
  function renderInstall(h, msg, mount, ceilingMm, unit) {
    $('ceilingField').style.display = mount === 'CEILING' ? '' : 'none';
    const showCeil = mount === 'CEILING' && h && ceilingMm > 0;
    $('hCeilingBox').style.display = showCeil ? 'block' : 'none';
    if (!h) {
      $('hLensRange').textContent = msg;
      $('hScreenCenter').textContent = '-';
      return;
    }
    $('hLensRange').textContent = `${U.format(h.min, unit)} ~ ${U.format(h.max, unit)}`;
    $('hScreenCenter').textContent = U.format(h.center, unit);
    if (showCeil) {
      $('hCeilingRange').textContent = `${U.format(ceilingMm - h.max, unit)} ~ ${U.format(ceilingMm - h.min, unit)}`;
    }
  }

  /** 초단초점 b, c 값 (null 이면 숨김) */
  function renderUst(o, unit) {
    $('hUstBox').hidden = !o;
    if (!o) return;
    const f = (mm) => U.format(mm, unit);
    $('hUst').textContent = `WIDE: b ${f(o.wide.b)}, c ${f(o.wide.c)} / TELE: b ${f(o.tele.b)}, c ${f(o.tele.c)}`;
  }

  function setUnitLabels(unit) {
    document.querySelectorAll('.unit-label').forEach((el) => { el.textContent = U.LABEL[unit]; });
  }

  function setMode(mode) {
    $('tabInch').classList.toggle('active', mode === 'INCH');
    $('tabCustom').classList.toggle('active', mode === 'CUSTOM');
    $('tabDist').classList.toggle('active', mode === 'DIST');
    // display 값은 CSS(grid) 기본값을 쓰도록 '' 로 되돌림
    $('inchInputSection').style.display = mode === 'INCH' ? '' : 'none';
    $('customInputSection').style.display = mode === 'CUSTOM' ? '' : 'none';
    $('distInputSection').style.display = mode === 'DIST' ? '' : 'none';
    $('ratioField').style.display = mode === 'CUSTOM' ? 'none' : '';
  }

  function setCopyStatus(text) {
    $('copyStatus').textContent = text;
  }

  /** 렌즈 장착 시 밝기 */
  function renderLight(light) {
    if (!light) { $('specLight').textContent = '자료 없음 (이 기종의 사양서에 렌즈별 밝기 표가 없음)'; return; }
    const parts = light.items.map((it) => {
      let s = `${it.model} ${it.lm.toLocaleString()} lm`;
      if (it.pct !== null && it.pct < 100) s += ` (${it.pct}%)`;
      if (it.limited) s += ' *자동 밝기 제한';
      return s;
    });
    $('specLight').textContent = `${parts.join(' / ')}  [${light.source}]`;
  }

  /** 설치 그림. svg 문자열은 diagram.js 에서 생성 (사용자 입력 문자열은 이스케이프 처리됨) */
  function renderDiagrams(sideSvg, frontSvg, msg) {
    $('diagramMsg').textContent = msg || '';
    $('diagramBox').style.display = sideSvg ? 'block' : 'none';
    $('sideView').innerHTML = sideSvg || '';
    $('frontView').innerHTML = frontSvg || '';
  }

  /** 같은 조건 가능 기종 목록 */
  function renderMatches(list, msg, unit) {
    $('matchMsg').textContent = msg;
    const ul = $('matchList');
    ul.innerHTML = '';
    (list || []).forEach((m) => {
      const li = document.createElement('li');
      li.textContent = `${m.p.model} + ${m.lens.name}  (${U.format(m.distWide * 1000, unit)} ~ ${U.format(m.distTele * 1000, unit)})`;
      if (!m.p.verified) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = '미검증';
        li.appendChild(tag);
      }
      ul.appendChild(li);
    });
  }

  root.EPC = root.EPC || {};
  root.EPC.ui = {
    $, renderSeries, renderProjectorList, renderLensList, renderSpecs,
    renderWarnings, renderResult, renderReverse, clearResult, renderInstall,
    setUnitLabels, setMode, setCopyStatus, renderLight, renderDiagrams, renderMatches, renderUst, renderNoData
  };
})(window);
