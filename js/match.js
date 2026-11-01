/*
 * 같은 조건으로 설치 가능한 기종 찾기 (DOM 사용 안 함)
 *
 * 조건: 같은 스크린 크기에서, 지정한 투사거리가 렌즈의 WIDE ~ TELE 범위 안에 들어가는 본체-렌즈 조합.
 */
(function (root) {
  const calc = root.EPC.calc;
  const catalog = root.EPC.catalog;

  /**
   * @param {{w:number,h:number}} screen  스크린 mm
   * @param {number} distM                설치할 투사거리 (m)
   * @param {object[]} projectors
   * @param {object} lensClasses
   * @returns {Array<{p:object, lens:object, distWide:number, distTele:number}>}
   */
  function findMatches(screen, distM, projectors, lensClasses) {
    const out = [];
    projectors.forEach((p) => {
      catalog.lensesFor(p, lensClasses).forEach((lens) => {
        const r = calc.calculate(screen, p.nativeAspect, lens);
        if (distM >= r.distWide - 1e-9 && distM <= r.distTele + 1e-9) {
          out.push({ p, lens, distWide: r.distWide, distTele: r.distTele });
        }
      });
    });
    return out;
  }

  root.EPC = root.EPC || {};
  root.EPC.match = { findMatches };
  if (typeof module !== 'undefined') module.exports = { findMatches };
})(typeof window !== 'undefined' ? window : globalThis);
