/* ============================================================================
   GERADOR DE ÍCONES — PNG puro, sem dependência nenhuma
   ----------------------------------------------------------------------------
   Node traz zlib embutido, e PNG é só cabeçalho + scanlines deflatadas.
   Desenha o anel de prontidão do app: arco aberto + ponto central.

   Uso:  node ferramentas/gerar-icones.js
   ========================================================================== */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ------------------------------ PNG ------------------------------------- */

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function bloco(tipo, dados) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length, 0);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([len, corpo, crc]);
}

/** rgba: Buffer com largura*altura*4 bytes. */
function png(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;    // 8 bits por canal
  ihdr[9] = 6;    // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // scanlines com byte de filtro 0 na frente
  const bruto = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y++) {
    const destino = y * (1 + largura * 4);
    bruto[destino] = 0;
    rgba.copy(bruto, destino + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(bruto, { level: 9 })),
    bloco('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------------------- Desenho ----------------------------------- */

const COR_FUNDO = [0x0d, 0x0d, 0x0d];
const COR_MARCA = [0x19, 0x9e, 0x70];

/**
 * Renderiza o ícone em supersampling e reduz por média — antialiasing sem
 * biblioteca gráfica.
 *
 * @param {number} lado        tamanho final em px
 * @param {boolean} sangria    true = fundo preenche tudo (maskable / iOS)
 * @param {number} escala      proporção do conteúdo dentro do quadro
 */
function desenhar(lado, sangria, escala) {
  const SS = 3;
  const L = lado * SS;
  const buf = Buffer.alloc(L * L * 4);

  const cx = L / 2, cy = L / 2;
  const raioCanto = sangria ? 0 : L * 0.225;

  const rExterno = L * 0.40 * escala;
  const rInterno = rExterno - L * 0.085 * escala;
  const rPonto   = L * 0.085 * escala;
  const inicioGrau = -90, varreduraGrau = 285;

  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const i = (y * L + x) * 4;
      const px = x + 0.5, py = y + 0.5;

      // dentro do quadro (com cantos arredondados quando não há sangria)?
      let noQuadro = true;
      if (raioCanto > 0) {
        const dx = Math.max(raioCanto - px, px - (L - raioCanto), 0);
        const dy = Math.max(raioCanto - py, py - (L - raioCanto), 0);
        noQuadro = (dx * dx + dy * dy) <= raioCanto * raioCanto;
      }
      if (!noQuadro) { buf[i + 3] = 0; continue; }

      let cor = COR_FUNDO;
      const ddx = px - cx, ddy = py - cy;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);

      if (d <= rPonto) {
        cor = COR_MARCA;
      } else if (d >= rInterno && d <= rExterno) {
        const ang = Math.atan2(ddy, ddx) * 180 / Math.PI;
        const t = ((ang - inicioGrau) % 360 + 360) % 360;
        if (t <= varreduraGrau) cor = COR_MARCA;
      }

      buf[i] = cor[0]; buf[i + 1] = cor[1]; buf[i + 2] = cor[2]; buf[i + 3] = 255;
    }
  }

  // redução por média (box filter)
  const saida = Buffer.alloc(lado * lado * 4);
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const j = (((y * SS + sy) * L) + (x * SS + sx)) * 4;
          const alfa = buf[j + 3] / 255;
          r += buf[j] * alfa; g += buf[j + 1] * alfa; b += buf[j + 2] * alfa; a += buf[j + 3];
        }
      }
      const n = SS * SS;
      const alfaMedio = a / n;
      const k = (y * lado + x) * 4;
      const norm = alfaMedio > 0 ? (255 / alfaMedio) : 0;
      saida[k]     = Math.round(r / n * norm);
      saida[k + 1] = Math.round(g / n * norm);
      saida[k + 2] = Math.round(b / n * norm);
      saida[k + 3] = Math.round(alfaMedio);
    }
  }

  return png(lado, lado, saida);
}

/* ----------------------------- Saída ------------------------------------ */

const destino = path.join(__dirname, '..', 'app', 'icones');
fs.mkdirSync(destino, { recursive: true });

const arquivos = [
  ['icone-192.png',           192, false, 1.00],
  ['icone-512.png',           512, false, 1.00],
  ['icone-maskable-512.png',  512, true,  0.72],  // zona segura de 80%
  ['apple-touch-icon.png',    180, true,  0.82],  // iOS aplica a própria máscara
  ['favicon-32.png',           32, false, 1.00]
];

arquivos.forEach(([nome, lado, sangria, escala]) => {
  const dados = desenhar(lado, sangria, escala);
  fs.writeFileSync(path.join(destino, nome), dados);
  console.log(nome.padEnd(26), String(lado).padStart(4) + 'px', String(dados.length).padStart(7) + ' bytes');
});

console.log('\nÍcones gravados em app/icones/');
