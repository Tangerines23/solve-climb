const CACHE_NAME = 'solve-climb-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/SolveClimb.png',
    '/SolveClimb.webp'
];

/**
 * 서비스 워커 설치: 정적 자원 캐싱
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

/**
 * 서비스 워커 활성화: 이전 캐시 정리
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

/**
 * 네트워크 요청 인터셉트: Cache First 전략 (Static Assets 전용)
 */
self.addEventListener('fetch', (event) => {
    // POST 요청이나 외부 API 호출은 캐시하지 않음
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 정적 자산(CSS, JS, 이미지, 폰트) 위주로 캐시 적용
    if (
        url.origin === self.location.origin &&
        (url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.webp') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.woff2'))
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((response) => {
                    // 유효한 응답인 경우 캐시에 저장 후 반환
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
        );
    }
});
