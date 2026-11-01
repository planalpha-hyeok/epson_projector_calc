/*
 * 본체-렌즈 조합 조회 (DOM 사용 안 함)
 *   - 본체별 사용 가능 렌즈 목록
 *   - 렌즈 항목 이름 → 실제 렌즈 모델명 목록 (예: "ELPLM15 / M09 / S04" → ELPLM15, ELPLM09, ELPLS04)
 *   - 렌즈 장착 시 밝기 (사양서 표가 있는 기종만)
 */
(function (root) {
  const NOTE_SHIFT_UNKNOWN = '이 기종의 시프트 수치는 사양서로 확인하지 못함';

  /** 본체에서 쓸 수 있는 렌즈 목록 */
  function lensesFor(p, lensClasses) {
    if (p.type === 'FIXED') return [p.lens];
    const cls = lensClasses[p.lensClass];
    const hideShift = (cls.shiftUnknownFor || []).includes(p.id);
    return cls.lenses
      .filter((l) => !l.onlyFor || l.onlyFor.includes(p.id))
      .map((l) => (hideShift ? Object.assign({}, l, { shift: null, shiftNote: NOTE_SHIFT_UNKNOWN }) : l));
  }

  /** 렌즈 항목 이름에서 모델명 추출. "ELPLU03 / U03S 단초점 줌" → ['ELPLU03', 'ELPLU03S'] */
  function lensModels(lens) {
    if (lens.id === 'BUILTIN') return [];
    const head = lens.name.split(' ').reduce((acc, tok, i, arr) => {
      // 모델명 토큰과 구분자 '/' 만 앞에서부터 모음
      if (acc.done) return acc;
      if (tok === '/' || /^(ELPL)?[A-Z]\d{2}[A-Z]{0,2}$/.test(tok)) acc.list.push(tok);
      else acc.done = true;
      return acc;
    }, { list: [], done: false }).list.filter((t) => t !== '/');
    return head.map((t) => (t.startsWith('ELPL') ? t : `ELPL${t}`));
  }

  /**
   * 렌즈 장착 시 밝기
   * @returns {{source:string, items:Array<{model:string, lm:number, pct:number|null, limited:boolean}>}|null}
   */
  function lightOutputFor(p, lens, lightTable) {
    const row = lightTable[p.id];
    if (!row) return null;
    const items = lensModels(lens)
      .filter((m) => row.lenses[m])
      .map((m) => {
        const [lm, pct, limited] = row.lenses[m];
        return { model: m, lm, pct, limited };
      });
    return items.length ? { source: row.source, items } : null;
  }

  const api = { lensesFor, lensModels, lightOutputFor };
  root.EPC = root.EPC || {};
  root.EPC.catalog = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
