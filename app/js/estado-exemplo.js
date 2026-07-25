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

  exames: {
    ferritina:  { v: 22,  data: '2026-07-12' },
    magnesio:   { v: 1.7, data: '2026-07-12' },
    vitaminaD:  { v: 27,  data: '2026-07-12' },
    zinco:      { v: 92,  data: '2026-07-12' },
    b12:        { v: 486, data: '2026-07-12' }
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
    ea: 41,                          // kcal/kg de massa livre de gordura
    proteinaGkgMedia: 1.8,
    gorduraGkgMedia: 1.1,
    fibraMediaG: 24,
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
