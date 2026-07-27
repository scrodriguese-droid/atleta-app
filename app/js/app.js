/* ============================================================================
   APP — casca, telas e ligação com o motor
   ----------------------------------------------------------------------------
   Nenhuma regra de saúde mora aqui. Esta camada monta o estado, entrega ao
   motor e desenha o que ele devolve. Onde falta dado, mostra estado vazio
   honesto — nunca número falso.
   ========================================================================== */

(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  let estado = Armazem.carregar();

  /* ====================================================================== */
  /* Metadados de apresentação                                              */
  /* ====================================================================== */

  const FORMULARIO = [
    { grupo: 'Você', itens: [
      { c: 'atleta.nome', r: 'Nome', tipo: 'texto' },
      { c: 'atleta.modalidade', r: 'Modalidade', tipo: 'opcoes',
        opcoes: [['endurance','Endurance'],['forca','Força'],['misto','Misto']] },
      { c: 'atleta.pesoKg', r: 'Massa corporal', s: 'só denominador de g/kg', tipo: 'num', u: 'kg' },
      { c: 'atleta.mlgKg', r: 'Massa livre de gordura', s: 'para disponibilidade energética', tipo: 'num', u: 'kg' }
    ]},
    { grupo: 'Perfil', nota: 'Isto ajusta os limiares para você — não é questionário médico. Fica só no aparelho.', itens: [
      { c: 'perfil.idade', r: 'Idade', tipo: 'num', u: 'anos' },
      { c: 'perfil.sexo', r: 'Sexo biológico', s: 'afeta ferro, osso e energia', tipo: 'opcoes',
        opcoes: [['','—'],['feminino','Feminino'],['masculino','Masculino'],['outro','Outro / prefiro não dizer']] },
      { c: 'perfil.menstruacao', r: 'Ciclo menstrual', tipo: 'opcoes',
        opcoes: [['','—'],['regular','Regular'],['irregular','Irregular'],['ausente','Ausente'],['nao_se_aplica','Não se aplica']] },
      { c: 'perfil.condicoes', r: 'Saúde física', s: 'o app silencia o que exige manejo clínico e encaminha', tipo: 'multi', opcoes: 'CONDICOES_FISICA' },
      { c: 'perfil.condicoes', r: 'Saúde mental', s: 'a nutrição entra como apoio, nunca como tratamento', tipo: 'multi', opcoes: 'CONDICOES_MENTAL' }
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
      { c: 'recuperacao.fcRepouso', r: 'FC de repouso', tipo: 'num', u: 'bpm' },
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

  // Faixas dos micronutrientes (min/max da barra, alvo, limiar baixo).
  // Maior é melhor em todos estes. Fonte dos limiares: base-regras.js.
  const MICROS = [
    { c:'exames.ferritina', nome:'Ferritina',    u:'ng/mL', min:0,   max:80,  baixo:30,  alvo:40 },
    { c:'exames.magnesio',  nome:'Magnésio',     u:'mg/dL', min:1.4, max:2.6, baixo:1.8, alvo:2.0 },
    { c:'exames.vitaminaD', nome:'Vitamina D',   u:'ng/mL', min:0,   max:60,  baixo:20,  alvo:40 },
    { c:'exames.zinco',     nome:'Zinco',        u:'µg/dL', min:50,  max:120, baixo:70,  alvo:70 },
    { c:'exames.b12',       nome:'Vitamina B12', u:'pg/mL', min:0,   max:700, baixo:300, alvo:300 }
  ];

  // Catálogo da triagem de condições, separado por saúde física e mental.
  // As chaves casam com o que as regras 'condicao' testam em base-regras.js.
  // Ambos os campos gravam no mesmo array perfil.condicoes.
  const CONDICOES_FISICA = [
    ['diabetes', 'Diabetes'],
    ['doenca_renal', 'Doença renal'],
    ['hipertensao', 'Hipertensão'],
    ['dii', 'Doença inflamatória intestinal'],
    ['doenca_celiaca', 'Doença celíaca'],
    ['gravidez_amamentacao', 'Gravidez ou amamentação']
  ];
  const CONDICOES_MENTAL = [
    ['transtorno_alimentar', 'Histórico de transtorno alimentar'],
    ['depressao', 'Depressão'],
    ['ansiedade', 'Ansiedade'],
    ['transtorno_bipolar', 'Transtorno bipolar'],
    ['tdah', 'TDAH']
  ];
  const CAT_MULTI = { CONDICOES_FISICA, CONDICOES_MENTAL };

  const ICONES_ST = {
    bom:     '<path d="M8 1a7 7 0 100 14A7 7 0 008 1z"/><path d="M4.6 8.1l2.2 2.2 4.3-4.3" fill="none" stroke="#1a1a19" stroke-width="1.8"/>',
    aviso:   '<path d="M8 1 15 14H1z"/><path d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" fill="#1a1a19"/>'
  };

  /* ====================================================================== */
  /* Utilidades                                                             */
  /* ====================================================================== */

  function ler(caminho) {
    return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), estado);
  }
  function escrever(caminho, valor) {
    const partes = caminho.split('.');
    const ultima = partes.pop();
    const alvo = partes.reduce((o, k) => (o[k] = o[k] || {}), estado);
    alvo[ultima] = valor;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }
  function num(v) {
    if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return null;
    return v;
  }
  function fmt(v) {
    if (v == null) return '—';
    return Number.isInteger(v) ? String(v) : Number(v).toFixed(1).replace('.', ',');
  }

  function derivar() {
    const meta = num(estado.hoje.carboMeta) || 0;
    const cons = num(estado.hoje.carboConsumido) || 0;
    estado.hoje.carboRestante = Math.max(0, meta - cons);
    if (num(estado.atleta.pesoKg)) {
      estado.atleta.doseProteinaAlvo = Math.round(estado.atleta.pesoKg * 0.35);
    }
  }

  /** Anel SVG de progresso (0–100) ou vazio se val for null. */
  function anel(val, rotulo) {
    const R = 44, C = 2 * Math.PI * R;
    const vazio = val == null;
    const frac = vazio ? 0 : Math.max(0, Math.min(1, val / 100));
    const off = C * (1 - frac);
    const centro = vazio ? '—' : Math.round(val);
    return `<div class="ring ${vazio ? 'vazio' : ''}">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-label="${esc(rotulo)}: ${vazio ? 'sem dado' : centro}">
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="#2c2c2a" stroke-width="9"/>
        ${vazio ? '' : `<circle cx="52" cy="52" r="${R}" fill="none" stroke="#199e70" stroke-width="9"
          stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
          transform="rotate(-90 52 52)"/>`}
      </svg>
      <div class="val"><b>${centro}</b><i>${esc(rotulo)}</i></div>
    </div>`;
  }

  function kpi(l, v, u, extra) {
    const na = v == null;
    return `<div class="kpi">
      <div class="l">${esc(l)}</div>
      <div class="v ${na ? 'na' : ''}">${na ? '—' : fmt(v)}${!na && u ? `<small>${esc(u)}</small>` : ''}</div>
      ${extra ? `<div class="d ${extra.cls || ''}">${esc(extra.txt)}</div>` : ''}
    </div>`;
  }

  /** Medidor com faixa-alvo. Devolve {html, status}. Maior é melhor. */
  function medidor(val, min, max, baixo, alvo) {
    const status = val == null ? 'neutro'
      : val >= alvo ? 'bom'
      : val >= baixo ? 'atencao'
      : 'critico';
    const pct = val == null ? 0 : Math.max(2, Math.min(100, (val - min) / (max - min) * 100));
    const refPct = Math.max(0, Math.min(100, (alvo - min) / (max - min) * 100));
    const html = `<div class="meter">
        <i class="${status}" style="width:${pct.toFixed(0)}%"></i>
        <span class="ref" style="left:${refPct.toFixed(0)}%"></span>
      </div>
      <div class="mrange"><span>${fmt(min)}</span><span>alvo ${fmt(alvo)}</span><span>${fmt(max)}</span></div>`;
    return { html, status };
  }

  function pilula(status, texto) {
    const ic = status === 'bom' ? ICONES_ST.bom : ICONES_ST.aviso;
    return `<span class="st ${status}"><svg class="ic" viewBox="0 0 16 16">${ic}</svg>${esc(texto)}</span>`;
  }

  /* ====================================================================== */
  /* Tela: HOJE                                                             */
  /* ====================================================================== */

  function desenharHoje() {
    derivar();
    const r = Motor.briefing(estado, { base: BASE_REGRAS, max: 5 });
    const rec = estado.recuperacao, sem = estado.semana;
    let html = '';

    // Hero: anel de prontidão
    const prontidao = num(rec.prontidao);
    const primeiroCard = r.cards[0];
    html += `<div class="hero"><div class="hero-row">
      ${anel(prontidao, 'PRONTIDÃO')}
      <div class="hero-copy">
        <div class="lab">Leitura de hoje</div>
        ${prontidao != null
          ? `<div class="big">${primeiroCard ? esc(primeiroCard.conteudo.titulo) : 'Sem alertas no combustível hoje'}</div>
             <div class="txt">${primeiroCard ? 'O motor destacou este ponto como prioridade — detalhe abaixo.' : 'Nenhuma regra disparou com os dados atuais.'}</div>`
          : `<div class="big">Registre sua prontidão para começar</div>
             <div class="txt">Na aba <b>Dados</b>, informe prontidão, sono e VFC. O anel e o painel do dia se preenchem a partir daí.</div>`}
      </div>
    </div></div>`;

    // KPIs de recuperação
    let deltaVfc = null;
    if (num(rec.vfc) != null && num(rec.vfcMedia7) != null) {
      const d = rec.vfc - rec.vfcMedia7;
      deltaVfc = { txt: (d >= 0 ? '+' : '') + fmt(d) + ' vs. média de 7 dias', cls: d >= 0 ? 'up' : 'down' };
    }
    html += `<div class="kpis">
      ${kpi('VFC (rMSSD)', num(rec.vfc), 'ms', deltaVfc)}
      ${kpi('Sono', num(sem.sonoMedioH), 'h')}
      ${kpi('Energia disponível', num(sem.ea), 'kcal/kg')}
      ${kpi('FC de repouso', num(rec.fcRepouso), 'bpm')}
    </div>`;

    // Briefing
    if (r.cards.length) {
      html += '<div class="sec">Seu briefing</div>';
      html += r.cards.map(cardHTML).join('');
    } else {
      html += '<div class="sec">Seu briefing</div>';
      html += '<div class="vazio">Nenhuma regra disparou. Pode ser que esteja tudo em ordem — ou que faltem dados. Veja os pedidos abaixo.</div>';
    }

    if (r.pedidosDeDado.length) {
      html += '<div class="sec">Para eu enxergar mais</div>';
      html += r.pedidosDeDado.map(p => `<div class="pedido">${esc(p.pedido)}</div>`).join('');
    }

    $('#a-hoje').innerHTML = html;
  }

  function cardHTML(c) {
    const corpo = CAMPOS_CARD.filter(([k]) => c.conteudo[k])
      .map(([k, rot]) => `<p class="fld"><em>${rot}</em>${esc(c.conteudo[k])}</p>`).join('');
    return `<div class="card sev ${c.severidade}">
      <h3>${esc(c.conteudo.titulo)}</h3>${corpo}
      <div class="src">Fonte: ${esc(c.fonte)} · revisto em ${esc(c.revisadoEm)}</div>
    </div>`;
  }

  /* ====================================================================== */
  /* Tela: COMBUSTÍVEL                                                      */
  /* ====================================================================== */

  function desenharFuel() {
    derivar();
    const h = estado.hoje, sem = estado.semana, at = estado.atleta;
    const gates = (Motor.avaliar(estado, { base: BASE_REGRAS }).gates) || {};
    const bloqueio = '<div class="vazio">Esta orientação está sob manejo da sua condição de saúde — o motivo e o encaminhamento estão no topo da aba <b>Hoje</b>.</div>';
    let html = '';

    // Anel de carboidrato do dia
    const meta = num(h.carboMeta), cons = num(h.carboConsumido);
    if (gates.carboidrato) {
      html += bloqueio;
    } else if (meta) {
      const pct = cons != null ? Math.round(cons / meta * 100) : 0;
      html += `<div class="hero"><div class="hero-row">
        ${anel(cons != null ? Math.min(100, pct) : null, 'DA META')}
        <div class="hero-copy">
          <div class="lab">Carboidrato de hoje</div>
          <div class="big">${cons != null ? fmt(cons) : '0'} de ${fmt(meta)} g</div>
          <div class="txt">${cons != null && cons < meta
            ? `Faltam <b>${fmt(meta - cons)} g</b> até o fim do dia. Glicogênio é o que decide se o último esforço sai no ritmo.`
            : 'Meta do dia definida na aba Dados, conforme o tipo de sessão.'}</div>
        </div>
      </div></div>`;
    } else {
      html += '<div class="vazio">Defina a <b>meta de carboidrato</b> e o tipo de sessão na aba Dados para ver o painel de combustível.</div>';
    }

    // Distribuição-alvo de macros (derivada do peso — rótulo honesto: são metas)
    const peso = num(at.pesoKg);
    if (peso && !gates.proteina && !gates.carboidrato && !gates.gordura) {
      const cMeta = meta || Math.round(peso * 5);
      const pMeta = Math.round(peso * 1.8);
      const gMeta = Math.round(peso * 1.0);
      const kc = cMeta * 4, kp = pMeta * 4, kg = gMeta * 9, tot = kc + kp + kg;
      html += `<div class="sec">Distribuição-alvo do dia</div>
        <div class="card">
          <div class="macrobar">
            <i style="width:${(kc/tot*100).toFixed(1)}%;background:var(--s1)"></i>
            <i style="width:${(kp/tot*100).toFixed(1)}%;background:var(--s2)"></i>
            <i style="width:${(kg/tot*100).toFixed(1)}%;background:var(--s3)"></i>
          </div>
          <div class="legend">
            <span><i style="background:var(--s1)"></i> Carbo · ${cMeta} g</span>
            <span><i style="background:var(--s2)"></i> Proteína · ${pMeta} g</span>
            <span><i style="background:var(--s3)"></i> Gordura · ${gMeta} g</span>
          </div>
          <div class="note">Metas derivadas do seu peso (${fmt(peso)} kg): carbo pela sessão, proteína 1,8 g/kg, gordura 1,0 g/kg. São alvos de referência, não o que você já comeu.</div>
        </div>`;
    }

    // Disponibilidade energética
    const ea = num(sem.ea);
    if (ea != null && !gates.energia) {
      const st = ea >= 40 ? 'bom' : ea >= 30 ? 'atencao' : 'critico';
      const pct = Math.max(2, Math.min(100, ea / 50 * 100));
      html += `<div class="sec">Disponibilidade energética</div>
        <div class="card">
          <div class="card-t"><span>Energia disponível (EA)</span>
            ${pilula(st, ea >= 40 ? 'Adequada' : ea >= 30 ? 'Zona cinzenta' : 'Baixa')}</div>
          <div class="meter"><i class="${st}" style="width:${pct.toFixed(0)}%"></i><span class="ref" style="left:60%"></span></div>
          <div class="mrange"><span>0</span><span>limiar 30</span><span>50 kcal/kg MLG</span></div>
          <div class="note">Abaixo de 30 kcal/kg de massa livre de gordura o corpo entra em economia (RED-S). É o indicador que este app protege — comer menos nunca é a alavanca de performance.</div>
        </div>`;
    }

    // Hidratação
    const sod = num(estado.suor.sodioMgL), taxa = num(estado.suor.taxaLh);
    if (!gates.hidratacao && (sod != null || taxa != null)) {
      html += `<div class="sec">Hidratação e eletrólitos</div>
        <div class="card"><table class="tbl">
          <tr><th>Parâmetro</th><th>Seu perfil</th></tr>
          ${taxa != null ? `<tr><td>Taxa de suor</td><td><b>${fmt(taxa)} L/h</b></td></tr>` : ''}
          ${sod != null ? `<tr><td>Sódio no suor</td><td><b>${fmt(sod)} mg/L</b>${sod >= 800 ? ' · salgado' : ''}</td></tr>` : ''}
          ${sod != null ? `<tr><td>Reposição alvo</td><td><b>${sod >= 800 ? '600–900' : '400–600'} mg Na/L</b></td></tr>` : ''}
        </table></div>`;
    }

    // Referência peri-treino (conteúdo educativo, adapta ao tipo de sessão)
    if (!gates.carboidrato && ['intenso','longo','forca'].includes(h.tipoSessao)) {
      html += `<div class="sec">Peri-treino · referência</div>
        <div class="card"><ul class="plan">
          <li><span class="t">3–4 h antes</span><span>1–4 g/kg de carboidrato, pouca fibra e gordura.</span></li>
          <li><span class="t">30–45 min</span><span>30 g de carboidrato + 500 mg de sódio em 400 ml.</span></li>
          <li><span class="t">Durante</span><span>${num(h.duracaoPrevistaMin) >= 90 ? '30–60 g/h; acima de 150 min, até 90 g/h com glicose:frutose 2:1.' : 'Sessão &lt; 60 min: água basta.'}</span></li>
          <li><span class="t">0–2 h após</span><span>1,0 g/kg de carboidrato + 0,3 g/kg de proteína para ressíntese e reparo.</span></li>
        </ul></div>`;
    }

    $('#a-fuel').innerHTML = html;
  }

  /* ====================================================================== */
  /* Tela: CORPO (micros + intestino + recuperação)                        */
  /* ====================================================================== */

  function desenharCorpo() {
    derivar();
    const sem = estado.semana, rec = estado.recuperacao;
    const gates = (Motor.avaliar(estado, { base: BASE_REGRAS }).gates) || {};
    let html = '';

    // Micronutrientes
    const comExame = MICROS.filter(m => num(ler(m.c + '.v')) != null);
    if (comExame.length) {
      html += '<div class="sec">Micronutrientes</div>';
      html += comExame.map(m => {
        const v = ler(m.c + '.v');
        const md = medidor(v, m.min, m.max, m.baixo, m.alvo);
        const rotulo = md.status === 'bom' ? 'Adequado' : md.status === 'atencao' ? 'Atenção' : 'Baixo';
        return `<div class="micro">
          <div class="micro-top">
            <span class="nm">${esc(m.nome)}</span>
            <span class="vl">${fmt(v)}<small>${esc(m.u)}</small></span>
          </div>
          ${md.html}
          <div style="margin-top:10px">${pilula(md.status, rotulo)}</div>
        </div>`;
      }).join('');
      html += '<div class="note" style="margin:0 2px 4px">Cada marcador vira consequência de treino no seu briefing (aba Hoje). Aqui é a leitura numérica contra a faixa-alvo.</div>';
    } else {
      html += '<div class="sec">Micronutrientes</div>';
      html += '<div class="vazio">Cadastre seus exames na aba <b>Dados</b> para ver cada marcador posicionado na sua faixa-alvo.</div>';
    }

    // Intestino
    const plantas = num(sem.plantasDistintas);
    if (gates.intestino) {
      html += '<div class="sec">Eixo intestino–cérebro</div>';
      html += '<div class="vazio">A orientação de intestino está sob manejo da sua condição de saúde — o motivo e o encaminhamento estão no topo da aba <b>Hoje</b>.</div>';
    } else if (plantas != null || num(sem.fibraMediaG) != null) {
      html += '<div class="sec">Eixo intestino–cérebro</div>';
      if (plantas != null) {
        const st = plantas >= 25 ? 'bom' : 'atencao';
        const pct = Math.min(100, plantas / 30 * 100);
        html += `<div class="card">
          <div class="card-t"><span>Diversidade vegetal da semana</span><span>${plantas} / 30</span></div>
          <div class="meter"><i class="${st}" style="width:${pct.toFixed(0)}%"></i></div>
          <div class="mrange"><span>0</span><span>meta 30 plantas distintas</span></div>
          <div class="note">Diversidade de fibra determina a diversidade da microbiota — e quanto butirato você produz, o que sustenta humor e foco nas semanas duras.</div>
        </div>`;
      }
      html += '<div class="kpis">';
      html += kpi('Fibra / dia', num(sem.fibraMediaG), 'g', num(sem.fibraMediaG) != null ? { txt: 'meta: 38 g' } : null);
      html += kpi('Fermentados', num(sem.fermentadosDias), '/7 dias');
      html += kpi('Sintomas GI', num(sem.sintomasGI), '×');
      html += kpi('Cãibras', num(sem.caibras), '×');
      html += '</div>';
    }

    // Recuperação
    const acwr = num(rec.acwr);
    if (acwr != null) {
      const st = acwr > 1.5 ? 'serio' : acwr < 0.8 ? 'atencao' : 'bom';
      html += `<div class="sec">Carga e recuperação</div>
        <div class="card">
          <div class="card-t"><span>Razão aguda:crônica</span>${pilula(st, st === 'bom' ? 'Faixa segura' : 'Fora da faixa')}</div>
          <div class="meter"><i class="${st}" style="width:${Math.min(100, acwr/2*100).toFixed(0)}%"></i><span class="ref" style="left:65%"></span></div>
          <div class="mrange"><span>0,5</span><span>faixa 0,8–1,3</span><span>2,0</span></div>
          <div class="note">Progressão sustentável fica entre 0,8 e 1,3. Este é um indicador com ressalvas na literatura recente — trate como sinal, não veredito.</div>
        </div>`;
    }

    if (!html) {
      html = '<div class="vazio">Preencha seus dados na aba <b>Dados</b> — exames, semana e recuperação — para ver seus marcadores aqui.</div>';
    }

    $('#a-corpo').innerHTML = html;
  }

  /* ====================================================================== */
  /* Tela: DADOS                                                            */
  /* ====================================================================== */

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
    if (item.tipo === 'multi') {
      const ops = typeof item.opcoes === 'string' ? (CAT_MULTI[item.opcoes] || []) : item.opcoes;
      const sel = ler(item.c) || [];
      const chips = ops.map(([k, r]) =>
        `<span class="chip ${sel.indexOf(k) !== -1 ? 'on' : ''}" data-multi="${item.c}" data-key="${esc(k)}">${esc(r)}</span>`).join('');
      return `<div class="campo" style="display:block">
        <div class="rot" style="margin-bottom:8px">${esc(item.r)}${item.s ? `<small>${esc(item.s)}</small>` : ''}</div>
        <div class="chips" style="margin-top:0">${chips}</div>
      </div>`;
    }
    return `<div class="campo">${rot}
      <input type="number" step="${passo}" data-c="${item.c}" value="${v != null ? v : ''}" placeholder="${item.u || ''}">
    </div>`;
  }

  function desenharDados() {
    let html = FORMULARIO.map(g =>
      `<div class="sec">${esc(g.grupo)}</div>` +
      (g.nota ? `<div class="note" style="margin:-4px 2px 9px">${esc(g.nota)}</div>` : '') +
      `<div class="grupo">${g.itens.map(campoHTML).join('')}</div>`
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
        aviso('Salvo');
      });
    });

    // Chips de seleção múltipla (condições de saúde)
    $('#a-dados').querySelectorAll('[data-multi]').forEach(chip => {
      chip.addEventListener('click', () => {
        const caminho = chip.dataset.multi, key = chip.dataset.key;
        const arr = (ler(caminho) || []).slice();
        const i = arr.indexOf(key);
        if (i === -1) arr.push(key); else arr.splice(i, 1);
        escrever(caminho, arr);
        Armazem.salvar(estado);
        desenharDados();   // atualiza o estado visual dos chips
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

  /* ====================================================================== */
  /* Tela: AUDITORIA                                                        */
  /* ====================================================================== */

  function desenharSobre() {
    derivar();
    const r = Motor.avaliar(estado, { base: BASE_REGRAS });

    let html = `<div class="sec">Isto não é um diagnóstico</div>
      <div class="aviso" style="margin-bottom:12px">
        Este app traduz marcadores em consequência de treino, com base em literatura de nutrição
        esportiva. <b>Ele não diagnostica, não prescreve e não substitui médico ou nutricionista.</b>
        Os limiares vêm de consensos para atletas e podem não servir ao seu caso.
        <br><br><b>Nenhum dado sai deste aparelho.</b> Sem conta, sem servidor, sem rede.
      </div>`;

    html += `<div class="sec">Regras que dispararam · ${r.ativas.length}</div>`;
    html += r.ativas.map(c =>
      `<div class="row"><code>${esc(c.id)}</code><span class="why">${esc(c.severidade)} · ${esc(c.trace.join(', '))}</span></div>`
    ).join('') || '<div class="vazio">Nenhuma.</div>';

    html += `<div class="sec">Suprimidas por regra mais específica · ${r.suprimidas.length}</div>`;
    html += r.suprimidas.map(s =>
      `<div class="row"><code>${esc(s.id)}</code><span class="why">calada por <code>${esc(s.suprimidaPor)}</code></span></div>`
    ).join('') || '<div class="vazio">Nenhuma.</div>';

    html += `<div class="sec">Não avaliadas · ${r.semDados.length}</div>`;
    html += r.semDados.map(s => {
      const b = s.bloqueio;
      const motivo = b.motivo === 'desatualizado'
        ? `${b.caminho}: ${b.idadeDias} dias (limite ${b.limiteDias})`
        : b.motivo === 'ausente' ? `falta ${b.caminho}` : `erro: ${b.erro}`;
      return `<div class="row"><code>${esc(s.id)}</code><span class="why">${esc(motivo)}</span></div>`;
    }).join('') || '<div class="vazio">Todas puderam ser avaliadas.</div>';

    if (r.erros.length) {
      html += `<div class="sec">Rejeitadas na carga · ${r.erros.length}</div>`;
      html += r.erros.map(e =>
        `<div class="row"><code>${esc(e.id)}</code><span class="why">${esc(e.problemas.join(' · '))}</span></div>`).join('');
    }

    html += `<div class="sec">Versão</div>
      <div class="aviso" style="font-size:12.5px;color:var(--ink-2)">
        ${BASE_REGRAS.length} regras na base · casca <code>atleta-v5</code><br>
        Funciona offline. Para atualizar, feche e abra de novo com internet.
      </div>`;

    $('#a-sobre').innerHTML = html;
  }

  /* ====================================================================== */
  /* Casca                                                                  */
  /* ====================================================================== */

  const RENDER = {
    'a-hoje': desenharHoje, 'a-fuel': desenharFuel, 'a-corpo': desenharCorpo,
    'a-dados': desenharDados, 'a-sobre': desenharSobre
  };

  function redesenhar() { Object.values(RENDER).forEach(fn => fn()); atualizarSub(); }

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
      const aba = b.dataset.aba;
      document.querySelectorAll('.aba').forEach(s => s.classList.toggle('on', s.id === aba));
      $('#titulo').textContent = b.dataset.titulo;
      document.querySelector('main').scrollTop = 0;
      if (RENDER[aba]) RENDER[aba]();     // sempre fresco ao abrir
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
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW não registrou:', e.message));
    });
  }

  redesenhar();
})();
