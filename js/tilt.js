/*
 * 계획 위치 확인: 렌즈를 놓을 위치가 시프트 범위 안인지, 아니면 기울여야 하는지 (DOM 사용 안 함)
 *
 * 필요한 시프트(%):
 *   바닥 설치: 영상 중심 = 렌즈 중심 + s × 패널 높이  →  s = (스크린 중심 높이 - 렌즈 높이) / 패널 높이
 *   천장 설치: 상하 반전                              →  s = (렌즈 높이 - 스크린 중심 높이) / 패널 높이
 *   수평: 영상 중심 = 렌즈 + s × 패널 가로 (오른쪽 +)  →  s = -렌즈 좌우 위치 / 패널 가로
 * 범위를 넘는 만큼은 프로젝터를 기울여야 한다고 보고, 기울기 = atan(넘는 거리 / 투사거리) 로 근사한다.
 * 그 기울기를 사양서의 H/V 키스톤 보정 가능 범위와 비교한다.
 */
(function (root) {
  const DEG = 180 / Math.PI;

  /**
   * 한 방향 확인
   * @param {number} needPct    필요한 시프트 %
   * @param {number[]|null} range  시프트 가능 범위 [하한%, 상한%]
   * @param {number} sizeMm     패널 영상 높이(수직) 또는 가로폭(수평)
   * @param {number} distMm     투사거리
   * @param {number|null} keystoneDeg  키스톤 보정 가능 ±도
   */
  function checkAxis(needPct, range, sizeMm, distMm, keystoneDeg) {
    if (!range) return { needPct, known: false };
    const clamped = Math.min(Math.max(needPct, range[0]), range[1]);
    const excessMm = (needPct - clamped) / 100 * sizeMm;
    const tiltDeg = Math.atan2(excessMm, distMm) * DEG;
    const inShift = Math.abs(needPct - clamped) < 1e-9;
    const keystoneOk = keystoneDeg === null || keystoneDeg === undefined ? null : Math.abs(tiltDeg) <= keystoneDeg + 1e-9;
    return { needPct, known: true, inShift, shiftUsedPct: clamped, excessMm, tiltDeg, keystoneDeg: keystoneDeg ?? null, keystoneOk };
  }

  /**
   * @param {object} d
   *   screenCenterY (mm, 바닥 기준), panelW, panelH, distMm
   *   lensY (mm, 바닥 기준), lensX (mm, 스크린 중심 기준 오른쪽 +)
   *   mount ('FLOOR'|'CEILING'), shift {v,h}, keystone [수직°, 수평°] 또는 null
   */
  function checkPlacement(d) {
    const sv = d.mount === 'CEILING'
      ? (d.lensY - d.screenCenterY) / d.panelH * 100
      : (d.screenCenterY - d.lensY) / d.panelH * 100;
    const sh = -d.lensX / d.panelW * 100;
    const shift = d.shift || { v: null, h: null };
    const k = d.keystone || [null, null];
    return {
      v: checkAxis(sv, shift.v, d.panelH, d.distMm, k[0]),
      h: checkAxis(sh, shift.h, d.panelW, d.distMm, k[1])
    };
  }

  const api = { checkPlacement, checkAxis };
  root.EPC = root.EPC || {};
  root.EPC.tilt = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
