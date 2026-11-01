/*
 * 홈 화면에 앱처럼 설치
 *   - 안드로이드/PC 크롬·엣지: 브라우저가 설치 가능하다고 알려주면 "앱으로 설치" 버튼을 보여줌
 *   - 아이폰/아이패드 사파리: 설치 버튼 기능이 없어 "공유 → 홈 화면에 추가" 안내를 보여줌
 *   - 이미 앱으로 실행 중이면 아무것도 보이지 않음
 * 서비스워커(sw.js)를 등록해 인터넷이 안 되는 현장에서도 열리게 한다.
 */
(function () {
  const btn = document.getElementById('installBtn');
  const iosHint = document.getElementById('iosInstallHint');
  let deferred = null;

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!standalone && isIOS && iosHint) iosHint.hidden = false;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (btn && !standalone) btn.hidden = false;
  });

  if (btn) {
    btn.addEventListener('click', () => {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(() => { deferred = null; btn.hidden = true; });
    });
  }

  window.addEventListener('appinstalled', () => { if (btn) btn.hidden = true; });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 등록 실패해도 계산기는 동작 */ });
  }
})();
