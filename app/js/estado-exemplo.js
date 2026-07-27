/* ============================================================================
   ESTADO — o contrato de entrada do motor
   ----------------------------------------------------------------------------
   Tudo que o motor sabe sobre você em um instante. Nenhuma regra lê banco,
   rede ou arquivo: o app monta este objeto e entrega pronto.

   Convenção: medidas com data de coleta usam { v: valor, data: 'AAAA-MM-DD' }.
   O motor usa essa data para não disparar alerta com base em exame vencido.

   Note o que NÃO existe aqui: peso-meta, percentual de gordura, medida
   corporal. `pesoKg` e `mlgKg` entram só como denominador de g/kg e de
   disponibilidade energética.
   ========================================================================== */

var ESTADO_EXEMPLO = {

  contexto: {
    hoje: '2026-07-24',
    horaDoDia: 15
  },

  atleta: {
    nome: 'Rafael',
    modalidade: 'endurance',
    pesoKg: 70,
    mlgKg: 58,
    doseProteinaAlvo: 24        // 0,35 g/kg — usado na interpolação de texto
  },

  perfil: {
    idade: 34,
    sexo: 'masculino',
    menstruacao: 'nao_se_aplica',
    condicoes: []               // experimente ['doenca_renal'] na bancada
  },

  // Posição qualitativa 0–4: 0 abaixo · 1 limite inferior · 2 média · 3 limite superior · 4 acima
  exames: {
    ferritina:  { nivel: 0, data: '2026-07-12' },
    magnesio:   { nivel: 1, data: '2026-07-12' },
    vitaminaD:  { nivel: 1, data: '2026-07-12' },
    zinco:      { nivel: 3, data: '2026-07-12' },
    b12:        { nivel: 2, data: '2026-07-12' }
  },

  hoje: {
    tipoSessao: 'intenso',           // leve | moderado | intenso | longo | forca | descanso
    duracaoPrevistaMin: 65,
    carboMeta: 490,
    carboConsumido: 347,
    carboRestante: 143,
    proteinaUltimaRefeicao: 40,
    refeicaoTemFerroNaoHeme: true,
    refeicaoTemVitaminaC: false
  },

  semana: {
    sinaisEnergia: ['cansaco'],      // sinais de baixa energia marcados
    eaRisco: 1,                      // derivado (bancada não roda derivar)
    plantasDistintas: 19,
    fermentadosDias: 3,
    sintomasGI: 2,
    caibras: 1,
    sonoMedioH: 7.2
  },

  recuperacao: {
    prontidao: 78,
    vfc: 62,
    vfcMedia7: 58,
    fcRepouso: 48,
    acwr: 1.06,
    _data: '2026-07-24'
  },

  suor: {
    taxaLh: 1.2,
    sodioMgL: 950,
    perdaPctUltimaSessao: 1.4,
    data: '2026-03-15'
  }
};

if (typeof module === 'object' && module.exports) module.exports = ESTADO_EXEMPLO;
