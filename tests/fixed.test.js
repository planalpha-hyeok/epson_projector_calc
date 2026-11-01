/*
 * 고정 렌즈 기종: 엡손 사양서 공식/투사거리 표 대조
 */
const test = require('node:test');
const assert = require('node:assert');
require('../js/units.js');
const calc = require('../js/calc.js');
const install = require('../js/install.js');
const { PROJECTORS } = require('../js/data/projectors.js');

const P = (id) => PROJECTORS.find((p) => p.id === id);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: 계산 ${a.toFixed(3)} / 기준 ${b}`);
function dist(id, inch, ratio) {
  const p = P(id);
  return calc.calculate(calc.screenFromDiagonal(inch, calc.parseAspect(ratio)), p.nativeAspect, p.lens);
}

test('L735U 계열: 사양서 투사거리 표 (cm)', () => {
  // [본체, 인치, 비율, 최소, 최대]  출처: EB-L735U series v1.04 / EB-L770U 사양서 표
  [['EB-L735U', 100, '16:10', 292, 474], ['EB-L630U', 500, '16:10', 1476, 2384], ['EB-L520U', 120, '16:10', 351, 569],
   ['EB-L770U', 120, '4:3', 398, 645], ['EB-L570U', 300, '4:3', 1001, 1618],
   ['EB-L635SU', 100, '16:9', 178, 240], ['EB-L630SU', 120, '16:9', 214, 289]].forEach(([id, i, r, mn, mx]) => {
    const d = dist(id, i, r);
    near(d.distWide * 100, mn, 1.5, `${id} ${i}" ${r} WIDE`);
    near(d.distTele * 100, mx, 1.5, `${id} ${i}" ${r} TELE`);
  });
});

test('L735U 계열 렌즈 중심~스크린 하단: 사양서 표와 일치', () => {
  // 시프트 기종 16:9 49": 사양서 ② -64 ~ 3 (스크린 하단 - 렌즈 중심)
  const p = P('EB-L735U');
  const s = calc.screenFromDiagonal(49, 16 / 9);
  const r = calc.calculate(s, p.nativeAspect, p.lens);
  const o = install.lensToScreenBottom(s.h, r.panel.h, p.lens.shift.v);
  near(-o.max / 10, -64, 1, '하한'); near(-o.min / 10, 3, 1, '상한');
  // L520U (시프트 없음) 16:10 500": 사양서 ② -24
  const q = P('EB-L520U');
  const s2 = calc.screenFromDiagonal(500, 1.6);
  const o2 = install.lensToScreenBottom(s2.h, s2.h, q.lens.shift.v);
  near(-o2.min / 10, -24, 0.6, 'L520U 고정 오프셋');
});

test('L260F / L210W: 사양서 공식과 비율별 공식 재현', () => {
  // L260F 16:10 공식: 3.169 x - 2.8612 (16:9 패널, 세로 맞춤)
  near(dist('EB-L260F', 100, '16:10').distWide * 100, 3.169 * 100 - 2.8612, 0.3, 'L260F 16:10');
  // L210W 4:3 공식: 3.4388 x - 2.6928 / 5.52794 x - 2.9478
  near(dist('EB-L210W', 100, '4:3').distWide * 100, 3.4388 * 100 - 2.6928, 0.3, 'L210W 4:3 WIDE');
  near(dist('EB-L210W', 100, '4:3').distTele * 100, 5.52794 * 100 - 2.9478, 0.3, 'L210W 4:3 TELE');
});

test('초단초점: 사양서 a 공식 비율별 재현, b 값', () => {
  // 805F 16:10: a = 6.8452 x - 20.027 (mm), 4:3: 7.7493 x - 20.027
  near(dist('EB-805F', 100, '16:10').distWide * 1000, 6.8452 * 100 - 20.027, 2, '805F 16:10');
  near(dist('EB-805F', 80, '4:3').distTele * 1000, 10.4616 * 80 - 20.027, 2, '805F 4:3 TELE');
  // 770F 16:10: a = 6.8181 x - 53.0074
  near(dist('EB-770F', 100, '16:10').distWide * 1000, 6.8181 * 100 - 53.0074, 2, '770F 16:10');
  // 735Fi 16:10 TELE: a = 8.7691 x - 17.605
  near(dist('EB-735Fi', 90, '16:10').distTele * 1000, 8.7691 * 90 - 17.605, 2, '735Fi 16:10');
  // 725W 16:9: a = 6.3518 x - 16.422 (16:10 패널, 가로 맞춤)
  near(dist('EB-725W', 100, '16:9').distWide * 1000, 6.3518 * 100 - 16.422, 2, '725W 16:9');
  // 810E 16:10: 0.4047 x - 2.13581 (cm)
  near(dist('EB-810E', 100, '16:10').distWide * 100, 0.4047 * 100 - 2.13581, 0.3, '810E 16:10');
  // b 값: 805F 16:6 화면 중앙 WIDE b = 3.9715 x, 16:10 TELE b = 4.7222 x
  const p = P('EB-805F');
  const s = calc.screenFromDiagonal(100, 16 / 6);
  const r = calc.calculate(s, p.nativeAspect, p.lens);
  near(install.ustOffsets(p.lens.ust, r.panel.diagInch, r.panel.h, s.h).wide.b, 3.9715 * 100, 1, '805F 16:6 b');
  const s2 = calc.screenFromDiagonal(100, 1.6);
  const r2 = calc.calculate(s2, p.nativeAspect, p.lens);
  const o2 = install.ustOffsets(p.lens.ust, r2.panel.diagInch, r2.panel.h, s2.h);
  near(o2.tele.b, 4.7222 * 100, 1, '805F 16:10 TELE b');
  near(o2.tele.c, 18.1842 * 100, 1, '805F 16:10 TELE c');
});

test('고정 렌즈: 공식 확인 기종은 출처가 있고, 자료 없는 기종은 계산 수치가 없음', () => {
  const fixed = PROJECTORS.filter((p) => p.type === 'FIXED');
  fixed.filter((p) => p.verified).forEach((p) => assert.ok(p.source && /엡손 사양서/.test(p.source), p.id));
  const noData = fixed.filter((p) => !p.verified);
  assert.strictEqual(fixed.length - noData.length, 22);
  // 공식 자료가 없는 기종은 광학 수치를 갖지 않음
  noData.forEach((p) => assert.ok(p.noData && p.lens === null, p.id));
  assert.ok(noData.some((p) => p.id === 'EB-L690U') && noData.some((p) => p.id === 'EB-2250U'));
});

test('밝기·무게: 사양서 값 또는 "자료 없음"', () => {
  PROJECTORS.forEach((p) => {
    assert.ok(p.lm === '자료 없음' || /^\d{1,3}(,\d{3})* lm$/.test(p.lm), `${p.id} 밝기 ${p.lm}`);
    assert.ok(p.wt === '자료 없음' || /^약 \d+(\.\d)? kg( \(.+\))?$/.test(p.wt), `${p.id} 무게 ${p.wt}`);
    if (p.noData) assert.ok(p.lm === '자료 없음' && p.wt === '자료 없음', p.id);
  });
  // 사양서 대조 값 (원본과 달랐던 것)
  assert.strictEqual(P('EB-PQ2220B').wt, '약 29.2 kg (렌즈 제외)');
  assert.strictEqual(P('EB-PU2116W').wt, '약 24.3 kg (렌즈 제외)');
  assert.strictEqual(P('EB-L530U').wt, '약 8.2 kg');
  assert.strictEqual(P('EB-810E').wt, '약 12.5 kg');
  assert.strictEqual(P('EB-L25000U').lm, '자료 없음');
});
