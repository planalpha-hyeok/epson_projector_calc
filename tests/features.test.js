/*
 * 1단계 기능 테스트: 설치 높이, 역계산, 단위 변환, 결과 텍스트
 * 실행: node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert');
const units = require('../js/units.js');
const calc = require('../js/calc.js');
const install = require('../js/install.js');
const report = require('../js/report.js');
const LENS = require('../js/data/lenses.js');
const { PROJECTORS } = require('../js/data/projectors.js');

function lensFor(projectorId, lensId) {
  const p = PROJECTORS.find((x) => x.id === projectorId);
  const l = LENS[p.lensClass].lenses.find((x) => x.id === lensId && (!x.onlyFor || x.onlyFor.includes(p.id)));
  assert.ok(l, `${projectorId} / ${lensId}`);
  return { p, l };
}

test('설치 높이: 엡손 사양서 "렌즈 중심 ~ 스크린 하단" 공식과 일치', () => {
  // [본체, 렌즈, 인치, 공식 하한(cm/인치), 공식 상한(cm/인치)]  값 = 렌즈 중심 - 스크린 하단 (+ 는 렌즈가 위)
  // 출처: PU2220 / PU2010 / G7905U / PQ2220 사양서
  const rows = [
    ['EB-PU2220B', 'ELPLM15', 120, -0.14, 1.48],
    ['EB-PU2220B', 'ELPLU03S', 120, 0.35, 1.00],
    ['EB-PU2220B', 'ELPLX02S', 120, -0.27, 0.07],
    ['EB-L1100U', 'ELPLM08', 100, -0.24, 1.58],
    ['EB-G7905U', 'ELPLX01', 100, -0.24, 0],
    ['EB-PQ2220B', 'ELPLM15', 150, -0.10, 1.35],
    ['EB-PQ2220B', 'ELPLX02', 150, -0.22, 0.06],
    ['EB-PQ2220B', 'ELPLU03S', 150, 0.40, 0.85]
  ];
  rows.forEach(([pid, lid, inch, lo, hi]) => {
    const { p, l } = lensFor(pid, lid);
    const s = calc.screenFromDiagonal(inch, calc.parseAspect(p.nativeAspect));
    const r = install.lensToScreenBottom(s.h, s.h, l.shift.v);
    // 허용 오차: 인치당 0.012 cm. 사양서 계수는 소수 둘째 자리 반올림 값이고,
    // 0.76" 패널은 사양서 본문의 시프트(약 ±67%)와 공식 계수(약 67.4~67.8%)가 이 정도 차이남 (100" 에서 약 1.1 cm)
    const tol = 0.012 * inch * 10;
    assert.ok(Math.abs(r.min - lo * inch * 10) <= tol, `${pid} ${lid} 하한 ${r.min.toFixed(0)} / ${lo * inch * 10}`);
    assert.ok(Math.abs(r.max - hi * inch * 10) <= tol, `${pid} ${lid} 상한 ${r.max.toFixed(0)} / ${hi * inch * 10}`);
  });
});

test('설치 높이: 천장 설치는 스크린 중심 기준 상하 대칭(반전)', () => {
  const f = install.lensHeightRange(1000, 1500, 1500, [45, 70], 'FLOOR');
  const c = install.lensHeightRange(1000, 1500, 1500, [45, 70], 'CEILING');
  assert.ok(Math.abs((f.min + c.max) / 2 - 1750) < 1e-9);
  assert.ok(Math.abs((f.max + c.min) / 2 - 1750) < 1e-9);
  assert.strictEqual(install.lensHeightRange(1000, 1500, 1500, null, 'FLOOR'), null);
});

test('역계산: 거리 → 화면 크기 → 다시 거리 계산 시 같은 거리', () => {
  [['EB-PU2220B', 'ELPLM15', '16:10'], ['EB-L1100U', 'ELPLM08', '4:3'], ['EB-L30000U', 'ELPLL09', '16:9'],
   ['EB-PQ2220B', 'ELPLW08', '21:9']].forEach(([pid, lid, ratio]) => {
    const { p, l } = lensFor(pid, lid);
    const aspect = calc.parseAspect(ratio);
    const rev = calc.screenFromDistance(8.0, p.nativeAspect, aspect, l);
    const back = calc.calculate(rev.wide.screen, p.nativeAspect, l);
    assert.ok(Math.abs(back.distWide - 8.0) < 1e-6, `${pid} WIDE`);
    const back2 = calc.calculate(rev.tele.screen, p.nativeAspect, l);
    assert.ok(Math.abs(back2.distTele - 8.0) < 1e-6, `${pid} TELE`);
    assert.ok(rev.wide.screen.diagInch > rev.tele.screen.diagInch);
  });
  assert.strictEqual(calc.screenFromDistance(0, '16:10', 1.6, lensFor('EB-PU2220B', 'ELPLM15').l), null);
});

test('단위 변환', () => {
  assert.strictEqual(units.toMm(2.5, 'm'), 2500);
  assert.strictEqual(units.toMm(10, 'ft'), 3048);
  assert.strictEqual(units.format(2585, 'm'), '2.59 m');
  assert.strictEqual(units.format(3048, 'ft'), `10' 0"`);
  assert.strictEqual(units.format(3060.7, 'ft'), `10' 0.5"`);
  assert.strictEqual(units.inputValue(2585, 'mm'), '2585');
  assert.strictEqual(units.inputValue(2585, 'm'), '2.59');
});

test('결과 텍스트: 주요 항목 포함', () => {
  const { p, l } = lensFor('EB-PU2220B', 'ELPLM15');
  const s = calc.screenFromDiagonal(120, 1.6);
  const res = calc.calculate(s, p.nativeAspect, l);
  const height = install.lensHeightRange(900, s.h, res.panel.h, l.shift.v, 'CEILING');
  const txt = report.build({ p, lens: l, unit: 'm', mode: 'INCH', res, height, mount: 'CEILING',
    screenBottomMm: 900, ceilingMm: 3000, warnings: ['테스트 경고'] });
  ['EB-PU2220B', 'ELPLM15', '투사거리', '천장 설치', '천장~렌즈 중심', '테스트 경고', '비공식'].forEach((k) =>
    assert.ok(txt.includes(k), `없음: ${k}`));
});
