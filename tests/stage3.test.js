/*
 * 3단계 기능 테스트: 계획 위치(기울기·키스톤), 엣지 블렌딩, 밝기·대비, 키스톤 데이터
 */
const test = require('node:test');
const assert = require('node:assert');
require('../js/units.js');
const calc = require('../js/calc.js');
const catalog = require('../js/catalog.js');
const tilt = require('../js/tilt.js');
const blend = require('../js/blend.js');
const brightness = require('../js/brightness.js');
const KEYSTONE = require('../js/data/keystone.js');
const LENS = require('../js/data/lenses.js');
const { PROJECTORS } = require('../js/data/projectors.js');

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} / ${b}`);
const shift60 = { v: [-60, 60], h: [-18, 18] };
const base = { screenCenterY: 900 + 1615.4 / 2, panelW: 2584.6, panelH: 1615.4, distMm: 5000, mount: 'FLOOR', shift: shift60, keystone: [44, 30] };

test('계획 위치: 시프트 범위 안이면 기울기 불필요', () => {
  const r = tilt.checkPlacement(Object.assign({}, base, { lensY: 900, lensX: 0 }));
  near(r.v.needPct, 50, 0.01, '수직 필요 %');
  assert.ok(r.v.inShift && r.h.inShift);
});

test('계획 위치: 범위 초과 시 기울기 = atan(초과 거리 / 투사거리), 키스톤 범위 비교', () => {
  const r = tilt.checkPlacement(Object.assign({}, base, { lensY: 0, lensX: 500 }));
  near(r.v.needPct, base.screenCenterY / 1615.4 * 100, 1e-9, '수직 필요 %');
  const excess = (r.v.needPct - 60) / 100 * 1615.4;
  near(r.v.tiltDeg, Math.atan(excess / 5000) * 180 / Math.PI, 1e-9, '기울기');
  assert.ok(!r.v.inShift && r.v.tiltDeg > 0 && r.v.keystoneOk === true);
  near(r.h.needPct, -500 / 2584.6 * 100, 1e-9, '수평 필요 %');
  assert.ok(!r.h.inShift && r.h.tiltDeg < 0 && r.h.keystoneOk === true);
  const far = tilt.checkPlacement(Object.assign({}, base, { lensY: 9000, lensX: 0, distMm: 3000 }));
  assert.strictEqual(far.v.keystoneOk, false);
});

test('계획 위치: 천장 설치는 상하 반전', () => {
  const mirrorY = 2 * base.screenCenterY - 900;
  const r = tilt.checkPlacement(Object.assign({}, base, { mount: 'CEILING', lensY: mirrorY, lensX: 0 }));
  near(r.v.needPct, 50, 0.01, '천장 수직 %');
});

test('엣지 블렌딩: 가로 2대, 15%', () => {
  const L = blend.layout({ screenW: 5000, screenH: 1500, cols: 2, rows: 1, overlapPct: 15, nativeAspect: '16:10', resText: 'WUXGA (4KE)' });
  assert.strictEqual(L.fit, 'WIDTH');
  near(L.panel.w, 5000 / 1.85, 1e-9, '1대 가로');
  near(L.blendMm.x, 0.15 * 5000 / 1.85, 1e-9, '블렌드 mm');
  assert.deepStrictEqual(L.blendPx, { x: 288, y: 0 });
  near(L.panel.w * (2 - 0.15), L.canvas.w, 1e-9, '캔버스 = 한 대 × (N-(N-1)o)');
  assert.strictEqual(L.count, 2);
  // 세로로 긴 스크린이면 세로 맞춤
  const H = blend.layout({ screenW: 3000, screenH: 3000, cols: 2, rows: 1, overlapPct: 15, nativeAspect: '16:10', resText: 'WUXGA' });
  assert.strictEqual(H.fit, 'HEIGHT');
  near(H.canvas.h, 3000, 1e-9, '세로 맞춤 캔버스 높이');
  assert.strictEqual(blend.panelPixels('Native 4K'), null);
  assert.deepStrictEqual(blend.panelPixels('WXGA'), { x: 1280, y: 800 });
});

test('밝기·대비 판정', () => {
  const r = brightness.evaluate({ lumens: 10000, panelWmm: 2584.6, panelHmm: 1615.4, gain: 1, ambientLux: 100 });
  near(r.projLux, 10000 / (2.5846 * 1.6154), 1e-6, '조도');
  near(r.nit, r.projLux / Math.PI, 1e-9, '휘도');
  near(r.contrast, (r.projLux + 100) / 100, 1e-9, '대비');
  assert.ok(r.level.startsWith('기본 의사결정'));
  const dark = brightness.evaluate({ lumens: 1000, panelWmm: 4000, panelHmm: 2500, gain: 1, ambientLux: 500 });
  assert.strictEqual(dark.meets, false);
});

test('키스톤 데이터: 대상 본체의 모든 렌즈에 값이 있음', () => {
  Object.entries(KEYSTONE).forEach(([pid, row]) => {
    const p = PROJECTORS.find((x) => x.id === pid);
    assert.ok(p, `없는 본체 ${pid}`);
    catalog.lensesFor(p, LENS).forEach((l) => {
      const m = l.id === 'BUILTIN' ? 'BUILTIN' : catalog.lensModels(l).find((x) => row.lenses[x]);
      assert.ok(m, `${pid} ${l.name}: 키스톤 값 없음`);
      const [v, h] = row.lenses[m];
      assert.ok(v > 0 && v <= 45 && h > 0 && h <= 30, `${pid} ${m}`);
    });
  });
  assert.deepStrictEqual(KEYSTONE['EB-L20000U'].lenses.ELPLW08, [37, 30]);
  assert.deepStrictEqual(KEYSTONE['EB-PU2220B'].lenses.ELPLW08, [35, 30]);
  assert.deepStrictEqual(KEYSTONE['EB-PQ2010B'].lenses.ELPLU03S, [30, 30]);
  assert.deepStrictEqual(KEYSTONE['EB-PQ2220B'].lenses.ELPLU03S, [35, 30]);
  assert.deepStrictEqual(KEYSTONE['EB-L895U'].lenses.BUILTIN, [30, 30]);
});
