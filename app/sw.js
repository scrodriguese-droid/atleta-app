/* ============================================================================
   SERVICE WORKER — o que torna o app instalável e utilizável sem rede
   ----------------------------------------------------------------------------
   Estratégia: cache-first para a casca do app. Um app pessoal que roda sobre
   dados locais não tem nada a buscar na rede depois de instalado — a rede só
   serve para entregar uma versão nova.

   PARA PUBLICAR UMA ATUALIZAÇÃO: mude VERSAO. O navegador troca o cache
   inteiro e descarta o antigo. Sem isso, seus amigos ficam presos na versão
   que instalaram.
   ========================================================================== */

const VERSAO = 'atleta-v5';

const CASCA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilo.css',
  './js/motor-regras.js',
  './js/base-regras.js',
  './js/armazenamento.js',
  './js/app.js',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-maskable-512.png',
  './icones/apple-touch-icon.png',
  './icones/favicon-32.png'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(VERSAO)
      .then(cache => cache.addAll(CASCA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(
        chaves.filter(c => c !== VERSAO).map(c => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  // Navegação: devolve a casca mesmo offline, para o app abrir sempre.
  if (req.mode === 'navigate') {
    evento.respondWith(
      caches.match('./index.html').then(r => r || fetch(req))
    );
    return;
  }

  evento.respondWith(
    caches.match(req).then(cacheado => {
      if (cacheado) return cacheado;
      return fetch(req).then(resposta => {
        // guarda o que for do próprio app, para a próxima abertura offline
        if (resposta.ok && new URL(req.url).origin === self.location.origin) {
          const copia = resposta.clone();
          caches.open(VERSAO).then(c => c.put(req, copia));
        }
        return resposta;
      }).catch(() => cacheado);
    })
  );
});
