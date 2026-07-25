/* ============================================================================
   SERVIDOR DE DESENVOLVIMENTO — sem dependências
   ----------------------------------------------------------------------------
   Service worker só funciona em HTTPS ou em localhost. Abrir index.html com
   duplo clique (file://) nunca vai registrar o SW nem oferecer instalação.

   Uso:  node ferramentas/servidor.js
   Abra: http://localhost:8080
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'app');
const PORTA = process.env.PORTA || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho === '/') caminho = '/index.html';

  const arquivo = path.join(RAIZ, path.normalize(caminho));
  if (!arquivo.startsWith(RAIZ)) {           // barra travessia de diretório
    res.writeHead(403).end('Proibido');
    return;
  }

  fs.readFile(arquivo, (erro, dados) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado: ' + caminho);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
      // durante o desenvolvimento, nada de cache: você quer ver a edição
      'Cache-Control': 'no-store'
    });
    res.end(dados);
  });
}).listen(PORTA, () => {
  console.log('\n  ATLETA rodando em  http://localhost:' + PORTA);
  console.log('  Servindo           ' + RAIZ);
  console.log('\n  Ctrl+C para parar.\n');
});
