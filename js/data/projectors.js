/*
 * 프로젝터 본체 데이터
 *
 * 교체형(INTERCHANGEABLE): lensClass 로 js/data/lenses.js 의 패널 등급을 지정.
 *   - 모든 교체형 본체는 엡손 공식 사양서/매뉴얼로 렌즈 공식을 확인함 (lenses.js source 참고).
 * 고정형(FIXED): 내장 렌즈 투사비/시프트를 직접 기록.
 *   - 원본 파일 값이며 공식 자료와 대조하지 않음 (verified: false).
 *
 * 주의: 밝기/무게 등 일반 제원은 원본 파일 값을 그대로 옮긴 것이며 검증하지 않았다.
 */
(function (root) {
  const SERIES = [
    { id: 'ALL', label: '전체 시리즈' },
    { id: 'PQ_4K', label: '4K 고광량 레이저 (EB-PQ2000 / PQ2200)' },
    { id: 'PU_HIGH', label: '고광량 레이저 (EB-PU2010 / PU2100 / PU2200)' },
    { id: 'PU_STD', label: '중대형 렌즈교체형 레이저 (EB-PU1000 / EB-L1000)' },
    { id: 'FLAGSHIP', label: '초고광속 (EB-L20000U / L25000U / L30000U / L12000Q)' },
    { id: 'G_SERIES', label: '설치형 G 시리즈 (EB-G7000)' },
    { id: 'FIXED_LASER', label: '회의실/강의실 레이저 고정형 (EB-L700 / L600 / L500 / L400)' },
    { id: 'SMALL_LASER', label: '소형 레이저 (EB-L260F / L210W / L200)' },
    { id: 'UST', label: '초단초점 (EB-810E / 800F / 770F / 735Fi / 1485Fi)' },
    { id: 'FIXED_LAMP', label: '램프형 (EB-2250U, EB-2065 등)' }
  ];

  const NOTE_FIXED = '내장 렌즈 투사비/시프트는 원본 파일 값이며 공식 자료와 대조하지 않음';

  // 투사비(tr) → 거리 공식 계수 a (cm / 인치). 화면 대각선 1인치당 가로폭(cm) × 투사비
  const aFromTr = (tr, aspectText) => {
    const [w, h] = aspectText.split(':').map(Number);
    return tr * 2.54 * w / Math.sqrt(w * w + h * h);
  };

  // 교체형 본체 생성
  const ic = (id, series, lm, res, aspect, wt, lensClass, note) => ({
    id, model: id, series, lm, res, nativeAspect: aspect, wt,
    type: 'INTERCHANGEABLE', lensClass, verified: true, note: note || ''
  });

  // 고정형 본체 생성 (vS/hS: 원본 파일의 ±% 값)
  const fx = (id, model, series, lm, res, aspect, wt, trMin, trMax, vS, hS) => ({
    id, model, series, lm, res, nativeAspect: aspect, wt, type: 'FIXED',
    lens: {
      id: 'BUILTIN', name: '내장 렌즈',
      trText: trMin === trMax ? `${trMin}` : `${trMin} - ${trMax}`,
      wide: { a: aFromTr(trMin, aspect), b: 0 }, tele: { a: aFromTr(trMax, aspect), b: 0 },
      shift: { v: [-vS, vS], h: [-hS, hS] }
    },
    verified: false, note: NOTE_FIXED
  });

  const PROJECTORS = [
    // 4K 고광량 레이저 - 1.04" LCD
    ic('EB-PQ2220B', 'PQ_4K', '20,000 lm', '4K (3840x2160)', '16:9', '24.4 kg', 'UHD_104'),
    ic('EB-PQ2216B', 'PQ_4K', '16,000 lm', '4K (3840x2160)', '16:9', '24.2 kg', 'UHD_104'),
    ic('EB-PQ2213B', 'PQ_4K', '13,000 lm', '4K (3840x2160)', '16:9', '23.7 kg', 'UHD_104'),
    ic('EB-PQ2010B', 'PQ_4K', '10,000 lm', '4K (3840x2160)', '16:9', '17.2 kg', 'UHD_104'),
    ic('EB-PQ2008B', 'PQ_4K', '8,000 lm', '4K (3840x2160)', '16:9', '17.0 kg', 'UHD_104'),

    // 고광량 레이저 - 1.03" LCD
    ic('EB-PU2220B', 'PU_HIGH', '20,000 lm', 'WUXGA (4KE)', '16:10', '24.4 kg', 'WUXGA_103'),
    ic('EB-PU2216B', 'PU_HIGH', '16,000 lm', 'WUXGA (4KE)', '16:10', '24.2 kg', 'WUXGA_103'),
    ic('EB-PU2213B', 'PU_HIGH', '13,000 lm', 'WUXGA (4KE)', '16:10', '23.7 kg', 'WUXGA_103'),
    ic('EB-PU2120W', 'PU_HIGH', '20,000 lm', 'WUXGA (4KE)', '16:10', '24.4 kg', 'WUXGA_103'),
    ic('EB-PU2116W', 'PU_HIGH', '16,000 lm', 'WUXGA (4KE)', '16:10', '24.2 kg', 'WUXGA_103'),
    ic('EB-PU2113W', 'PU_HIGH', '13,000 lm', 'WUXGA (4KE)', '16:10', '23.7 kg', 'WUXGA_103'),
    ic('EB-PU2010B', 'PU_HIGH', '10,000 lm', 'WUXGA (4KE)', '16:10', '16.8 kg', 'WUXGA_103'),

    // 중대형 교체형 - PU1000 / L1000
    ic('EB-PU1008W', 'PU_STD', '8,500 lm', 'WUXGA (4KE)', '16:10', '16.3 kg', 'WUXGA_076'),
    ic('EB-PU1008B', 'PU_STD', '8,500 lm', 'WUXGA (4KE)', '16:10', '16.3 kg', 'WUXGA_076'),
    ic('EB-PU1007W', 'PU_STD', '7,000 lm', 'WUXGA (4KE)', '16:10', '16.3 kg', 'WUXGA_076'),
    ic('EB-PU1007B', 'PU_STD', '7,000 lm', 'WUXGA (4KE)', '16:10', '16.3 kg', 'WUXGA_076'),
    ic('EB-PU1006W', 'PU_STD', '6,000 lm', 'WUXGA (4KE)', '16:10', '15.4 kg', 'WUXGA_076'),
    ic('EB-L1755U', 'PU_STD', '15,000 lm', 'WUXGA (4KE)', '16:10', '24.1 kg', 'WUXGA_103'),
    ic('EB-L1750U', 'PU_STD', '15,000 lm', 'WUXGA (4KE)', '16:10', '24.1 kg', 'WUXGA_103'),
    ic('EB-L1505UH', 'PU_STD', '12,000 lm', 'WUXGA (4KE)', '16:10', '23.8 kg', 'WUXGA_103'),
    ic('EB-L1500UH', 'PU_STD', '12,000 lm', 'WUXGA (4KE)', '16:10', '23.8 kg', 'WUXGA_103'),
    ic('EB-L1405U', 'PU_STD', '8,000 lm', 'WUXGA (4KE)', '16:10', '19.0 kg', 'WUXGA_076'),
    ic('EB-L1300U', 'PU_STD', '8,000 lm', 'WUXGA (4KE)', '16:10', '19.0 kg', 'WUXGA_076'),
    ic('EB-L1200U', 'PU_STD', '7,000 lm', 'WUXGA (4KE)', '16:10', '19.0 kg', 'WUXGA_076'),
    ic('EB-L1100U', 'PU_STD', '6,000 lm', 'WUXGA (4KE)', '16:10', '19.0 kg', 'WUXGA_076'),
    ic('EB-L1070U', 'PU_STD', '7,000 lm', 'WUXGA (4KE)', '16:10', '16.9 kg', 'WUXGA_076'),
    ic('EB-L1075U', 'PU_STD', '7,000 lm', 'WUXGA (4KE)', '16:10', '16.9 kg', 'WUXGA_076'),
    ic('EB-L1050U', 'PU_STD', '5,500 lm', 'WUXGA (4KE)', '16:10', '16.9 kg', 'WUXGA_076'),

    // 초고광속
    ic('EB-L30000U', 'FLAGSHIP', '30,000 lm', 'WUXGA (4KE)', '16:10', '63.8 kg', 'L25K'),
    ic('EB-L25000U', 'FLAGSHIP', '25,000 lm', 'WUXGA (4KE)', '16:10', '65.6 kg', 'L25K'),
    ic('EB-L20000U', 'FLAGSHIP', '20,000 lm', 'WUXGA (4KE)', '16:10', '49.6 kg', 'WUXGA_103'),
    ic('EB-L12000Q', 'FLAGSHIP', '12,000 lm', 'Native 4K', '16:9', '51.4 kg', 'UHD_104',
      '렌즈 공식은 PQ 사양서 값. L12000Q 매뉴얼의 렌즈별 최소·최대 거리와 0.3% 이내 일치함을 확인. 렌즈 시프트 수치는 미확인'),

    // G 시리즈 - 0.76" LCD
    ic('EB-G7905U', 'G_SERIES', '7,000 lm', 'WUXGA', '16:10', '12.7 kg', 'WUXGA_076'),
    ic('EB-G7900U', 'G_SERIES', '7,000 lm', 'WUXGA', '16:10', '12.7 kg', 'WUXGA_076'),
    ic('EB-G7500U', 'G_SERIES', '6,500 lm', 'WUXGA', '16:10', '12.7 kg', 'WUXGA_076'),
    ic('EB-G7400U', 'G_SERIES', '5,500 lm', 'WUXGA', '16:10', '12.7 kg', 'WUXGA_076'),
    ic('EB-G7200W', 'G_SERIES', '7,500 lm', 'WXGA', '16:10', '12.7 kg', 'WUXGA_076'),
    ic('EB-G7000W', 'G_SERIES', '6,500 lm', 'WXGA', '16:10', '12.7 kg', 'WUXGA_076'),

    // 회의실/강의실 레이저 고정형
    fx('EB-L770U', 'EB-L770U', 'FIXED_LASER', '7,000 lm', 'WUXGA (4KE)', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L735U', 'EB-L735U', 'FIXED_LASER', '7,000 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L730U', 'EB-L730U', 'FIXED_LASER', '7,000 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L695U', 'EB-L695U', 'FIXED_LASER', '6,500 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L690U', 'EB-L690U', 'FIXED_LASER', '6,500 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L635SU', 'EB-L635SU (단초점)', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.4 kg', 0.80, 1.07, 50, 20),
    fx('EB-L630SU', 'EB-L630SU (단초점)', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.4 kg', 0.80, 1.07, 50, 20),
    fx('EB-L630U', 'EB-L630U', 'FIXED_LASER', '6,200 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L570U', 'EB-L570U', 'FIXED_LASER', '5,200 lm', 'WUXGA (4KE)', '16:10', '7.7 kg', 1.35, 2.20, 50, 20),
    fx('EB-L530U', 'EB-L530U', 'FIXED_LASER', '5,200 lm', 'WUXGA', '16:10', '7.7 kg', 1.35, 2.20, 50, 20),
    fx('EB-L520U', 'EB-L520U', 'FIXED_LASER', '5,200 lm', 'WUXGA', '16:10', '7.7 kg', 1.35, 2.20, 0, 0),
    fx('EB-L610U', 'EB-L610U', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.5 kg', 1.35, 2.20, 50, 20),
    fx('EB-L510U', 'EB-L510U', 'FIXED_LASER', '5,000 lm', 'WUXGA', '16:10', '8.5 kg', 1.35, 2.20, 50, 20),
    fx('EB-L400U', 'EB-L400U', 'FIXED_LASER', '4,500 lm', 'WUXGA', '16:10', '7.8 kg', 1.35, 2.20, 0, 0),

    // 소형 레이저 (일반 초점)
    fx('EB-L260F', 'EB-L260F', 'SMALL_LASER', '4,600 lm', 'Full HD', '16:9', '4.2 kg', 1.32, 2.14, 0, 0),
    fx('EB-L255F', 'EB-L255F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.2 kg', 1.32, 2.14, 0, 0),
    fx('EB-L250F', 'EB-L250F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.2 kg', 1.32, 2.14, 0, 0),
    fx('EB-L210W', 'EB-L210W', 'SMALL_LASER', '4,500 lm', 'WXGA', '16:10', '4.2 kg', 1.41, 2.26, 0, 0),
    fx('EB-L200W', 'EB-L200W', 'SMALL_LASER', '4,200 lm', 'WXGA', '16:10', '4.1 kg', 1.38, 2.24, 0, 0),
    fx('EB-L200F', 'EB-L200F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.1 kg', 1.33, 2.16, 0, 0),

    // 초단초점 (UST)
    fx('EB-810E', 'EB-810E (초단초점 4KE)', 'UST', '5,000 lm', '4K (4KE)', '16:9', '12.3 kg', 0.16, 0.22, 0, 0),
    fx('EB-805F', 'EB-805F (초단초점)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.4 kg', 0.27, 0.37, 0, 0),
    fx('EB-800F', 'EB-800F (초단초점)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.4 kg', 0.27, 0.37, 0, 0),
    fx('EB-770F', 'EB-770F (초단초점)', 'UST', '4,100 lm', 'Full HD', '16:9', '5.9 kg', 0.28, 0.37, 0, 0),
    fx('EB-770Fi', 'EB-770Fi (전자칠판 UST)', 'UST', '4,100 lm', 'Full HD', '16:9', '6.0 kg', 0.28, 0.37, 0, 0),
    fx('EB-760W', 'EB-760W (초단초점)', 'UST', '4,100 lm', 'WXGA', '16:10', '5.9 kg', 0.28, 0.37, 0, 0),
    fx('EB-755F', 'EB-755F (초단초점)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.7 kg', 0.26, 0.35, 0, 0),
    fx('EB-750F', 'EB-750F (초단초점)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.7 kg', 0.26, 0.35, 0, 0),
    fx('EB-735Fi', 'EB-735Fi (전자칠판 UST)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.8 kg', 0.26, 0.35, 0, 0),
    fx('EB-725W', 'EB-725W (초단초점)', 'UST', '4,000 lm', 'WXGA', '16:10', '5.7 kg', 0.28, 0.37, 0, 0),
    fx('EB-1485Fi', 'EB-1485Fi (전자칠판 UST)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.3 kg', 0.27, 0.37, 0, 0),

    // 램프형
    fx('EB-2265U', 'EB-2265U', 'FIXED_LAMP', '5,500 lm', 'WUXGA', '16:10', '4.7 kg', 1.38, 2.28, 0, 0),
    fx('EB-2255U', 'EB-2255U', 'FIXED_LAMP', '5,000 lm', 'WUXGA', '16:10', '4.7 kg', 1.38, 2.28, 0, 0),
    fx('EB-2250U', 'EB-2250U', 'FIXED_LAMP', '5,000 lm', 'WUXGA', '16:10', '4.6 kg', 1.38, 2.28, 0, 0),
    fx('EB-2165W', 'EB-2165W', 'FIXED_LAMP', '5,500 lm', 'WXGA', '16:10', '4.6 kg', 1.38, 2.24, 0, 0),
    fx('EB-2155W', 'EB-2155W', 'FIXED_LAMP', '5,000 lm', 'WXGA', '16:10', '4.3 kg', 1.38, 2.24, 0, 0),
    fx('EB-2065', 'EB-2065', 'FIXED_LAMP', '5,500 lm', 'XGA', '4:3', '4.4 kg', 1.38, 2.24, 0, 0),
    fx('EB-2055', 'EB-2055', 'FIXED_LAMP', '5,000 lm', 'XGA', '4:3', '4.3 kg', 1.38, 2.24, 0, 0),
    fx('EB-2042', 'EB-2042', 'FIXED_LAMP', '4,400 lm', 'XGA', '4:3', '3.0 kg', 1.38, 2.24, 0, 0),
    fx('EB-992F', 'EB-992F', 'FIXED_LAMP', '4,000 lm', 'Full HD', '16:9', '3.1 kg', 1.32, 2.14, 0, 0),
    fx('EB-982W', 'EB-982W', 'FIXED_LAMP', '4,200 lm', 'WXGA', '16:10', '3.1 kg', 1.38, 2.24, 0, 0),
    fx('EB-FH52', 'EB-FH52', 'FIXED_LAMP', '4,000 lm', 'Full HD', '16:9', '3.1 kg', 1.32, 2.14, 0, 0),
    fx('EB-W51', 'EB-W51', 'FIXED_LAMP', '4,000 lm', 'WXGA', '16:10', '2.5 kg', 1.30, 1.56, 0, 0),
    fx('EB-X51', 'EB-X51', 'FIXED_LAMP', '3,800 lm', 'XGA', '4:3', '2.5 kg', 1.48, 1.77, 0, 0),
    fx('EB-E01', 'EB-E01', 'FIXED_LAMP', '3,300 lm', 'XGA', '4:3', '2.4 kg', 1.44, 1.44, 0, 0)
  ];

  root.EPC = root.EPC || {};
  root.EPC.SERIES = SERIES;
  root.EPC.PROJECTORS = PROJECTORS;
  if (typeof module !== 'undefined') module.exports = { SERIES, PROJECTORS };
})(typeof window !== 'undefined' ? window : globalThis);
