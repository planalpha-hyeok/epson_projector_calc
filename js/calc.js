/*
 * 계산 함수 (DOM 사용 안 함)
 *
 * 화면 맞춤 기준 (엡손 매뉴얼 투사거리 표와 같은 방식):
 *   - 스크린 비율 >= 패널 비율 (예: 16:10 패널에 16:9 스크린)
 *       → 패널 가로폭 = 스크린 가로폭. 남는 위아래는 검은 여백.
 *   - 스크린 비율 <  패널 비율 (예: 16:10 패널에 4:3 스크린)
 *       → 패널 높이 = 스크린 높이. 패널 가로폭 = 스크린 높이 × 패널 비율.
 *   거리는 항상 "패널 전체 영상"의 대각선(인치)으로 계산한다.
 *
 * 거리 공식 (엡손 사양서 형식): 거리(cm) = a × 패널 영상 대각선(인치) + b
 */
(function (root) {
  const MM_PER_INCH = 25.4;

  /** "16:10" → 1.6 */
  function parseAspect(text) {
    const parts = String(text).split(':').map(Number);
    if (parts.length !== 2 || !(parts[0] > 0) || !(parts[1] > 0)) return NaN;
    return parts[0] / parts[1];
  }

  /** 대각선(인치)과 비율 → 스크린 가로/세로(mm) */
  function screenFromDiagonal(inch, aspect) {
    const diagMm = inch * MM_PER_INCH;
    const h = diagMm / Math.sqrt(aspect * aspect + 1);
    return { w: h * aspect, h: h };
  }

  /** 가로/세로(mm) → 대각선(인치) */
  function diagonalInch(wMm, hMm) {
    return Math.sqrt(wMm * wMm + hMm * hMm) / MM_PER_INCH;
  }

  /** 스크린 크기와 패널 비율 → 패널 전체 영상 크기(mm)와 맞춤 기준 */
  function fitPanelToScreen(screenW, screenH, nativeAspect) {
    const screenAspect = screenW / screenH;
    if (screenAspect >= nativeAspect) {
      return { w: screenW, h: screenW / nativeAspect, fit: 'WIDTH' };
    }
    return { w: screenH * nativeAspect, h: screenH, fit: 'HEIGHT' };
  }

  /** 거리(m) = (a × 패널 영상 대각선(인치) + b) / 100 */
  function throwDistance(panelDiagInch, point) {
    return (point.a * panelDiagInch + point.b) / 100;
  }

  /** 시프트 % 범위 → mm 범위. 기준 길이는 패널 전체 영상의 높이(수직) 또는 가로폭(수평) */
  function shiftRangeMm(rangePct, baseMm) {
    if (!rangePct) return null;
    return [baseMm * rangePct[0] / 100, baseMm * rangePct[1] / 100];
  }

  /**
   * 전체 계산
   * @param {{w:number,h:number}} screen  스크린 mm
   * @param {string} nativeAspect         "16:10" 등
   * @param {object} lens                 { wide:{a,b}, tele:{a,b}, shift }
   */
  function calculate(screen, nativeAspect, lens) {
    const native = parseAspect(nativeAspect);
    const panel = fitPanelToScreen(screen.w, screen.h, native);
    const panelDiag = diagonalInch(panel.w, panel.h);
    const shift = lens.shift || { v: null, h: null };
    return {
      screen: { w: screen.w, h: screen.h, diagInch: diagonalInch(screen.w, screen.h) },
      panel: { w: panel.w, h: panel.h, fit: panel.fit, diagInch: panelDiag },
      distWide: throwDistance(panelDiag, lens.wide),
      distTele: throwDistance(panelDiag, lens.tele),
      shiftV: shiftRangeMm(shift.v, panel.h),
      shiftH: shiftRangeMm(shift.h, panel.w)
    };
  }

  /** 패널 대각선(인치)과 패널 비율 → 패널 가로/세로(mm) */
  function panelFromDiagonal(diagInch, nativeAspect) {
    return screenFromDiagonal(diagInch, nativeAspect);
  }

  /** 패널 영상 → 그 안에 들어가는 스크린(콘텐츠) 크기 */
  function screenInPanel(panel, nativeAspect, screenAspect) {
    if (screenAspect >= nativeAspect) return { w: panel.w, h: panel.w / screenAspect };
    return { w: panel.h * screenAspect, h: panel.h };
  }

  /**
   * 역계산: 투사거리 → 가능한 스크린 크기
   * WIDE 에서 가장 큰 화면, TELE 에서 가장 작은 화면.
   * @returns {{wide:object, tele:object}|null}  각 {screen:{w,h,diagInch}, panel:{w,h,diagInch}}
   */
  function screenFromDistance(distM, nativeAspect, screenAspect, lens) {
    if (!(distM > 0)) return null;
    const native = parseAspect(nativeAspect);
    const one = (pt) => {
      const panelDiag = (distM * 100 - pt.b) / pt.a;
      if (!(panelDiag > 0)) return null;
      const panel = panelFromDiagonal(panelDiag, native);
      const scr = screenInPanel(panel, native, screenAspect);
      return {
        panel: { w: panel.w, h: panel.h, diagInch: panelDiag },
        screen: { w: scr.w, h: scr.h, diagInch: diagonalInch(scr.w, scr.h) }
      };
    };
    const wide = one(lens.wide);
    const tele = one(lens.tele);
    if (!wide || !tele) return null;
    return { wide, tele };
  }

  const api = {
    parseAspect, screenFromDiagonal, diagonalInch, fitPanelToScreen, throwDistance, shiftRangeMm,
    calculate, screenFromDistance
  };
  root.EPC = root.EPC || {};
  root.EPC.calc = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
