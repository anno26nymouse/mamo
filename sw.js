const CACHE_NAME = "maestro-lite-v1";

// Gunakan path relatif yang lebih aman
const CORE = [
  "./",
  "index.html",
  "manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE))
      .catch(err => console.log("Gagal cache core assets:", err))
  );
});

// FETCH STRATEGY
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1. Halaman Utama -> Network First, Fallback to Cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("index.html"))
    );
    return;
  }

  // 2. Gambar -> Cache First, then Network & Store in Cache
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req).then((cached) => {
        // Jika ada di cache, langsung kembalikan
        if (cached) return cached;
        
        // Jika tidak ada, ambil dari network
        return fetch(req).then((res) => {
          // Validasi response sebelum disimpan (hanya simpan yang sukses)
          if (!res || res.status !== 200 || res.type !== 'basic' && res.type !== 'opaque') {
            return res;
          }
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        }).catch(() => {
          // Opsi: Berikan placeholder image jika offline dan tidak ada di cache
          // return caches.match("./path-to-placeholder.jpg");
        });
      })
    );
    return;
  }

  // 3. Lainnya (CSS, JS dari CDN) -> Cache Fallback
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
