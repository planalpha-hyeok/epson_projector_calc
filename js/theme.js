/*
 * 화면 테마: 자동(시스템 설정) → 다크 → 라이트 순으로 전환.
 * 선택은 이 브라우저에만 저장 (localStorage). 저장이 막힌 환경에서도 동작하도록 try/catch.
 */
(function () {
  const KEY = 'epc-theme';
  const ORDER = ['auto', 'dark', 'light'];
  const LABEL = { auto: '테마: 자동', dark: '테마: 다크', light: '테마: 라이트' };

  function read() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* 저장 불가 환경은 무시 */ }
  }
  function apply(v) {
    const root = document.documentElement;
    if (v === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = LABEL[v];
  }

  let current = read();
  apply(current);
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      save(current);
      apply(current);
    });
  }
})();
