/*
 * 공간 간섭 확인 (DOM 사용 안 함)
 *
 * 빛은 렌즈에서 패널 영상(검은 여백 포함) 네 모서리로 퍼진다. 방이 직육면체이고 렌즈와 화면 쪽 영상이
 * 모두 방 안에 있으면 빛 전체가 방 안에 있으므로, 화면 쪽 영상과 렌즈 위치만 확인하면 된다.
 *   - 화면(콘텐츠)이 벽·천장·바닥을 넘으면: 설치 불가 (bad)
 *   - 검은 여백 부분만 넘으면: 어두운 빛이 닿음 (warn)
 */
(function (root) {
  /**
   * @param {object} d
   *   hasFloor, screenBottom, screenW, screenH, panelW, panelH (mm)
   *   ceiling (mm, 바닥 기준) 또는 null
   *   wallLeft, wallRight (mm, 화면 중심 기준, 왼쪽은 음수) 또는 null
   *   depth (mm, 화면 벽 ~ 뒷벽) 또는 null
   *   distWide, distTele (mm), lensMin, lensMax (mm, 바닥 기준) 또는 null
   * @param {function} f  mm → 표시 문자열
   * @returns {Array<{state:'ok'|'warn'|'bad', text:string}>}
   */
  function check(d, f) {
    const out = [];
    const add = (state, text) => out.push({ state, text });

    if (d.hasFloor) {
      const center = d.screenBottom + d.screenH / 2;
      const sTop = d.screenBottom + d.screenH;
      const pTop = center + d.panelH / 2;
      const pBot = center - d.panelH / 2;
      if (d.ceiling) {
        if (sTop > d.ceiling) add('bad', `화면 위쪽이 천장보다 ${f(sTop - d.ceiling)} 높습니다.`);
        else if (pTop > d.ceiling) add('warn', `검은 여백 부분이 천장에 ${f(pTop - d.ceiling)} 닿습니다.`);
      }
      if (d.screenBottom < 0) add('bad', '화면 아래쪽이 바닥보다 낮습니다.');
      else if (pBot < 0) add('warn', `검은 여백 부분이 바닥에 ${f(-pBot)} 닿습니다.`);
      if (d.lensMin !== null && d.lensMax !== null) {
        const lo = Math.max(d.lensMin, 0);
        const hi = d.ceiling ? Math.min(d.lensMax, d.ceiling) : d.lensMax;
        if (lo > hi) add('bad', '렌즈를 둘 수 있는 높이가 바닥~천장 사이에 없습니다.');
        else if (lo > d.lensMin || hi < d.lensMax) add('warn', `방 안에서 가능한 렌즈 중심 높이: ${f(lo)} ~ ${f(hi)}`);
      }
    }

    if (d.wallLeft !== null && d.wallLeft !== undefined) {
      // panelEdge / screenEdge / wall: 화면 중심 기준 같은 쪽의 좌우 위치 (왼쪽 음수)
      const over = (panelEdge, screenEdge, wall, name) => {
        if (Math.abs(screenEdge) > Math.abs(wall)) add('bad', `화면이 ${name} 벽을 ${f(Math.abs(screenEdge) - Math.abs(wall))} 넘습니다.`);
        else if (Math.abs(panelEdge) > Math.abs(wall)) add('warn', `검은 여백 부분이 ${name} 벽에 ${f(Math.abs(panelEdge) - Math.abs(wall))} 닿습니다.`);
      };
      over(-d.panelW / 2, -d.screenW / 2, d.wallLeft, '왼쪽');
      over(d.panelW / 2, d.screenW / 2, d.wallRight, '오른쪽');
    }

    if (d.depth) {
      if (d.distWide > d.depth) add('bad', `가장 가까운 거리(WIDE ${f(d.distWide)})도 방 깊이(${f(d.depth)})보다 깁니다. 렌즈나 화면 크기를 바꿔야 합니다.`);
      else if (d.distTele > d.depth) add('warn', `방 깊이 때문에 ${f(d.distWide)} ~ ${f(d.depth)} 범위만 쓸 수 있습니다 (TELE 끝까지 못 씀).`);
      if (d.distWide <= d.depth) add('ok', `렌즈 뒤로 남는 공간: 최대 ${f(d.depth - d.distWide)} (본체 길이·배선 여유 확인)`);
    }

    if (!out.some((x) => x.state !== 'ok') && (d.ceiling || d.wallLeft !== null || d.depth)) {
      out.unshift({ state: 'ok', text: '입력한 방 크기 안에서 간섭이 없습니다.' });
    }
    return out;
  }

  root.EPC = root.EPC || {};
  root.EPC.room = { check };
  if (typeof module !== 'undefined') module.exports = { check };
})(typeof window !== 'undefined' ? window : globalThis);
