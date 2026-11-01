/*
 * 결과 요약 텍스트 생성 (클립보드 복사용, DOM 사용 안 함)
 */
(function (root) {
  const U = root.EPC.units;

  const pct = (r) => {
    if (!r) return '자료 없음';
    if (r[0] === 0 && r[1] === 0) return '없음';
    if (r[0] === -r[1]) return `±${r[1]}%`;
    return `${r[0]}% ~ ${r[1]}%`;
  };

  /**
   * @param {object} c
   *   c.p, c.lens, c.unit, c.mode ('INCH'|'CUSTOM'|'DIST')
   *   c.res (일반 계산 결과) 또는 c.rev (역계산 결과) + c.distMm
   *   c.height (설치 높이 결과 또는 null), c.mount, c.screenBottomMm, c.ceilingMm
   *   c.warnings (문자열 배열)
   */
  function build(c) {
    const f = (mm) => U.format(mm, c.unit);
    const L = [];
    L.push('[EPSON 투사거리 계산 결과 - 비공식 계산기]');
    L.push(`기종: ${c.p.model}`);
    L.push(`렌즈: ${c.lens.name} (투사비 ${c.lens.trText}:1)`);
    const sh = c.lens.shift || {};
    L.push(`시프트: 상하 ${pct(sh.v)}, 좌우 ${pct(sh.h)}`);

    if (c.mode === 'DIST' && c.rev) {
      L.push(`투사거리: ${f(c.distMm)}`);
      L.push(`최대 화면 (WIDE): 약 ${c.rev.wide.screen.diagInch.toFixed(1)}" (${f(c.rev.wide.screen.w)} × ${f(c.rev.wide.screen.h)})`);
      L.push(`최소 화면 (TELE): 약 ${c.rev.tele.screen.diagInch.toFixed(1)}" (${f(c.rev.tele.screen.w)} × ${f(c.rev.tele.screen.h)})`);
    } else if (c.res) {
      const r = c.res;
      L.push(`스크린: 약 ${r.screen.diagInch.toFixed(1)}" (${f(r.screen.w)} × ${f(r.screen.h)})`);
      L.push(`투사거리: ${f(r.distWide * 1000)} (WIDE) ~ ${f(r.distTele * 1000)} (TELE)`);
      if (c.height) {
        L.push(`설치 방식: ${c.mount === 'CEILING' ? '천장 설치(상하 반전)' : '바닥/테이블 설치'}`);
        L.push(`바닥~스크린 하단: ${f(c.screenBottomMm)}`);
        L.push(`렌즈 중심 높이(바닥 기준): ${f(c.height.min)} ~ ${f(c.height.max)}`);
        if (c.mount === 'CEILING' && c.ceilingMm > 0) {
          L.push(`천장~렌즈 중심: ${f(c.ceilingMm - c.height.max)} ~ ${f(c.ceilingMm - c.height.min)}`);
        }
      }
    }
    (c.warnings || []).forEach((w) => L.push(`* ${w}`));
    L.push('※ 근사치입니다. 설치 전 해당 기종 매뉴얼로 최종 확인하세요.');
    return L.join('\n');
  }

  root.EPC = root.EPC || {};
  root.EPC.report = { build };
  if (typeof module !== 'undefined') module.exports = { build };
})(typeof window !== 'undefined' ? window : globalThis);
