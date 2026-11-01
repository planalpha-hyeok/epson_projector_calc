/*
 * 교체형 렌즈 데이터 (패널 등급별)
 *
 * 모든 값은 엡손 공식 사양서(Specifications)의 "Projection Distance Formula" 표에서 옮겼다.
 *   투사거리(cm) = a × 화면 크기(인치, 패널 비율 기준 대각선) + b
 *   - wide: 최소 거리(Wide) 공식, tele: 최대 거리(Tele) 공식
 *   - trText: 사양서에 적힌 투사비 표기 (화면 표시용)
 *
 * shift: { v: [하한%, 상한%], h: [하한%, 상한%] }  (사양서 "Lens Shift Adjustment Range" 기준)
 *   - 값이 사양서 본문에 없으면 null.
 * shiftNote: 사양서의 시프트 관련 추가 설명
 * onlyFor: 이 목록의 본체에서만 표시 (사양서 렌즈 호환표 기준). 없으면 등급 내 전체 본체.
 */
(function (root) {
  const f = (a, b) => ({ a: a, b: b });

  // ---- 본체 그룹 (사양서별 호환 렌즈 목록이 다름) ----
  const PU2220 = ['EB-PU2220B', 'EB-PU2216B', 'EB-PU2213B', 'EB-PU2120W', 'EB-PU2116W', 'EB-PU2113W'];
  const PU2010 = ['EB-PU2010B'];
  const L1755 = ['EB-L1755U', 'EB-L1750U', 'EB-L1505UH', 'EB-L1500UH'];
  const L20000 = ['EB-L20000U'];
  const PQ = ['EB-PQ2220B', 'EB-PQ2216B', 'EB-PQ2213B', 'EB-PQ2010B', 'EB-PQ2008B'];
  const L12000Q = ['EB-L12000Q'];

  // ---- 시프트 (사양서 본문 수치) ----
  const S076 = { v: [-67, 67], h: [-30, 30] };
  const S103 = { v: [-60, 60], h: [-18, 18] };
  const S103_SMALL = { v: [-24, 24], h: null };
  const S104 = { v: [-58, 58], h: [-16, 16] };
  const S104_SMALL = { v: [-18, 18], h: null };
  const NOTE_SMALL = '사양서: 수평 시프트를 최대로 하면 수직 이동 0%';

  const LENS_CLASSES = {
    // 0.76" WUXGA/WXGA: PU1006~PU1008, L1050U~L1405U, G7000 시리즈
    WUXGA_076: {
      label: '0.76" LCD (WUXGA / WXGA)',
      basisAspect: '16:10',
      source: '엡손 사양서: EB-PU2010 series Rev.06, EB-L1505U/L1405U series, EB-L1075U/L1070U series, EB-G7905U/G7900U series (16:10 공식 동일)',
      lenses: [
        { id: 'ELPLX01', name: 'ELPLX01 / X01S / X01W / X01WS 초단초점', trText: '0.35',
          wide: f(0.79, -5.16), tele: f(0.79, -5.16), shift: null,
          shiftNote: '사양서: 최대 이동 V×17%, 수평 최대 시 위로 이동 불가' },
        { id: 'ELPLU03S', name: 'ELPLU03 / U03S 단초점 줌', trText: '0.65 - 0.78', wide: f(1.44, -3.77), tele: f(1.72, -3.63), shift: S076 },
        { id: 'ELPLU04', name: 'ELPLU04 / U02 단초점 줌', trText: '0.87 - 1.05', wide: f(1.94, -5.72), tele: f(2.33, -5.68), shift: S076 },
        { id: 'ELPLW05', name: 'ELPLW05 광각 줌', trText: '1.04 - 1.46', wide: f(2.32, -7.65), tele: f(3.21, -5.81), shift: S076 },
        { id: 'ELPLW06', name: 'ELPLW06 / W04 광각 줌', trText: '1.62 - 2.22', wide: f(3.58, -7.32), tele: f(4.87, -8.32), shift: S076 },
        { id: 'ELPLW08', name: 'ELPLW08 광각 줌', trText: '1.18 - 1.66', wide: f(2.58, -4.78), tele: f(3.62, -5.44), shift: S076 },
        { id: 'ELPLM08', name: 'ELPLM08 중초점 줌 (표준)', trText: '1.44 - 2.32', wide: f(3.16, -5.00), tele: f(5.05, -4.49), shift: S076 },
        { id: 'ELPLM15', name: 'ELPLM15 / M09 / S04 중초점 줌', trText: '2.16 - 3.48', wide: f(4.73, -8.00), tele: f(7.59, -7.93), shift: S076 },
        { id: 'ELPLM10', name: 'ELPLM10 / M06 중초점 줌', trText: '3.32 - 5.06', wide: f(7.30, -13.04), tele: f(11.03, -13.01), shift: S076 },
        { id: 'ELPLM11', name: 'ELPLM11 / M07 중초점 줌', trText: '4.85 - 7.38', wide: f(10.70, -23.67), tele: f(16.14, -23.47), shift: S076 },
        { id: 'ELPLL08', name: 'ELPLL08 / L07 장초점 줌', trText: '7.21 - 10.11', wide: f(15.87, -31.85), tele: f(22.11, -31.62), shift: S076 },
        { id: 'ELPLR04', name: 'ELPLR04 후면투사', trText: '0.95', wide: f(2.12, -6.10), tele: f(2.12, -6.10), shift: null }
      ]
    },

    // 1.03" WUXGA: PU2010B, PU2100/PU2200, L1500UH~L1755U, L20000U
    WUXGA_103: {
      label: '1.03" LCD (WUXGA)',
      basisAspect: '16:10',
      source: '엡손 사양서: EB-PU2220 series Rev.D, EB-PU2010 series Rev.06, EB-L1755U series r130, EB-L20000U series (16:10 공식 동일)',
      lenses: [
        { id: 'ELPLX02', name: 'ELPLX02 / X02W 초단초점', trText: '0.35', wide: f(0.77, -3.40), tele: f(0.77, -3.40), shift: null,
          onlyFor: [...PU2220, ...PU2010, ...L1755, ...L20000] },
        { id: 'ELPLX02S', name: 'ELPLX02S / X02WS 초단초점', trText: '0.35', wide: f(0.77, -3.40), tele: f(0.77, -3.40), shift: null,
          onlyFor: [...PU2220, ...PU2010] },
        { id: 'ELPLU03S', name: 'ELPLU03 / U03S 단초점 줌', trText: '0.48 - 0.57', wide: f(1.05, -3.49), tele: f(1.26, -3.28),
          shift: S103_SMALL, shiftNote: NOTE_SMALL, onlyFor: [...PU2220, ...PU2010, ...L1755] },
        { id: 'ELPLU04', name: 'ELPLU04 / U02 단초점 줌', trText: '0.64 - 0.77', wide: f(1.42, -5.65), tele: f(1.71, -5.52), shift: S103 },
        { id: 'ELPLW05', name: 'ELPLW05 광각 줌', trText: '0.77 - 1.07', wide: f(1.70, -7.86), tele: f(2.35, -5.80),
          shift: S103_SMALL, shiftNote: NOTE_SMALL, onlyFor: [...PU2220, ...PU2010, ...L1755] },
        { id: 'ELPLW08', name: 'ELPLW08 광각 줌', trText: '0.86 - 1.21', wide: f(1.88, -3.92), tele: f(2.64, -5.10), shift: S103 },
        { id: 'ELPLW06', name: 'ELPLW06 / W04 광각 줌', trText: '1.19 - 1.62', wide: f(2.61, -7.51), tele: f(3.55, -6.99), shift: S103 },
        { id: 'ELPLM08', name: 'ELPLM08 중초점 줌', trText: '1.06 - 1.69', wide: f(2.31, -5.10), tele: f(3.70, -4.54),
          shift: S103_SMALL, shiftNote: NOTE_SMALL, onlyFor: [...PU2220, ...PU2010] },
        { id: 'ELPLM15', name: 'ELPLM15 / M09 / S04 중초점 줌 (표준)', trText: '1.57 - 2.56', wide: f(3.45, -8.18), tele: f(5.57, -8.02), shift: S103 },
        { id: 'ELPLM10', name: 'ELPLM10 / M06 중초점 줌', trText: '2.42 - 3.71', wide: f(5.33, -13.21), tele: f(8.10, -13.08), shift: S103 },
        { id: 'ELPLM11', name: 'ELPLM11 / M07 중초점 줌', trText: '3.54 - 5.41', wide: f(7.81, -23.86), tele: f(11.83, -23.55), shift: S103 },
        { id: 'ELPLL08', name: 'ELPLL08 / L07 장초점 줌', trText: '5.27 - 7.41', wide: f(11.59, -31.52), tele: f(16.21, -31.81), shift: S103 },
        { id: 'ELPLR04', name: 'ELPLR04 후면투사', trText: '0.70', wide: f(1.56, -6.62), tele: f(1.56, -6.62), shift: null,
          onlyFor: [...PU2010, ...L1755] }
      ]
    },

    // 1.04" 4K (16:9): PQ 시리즈. L12000Q 는 매뉴얼 투사거리 범위가 이 공식과 일치
    UHD_104: {
      label: '1.04" LCD (4K / 16:9)',
      basisAspect: '16:9',
      source: '엡손 사양서: EB-PQ2220B/PQ2216/PQ2213B Rev.01, EB-PQ2010/PQ2008 Rev.03 (16:9 공식 동일). L12000Q 는 Pro L12000QNL 매뉴얼 투사거리 범위와 대조',
      lenses: [
        { id: 'ELPLX02', name: 'ELPLX02 / X02W / X02S / X02WS 초단초점', trText: '0.34', wide: f(0.77, -3.41), tele: f(0.77, -3.41), shift: null },
        { id: 'ELPLU03S', name: 'ELPLU03 / U03S 단초점 줌', trText: '0.46 - 0.56', wide: f(1.04, -3.47), tele: f(1.25, -3.28),
          shift: S104_SMALL, shiftNote: NOTE_SMALL },
        { id: 'ELPLU04', name: 'ELPLU04 단초점 줌', trText: '0.62 - 0.75', wide: f(1.40, -5.23), tele: f(1.69, -5.30), shift: S104 },
        { id: 'ELPLW05', name: 'ELPLW05 광각 줌', trText: '0.74 - 1.04', wide: f(1.69, -7.87), tele: f(2.34, -5.81),
          shift: S104_SMALL, shiftNote: NOTE_SMALL },
        { id: 'ELPLW08', name: 'ELPLW08 광각 줌', trText: '0.83 - 1.17', wide: f(1.87, -3.98), tele: f(2.63, -5.13), shift: S104 },
        { id: 'ELPLW06', name: 'ELPLW06 광각 줌', trText: '1.15 - 1.57', wide: f(2.60, -7.47), tele: f(3.53, -6.97), shift: S104 },
        { id: 'ELPLM08', name: 'ELPLM08 중초점 줌', trText: '1.02 - 1.64', wide: f(2.30, -5.10), tele: f(3.68, -4.54),
          shift: S104_SMALL, shiftNote: NOTE_SMALL, onlyFor: PQ },
        { id: 'ELPLM15', name: 'ELPLM15 / M09 중초점 줌 (표준)', trText: '1.52 - 2.47', wide: f(3.43, -8.09), tele: f(5.54, -8.00), shift: S104 },
        { id: 'ELPLM10', name: 'ELPLM10 중초점 줌', trText: '2.34 - 3.59', wide: f(5.29, -13.19), tele: f(8.05, -13.07), shift: S104 },
        { id: 'ELPLM11', name: 'ELPLM11 중초점 줌', trText: '3.42 - 5.23', wide: f(7.76, -23.84), tele: f(11.75, -23.54), shift: S104 },
        { id: 'ELPLL08', name: 'ELPLL08 장초점 줌', trText: '5.09 - 7.16', wide: f(11.53, -32.22), tele: f(16.10, -31.78), shift: S104 }
      ],
      // L12000Q: 시프트 수치는 사양서로 확인하지 못해 표시하지 않음
      shiftUnknownFor: L12000Q
    },

    // L25000U / L30000U 대구경 렌즈
    L25K: {
      label: 'L25000 / L30000 계열 대구경 렌즈',
      basisAspect: '16:10',
      source: '엡손 사양서: EB-L30002U/L30000U Specifications v1.20. L25000U 는 Pro L25000U 매뉴얼 투사거리 표와 대조(오차 1cm 이내)',
      lenses: [
        { id: 'ELPLX03', name: 'ELPLX03 초단초점', trText: '0.35', wide: f(0.78, -4.24), tele: f(0.78, -4.24),
          shift: { v: [-5, 20], h: null }, shiftNote: '사양서: 위 V×20%, 아래 V×5%. 수평 최대 시 위로 이동 불가',
          onlyFor: ['EB-L30000U'] },
        { id: 'ELPLR05', name: 'ELPLR05 후면투사', trText: '0.60', wide: f(1.35, -10.18), tele: f(1.35, -10.18),
          shift: { v: [-15, 15], h: null }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLU05', name: 'ELPLU05 단초점 줌', trText: '0.90 - 1.09', wide: f(1.98, -7.56), tele: f(2.39, -7.35),
          shift: { v: [-55, 55], h: null }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLW07', name: 'ELPLW07 광각 줌', trText: '1.29 - 1.76', wide: f(2.82, -10.15), tele: f(3.85, -10.49),
          shift: { v: [-65, 65], h: [-30, 30] }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLM12', name: 'ELPLM12 중초점 줌 #1', trText: '1.74 - 2.35', wide: f(3.81, -12.74), tele: f(5.12, -12.04),
          shift: { v: [-65, 65], h: [-30, 30] }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLM13', name: 'ELPLM13 중초점 줌 #2', trText: '2.28 - 3.46', wide: f(4.99, -17.44), tele: f(7.54, -16.08),
          shift: { v: [-65, 65], h: [-30, 30] }, shiftNote: '사양서: 스크린 매칭 시 V×60%. 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLM14', name: 'ELPLM14 중초점 줌 #3', trText: '3.41 - 5.12', wide: f(7.14, 41.07), tele: f(10.84, 39.76),
          shift: { v: [-65, 65], h: [-30, 30] }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가', onlyFor: ['EB-L30000U'] },
        // L25000U 매뉴얼 표(100" 735~1100cm, 1000" 7350~11000cm)는 L30000U 공식과 2~3% 다르므로 별도 수록
        { id: 'ELPLM14', name: 'ELPLM14 중초점 줌 #3', trText: '3.41 - 5.12', wide: f(7.35, 0), tele: f(11.00, 0),
          shift: { v: [-65, 65], h: [-30, 30] }, onlyFor: ['EB-L25000U'] },
        { id: 'ELPLL09', name: 'ELPLL09 장초점 줌 #1', trText: '4.79 - 7.20', wide: f(10.10, 43.96), tele: f(15.30, 43.65),
          shift: { v: [-55, 55], h: null }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' },
        { id: 'ELPLL10', name: 'ELPLL10 장초점 줌 #2', trText: '6.96 - 10.45', wide: f(14.63, 70.47), tele: f(22.16, 68.69),
          shift: { v: [-55, 55], h: null }, shiftNote: '사양서: 수평 최대 시 수직 이동 불가' }
      ],
      // 시프트 수치는 L30000U 사양서 값. L25000U 사양서로는 확인하지 못해 표시하지 않음
      shiftUnknownFor: ['EB-L25000U']
    }
  };

  root.EPC = root.EPC || {};
  root.EPC.LENS_CLASSES = LENS_CLASSES;
  if (typeof module !== 'undefined') module.exports = LENS_CLASSES;
})(typeof window !== 'undefined' ? window : globalThis);
