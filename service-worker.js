// Service worker بسيط لتطبيق "لجنة طب الأسنان"
// يوفر تحميلاً أسرع وعملاً محدوداً بدون اتصال بالإنترنت.

const CACHE_NAME = 'dental-committee-cache-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// عند التثبيت: خزّن الملفات الأساسية للتطبيق
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// عند التفعيل: احذف أي نسخ قديمة من الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// عند الطلب: حاول الشبكة أولاً (لتحديث بيانات الأسئلة من Supabase)،
// وإن تعذر الاتصال استخدم النسخة المخزنة من الكاش (لملفات التطبيق فقط)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // لا نتدخل في طلبات API الخارجية (مثل Supabase) - دعها تذهب للشبكة مباشرة
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
        return response;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
