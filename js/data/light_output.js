/*
 * 렌즈 장착 시 밝기 (엡손 사양서 "Light Output" 표)
 *
 * 값: [밝기(lm), 밝기 제한(%) 또는 null, 자동 제한 여부]
 *   - 자동 제한(true): 사양서 * 표시. 이 렌즈를 쓰면 광원 모드가 Custom 으로 바뀌고 최대 밝기가 제한됨.
 *   - 표에 없는 기종/렌즈는 "자료 없음"으로 표시한다.
 *
 * 출처:
 *   EB-PU2220 series Rev.D 1.2.3 Light Output
 *   EB-PQ2220B/PQ2216/PQ2213B Rev.01 Light Output
 *   EB-PQ2010/PQ2008 Rev.03 Light Output (제한 % 표기 없음)
 *   EB-PU2010 series Rev.06 Light Output (제한 % 표기 없음)
 */
(function (root) {
  const t = (lm, pct, limited) => [lm, pct === undefined ? null : pct, !!limited];

  // 같은 값을 여러 렌즈 모델에 펼침
  function expand(rows) {
    const out = {};
    rows.forEach(([models, v]) => models.forEach((m) => { out[m] = v; }));
    return out;
  }

  const X02ALL = ['ELPLX02', 'ELPLX02W', 'ELPLX02S', 'ELPLX02WS'];

  // PU2220 계열: [PU2220B/PU2120W, PU2216B/PU2116W, PU2213B/PU2113W]
  const PU22 = [
    [X02ALL, [t(16900, 100), t(13500, 100), t(11000, 100)]],
    [['ELPLU03'], [t(11700, 67, 1), t(11700, 84, 1), t(11300, 100)]],
    [['ELPLU03S'], [t(17400, 100), t(13900, 100), t(11300, 100)]],
    [['ELPLU04'], [t(19000, 100), t(15200, 100), t(12300, 100)]],
    [['ELPLW05'], [t(11700, 66, 1), t(11800, 83, 1), t(11500, 100)]],
    [['ELPLW08'], [t(19100, 100), t(15300, 100), t(12400, 100)]],
    [['ELPLW06'], [t(19200, 100), t(15300, 100), t(12400, 100)]],
    [['ELPLM08'], [t(10000, 50, 1), t(10000, 63, 1), t(10000, 77, 1)]],
    [['ELPLM09'], [t(12000, 60, 1), t(12000, 75, 1), t(11900, 92, 1)]],
    [['ELPLM15'], [t(20000, 100), t(16000, 100), t(13000, 100)]],
    [['ELPLM10'], [t(19900, 100), t(15900, 100), t(12900, 100)]],
    [['ELPLM11'], [t(19000, 100), t(15200, 100), t(12300, 100)]],
    [['ELPLL08'], [t(19000, 100), t(15200, 100), t(12300, 100)]]
  ];

  // PQ2220 계열: [PQ2220B, PQ2216B/W, PQ2213B]
  const PQ22 = [
    [X02ALL, [t(16900, 100), t(13500, 100), t(11000, 100)]],
    [['ELPLU03'], [t(12000, 70, 1), t(12000, 88, 1), t(11100, 100, 1)]],
    [['ELPLU03S'], [t(17100, 100), t(13700, 100), t(11100, 100)]],
    [['ELPLU04'], [t(18900, 100), t(15100, 100), t(12300, 100)]],
    [['ELPLW05'], [t(12000, 69, 1), t(12000, 86, 1), t(11400, 100, 1)]],
    [['ELPLW08'], [t(19000, 100), t(15200, 100), t(12300, 100)]],
    [['ELPLW06'], [t(19100, 100), t(15300, 100), t(12400, 100)]],
    [['ELPLM08'], [t(10000, 52, 1), t(10000, 65, 1), t(10000, 80, 1)]],
    [['ELPLM09'], [t(12000, 60, 1), t(12000, 75, 1), t(12000, 92, 1)]],
    [['ELPLM15'], [t(20000, 100), t(16000, 100), t(13000, 100)]],
    [['ELPLM10'], [t(19800, 100), t(15800, 100), t(12800, 100)]],
    [['ELPLM11'], [t(19000, 100), t(15200, 100), t(12300, 100)]],
    [['ELPLL08'], [t(19000, 100), t(15200, 100), t(12300, 100)]]
  ];

  // PQ2010 계열: [PQ2010B/W, PQ2008B/W]  (제한 % 표기 없음, * 는 자동 제한 렌즈)
  const PQ20 = [
    [X02ALL, [t(8400), t(6700)]],
    [['ELPLU03'], [t(8500, null, 1), t(6800, null, 1)]],
    [['ELPLU03S'], [t(8500), t(6800)]],
    [['ELPLU04'], [t(9400), t(7500)]],
    [['ELPLW05'], [t(8700, null, 1), t(7000, null, 1)]],
    [['ELPLW08'], [t(9500), t(7600)]],
    [['ELPLW06'], [t(9500), t(7600)]],
    [['ELPLM08'], [t(9600, null, 1), t(7600, null, 1)]],
    [['ELPLM09'], [t(9900, null, 1), t(7900, null, 1)]],
    [['ELPLM15'], [t(10000), t(8000)]],
    [['ELPLM10'], [t(9900), t(7900)]],
    [['ELPLM11'], [t(9500), t(7600)]],
    [['ELPLL08'], [t(9500), t(7600)]]
  ];

  // PU2010 계열: [PU2010B/W, PU1008B/W, PU1007B/W, PU1006W]  (단위 lm, 제한 % 표기 없음)
  const NA = null;
  const PU20 = [
    [['ELPLX01', 'ELPLX01S', 'ELPLX01W', 'ELPLX01WS'], [NA, t(7300), t(6000), t(5100)]],
    [X02ALL, [t(8400), NA, NA, NA]],
    [['ELPLU02', 'ELPLU04'], [t(9500), t(7700), t(6300), t(5400)]],
    [['ELPLU03', 'ELPLU03S'], [t(8700), t(7300), t(6000), t(5100)]],
    [['ELPLW04', 'ELPLW06'], [t(9600), t(8100), t(6600), t(5700)]],
    [['ELPLW05'], [t(8900), t(7400), t(6100), t(5200)]],
    [['ELPLW08'], [t(9500), t(7200), t(6000), t(5100)]],
    [['ELPLM06', 'ELPLM10'], [t(9900), t(8300), t(6800), t(5800)]],
    [['ELPLM07', 'ELPLM11'], [t(9500), t(8000), t(6600), t(5600)]],
    [['ELPLM08'], [t(10000), t(8500), t(7000), t(6000)]],
    [['ELPLM09', 'ELPLM15', 'ELPLS04'], [t(10000), t(8400), t(6900), t(5900)]],
    [['ELPLL07', 'ELPLL08'], [t(9500), t(8000), t(6600), t(5600)]],
    [['ELPLR04'], [t(9100), t(7700), t(6400), t(5400)]]
  ];

  // 표의 열(column) → 본체 ID
  function column(rows, idx) {
    return expand(rows.map(([models, cols]) => [models, cols[idx]]).filter(([, v]) => v));
  }

  const SRC_PU22 = '엡손 사양서 EB-PU2220 series Rev.D';
  const SRC_PQ22 = '엡손 사양서 EB-PQ2220B/PQ2216/PQ2213B Rev.01';
  const SRC_PQ20 = '엡손 사양서 EB-PQ2010/PQ2008 Rev.03';
  const SRC_PU20 = '엡손 사양서 EB-PU2010 series Rev.06';

  const BY_PROJECTOR = {};
  const put = (ids, rows, idx, source) => ids.forEach((id) => { BY_PROJECTOR[id] = { source, lenses: column(rows, idx) }; });
  put(['EB-PU2220B', 'EB-PU2120W'], PU22, 0, SRC_PU22);
  put(['EB-PU2216B', 'EB-PU2116W'], PU22, 1, SRC_PU22);
  put(['EB-PU2213B', 'EB-PU2113W'], PU22, 2, SRC_PU22);
  put(['EB-PQ2220B'], PQ22, 0, SRC_PQ22);
  put(['EB-PQ2216B'], PQ22, 1, SRC_PQ22);
  put(['EB-PQ2213B'], PQ22, 2, SRC_PQ22);
  put(['EB-PQ2010B'], PQ20, 0, SRC_PQ20);
  put(['EB-PQ2008B'], PQ20, 1, SRC_PQ20);
  put(['EB-PU2010B'], PU20, 0, SRC_PU20);
  put(['EB-PU1008W', 'EB-PU1008B'], PU20, 1, SRC_PU20);
  put(['EB-PU1007W', 'EB-PU1007B'], PU20, 2, SRC_PU20);
  put(['EB-PU1006W'], PU20, 3, SRC_PU20);

  root.EPC = root.EPC || {};
  root.EPC.LIGHT_OUTPUT = BY_PROJECTOR;
  if (typeof module !== 'undefined') module.exports = BY_PROJECTOR;
})(typeof window !== 'undefined' ? window : globalThis);
