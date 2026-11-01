/*
 * 길이 단위 변환 (내부 계산은 모두 mm)
 */
(function (root) {
  const MM = { mm: 1, m: 1000, ft: 304.8 };
  const LABEL = { mm: 'mm', m: 'm', ft: 'ft' };

  /** 입력값(선택 단위) → mm */
  function toMm(value, unit) {
    return value * MM[unit];
  }

  /** mm → 선택 단위 숫자 */
  function fromMm(mm, unit) {
    return mm / MM[unit];
  }

  /** mm → 표시 문자열 */
  function format(mm, unit) {
    if (unit === 'mm') return `${Math.round(mm).toLocaleString()} mm`;
    // 1cm 단위 반올림 (부동소수점 오차 방지를 위해 mm→cm 정수로 먼저 반올림)
    if (unit === 'm') return `${(Math.round(mm / 10) / 100).toFixed(2)} m`;
    // ft: 피트-인치 표기 (인치는 0.5 단위 반올림)
    const sign = mm < 0 ? '-' : '';
    let totalIn = Math.round((Math.abs(mm) / 25.4) * 2) / 2;
    const ft = Math.floor(totalIn / 12);
    const inch = totalIn - ft * 12;
    return `${sign}${ft}' ${inch}"`;
  }

  /** 입력칸에 넣을 숫자 (단위 변경 시 값 유지용) */
  function inputValue(mm, unit) {
    if (unit === 'mm') return String(Math.round(mm));
    if (unit === 'm') return String(Math.round(mm / 10) / 100);
    return String(Math.round(fromMm(mm, unit) * 100) / 100);
  }

  const api = { toMm, fromMm, format, inputValue, LABEL, UNITS: Object.keys(MM) };
  root.EPC = root.EPC || {};
  root.EPC.units = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
