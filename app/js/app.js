/* ============================================================================
   APP — casca, telas e ligação com o motor
   ----------------------------------------------------------------------------
   Nenhuma regra de saúde mora aqui. Esta camada só monta o estado, entrega
   ao motor e desenha o que ele devolve. Se você quiser mudar uma conduta,
   o arquivo é base-regras.js — nunca este.
   ========================================================================== */

(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  let estado = Armazem.carregar();

  /* ---------------------------------------------------------------------- */
  /* Especificação dos campos — a tela "Dados" é gerada a partir daqui       */
  /* ---------------------------------------------------------------------- */

  const FORMULARIO = [
    { grupo: 'Você', itens: [
      { c: 'atleta.nome', r: 'Nome', tipo: 'texto' },
      { c: 'atleta.modalidade', r: 'Modalidade', tipo: 'opcoes',
        opcoes: [['endurance','Endurance'],['forca','Força'],['misto','Misto']] },
      { c: 'atleta.pesoKg', r: 'Massa corporal', s: 'só denominador de g/kg', tipo: 'num', u: 'kg' },
      { c: 'atleta.mlgKg', r: 'Massa livre de gordura', s: 'para disponibilidade energética', tipo: 'num', u: 'kg' }
    ]},
    { grupo: 'Exames', itens: [
      { c: 'exames.ferritina', r: 'Ferritina', tipo: 'medida', u: 'ng/mL' },
      { c: 'exames.magnesio',  r: 'Magnésio',  tipo: 'medida', u: 'mg/dL', passo: 0.1 },
      { c: 'exames.vitaminaD', r: 'Vitamina D', tipo: 'medida', u: 'ng/mL' },
      { c: 'exames.zinco',     r: 'Zinco',     tipo: 'medida', u: 'µg/dL' },
      { c: 'exames.b12',       r: 'Vitamina B12', tipo: 'medida', u: 'pg/mL' }
    ]},
    { grupo: 'Hoje', itens: [
      { c: 'hoje.tipoSessao', r: 'Sessão', tipo: 'opcoes',
        opcoes: [['descanso','Descanso'],['leve','Leve'],['moderado','Moderado'],
                 ['intenso','Intenso'],['longo','Longo'],['forca','Força']] },
      { c: 'hoje.duracaoPrevistaMin', r: 'Duração prevista', tipo: 'num', u: 'min' },
      { c: 'hoje.carboMeta', r: 'Meta de carboidrato', tipo: 'num', u: 'g' },
      { c: 'hoje.carboConsumido', r: 'Carboidrato até agora', tipo: 'num', u: 'g' },
      { c: 'hoje.proteinaUltimaRefeicao', r: 'Proteína na última refeição', tipo: 'num', u: 'g' }
    ]},
    { grupo: 'Semana', itens: [
      { c: 'semana.ea', r: 'Disponibilidade energética', s: 'kcal por kg de MLG', tipo: 'num' },
      { c: 'semana.proteinaGkgMedia', r: 'Proteína média', tipo: 'num', u: 'g/kg', passo: 0.1 },
      { c: 'semana.gorduraGkgMedia', r: 'Gordura média', tipo: 'num', u: 'g/kg', passo: 0.1 },
      { c: 'semana.fibraMediaG', r: 'Fibra média', tipo: 'num', u: 'g/dia' },
      { c: 'semana.plantasDistintas', r: 'Plantas distintas', s: 'meta: 30 por semana', tipo: 'num' },
      { c: 'semana.fermentadosDias', r: 'Dias com fermentados', tipo: 'num' },
      { c: 'semana.sintomasGI', r: 'Episódios de desconforto GI', tipo: 'num' },
      { c: 'semana.caibras', r: 'Episódios de cãibra', tipo: 'num' },
      { c: 'semana.sonoMedioH', r: 'Sono médio', tipo: 'num', u: 'h', passo: 0.1 }
    ]},
    { grupo: 'Recuperação', itens: [
      { c: 'recuperacao.prontidao', r: 'Prontidão', s: '0 a 100', tipo: 'num' },
      { c: 'recuperacao.vfc', r: 'VFC hoje', tipo: 'num', u: 'ms' },
      { c: 'recuperacao.vfcMedia7', r: 'VFC média de 7 dias', tipo: 'num', u: 'ms' },
      { c: 'recuperacao.acwr', r: 'Razão aguda:crônica', tipo: 'num', passo: 0.01 }
    ]},
    { grupo: 'Suor', itens: [
      { c: 'suor.taxaLh', r: 'Taxa de suor', tipo: 'num', u: 'L/h', passo: 0.1 },
      { c: 'suor.sodioMgL', r: 'Sódio no suor', tipo: 'num', u: 'mg/L' },
      { c: 'suor.perdaPctUltimaSessao', r: 'Perda na última sessão', tipo: 'num', u: '%', passo: 0.1 }
    ]}
  ];

  const CAMPOS_CARD = [
    ['mecanismo', 'Mecanismo'],
    ['noTreino', 'No seu treino'],
    ['correcao', 'O que fazer'],
    ['encaminhar', 'Quando procurar um profissional']
  ];

  /* ---------------------------------------------------------------------- */
  /* Leitura e escrita por caminho                                          */
  /* ---------------------------------------------------------------------- */

  function ler(caminho) {
    return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), estado);
  }
  function escrever(caminho, valor) {
    const partes = caminho.split('.');
    const ultima = partes.pop();
    const alvo = partes.reduce((o, k) => (o[k] = o[k] || {}), estado);
    alvo[ultima] = valor;
  }

  function derivar() {
    estado.hoje.carboRestante = Math.max(0, (estado.hoje.carboMeta || 0) - (estado.hoje.carboConsumido || 0));
    if (estado.atleta.pesoKg) {
      estado.atleta.doseProteinaAlvo = Math.round(estado.atleta.pesoKg * 0.35);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Tela: Hoje                                                             */
  /* ---------------------------------------------------------------------- */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  function desenharHoje() {
    derivar();
    const r = Motor.briefing(estado, { base: BASE_REGRAS, max: 5 });
    let html = '';

    if (r.cards.length) {
      html += '<div class="sec">Seu briefing</div>';
      html += r.cards.map(c => {
        const corpo = CAMPOS_CARD.filter(([k]) => c.conteudo[k])
          .map(([k, rot]) => `<p class="fld"><em>${rot}</em>${esc(c.conteudo[k])}</p>`).join('');
        return `<div class="card ${c.severidade}">
                  <h3>${esc(c.conteudo.titulo)}</h3>${corpo}
                  <div class="src">Fonte: ${esc(c.fonte)} · revisto em ${esc(c.revisadoEm)}</div>
                </div>`;
      }).join('');
    } else {
      html += '<div class="vazio">Nenhuma regra disparou. Isso pode significar que está tudo em ordem — ou que faltam dados. Confira os pedidos abaixo.</div>';
    }

    if (r.pedidosDeDado.length) {
      html += '<div class="sec">Para eu enxergar mais</div>';
      html += r.pedidosDeDado.map(p => `<div class="pedido">${esc(p.pedido)}</div>`).join('');
    }

    const total = r.auditoria.ativas.length + r.auditoria.suprimidas.length;
    html += `<div class="vazio">${total} regra(s) dispararam de ${BASE_REGRAS.length} na base.
             ${r.naoMostradas.length ? r.naoMostradas.length + ' ficaram fora do orçamento de atenção. ' : ''}
             A auditoria completa está na terceira aba.</div>`;

    $('#a-hoje').innerHTML = html;
  }

  /* ---------------------------------------------------------------------- */
  /* Tela: Dados                                                            */
  /* ---------------------------------------------------------------------- */

  function campoHTML(item) {
    const v = ler(item.c);
    const rot = `<div class="rot">${esc(item.r)}${item.s ? `<small>${esc(item.s)}</small>` : ''}</div>`;
    const passo = item.passo || 1;

    if (item.tipo === 'medida') {
      const val = (v && v.v != null) ? v.v : '';
      const data = (v && v.data) ? v.data : '';
      return `<div class="campo">${rot}<div class="dupla">
        <input type="date" data-c="${item.c}.data" value="${data}">
        <input type="number" step="${passo}" data-c="${item.c}.v" value="${val}" placeholder="${item.u || ''}">
      </div></div>`;
    }
    if (item.tipo === 'opcoes') {
      const ops = item.opcoes.map(([k, r]) =>
        `<option value="${k}"${v === k ? ' selected' : ''}>${esc(r)}</option>`).join('');
      return `<div class="campo">${rot}<select data-c="${item.c}">${ops}</select></div>`;
    }
    if (item.tipo === 'texto') {
      return `<div class="campo">${rot}<input type="text" data-c="${item.c}" value="${esc(v || '')}"></div>`;
    }
    return `<div class="campo">${rot}
      <input type="number" step="${passo}" data-c="${item.c}" value="${v != null ? v : ''}" placeholder="${item.u || ''}">
    </div>`;
  }

  function desenharDados() {
    let html = FORMULARIO.map(g =>
      `<div class="sec">${esc(g.grupo)}</div><div class="grupo">${g.itens.map(campoHTML).join('')}</div>`
    ).join('');

    html += `<div class="sec">Backup</div>
      <div class="linha2" style="margin-bottom:10px">
        <button class="btn" id="exportar">Exportar</button>
        <button class="btn" id="importar-btn">Importar</button>
      </div>
      <input type="file" id="importar" accept="application/json" hidden>
      <div class="aviso" style="margin-bottom:10px">
        <b>Seus dados nunca saem deste aparelho.</b> Não existe conta, servidor ou sincronização.
        O backup é a única forma de tirá-los daqui — e quem manda é você. Guarde o arquivo antes
        de trocar de celular ou limpar o navegador.
      </div>
      <button class="btn perigo" id="apagar">Apagar tudo deste aparelho</button>`;

    $('#a-dados').innerHTML = html;

    $('#a-dados').querySelectorAll('[data-c]').forEach(el => {
      el.addEventListener('change', () => {
        const caminho = el.dataset.c;
        let valor;
        if (el.type === 'number') valor = el.value === '' ? null : parseFloat(el.value);
        else valor = el.value === '' ? null : el.value;
        escrever(caminho, valor);
        derivar();
        Armazem.salvar(estado);
        desenharHoje();
        aviso('Salvo');
      });
    });

    $('#exportar').onclick = () => { Armazem.exportar(estado); aviso('Backup gerado'); };
    $('#importar-btn').onclick = () => $('#importar').click();
    $('#importar').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      Armazem.importar(f)
        .then(novo => { estado = novo; estado.contexto = Armazem.carregar().contexto; redesenhar(); aviso('Backup restaurado'); })
        .catch(err => aviso(err.message));
    };
    $('#apagar').onclick = () => {
      if (!confirm('Apagar todos os seus dados deste aparelho? Isso não tem volta — exporte um backup antes.')) return;
      Armazem.limpar();
      estado = Armazem.carregar();
      redesenhar();
      aviso('Tudo apagado');
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Tela: Auditoria                                                        */
  /* ---------------------------------------------------------------------- */

  function desenharSobre() {
    derivar();
    const r = Motor.avaliar(estado, { base: BASE_REGRAS });

    let html = `<div class="sec">Isto não é um diagnóstico</div>
      <div class="aviso" style="margin-bottom:12px">
        Este app traduz marcadores em consequência de treino, com base em literatura de nutrição
        esportiva. <b>Ele não diagnostica, não prescreve e não substitui médico ou nutricionista.</b>
        Os limiares vêm de consensos para atletas e podem não servir ao seu caso — quem decide isso
        é um profissional com o seu histórico na mão.
        <br><br><b>Nenhum dado sai deste aparelho.</b> Sem conta, sem servidor, sem rede.
      </div>`;

    html += `<div class="sec">Regras que dispararam · ${r.ativas.length}</div>`;
    html += r.ativas.map(c =>
      `<div class="row"><code>${c.id}</code><span class="why">${c.severidade} · ${esc(c.trace.join(', '))}</span></div>`
    ).join('') || '<div class="vazio">Nenhuma.</div>';

    html += `<div class="sec">Suprimidas por regra mais específica · ${r.suprimidas.length}</div>`;
    html += r.suprimidas.map(s =>
      `<div class="row"><code>${s.id}</code><span class="why">calada por <code>${s.suprimidaPor}</code></span></div>`
    ).join('') || '<div class="vazio">Nenhuma.</div>';

    html += `<div class="sec">Não avaliadas · ${r.semDados.length}</div>`;
    html += r.semDados.map(s => {
      const b = s.bloqueio;
      const motivo = b.motivo === 'desatualizado'
        ? `${b.caminho}: ${b.idadeDias} dias (limite ${b.limiteDias})`
        : b.motivo === 'ausente' ? `falta ${b.caminho}` : `erro: ${b.erro}`;
      return `<div class="row"><code>${s.id}</code><span class="why">${esc(motivo)}</span></div>`;
    }).join('') || '<div class="vazio">Todas puderam ser avaliadas.</div>';

    if (r.erros.length) {
      html += `<div class="sec">Rejeitadas na carga · ${r.erros.length}</div>`;
      html += r.erros.map(e =>
        `<div class="row"><code>${e.id}</code><span class="why">${esc(e.problemas.join(' · '))}</span></div>`).join('');
    }

    html += `<div class="sec">Versão</div>
      <div class="liso" style="font-size:12.5px;color:var(--ink-2)">
        ${BASE_REGRAS.length} regras na base · casca <code>atleta-v1</code><br>
        Funciona offline. Para atualizar, feche e abra de novo com internet.
      </div>`;

    $('#a-sobre').innerHTML = html;
  }

  /* ---------------------------------------------------------------------- */
  /* Casca                                                                  */
  /* ---------------------------------------------------------------------- */

  function redesenhar() { desenharHoje(); desenharDados(); desenharSobre(); atualizarSub(); }

  function atualizarSub() {
    const d = new Date();
    const dias = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const nome = estado.atleta.nome ? estado.atleta.nome.split(' ')[0] + ' · ' : '';
    $('#subtitulo').textContent = nome + dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];
  }

  let tempoAviso;
  function aviso(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(() => t.classList.remove('on'), 1600);
  }

  document.querySelectorAll('nav button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('nav button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      document.querySelectorAll('.aba').forEach(s => s.classList.toggle('on', s.id === b.dataset.aba));
      $('#titulo').textContent = b.dataset.titulo;
      document.querySelector('main').scrollTop = 0;
      if (b.dataset.aba === 'a-sobre') desenharSobre();
    });
  });

  /* --- instalação --- */
  let promptInstalacao = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    promptInstalacao = e;
    $('#instalar').style.display = 'block';
  });
  $('#instalar').onclick = async () => {
    if (!promptInstalacao) return;
    promptInstalacao.prompt();
    await promptInstalacao.userChoice;
    promptInstalacao = null;
    $('#instalar').style.display = 'none';
  };
  window.addEventListener('appinstalled', () => {
    $('#instalar').style.display = 'none';
    aviso('Instalado');
  });

  /* --- service worker --- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .catch(e => console.warn('SW não registrou:', e.message));
    });
  }

  redesenhar();
})();
