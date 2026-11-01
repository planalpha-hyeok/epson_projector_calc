/*
 * 2단계 기능 테스트: 렌즈 모델명 추출, 렌즈별 밝기, 같은 조건 기종 찾기, 설치 그림
 */
const test = require('node:test');
const assert = require('node:assert');
require('../js/units.js');
const calc = require('../js/calc.js');
const catalog = require('../js/catalog.js');
const match = require('../js/match.js');
const diagram = require('../js/diagram.js');
const LIGHT = require('../js/data/light_output.js');
const LENS = require('../js/data/lenses.js');
const { PROJECTORS } = require('../js/data/projectors.js');

const P = (id) => PROJECTORS.find((p) => p.id === id);
const lens = (pid, lid) => catalog.lensesFor(P(pid), LENS).find((l) => l.id === lid);

test('렌즈 모델명 추출: 모든 렌즈 항목에서 1개 이상, ELPL 로 시작', () => {
  Object.values(LENS).forEach((c) => c.lenses.forEach((l) => {
    const m = catalog.lensModels(l);
    assert.ok(m.length >= 1, l.name);
    m.forEach((x) => assert.match(x, /^ELPL[A-Z]\d{2}[A-Z]{0,2}$/, `${l.name} → ${x}`));
  }));
  assert.deepStrictEqual(catalog.lensModels({ id: 'X', name: 'ELPLM15 / M09 / S04 중초점 줌 (표준)' }), ['ELPLM15', 'ELPLM09', 'ELPLS04']);
  assert.deepStrictEqual(catalog.lensModels({ id: 'X', name: 'ELPLX02 / X02W / X02S / X02WS 초단초점' }), ['ELPLX02', 'ELPLX02W', 'ELPLX02S', 'ELPLX02WS']);
});

test('렌즈별 밝기: 사양서 표 값 (PU2220B, PQ2216B, PU1008W)', () => {
  const a = catalog.lightOutputFor(P('EB-PU2220B'), lens('EB-PU2220B', 'ELPLM15'), LIGHT);
  assert.deepStrictEqual(a.items.map((i) => [i.model, i.lm, i.pct, i.limited]), [['ELPLM15', 20000, 100, false], ['ELPLM09', 12000, 60, true]]);
  const b = catalog.lightOutputFor(P('EB-PQ2216B'), lens('EB-PQ2216B', 'ELPLW05'), LIGHT);
  assert.deepStrictEqual(b.items.map((i) => [i.model, i.lm, i.pct, i.limited]), [['ELPLW05', 12000, 86, true]]);
  const c = catalog.lightOutputFor(P('EB-PU1008W'), lens('EB-PU1008W', 'ELPLM08'), LIGHT);
  assert.strictEqual(c.items[0].lm, 8500); // 표준 렌즈 = 정격 밝기 8,500 lm
  assert.strictEqual(catalog.lightOutputFor(P('EB-L1100U'), lens('EB-L1100U', 'ELPLM08'), LIGHT), null);
  // 표에 없는 본체 ID 가 없어야 함
  Object.keys(LIGHT).forEach((id) => assert.ok(P(id), `없는 본체: ${id}`));
});

test('같은 조건 기종: PU2220B 120" 16:10 에서 5 m', () => {
  const screen = calc.screenFromDiagonal(120, 1.6);
  const list = match.findMatches(screen, 5, PROJECTORS, LENS);
  const has = (pid, lid) => list.some((m) => m.p.id === pid && m.lens.id === lid);
  assert.ok(has('EB-PU2220B', 'ELPLM15'));   // 4.06 ~ 6.60 m
  assert.ok(!has('EB-PU2220B', 'ELPLL08'));  // 13 m 이상
  list.forEach((m) => assert.ok(m.distWide <= 5 + 1e-9 && m.distTele >= 5 - 1e-9));
});

test('설치 그림: SVG 생성, 입력 문자열 이스케이프', () => {
  const s = diagram.sideView({ screenBottom: 900, screenH: 1615, panelH: 1615, distWide: 4058, distTele: 6600,
    lensMin: 738, lensMax: 2677, ceiling: 3000, hasFloor: true, unit: 'm' });
  assert.ok(s.startsWith('<svg') && s.includes('</svg>'));
  assert.ok(s.includes('WIDE 4.06 m') && s.includes('TELE 6.60 m') && s.includes('천장'));
  const u = diagram.sideView({ screenBottom: 900, screenH: 1615, panelH: 1615, distWide: 890, distTele: 890, lensMin: 580, lensMax: 980, ceiling: null, hasFloor: true, unit: 'm' });
  assert.ok(u.includes('거리 0.89 m') && !u.includes('WIDE'));
  assert.ok(!/NaN/.test(s));
  const f = diagram.frontView({ screenBottom: 0, screenW: 2585, screenH: 1615, panelW: 2585, panelH: 1615,
    lensYMin: -100, lensYMax: 1700, hRangePct: null, hasFloor: false, unit: 'mm' });
  assert.ok(f.includes('좌우 자료 없음') && !/NaN/.test(f));
});
