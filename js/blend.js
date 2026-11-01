/*
 * 엣지 블렌딩 배치 계산 (DOM 사용 안 함)
 *
 * 가로 N 대, 세로 M 대, 겹침(블렌드) 폭 o (한 대 영상 대비 비율)
 *   전체 캔버스 가로 = 한 대 가로 × (N - (N-1) × o)
 *   전체 캔버스 세로 = 한 대 세로 × (M - (M-1) × o)
 * 캔버스를 스크린에 맞추는 방식은 한 대일 때와 같다 (스크린이 더 넓으면 가로 맞춤, 아니면 세로 맞춤).
 */
(function (root) {
  const calc = root.EPC.calc;

  /** 해상도 표기 → 가로/세로 화소 수 (알 수 없으면 null) */
  function panelPixels(resText) {
    const t = String(resText);
    if (/3840/.test(t)) return { x: 3840, y: 2160 };
    if (/WUXGA/.test(t)) return { x: 1920, y: 1200 };
    if (/WXGA/.test(t)) return { x: 1280, y: 800 };
    if (/Full HD/.test(t)) return { x: 1920, y: 1080 };
    if (/XGA/.test(t)) return { x: 1024, y: 768 };
    return null;
  }

  /**
   * @param {object} d  screenW, screenH (mm), cols, rows, overlapPct, nativeAspect ("16:10"), resText
   */
  function layout(d) {
    const a = calc.parseAspect(d.nativeAspect);
    const o = d.overlapPct / 100;
    const kx = d.cols - (d.cols - 1) * o;
    const ky = d.rows - (d.rows - 1) * o;
    const canvasAspect = a * kx / ky;
    const screenAspect = d.screenW / d.screenH;
    let canvasW;
    let fit;
    if (screenAspect >= canvasAspect) { canvasW = d.screenW; fit = 'WIDTH'; } else { canvasW = d.screenH * canvasAspect; fit = 'HEIGHT'; }
    const canvasH = canvasW / canvasAspect;
    const panelW = canvasW / kx;
    const panelH = panelW / a;
    const px = panelPixels(d.resText);
    return {
      fit,
      canvas: { w: canvasW, h: canvasH },
      panel: { w: panelW, h: panelH, diagInch: calc.diagonalInch(panelW, panelH) },
      blendMm: { x: d.cols > 1 ? o * panelW : 0, y: d.rows > 1 ? o * panelH : 0 },
      blendPx: px ? { x: d.cols > 1 ? Math.round(o * px.x) : 0, y: d.rows > 1 ? Math.round(o * px.y) : 0 } : null,
      count: d.cols * d.rows
    };
  }

  const api = { layout, panelPixels };
  root.EPC = root.EPC || {};
  root.EPC.blend = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
