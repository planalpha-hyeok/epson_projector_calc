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

  /*
   * 공식 사양서로 확인한 고정 렌즈 기종
   *   o.wide / o.tele: [a, b]  거리(cm) = a × 화면 크기(인치, 패널 비율 기준) + b
   *   o.shift: 수직/수평 시프트 범위(%). 시프트가 없는 기종은 [x, x] 로 고정 위치를 나타냄
   *   o.ust: 초단초점 사양서의 b, c (mm) = k × 인치 + c0  (WIDE, TELE 각각)
   */
  const fv = (id, model, series, lm, res, aspect, wt, o) => {
    const [w, h] = aspect.split(':').map(Number);
    const widthPerInch = 2.54 * w / Math.sqrt(w * w + h * h); // cm
    const tr = (a) => Math.round(a / widthPerInch * 100) / 100;
    return {
      id, model, series, lm, res, nativeAspect: aspect, wt, type: 'FIXED',
      lens: {
        id: 'BUILTIN', name: '내장 렌즈',
        // 초단초점의 a 는 렌즈가 아닌 사양서 그림 기준점까지의 거리라서 투사비로 환산하지 않음
        trText: series === 'UST' ? '' : o.wide[0] === o.tele[0] ? `${tr(o.wide[0])}` : `${tr(o.wide[0])} - ${tr(o.tele[0])}`,
        wide: { a: o.wide[0], b: o.wide[1] }, tele: { a: o.tele[0], b: o.tele[1] },
        shift: o.shift || null, shiftNote: o.shiftNote || '', zoomNote: o.zoomNote || '', ust: o.ust || null
      },
      verified: true, source: o.source, note: o.note || ''
    };
  };

  // ---- 공식 사양서 값 ----
  const SRC_L735 = '엡손 사양서 EB-L735U/L730U/L635SU/L630SU/L630U/L530U/L520U series v1.04';
  const SRC_L770 = '엡손 사양서 EB-L775U/L770U/L570U';
  const SRC_L260 = '엡손 사양서 EB-L265F/L260F/L210W Rev01';
  const SRC_805 = '엡손 사양서 EB-805F/800F Rev02, EB-1485Fi (공식 동일)';
  const SRC_770 = '엡손 사양서 EB-775F/770Fi/770F/760Wi/760W Rev01';
  const SRC_735 = '엡손 사양서 EB-755F/750F/735F/735Fi/725Wi/725W Rev1.1';
  const SRC_810 = '엡손 사양서 EB-815E/810E Rev02';
  const DIGITAL = 'WIDE~TELE 범위는 디지털 줌(영상 축소)입니다. TELE 쪽으로 갈수록 화질이 떨어집니다.';
  const UST_NOTE = '초단초점은 렌즈 시프트가 없습니다. 거리 a 와 높이 b, c 는 사양서 그림의 기준점 기준입니다.';
  const STD = { wide: [2.95848, -3.5728], tele: [4.7743, -3.5078] };
  const O_L735 = Object.assign({}, STD, { shift: { v: [-50, 50], h: [-20, 20] }, source: SRC_L735 });
  const O_SU = { wide: [1.76148, -3.00768], tele: [2.378, -4.06037], shift: { v: [-50, 50], h: [-20, 20] },
    zoomNote: DIGITAL, source: SRC_L735 };
  const O_L520 = Object.assign({}, STD, { shift: { v: [46.4, 46.4], h: [0, 0] },
    shiftNote: '렌즈 시프트 없음. 수직 위치는 매뉴얼 표(500" 에서 렌즈 중심이 스크린 하단보다 24 cm 위)에서 환산한 고정값', source: SRC_L735 });
  const O_L770 = Object.assign({}, STD, { shift: { v: [-50, 50], h: null },
    shiftNote: '수직 범위는 매뉴얼 투사거리 표(렌즈 중심~스크린 하단)에서 환산. 수평 시프트 수치는 사양서에서 확인하지 못함', source: SRC_L770 });
  const O_L260F = { wide: [2.9314, -2.8612], tele: [4.712, -2.9508], shift: { v: [49.7, 49.7], h: [0, 0] },
    shiftNote: '렌즈 시프트 없음. 수직 위치는 사양서의 렌즈 중심~스크린 하단 공식(-0.0039×인치)에서 환산한 고정값', source: SRC_L260 };
  const O_L210W = { wide: [3.0376, -2.6928], tele: [4.883, -2.9478], shift: { v: [47.6, 47.6], h: [0, 0] },
    shiftNote: '렌즈 시프트 없음. 수직 위치는 사양서의 렌즈 중심~스크린 하단 공식(-0.03197×인치)에서 환산한 고정값', source: SRC_L260 };
  const ust = (bw, bt, cw, ct, c0) => ({ b: [[bw, c0], [bt, c0]], c: [[cw, c0], [ct, c0]] });
  const O_805 = { wide: [0.6332, -2.0027], tele: [0.85482, -2.0027], zoomNote: DIGITAL, shiftNote: UST_NOTE,
    ust: ust(1.6214, 4.3682, 14.0741, 16.8208, 0), source: SRC_805 };
  const O_770 = { wide: [0.63069, -5.30074], tele: [0.85143, -5.30074], zoomNote: DIGITAL, shiftNote: UST_NOTE,
    ust: ust(2.9767, 6.1978, 15.4294, 18.6505, -62.67), source: SRC_770 };
  const O_760 = { wide: [0.65352, -5.24359], tele: [0.88225, -5.24359], zoomNote: DIGITAL, shiftNote: UST_NOTE,
    ust: ust(2.8051, 6.1428, 16.2671, 19.6048, -62.67), source: SRC_770 };
  const O_755 = { wide: [0.60086, -1.7605], tele: [0.81116, -1.7605], zoomNote: DIGITAL, shiftNote: UST_NOTE,
    ust: ust(3.1082, 6.3753, 15.5609, 18.8279, -62.67), source: SRC_735 };
  const O_725 = { wide: [0.618, -1.6422], tele: [0.8343, -1.6422], zoomNote: DIGITAL, shiftNote: UST_NOTE,
    ust: ust(2.8051, 6.1428, 16.2671, 19.6048, -62.67), source: SRC_735 };
  const O_810 = { wide: [0.37435, -2.13581], tele: [0.50538, -2.13581], shiftNote: '초단초점. 높이 관련 공식은 사양서에서 확인하지 못함', source: SRC_810 };

  // 고정형 본체 생성 - 공식 자료 미대조 (vS/hS: 원본 파일의 ±% 값)
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
    fv('EB-L770U', 'EB-L770U', 'FIXED_LASER', '7,000 lm', 'WUXGA (4KE)', '16:10', '8.4 kg', O_L770),
    fv('EB-L735U', 'EB-L735U', 'FIXED_LASER', '7,000 lm', 'WUXGA', '16:10', '8.4 kg', O_L735),
    fv('EB-L730U', 'EB-L730U', 'FIXED_LASER', '7,000 lm', 'WUXGA', '16:10', '8.4 kg', O_L735),
    fx('EB-L695U', 'EB-L695U', 'FIXED_LASER', '6,500 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fx('EB-L690U', 'EB-L690U', 'FIXED_LASER', '6,500 lm', 'WUXGA', '16:10', '8.4 kg', 1.35, 2.20, 50, 20),
    fv('EB-L635SU', 'EB-L635SU (단초점)', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.4 kg', O_SU),
    fv('EB-L630SU', 'EB-L630SU (단초점)', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.4 kg', O_SU),
    fv('EB-L630U', 'EB-L630U', 'FIXED_LASER', '6,200 lm', 'WUXGA', '16:10', '8.4 kg', O_L735),
    fv('EB-L570U', 'EB-L570U', 'FIXED_LASER', '5,200 lm', 'WUXGA (4KE)', '16:10', '7.7 kg', O_L770),
    fv('EB-L530U', 'EB-L530U', 'FIXED_LASER', '5,200 lm', 'WUXGA', '16:10', '7.7 kg', O_L735),
    fv('EB-L520U', 'EB-L520U', 'FIXED_LASER', '5,200 lm', 'WUXGA', '16:10', '7.7 kg', O_L520),
    fx('EB-L610U', 'EB-L610U', 'FIXED_LASER', '6,000 lm', 'WUXGA', '16:10', '8.5 kg', 1.35, 2.20, 50, 20),
    fx('EB-L510U', 'EB-L510U', 'FIXED_LASER', '5,000 lm', 'WUXGA', '16:10', '8.5 kg', 1.35, 2.20, 50, 20),
    fx('EB-L400U', 'EB-L400U', 'FIXED_LASER', '4,500 lm', 'WUXGA', '16:10', '7.8 kg', 1.35, 2.20, 0, 0),

    // 소형 레이저 (일반 초점)
    fv('EB-L260F', 'EB-L260F', 'SMALL_LASER', '4,600 lm', 'Full HD', '16:9', '4.2 kg', O_L260F),
    fx('EB-L255F', 'EB-L255F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.2 kg', 1.32, 2.14, 0, 0),
    fx('EB-L250F', 'EB-L250F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.2 kg', 1.32, 2.14, 0, 0),
    fv('EB-L210W', 'EB-L210W', 'SMALL_LASER', '4,500 lm', 'WXGA', '16:10', '4.2 kg', O_L210W),
    fx('EB-L200W', 'EB-L200W', 'SMALL_LASER', '4,200 lm', 'WXGA', '16:10', '4.1 kg', 1.38, 2.24, 0, 0),
    fx('EB-L200F', 'EB-L200F', 'SMALL_LASER', '4,500 lm', 'Full HD', '16:9', '4.1 kg', 1.33, 2.16, 0, 0),

    // 초단초점 (UST)
    fv('EB-810E', 'EB-810E (초단초점 4KE)', 'UST', '5,000 lm', '4K (4KE)', '16:9', '12.3 kg', O_810),
    fv('EB-805F', 'EB-805F (초단초점)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.4 kg', O_805),
    fv('EB-800F', 'EB-800F (초단초점)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.4 kg', O_805),
    fv('EB-770F', 'EB-770F (초단초점)', 'UST', '4,100 lm', 'Full HD', '16:9', '5.9 kg', O_770),
    fv('EB-770Fi', 'EB-770Fi (전자칠판 UST)', 'UST', '4,100 lm', 'Full HD', '16:9', '6.0 kg', O_770),
    fv('EB-760W', 'EB-760W (초단초점)', 'UST', '4,100 lm', 'WXGA', '16:10', '5.9 kg', O_760),
    fv('EB-755F', 'EB-755F (초단초점)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.7 kg', O_755),
    fv('EB-750F', 'EB-750F (초단초점)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.7 kg', O_755),
    fv('EB-735Fi', 'EB-735Fi (전자칠판 UST)', 'UST', '3,600 lm', 'Full HD', '16:9', '5.8 kg', O_755),
    fv('EB-725W', 'EB-725W (초단초점)', 'UST', '4,000 lm', 'WXGA', '16:10', '5.7 kg', O_725),
    fv('EB-1485Fi', 'EB-1485Fi (전자칠판 UST)', 'UST', '5,000 lm', 'Full HD', '16:9', '9.3 kg', O_805),

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
