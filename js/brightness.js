/*
 * 밝기·대비 판정 (DOM 사용 안 함)
 *
 *   스크린 조도(lux)    = 프로젝터 밝기(lm) / 패널 영상 면적(m²)
 *   스크린 휘도(cd/m²) = 스크린 조도 × 스크린 게인 / π
 *   대비(근사)          = (프로젝터 조도 + 주변광 조도) / 주변광 조도
 *     - 프로젝터 자체의 검은색 밝기는 무시하므로 실제 대비보다 높게 나온다 (상한값).
 *     - 주변광 조도는 스크린 면에서 잰 값(lux)을 넣는다. 게인은 양쪽에 같이 곱해지므로 대비에는 영향이 없다고 본다.
 *
 * 판정 기준: ANSI/INFOCOMM 3M-2011 (현 AVIXA) 시청 용도별 최소 대비
 *   수동적 시청 7:1, 기본 의사결정 15:1, 분석적 의사결정 50:1, 풀모션 영상 80:1
 *   (표준 원문은 확인하지 못했고, 2차 자료 기준)
 */
(function (root) {
  const LEVELS = [
    { min: 80, label: '풀모션 영상 (80:1 이상)' },
    { min: 50, label: '분석적 의사결정 (50:1 이상)' },
    { min: 15, label: '기본 의사결정 (15:1 이상)' },
    { min: 7, label: '수동적 시청 (7:1 이상)' }
  ];

  /**
   * @param {object} d  lumens, panelWmm, panelHmm, gain, ambientLux
   */
  function evaluate(d) {
    const areaM2 = (d.panelWmm / 1000) * (d.panelHmm / 1000);
    const projLux = d.lumens / areaM2;
    const nit = projLux * d.gain / Math.PI;
    const contrast = d.ambientLux > 0 ? (projLux + d.ambientLux) / d.ambientLux : Infinity;
    const level = LEVELS.find((l) => contrast >= l.min) || null;
    return { areaM2, projLux, nit, contrast, level: level ? level.label : '기준 미달 (7:1 미만)', meets: !!level };
  }

  const api = { evaluate, LEVELS };
  root.EPC = root.EPC || {};
  root.EPC.brightness = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
