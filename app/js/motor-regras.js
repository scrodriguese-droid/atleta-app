/* ============================================================================
   MOTOR DE REGRAS — camada de julgamento
   ----------------------------------------------------------------------------
   Determinístico, auditável, sem rede e sem IA. Recebe um estado, devolve
   quais regras disparam, por quê, e quais não puderam ser avaliadas.

   Princípios:
   1. Regra é dado declarativo, não código espalhado. Toda regra é um objeto.
   2. Nada dispara sem fonte e sem data de revisão.
   3. Dado ausente ou vencido não vira silêncio: vira pedido explícito de dado.
   4. Orçamento de atenção: o motor ordena e corta. Mostrar 20 alertas é o
      mesmo que não mostrar nenhum.
   5. As diretrizes do produto são validadas na carga, não confiadas ao autor.

   Uso:
     <script src="motor-regras.js"></script>
     <script src="base-regras.js"></script>
     const r = Motor.briefing(estado, { max: 4 });
   ========================================================================== */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Motor = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------------- */
  /* Constantes                                                             */
  /* ---------------------------------------------------------------------- */

  const SEVERIDADE = { critico: 4, serio: 3, atencao: 2, info: 1, bom: 0 };

  /** Validade padrão do dado, em dias, por prefixo de caminho. */
  const VALIDADE_PADRAO = {
    'exames': 240,       // exame de 8 meses ainda decide conduta; de 2 anos, não
    'suor': 365,
    'recuperacao': 2,
    'hoje': 1,
    'semana': 10,
    'atleta': 3650
  };

  /**
   * Diretriz nº 1 do produto, aplicada estruturalmente: o motor se recusa a
   * carregar qualquer regra que fale de perda de peso ou estética. Não é
   * filtro de interface — é barreira na carga. Uma tela futura não consegue
   * exibir o que nunca entrou na base.
   */
  const TERMOS_VETADOS = [
    'emagrec', 'perder peso', 'perda de peso', 'queimar caloria', 'queima de gordura',
    'deficit calorico', 'déficit calórico', 'secar', 'definicao muscular',
    'definição muscular', 'barriga', 'estetic', 'estétic', 'shape', 'imc'
  ];

  /** Campos de conteúdo obrigatórios por categoria. */
  const CONTEUDO_OBRIGATORIO = {
    micronutriente: ['titulo', 'mecanismo', 'noTreino', 'correcao'],
    _padrao: ['titulo', 'noTreino']
  };

  /* ---------------------------------------------------------------------- */
  /* Utilitários                                                            */
  /* ---------------------------------------------------------------------- */

  /** Lê 'exames.ferritina.v' de um objeto aninhado, sem estourar. */
  function ler(obj, caminho) {
    return caminho.split('.').reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, obj);
  }

  /** Um valor "existe" se não for undefined, null ou NaN. */
  function existe(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'number' && isNaN(v)) return false;
    if (typeof v === 'object' && 'v' in v) return existe(v.v);
    return true;
  }

  function diasEntre(dataISO, hojeISO) {
    const a = new Date(dataISO + 'T00:00:00');
    const b = new Date(hojeISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function validadeDe(caminho, regra) {
    if (regra && regra.validadeDias) return regra.validadeDias;
    const prefixo = caminho.split('.')[0];
    return VALIDADE_PADRAO[prefixo] || 365;
  }

  function semAcento(s) {
    return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  /**
   * Monta o regex de um termo vetado. Busca por substring crua não serve:
   * "kimchi" contém "imc", "dessecar" contém "secar". Termos curtos exigem
   * palavra inteira; termos longos aceitam sufixo, para que "emagrec" pegue
   * "emagrecer" e "emagrecimento".
   */
  function regexVetado(termo) {
    const t = semAcento(termo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(t.length <= 4 ? '\\b' + t + '\\b' : '\\b' + t, 'i');
  }

  /** Substitui {{caminho}} pelo valor do estado, formatado em pt-BR. */
  function interpolar(texto, estado) {
    if (typeof texto !== 'string') return texto;
    return texto.replace(/\{\{([\w.]+)\}\}/g, function (_, caminho) {
      let v = ler(estado, caminho);
      if (v && typeof v === 'object' && 'v' in v) v = v.v;
      if (v === undefined || v === null) return '—';
      if (typeof v === 'number') {
        return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
      }
      return String(v);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Validação na carga                                                     */
  /* ---------------------------------------------------------------------- */

  /**
   * Confere uma regra antes de deixá-la entrar na base. Devolve lista de
   * problemas — vazia quer dizer aprovada.
   */
  function validarRegra(regra) {
    const erros = [];
    const obrig = ['id', 'categoria', 'severidade', 'quando', 'conteudo', 'fonte', 'revisadoEm'];

    obrig.forEach(function (campo) {
      if (!regra[campo]) erros.push('falta o campo "' + campo + '"');
    });
    if (erros.length) return erros;

    if (!(regra.severidade in SEVERIDADE)) {
      erros.push('severidade inválida: "' + regra.severidade + '"');
    }
    if (typeof regra.quando !== 'function') {
      erros.push('"quando" precisa ser função (estado) => boolean');
    }
    if (!/^\d{4}-\d{2}$/.test(regra.revisadoEm)) {
      erros.push('"revisadoEm" precisa estar no formato AAAA-MM');
    }

    // Diretriz nº 2: micronutriente sem consequência no treino não entra.
    const campos = CONTEUDO_OBRIGATORIO[regra.categoria] || CONTEUDO_OBRIGATORIO._padrao;
    campos.forEach(function (c) {
      if (!regra.conteudo[c] || !String(regra.conteudo[c]).trim()) {
        erros.push('conteudo.' + c + ' é obrigatório para a categoria "' + regra.categoria + '"');
      }
    });

    // Diretriz nº 1: barreira de vocabulário.
    const textoTodo = semAcento(Object.values(regra.conteudo).join(' '));
    TERMOS_VETADOS.forEach(function (termo) {
      if (regexVetado(termo).test(textoTodo)) {
        erros.push('conteúdo contém termo vetado pela diretriz nº 1: "' + termo + '"');
      }
    });

    return erros;
  }

  /**
   * Carrega uma base de regras. Regras inválidas não entram — e o motivo
   * fica registrado em .erros para você ver na bancada.
   */
  function carregar(regras) {
    const validas = [], erros = [], vistos = {};

    regras.forEach(function (r, i) {
      const problemas = validarRegra(r);
      if (r.id && vistos[r.id]) problemas.push('id duplicado');
      if (problemas.length) {
        erros.push({ id: r.id || '(regra #' + i + ')', problemas: problemas });
      } else {
        vistos[r.id] = true;
        validas.push(r);
      }
    });

    return { regras: validas, erros: erros };
  }

  /* ---------------------------------------------------------------------- */
  /* Avaliação                                                              */
  /* ---------------------------------------------------------------------- */

  /**
   * Confere se o estado tem os dados que a regra exige, e se estão dentro
   * da validade. Devolve null se está tudo certo, ou o motivo do bloqueio.
   */
  function checarDados(regra, estado, hojeISO) {
    const requer = regra.requer || [];

    for (let i = 0; i < requer.length; i++) {
      const caminho = requer[i];
      const bruto = ler(estado, caminho);

      if (!existe(bruto)) {
        return { motivo: 'ausente', caminho: caminho };
      }
      if (bruto && typeof bruto === 'object' && bruto.data) {
        const idade = diasEntre(bruto.data, hojeISO);
        const limite = validadeDe(caminho, regra);
        if (idade > limite) {
          return { motivo: 'desatualizado', caminho: caminho, idadeDias: idade, limiteDias: limite };
        }
      }
    }
    return null;
  }

  /**
   * Avalia a base inteira contra um estado.
   * Devolve { ativas, suprimidas, semDados, erros }.
   */
  function avaliar(estado, opcoes) {
    opcoes = opcoes || {};
    const base = opcoes.base || (typeof BASE_REGRAS !== 'undefined' ? BASE_REGRAS : []);
    const hojeISO = opcoes.hoje || (estado.contexto && estado.contexto.hoje);

    if (!hojeISO) throw new Error('Motor: informe a data de hoje em estado.contexto.hoje (AAAA-MM-DD)');

    const carga = carregar(base);
    const disparadas = [], semDados = [];

    carga.regras.forEach(function (regra) {
      const bloqueio = checarDados(regra, estado, hojeISO);
      if (bloqueio) {
        semDados.push({
          id: regra.id,
          categoria: regra.categoria,
          pedido: regra.pedeDado || null,
          bloqueio: bloqueio
        });
        return;
      }

      let acionou = false;
      try {
        acionou = !!regra.quando(estado);
      } catch (e) {
        semDados.push({ id: regra.id, categoria: regra.categoria, bloqueio: { motivo: 'erro', erro: e.message } });
        return;
      }

      if (acionou) {
        disparadas.push({
          id: regra.id,
          categoria: regra.categoria,
          severidade: regra.severidade,
          peso: SEVERIDADE[regra.severidade] * 100 + (regra.prioridade || 0),
          conteudo: renderizar(regra.conteudo, estado),
          fonte: regra.fonte,
          revisadoEm: regra.revisadoEm,
          suprime: regra.suprime || [],
          trace: (regra.requer || []).map(function (c) {
            let v = ler(estado, c);
            if (v && typeof v === 'object' && 'v' in v) v = v.v;
            return c + ' = ' + v;
          })
        });
      }
    });

    // Supressão: regra específica cala a genérica.
    const aSuprimir = {};
    disparadas.forEach(function (d) {
      d.suprime.forEach(function (id) { aSuprimir[id] = d.id; });
    });

    const ativas = [], suprimidas = [];
    disparadas.forEach(function (d) {
      if (aSuprimir[d.id]) suprimidas.push(Object.assign({ suprimidaPor: aSuprimir[d.id] }, d));
      else ativas.push(d);
    });

    ativas.sort(function (a, b) { return b.peso - a.peso; });

    return { ativas: ativas, suprimidas: suprimidas, semDados: semDados, erros: carga.erros };
  }

  function renderizar(conteudo, estado) {
    const out = {};
    Object.keys(conteudo).forEach(function (k) {
      out[k] = interpolar(conteudo[k], estado);
    });
    return out;
  }

  /* ---------------------------------------------------------------------- */
  /* Briefing — orçamento de atenção                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * O que a tela realmente mostra. Uma regra por categoria (a mais grave),
   * limitado a `max` cards. O resto continua acessível na auditoria.
   */
  function briefing(estado, opcoes) {
    opcoes = opcoes || {};
    const max = opcoes.max || 4;
    const r = avaliar(estado, opcoes);

    const porCategoria = {}, escolhidas = [];
    r.ativas.forEach(function (a) {
      if (porCategoria[a.categoria]) return;   // já ordenado por peso
      porCategoria[a.categoria] = true;
      escolhidas.push(a);
    });

    return {
      cards: escolhidas.slice(0, max),
      naoMostradas: escolhidas.slice(max),
      pedidosDeDado: r.semDados.filter(function (s) { return s.pedido; }),
      auditoria: r
    };
  }

  /* ---------------------------------------------------------------------- */

  return {
    carregar: carregar,
    validarRegra: validarRegra,
    avaliar: avaliar,
    briefing: briefing,
    interpolar: interpolar,
    SEVERIDADE: SEVERIDADE,
    TERMOS_VETADOS: TERMOS_VETADOS,
    VALIDADE_PADRAO: VALIDADE_PADRAO,
    _ler: ler
  };
});
