/* ============================================================================
   ARMAZENAMENTO — local-first, sem servidor
   ----------------------------------------------------------------------------
   Tudo mora no aparelho. Não existe banco central, não existe conta, não
   existe requisição saindo. Isso é decisão de arquitetura, não economia:
   sem coleta, não há vazamento, não há titular pedindo exclusão, e a
   isenção do Art. 4º da LGPD continua de pé.

   localStorage dá conta com folga: o estado inteiro deste app não passa de
   alguns kilobytes. Migre para IndexedDB quando começar a guardar histórico
   diário de registros alimentares — aí sim o volume cresce e você vai
   precisar de índice por data.
   ========================================================================== */

var Armazem = (function () {
  'use strict';

  const CHAVE = 'atleta.estado.v1';

  /** Estado inicial de quem abre o app pela primeira vez. */
  const PADRAO = {
    contexto: { hoje: null, horaDoDia: null },
    atleta: {
      nome: '', modalidade: 'endurance',
      pesoKg: 70, mlgKg: 58, doseProteinaAlvo: 24
    },
    perfil: {
      idade: null,
      sexo: null,          // 'feminino' | 'masculino' | 'outro'
      menstruacao: null,   // 'regular' | 'irregular' | 'ausente' | 'nao_se_aplica'
      condicoes: []        // chaves da triagem de condições de saúde
    },
    // Cada exame é uma posição qualitativa 0–4 (abaixo → acima da média),
    // não o valor exato. As pessoas lembram do sentido do exame, não do número.
    exames: {
      ferritina:  { nivel: null, data: null },
      magnesio:   { nivel: null, data: null },
      vitaminaD:  { nivel: null, data: null },
      zinco:      { nivel: null, data: null },
      b12:        { nivel: null, data: null }
    },
    hoje: {
      tipoSessao: 'moderado', duracaoPrevistaMin: 60,
      carboMeta: 400, carboConsumido: 0, carboRestante: 400,
      proteinaUltimaRefeicao: null,
      refeicaoTemFerroNaoHeme: false, refeicaoTemVitaminaC: false
    },
    semana: {
      ea: null, proteinaGkgMedia: null, gorduraGkgMedia: null,
      fibraMediaG: null, plantasDistintas: null, fermentadosDias: null,
      sintomasGI: 0, caibras: 0, sonoMedioH: null
    },
    recuperacao: {
      prontidao: null, vfc: null, vfcMedia7: null,
      fcRepouso: null, acwr: null
    },
    suor: { taxaLh: null, sodioMgL: null, perdaPctUltimaSessao: null, data: null }
  };

  /** Mescla o guardado sobre o padrão, para que campo novo não quebre app antigo. */
  function fundir(padrao, guardado) {
    if (guardado === null || guardado === undefined) return clonar(padrao);
    if (typeof padrao !== 'object' || padrao === null || Array.isArray(padrao)) return guardado;
    const saida = {};
    Object.keys(padrao).forEach(k => { saida[k] = fundir(padrao[k], guardado[k]); });
    Object.keys(guardado).forEach(k => { if (!(k in saida)) saida[k] = guardado[k]; });
    return saida;
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  function hojeISO() {
    const d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function carregar() {
    let guardado = null;
    try {
      const cru = localStorage.getItem(CHAVE);
      if (cru) guardado = JSON.parse(cru);
    } catch (e) {
      console.warn('Armazem: estado ilegível, recomeçando do padrão.', e);
    }
    const estado = fundir(PADRAO, guardado);
    // contexto é sempre do momento, nunca do que foi salvo
    estado.contexto.hoje = hojeISO();
    estado.contexto.horaDoDia = new Date().getHours();
    return estado;
  }

  function salvar(estado) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      return true;
    } catch (e) {
      console.error('Armazem: falha ao salvar.', e);
      return false;
    }
  }

  function limpar() { localStorage.removeItem(CHAVE); }

  /* --- Backup: a única forma de o dado sair daqui é você mandando ------- */

  function exportar(estado) {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atleta-backup-' + hojeISO() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importar(arquivo) {
    return new Promise((ok, falha) => {
      const leitor = new FileReader();
      leitor.onload = () => {
        try {
          const estado = fundir(PADRAO, JSON.parse(leitor.result));
          salvar(estado);
          ok(estado);
        } catch (e) { falha(new Error('Arquivo inválido: ' + e.message)); }
      };
      leitor.onerror = () => falha(new Error('Não consegui ler o arquivo.'));
      leitor.readAsText(arquivo);
    });
  }

  return { carregar, salvar, limpar, exportar, importar, hojeISO, PADRAO, CHAVE };
})();
