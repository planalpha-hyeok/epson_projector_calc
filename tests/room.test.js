/*
 * 평면도 · 공간 간섭 확인 테스트
 */
const test = require('node:test');
const assert = require('node:assert');
require('../js/units.js');
const room = require('../js/room.js');
const diagram = require('../js/diagram.js');

const f = (mm) => `${Math.round(mm)}mm`;
// 120" 16:9 화면을 16:10 패널로 (가로 맞춤): 화면 2657 x 1494, 패널 2657 x 1661
const base = { hasFloor: true, screenBottom: 900, screenW: 2657, screenH: 1494, panelW: 2657, panelH: 1661,
  ceiling: null, wallLeft: null, wallRight: null, depth: null, distWide: 4170, distTele: 6790, lensMin: 650, lensMax: 2640 };
const states = (r) => r.map((x) => x.state);

test('천장: 화면이 넘으면 불가, 검은 여백만 넘으면 주의', () => {
  // 화면 위 = 900 + 1494 = 2394, 패널 위 = 1647 + 830.5 = 2477.5
  assert.ok(states(room.check({ ...base, ceiling: 2300 }, f)).includes('bad'));
  const w = room.check({ ...base, ceiling: 2450 }, f);
  assert.ok(states(w).includes('warn') && !states(w).includes('bad'));
  assert.strictEqual(room.check({ ...base, ceiling: 3000 }, f)[0].state, 'ok');
});

test('렌즈 높이: 방 안에서 가능한 범위로 잘라 알려줌', () => {
  const r = room.check({ ...base, ceiling: 2500 }, f);
  assert.ok(r.some((x) => x.text.includes('가능한 렌즈 중심 높이') && x.text.includes('650mm ~ 2500mm')));
  assert.ok(states(room.check({ ...base, ceiling: 3000, lensMin: 3100, lensMax: 3500 }, f)).includes('bad'));
});

test('좌우 벽: 화면이 넘으면 불가, 검은 여백만 넘으면 주의, 화면 위치 반영', () => {
  assert.strictEqual(room.check({ ...base, wallLeft: -1500, wallRight: 1500 }, f)[0].state, 'ok');
  // 화면이 왼쪽 벽에 붙음: 왼쪽 벽까지 1200 < 화면 반폭 1328.5
  assert.ok(room.check({ ...base, wallLeft: -1200, wallRight: 3000 }, f).some((x) => x.state === 'bad' && x.text.includes('왼쪽')));
});

test('방 깊이: WIDE 보다 짧으면 불가, TELE 보다 짧으면 주의', () => {
  assert.ok(states(room.check({ ...base, depth: 4000 }, f)).includes('bad'));
  const r = room.check({ ...base, depth: 5000 }, f);
  assert.ok(r.some((x) => x.state === 'warn' && x.text.includes('4170mm ~ 5000mm')));
  assert.ok(r.some((x) => x.text.includes('렌즈 뒤로 남는 공간') && x.text.includes('830mm')));
});

test('평면도: SVG 생성, 벽·뒷벽 표시, NaN 없음', () => {
  const s = diagram.topView({ screenW: 2657, panelW: 2657, distWide: 4170, distTele: 6790, lensXMin: -478, lensXMax: 478,
    wallLeft: -2000, wallRight: 2500, depth: 8000, unit: 'm' });
  assert.ok(s.startsWith('<svg') && s.includes('왼쪽 벽') && s.includes('오른쪽 벽') && s.includes('뒷벽'));
  assert.ok(!/NaN/.test(s));
  const n = diagram.topView({ screenW: 2000, panelW: 2000, distWide: 800, distTele: 800, lensXMin: null, lensXMax: null,
    wallLeft: null, wallRight: null, depth: null, unit: 'mm' });
  assert.ok(!/NaN/.test(n));
});
