/*
 * 설치 높이 계산 (DOM 사용 안 함)
 *
 * 수직 시프트 s(%)의 의미: 영상 중심이 렌즈 중심보다 s × 패널 영상 높이만큼 위(+)에 있음.
 *   - 바닥/테이블 설치: 영상 중심 = 렌즈 중심 + s × H
 *   - 천장 설치(상하 반전): 영상 중심 = 렌즈 중심 - s × H
 * 이 정의로 계산한 값은 엡손 사양서의 "렌즈 중심 ~ 스크린 하단 거리" 공식과 일치한다
 * (tests/calc.test.js 에서 검증).
 *
 * 영상 중심 = 스크린 중심 (패널의 남는 여백은 위아래/좌우로 균등하게 나간다고 본다).
 */
(function (root) {
  /**
   * 렌즈 중심 높이 범위 (바닥 기준, mm)
   * @param {number} screenBottomMm  바닥 ~ 스크린 하단 높이
   * @param {number} screenHmm       스크린 세로
   * @param {number} panelHmm        패널 전체 영상 세로
   * @param {number[]} vRangePct     수직 시프트 범위 [하한%, 상한%]
   * @param {'FLOOR'|'CEILING'} mount 설치 방식
   * @returns {{min:number,max:number,center:number}|null}
   */
  function lensHeightRange(screenBottomMm, screenHmm, panelHmm, vRangePct, mount) {
    if (!vRangePct) return null;
    const center = screenBottomMm + screenHmm / 2;
    const lo = vRangePct[0] / 100;
    const hi = vRangePct[1] / 100;
    if (mount === 'CEILING') {
      return { min: center + lo * panelHmm, max: center + hi * panelHmm, center };
    }
    return { min: center - hi * panelHmm, max: center - lo * panelHmm, center };
  }

  /** 렌즈 중심 - 스크린 하단 (mm). 바닥 설치 기준, + 는 렌즈가 스크린 하단보다 위 */
  function lensToScreenBottom(screenHmm, panelHmm, vRangePct) {
    const r = lensHeightRange(0, screenHmm, panelHmm, vRangePct, 'FLOOR');
    return r ? { min: r.min, max: r.max } : null;
  }

  const api = { lensHeightRange, lensToScreenBottom };
  root.EPC = root.EPC || {};
  root.EPC.install = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
