/*
 * 계산 검증 테스트: 엡손 공식 매뉴얼 투사거리 표 / 사양서 공식과 비교
 * 실행: node --test tests/calc.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const calc = require('../js/calc.js');
const LENS = require('../js/data/lenses.js');
const { PROJECTORS } = require('../js/data/projectors.js');

const IN = 0.0254; // inch → m

function lensFor(projectorId, lensId) {
  const p = PROJECTORS.find((x) => x.id === projectorId);
  const l = LENS[p.lensClass].lenses.find((x) => x.id === lensId && (!x.onlyFor || x.onlyFor.includes(p.id)));
  assert.ok(l, `${projectorId} 에서 ${lensId} 를 찾지 못함`);
  return { p, l };
}

function dist(projectorId, lensId, inch, ratio) {
  const { p, l } = lensFor(projectorId, lensId);
  const screen = calc.screenFromDiagonal(inch, calc.parseAspect(ratio));
  return calc.calculate(screen, p.nativeAspect, l);
}

// 허용 오차: 표 값의 1% 또는 3cm 중 큰 값
function near(actual, expected, label) {
  const tol = Math.max(expected * 0.01, 0.03);
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: 계산 ${actual.toFixed(3)} m / 기준 ${expected.toFixed(3)} m`);
}

test('스크린 크기 변환: 120" 16:10 = 2585 x 1615 mm', () => {
  const s = calc.screenFromDiagonal(120, 1.6);
  assert.strictEqual(Math.round(s.w), 2585);
  assert.strictEqual(Math.round(s.h), 1615);
});

test('L1100U + ELPLM08: Pro L1100U~L1405U 매뉴얼 표 (16:10 / 16:9 / 4:3, 인치)', () => {
  const rows = [
    [100, '16:10', 123, 197], [120, '16:10', 147, 237], [300, '16:10', 371, 595],
    [100, '16:9', 126, 203], [120, '16:9', 152, 243],
    [100, '4:3', 139, 223], [120, '4:3', 167, 268], [200, '4:3', 280, 448]
  ];
  rows.forEach(([inch, ratio, mn, mx]) => {
    const r = dist('EB-L1100U', 'ELPLM08', inch, ratio);
    near(r.distWide, mn * IN, `${inch}" ${ratio} WIDE`);
    near(r.distTele, mx * IN, `${inch}" ${ratio} TELE`);
  });
});

test('L1500UH + ELPLM15: Pro L1500U 매뉴얼 표 (16:10 / 4:3, 인치)', () => {
  const rows = [[100, '16:10', 133, 216], [120, '16:10', 160, 260], [120, '4:3', 181, 295]];
  rows.forEach(([inch, ratio, mn, mx]) => {
    const r = dist('EB-L1500UH', 'ELPLM15', inch, ratio);
    near(r.distWide, mn * IN, `${inch}" ${ratio} WIDE`);
    near(r.distTele, mx * IN, `${inch}" ${ratio} TELE`);
  });
});

test('비율별 사양서 공식 재현: 16:10 공식으로 16:9 / 4:3 사양서 계수 재현 (L1505U 사양서)', () => {
  // ELPLM15(1.03"): 16:9 공식 3.55 x - 8.18 / 4:3 공식 3.91 x - 8.18
  [[100, '16:9', 3.55 * 100 - 8.18], [250, '16:9', 3.55 * 250 - 8.18],
   [100, '4:3', 3.91 * 100 - 8.18], [250, '4:3', 3.91 * 250 - 8.18]].forEach(([inch, ratio, cm]) => {
    near(dist('EB-L1500UH', 'ELPLM15', inch, ratio).distWide, cm / 100, `${inch}" ${ratio}`);
  });
});

test('L25000U: Pro L25000U 매뉴얼 표 (16:10, cm)', () => {
  const rows = [
    ['ELPLU05', 120, 231, 280], ['ELPLW07', 150, 413, 567], ['ELPLM12', 200, 749, 1011],
    ['ELPLM13', 250, 1231, 1869], ['ELPLM14', 120, 882, 1320], ['ELPLM14', 1000, 7350, 11000],
    ['ELPLL09', 150, 1559, 2338], ['ELPLL10', 200, 2997, 4500], ['ELPLR05', 250, 328, 328]
  ];
  rows.forEach(([id, inch, mn, mx]) => {
    const r = dist('EB-L25000U', id, inch, '16:10');
    near(r.distWide, mn / 100, `${id} ${inch}" WIDE`);
    near(r.distTele, mx / 100, `${id} ${inch}" TELE`);
  });
});

test('L30000U: EB-L30000U 사양서 투사거리 표 (16:10, cm)', () => {
  const rows = [['ELPLM14', 100, 756, 1123], ['ELPLM14', 1000, 7186, 10876], ['ELPLM12', 100, 368, 500], ['ELPLU05', 500, 984, 1190]];
  rows.forEach(([id, inch, mn, mx]) => {
    const r = dist('EB-L30000U', id, inch, '16:10');
    near(r.distWide, mn / 100, `${id} ${inch}" WIDE`);
    near(r.distTele, mx / 100, `${id} ${inch}" TELE`);
  });
});

test('L12000Q: Pro L12000QNL 매뉴얼 렌즈별 최소/최대 거리 (16:9, cm)', () => {
  // [렌즈, 최소 화면", 최소거리cm(Wide), 최대 화면", 최대거리cm(Tele)]
  const rows = [['ELPLW08', 60, 108, 1000, 2623], ['ELPLM15', 60, 198, 1000, 5528],
    ['ELPLL08', 60, 659, 1000, 16070], ['ELPLX02', 100, 73, 1000, 764], ['ELPLW05', 80, 128, 500, 1162]];
  rows.forEach(([id, i1, d1, i2, d2]) => {
    near(dist('EB-L12000Q', id, i1, '16:9').distWide, d1 / 100, `${id} ${i1}" WIDE`);
    near(dist('EB-L12000Q', id, i2, '16:9').distTele, d2 / 100, `${id} ${i2}" TELE`);
  });
});

test('패널보다 넓은 스크린은 가로 맞춤, 좁은 스크린은 세로 맞춤', () => {
  const wide = calc.fitPanelToScreen(2000, 1000, 1.6);
  assert.strictEqual(wide.fit, 'WIDTH');
  assert.strictEqual(wide.w, 2000);
  const narrow = calc.fitPanelToScreen(1600, 1200, 1.6);
  assert.strictEqual(narrow.fit, 'HEIGHT');
  assert.strictEqual(narrow.w, 1920);
});

test('비대칭 시프트 범위 mm 변환', () => {
  assert.deepStrictEqual(calc.shiftRangeMm([-5, 20], 1000), [-50, 200]);
  assert.strictEqual(calc.shiftRangeMm(null, 1000), null);
});

test('데이터: 교체형 본체마다 렌즈 1개 이상, 본체 안에서 렌즈 ID 중복 없음, 패널 비율 = 공식 기준 비율', () => {
  PROJECTORS.filter((p) => p.type === 'INTERCHANGEABLE').forEach((p) => {
    const cls = LENS[p.lensClass];
    assert.ok(cls, `${p.id}: 렌즈 등급 ${p.lensClass} 없음`);
    assert.strictEqual(cls.basisAspect, p.nativeAspect, `${p.id}: 공식 기준 비율 불일치`);
    const usable = cls.lenses.filter((l) => !l.onlyFor || l.onlyFor.includes(p.id));
    assert.ok(usable.length > 0, `${p.id}: 사용 가능한 렌즈 없음`);
    const ids = usable.map((l) => l.id);
    assert.strictEqual(new Set(ids).size, ids.length, `${p.id}: 렌즈 ID 중복`);
  });
});

test('데이터: Wide 거리 <= Tele 거리, 모델 ID 중복 없음, onlyFor/shiftUnknownFor 모델 존재', () => {
  const ids = new Set(PROJECTORS.map((p) => p.id));
  assert.strictEqual(ids.size, PROJECTORS.length);
  Object.values(LENS).forEach((c) => {
    (c.shiftUnknownFor || []).forEach((id) => assert.ok(ids.has(id), `shiftUnknownFor: ${id} 없음`));
    c.lenses.forEach((l) => {
      [60, 100, 300].forEach((i) => assert.ok(l.wide.a * i + l.wide.b <= l.tele.a * i + l.tele.b + 1e-9, `${l.id}: WIDE > TELE`));
      (l.onlyFor || []).forEach((id) => assert.ok(ids.has(id), `${l.id}.onlyFor: ${id} 없음`));
    });
  });
});

test('데이터: 출처에 판매처(AudioGeneral) 자료가 남아 있지 않음', () => {
  const text = JSON.stringify(LENS) + JSON.stringify(PROJECTORS);
  assert.ok(!/audiogeneral/i.test(text));
});
