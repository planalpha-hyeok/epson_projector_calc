// 오프라인 지원: 화면은 인터넷이 되면 항상 최신으로, 안 되면 저장본으로.
// 파일을 바꾸면 CACHE 버전을 올린다 (이전 저장본 삭제용).
const CACHE = 'epson-calc-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/blend.js',
  './js/brightness.js',
  './js/calc.js',
  './js/catalog.js',
  './js/data/keystone.js',
  './js/data/lenses.js',
  './js/data/light_output.js',
  './js/data/projectors.js',
  './js/diagram.js',
  './js/extras.js',
  './js/install.js',
  './js/main.js',
  './js/match.js',
  './js/report.js',
  './js/theme.js',
  './js/tilt.js',
  './js/ui.js',
  './js/units.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 네트워크 우선 → 실패하면 저장본 (계산 데이터가 바뀌어도 바로 반영되도록)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))));
});
