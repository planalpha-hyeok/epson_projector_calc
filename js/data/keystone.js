/*
 * H/V 키스톤 보정 가능 기울기 범위 (엡손 사양서 "Keystone Correction Range" 표)
 *   값: [수직 ±도, 수평 ±도]. 프로젝터 기울기가 이 범위 안이면 H/V 키스톤으로 보정 가능.
 *   표는 사양서 PDF 페이지를 이미지로 확인해 옮겼다 (병합된 칸이 많아 텍스트 추출로는 구분 불가).
 *
 * 출처:
 *   0.76": EB-G7905U series p.51, EB-L1075U series p.35, EB-L1505U/L1405U series p.34, EB-PU2010 series Rev.06 p.54-55 (값 동일)
 *   1.03": EB-PU2220 series Rev.D p.54, EB-PU2010 series Rev.06 p.54, EB-L1755U series r130 p.35 (값 동일),
 *          EB-L20000U series p.22 (ELPLW08 만 37°)
 *   4K   : EB-PQ2220B Rev.01, EB-PQ2010 Rev.03 (ELPLU03/U03S 만 다름)
 *   L30000U: EB-L30000U series v1.20 p.25
 *   L25000U, L12000Q: 확인한 사양서 없음 → 자료 없음
 */
(function (root) {
  function expand(rows) {
    const out = {};
    rows.forEach(([models, v]) => models.forEach((m) => { out[m] = v; }));
    return out;
  }

  const K076 = expand([
    [['ELPLX01', 'ELPLX01S', 'ELPLX01W', 'ELPLX01WS'], [16, 16]],
    [['ELPLU03', 'ELPLU03S'], [28, 28]],
    [['ELPLU04', 'ELPLU02'], [35, 30]],
    [['ELPLR04'], [34, 30]],
    [['ELPLW05', 'ELPLW08'], [40, 30]],
    [['ELPLW06', 'ELPLW04', 'ELPLM08', 'ELPLM09', 'ELPLM15', 'ELPLS04', 'ELPLM10', 'ELPLM06',
      'ELPLM11', 'ELPLM07', 'ELPLL08', 'ELPLL07'], [45, 30]]
  ]);

  const K103 = expand([
    [['ELPLX02', 'ELPLX02S', 'ELPLX02W', 'ELPLX02WS'], [16, 16]],
    [['ELPLU03', 'ELPLU03S'], [28, 28]],
    [['ELPLU04', 'ELPLU02', 'ELPLR04'], [31, 30]],
    [['ELPLW05', 'ELPLW06', 'ELPLW04'], [41, 30]],
    [['ELPLW08'], [35, 30]],
    [['ELPLM09', 'ELPLM15', 'ELPLS04'], [44, 30]],
    [['ELPLM08', 'ELPLM10', 'ELPLM06', 'ELPLM11', 'ELPLM07', 'ELPLL08', 'ELPLL07'], [45, 30]]
  ]);
  const K103_L20000 = Object.assign({}, K103, { ELPLW08: [37, 30] });

  const KPQ22 = expand([
    [['ELPLX02', 'ELPLX02S', 'ELPLX02W', 'ELPLX02WS'], [17, 17]],
    [['ELPLU03', 'ELPLU03S'], [35, 30]],
    [['ELPLU04'], [32, 30]],
    [['ELPLW05', 'ELPLW06'], [40, 30]],
    [['ELPLW08'], [36, 30]],
    [['ELPLM08', 'ELPLM09', 'ELPLM15', 'ELPLM10', 'ELPLM11', 'ELPLL08'], [45, 30]]
  ]);
  const KPQ20 = Object.assign({}, KPQ22, { ELPLU03: [30, 30], ELPLU03S: [30, 30] });

  const KL30 = expand([
    [['ELPLX03'], [18, 30]],
    [['ELPLR05'], [35, 30]],
    [['ELPLU05'], [39, 30]],
    [['ELPLW07'], [42, 30]],
    [['ELPLM12', 'ELPLM13', 'ELPLM14', 'ELPLL09', 'ELPLL10'], [45, 30]]
  ]);

  const BY_PROJECTOR = {};
  const put = (ids, table, source) => ids.forEach((id) => { BY_PROJECTOR[id] = { source, lenses: table }; });
  put(['EB-PU1008W', 'EB-PU1008B', 'EB-PU1007W', 'EB-PU1007B', 'EB-PU1006W', 'EB-L1405U', 'EB-L1300U', 'EB-L1200U',
    'EB-L1100U', 'EB-L1070U', 'EB-L1075U', 'EB-L1050U', 'EB-G7905U', 'EB-G7900U', 'EB-G7500U', 'EB-G7400U',
    'EB-G7200W', 'EB-G7000W'], K076, '엡손 사양서 (EB-G7905U / L1075U / L1405U / PU2010 series)');
  put(['EB-PU2220B', 'EB-PU2216B', 'EB-PU2213B', 'EB-PU2120W', 'EB-PU2116W', 'EB-PU2113W', 'EB-PU2010B',
    'EB-L1755U', 'EB-L1750U', 'EB-L1505UH', 'EB-L1500UH'], K103, '엡손 사양서 (EB-PU2220 / PU2010 / L1755U series)');
  put(['EB-L20000U'], K103_L20000, '엡손 사양서 EB-L20000U series');
  put(['EB-PQ2220B', 'EB-PQ2216B', 'EB-PQ2213B'], KPQ22, '엡손 사양서 EB-PQ2220B Rev.01');
  put(['EB-PQ2010B', 'EB-PQ2008B'], KPQ20, '엡손 사양서 EB-PQ2010 Rev.03');
  put(['EB-L30000U'], KL30, '엡손 사양서 EB-L30000U series v1.20');

  // 고정 렌즈 (렌즈 항목 BUILTIN): EB-L890E/L895E/L890U/L895U/L790U/L690U 사양서 p.27
  put(['EB-L895U', 'EB-L890U', 'EB-L790U', 'EB-L690U'], { BUILTIN: [30, 30] }, '엡손 사양서 EB-L890E/L895E series Rev01');

  root.EPC = root.EPC || {};
  root.EPC.KEYSTONE = BY_PROJECTOR;
  if (typeof module !== 'undefined') module.exports = BY_PROJECTOR;
})(typeof window !== 'undefined' ? window : globalThis);
