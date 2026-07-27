/* ============================================================================
   BASE DE REGRAS — camada de julgamento
   ----------------------------------------------------------------------------
   Cada regra é um objeto declarativo. Nenhuma entra na base sem fonte e sem
   data de revisão — o motor recusa na carga.

   ANATOMIA DE UMA REGRA
     id           string única, kebab-case
     categoria    agrupa para o orçamento de atenção (1 card por categoria)
     severidade   critico | serio | atencao | info | bom
     prioridade   0–99, desempate dentro da mesma severidade
     requer       caminhos do estado que precisam existir e estar na validade
     quando       (estado) => boolean  — puro, sem efeito colateral
     suprime      ids de regras mais genéricas que esta cala
     conteudo     titulo, mecanismo, noTreino, correcao, encaminhar
                  micronutriente exige os quatro primeiros (diretriz nº 2)
     fonte        de onde saiu o limiar. Obrigatório.
     revisadoEm   AAAA-MM. Quando você conferiu pela última vez.
     pedeDado     o que perguntar quando o dado exigido não existe

   FORMATO DO ESTADO — ver estado-exemplo.js
   ========================================================================== */

var BASE_REGRAS = [

/* ══════════════════════════════ FERRO ══════════════════════════════════ */
{
  id: 'ferritina-baixa-endurance',
  categoria: 'micronutriente',
  severidade: 'critico',
  prioridade: 90,
  requer: ['exames.ferritina', 'atleta.modalidade'],
  quando: e => e.exames.ferritina.nivel === 0 && e.atleta.modalidade === 'endurance',
  suprime: ['ferritina-limitrofe', 'ferro-combinacao'],
  conteudo: {
    titulo: 'Ferritina abaixo da referência — o seu limitador de oxigênio',
    mecanismo: 'O ferro é o núcleo da hemoglobina e da mioglobina. Com o estoque baixo, falta matéria-prima para produzir hemácias novas, e o transporte de O₂ até a mitocôndria fica limitado. O ferro também compõe os citocromos da cadeia respiratória — mesmo com hemoglobina ainda normal, a produção aeróbia de ATP já perde eficiência.',
    noTreino: 'Fadiga precoce nas séries longas, frequência cardíaca 5 a 8 bpm acima do normal no mesmo pace, pernas pesadas já no aquecimento e recuperação lenta entre tiros. O limiar aeróbio desce sem que nada tenha mudado no treino.',
    correcao: 'Ferro heme (carne vermelha magra, fígado uma vez por semana) absorve 15 a 35%. Fontes vegetais absorvem 2 a 10% — combine sempre com vitamina C na mesma refeição. Segure café, chá e leite por uma hora antes e depois. Priorize ferro pela manhã: a hepcidina sobe por 3 a 6 h após treino intenso e fecha a absorção intestinal.',
    encaminhar: 'Ferritina abaixo de 30 em atleta pede avaliação médica com hemograma, saturação de transferrina e PCR antes de qualquer suplementação. Ferro suplementado sem indicação é hepatotóxico.'
  },
  fonte: 'Peeling et al., PLoS ONE 2014 (doi:10.1371/journal.pone.0093002); Borrione et al. 2011 (PMID 22023767); AND/DC/ACSM — Thomas, Erdman & Burke, J Acad Nutr Diet 2016;116:501-528. Verificado 2026-07.',
  revisadoEm: '2026-07',
  pedeDado: 'Cadastre sua ferritina mais recente para eu avaliar transporte de oxigênio.'
},
{
  id: 'ferritina-limitrofe',
  categoria: 'micronutriente',
  severidade: 'atencao',
  prioridade: 60,
  requer: ['exames.ferritina', 'atleta.modalidade'],
  quando: e => e.exames.ferritina.nivel === 1 && e.atleta.modalidade === 'endurance',
  conteudo: {
    titulo: 'Ferritina no limite inferior — dentro da referência, abaixo do ideal para endurance',
    mecanismo: 'A referência laboratorial comum considera deficiência abaixo de 15 a 30 ng/mL, porque foi construída para a população geral. Corredores perdem ferro por três vias somadas: hemólise de impacto na pisada, suor e microssangramento gastrointestinal.',
    noTreino: 'Nesta faixa você provavelmente não sente nada em rodagem, mas a reserva não sustenta um bloco de volume alto. É a faixa em que a queda aparece seis semanas depois, já como perda de pace no limiar.',
    correcao: 'Manter ferro heme em duas refeições semanais, leguminosa com fonte de vitamina C nas demais, e repetir o exame em 90 dias para saber a direção da curva — o valor isolado importa menos que a trajetória. Ressalva honesta: não existe um corte único de ferritina acordado entre as diretrizes (as propostas vão de <10 a <35 ng/mL); alvos de 30-50 para endurance são recomendação prática, não consenso firme.'
  },
  fonte: 'AND/DC/ACSM — Thomas et al., J Acad Nutr Diet 2016;116:501-528 ("no agreement on the serum ferritin level... <10 to <35 ng/mL"). Verificado 2026-07: o alvo fixo >40 do app NÃO é endossado por diretriz.',
  revisadoEm: '2026-07'
},
{
  id: 'ferro-combinacao',
  categoria: 'micronutriente',
  severidade: 'info',
  prioridade: 30,
  requer: ['exames.ferritina', 'hoje.refeicaoTemFerroNaoHeme', 'hoje.refeicaoTemVitaminaC'],
  quando: e => e.exames.ferritina.nivel <= 1 && e.hoje.refeicaoTemFerroNaoHeme && !e.hoje.refeicaoTemVitaminaC,
  conteudo: {
    titulo: 'Faltou vitamina C nesta refeição',
    mecanismo: 'O ferro não-heme das leguminosas e folhas é absorvido na forma férrica, que o intestino capta mal. O ascorbato reduz esse ferro à forma ferrosa e forma com ele um quelato solúvel, que atravessa a mucosa com muito mais facilidade. Taninos do café e do chá fazem o caminho inverso: formam complexos insolúveis com o mesmo ferro.',
    noTreino: 'Sozinho, o ferro do feijão e das folhas é absorvido em 2 a 10%. Com vitamina C na mesma refeição, a captação sobe várias vezes — repetido cinco vezes por semana, esse detalhe pesa mais que suplemento tomado na hora errada.',
    correcao: 'Meia laranja, pimentão cru na salada, tomate ou um pouco de suco de limão sobre o feijão. E o café só uma hora depois: os taninos disputam o mesmo transportador.'
  },
  fonte: 'Hurrell & Egli, Am J Clin Nutr 2010',
  revisadoEm: '2026-07'
},

/* ═════════════════════════════ MAGNÉSIO ════════════════════════════════ */
{
  id: 'magnesio-caibras',
  categoria: 'micronutriente',
  severidade: 'serio',
  prioridade: 80,
  requer: ['exames.magnesio', 'semana.caibras'],
  quando: e => e.exames.magnesio.nivel <= 1 && e.semana.caibras > 0,
  suprime: ['magnesio-baixo'],
  conteudo: {
    titulo: 'Magnésio baixo e {{semana.caibras}} episódio(s) de cãibra nesta semana',
    mecanismo: 'O magnésio é o antagonista natural do cálcio dentro da fibra muscular. Sem ele em quantidade suficiente, o cálcio não é bombeado de volta ao retículo sarcoplasmático e a fibra não consegue relaxar. Ele também é cofator de mais de 300 enzimas, incluindo as que produzem ATP — que só é biologicamente ativo na forma Mg-ATP.',
    noTreino: 'A cãibra é literalmente uma contração que não desliga. Some a isso percepção de esforço mais alta para a mesma carga, tremor fino no fim do longo e dificuldade de entrar em sono profundo — a fase em que ocorre o pico de hormônio do crescimento e a maior parte do reparo tecidual.',
    correcao: 'Sementes de abóbora, castanha-do-pará, cacau 70%, folhas verde-escuras e grão-de-bico na rotina diária. Se a cãibra vier sempre no mesmo grupamento muscular, o problema provavelmente é fadiga local e técnica de passada, não mineral.'
  },
  fonte: 'Nielsen & Lukaski, Magnes Res 2006; ISSN Position Stand 2018',
  revisadoEm: '2026-07'
},
{
  id: 'magnesio-baixo',
  categoria: 'micronutriente',
  severidade: 'atencao',
  prioridade: 50,
  requer: ['exames.magnesio'],
  quando: e => e.exames.magnesio.nivel <= 1,
  conteudo: {
    titulo: 'Magnésio no limite inferior',
    mecanismo: 'Cofator de mais de 300 enzimas, entre elas as da produção de ATP. No sistema nervoso, modula receptores NMDA e a liberação de GABA.',
    noTreino: 'Percepção de esforço mais alta para a mesma carga, irritabilidade e sono fragmentado. Aparece antes como sensação de treino "mais duro do que os números dizem" do que como cãibra.',
    correcao: 'Sementes de abóbora, castanhas, cacau 70%, folhas verde-escuras e leguminosas. O magnésio sérico reflete mal o estoque total — a tendência ao longo de três exames diz mais que um valor isolado.'
  },
  fonte: 'NIH Office of Dietary Supplements — Magnesium Fact Sheet for Health Professionals',
  revisadoEm: '2026-07'
},

/* ═════════════════════════════ VITAMINA D ══════════════════════════════ */
{
  id: 'vitd-deficiente',
  categoria: 'micronutriente',
  severidade: 'critico',
  prioridade: 85,
  requer: ['exames.vitaminaD'],
  quando: e => e.exames.vitaminaD.nivel === 0,
  suprime: ['vitd-insuficiente'],
  conteudo: {
    titulo: 'Vitamina D abaixo da referência — faixa de deficiência',
    mecanismo: 'A vitamina D age como hormônio, com receptores dentro da própria fibra muscular. Influencia força, potência e velocidade de contração das fibras tipo II, além de governar o remodelamento ósseo e a imunidade de mucosa.',
    noTreino: 'Queda documentada de desempenho neuromuscular, risco elevado de fratura por estresse em tíbia e metatarso, e mais infecções de vias aéreas justamente nas semanas em que o volume sobe. Perder dez dias de treino por um resfriado custa mais adaptação do que qualquer sessão isolada entrega.',
    correcao: 'Exposição solar de 15 a 20 minutos com braços e pernas descobertos, sardinha, gema de ovo.',
    encaminhar: 'Abaixo de 20 ng/mL há indicação de reposição orientada por médico, com dose e reavaliação definidas por ele.'
  },
  fonte: 'Endocrine Society — Holick et al., J Clin Endocrinol Metab 2011;96:1911-1930 (doi:10.1210/jc.2011-0385): deficiência = 25(OH)D < 20 ng/mL. Verificado 2026-07.',
  revisadoEm: '2026-07'
},
{
  id: 'vitd-insuficiente',
  categoria: 'micronutriente',
  severidade: 'serio',
  prioridade: 70,
  requer: ['exames.vitaminaD'],
  quando: e => e.exames.vitaminaD.nivel === 1,
  conteudo: {
    titulo: 'Vitamina D no limite inferior — insuficiente para atleta',
    mecanismo: 'Receptores de vitamina D existem no músculo esquelético e nas células de defesa das vias aéreas. A faixa alvo para atletas (40 a 60 ng/mL) é mais alta que a da população geral porque a demanda de remodelamento ósseo e de imunidade é maior.',
    noTreino: 'Abaixo de 30 ng/mL há perda mensurável de desempenho neuromuscular e maior incidência de infecção respiratória em blocos de volume alto. O osso responde pior à carga de impacto — terreno para fratura por estresse.',
    correcao: 'Sol de 15 a 20 minutos por dia sem protetor nos braços, sardinha e gema de ovo na rotina. Reavaliar em 90 dias; se não subir com exposição solar, conversar com seu médico sobre reposição. Duas ressalvas honestas: (1) há divergência real de diretriz — a Endocrine Society chama 20-30 ng/mL de "insuficiência", mas o NIH já considera 20 ng/mL adequado; (2) não persiga níveis altos: o NIH sinaliza acima de 50 ng/mL como potencialmente prejudicial, então a parte alta do alvo "40-60" deve ser tratada com cautela.'
  },
  fonte: 'Endocrine Society — Holick et al., J Clin Endocrinol Metab 2011;96:1911-1930; NIH ODS Vitamin D Fact Sheet (≥20 ng/mL adequado; >50 ng/mL potencialmente prejudicial). Verificado 2026-07: divergência de diretriz e limite superior de segurança.',
  revisadoEm: '2026-07'
},

/* ═══════════════════════ OUTROS MICRONUTRIENTES ════════════════════════ */
{
  id: 'b12-baixa',
  categoria: 'micronutriente',
  severidade: 'atencao',
  prioridade: 55,
  requer: ['exames.b12'],
  quando: e => e.exames.b12.nivel <= 1,
  conteudo: {
    titulo: 'Vitamina B12 abaixo do ideal',
    mecanismo: 'Trabalha junto com o folato na eritropoiese — a formação de hemácias novas — e na manutenção da bainha de mielina.',
    noTreino: 'Fadiga que não melhora com descanso, formigamento em extremidades e, quando somada a ferro baixo, um gargalo duplo na produção de hemácias: falta o mineral e falta o cofator.',
    correcao: 'Carnes, ovos, laticínios e peixes. Em dieta vegetariana estrita, a suplementação é obrigatória — não existe fonte vegetal confiável. Ressalva honesta: a ideia de que atletas precisam de B12 mais alta (400-700 pg/mL) vem de UM único estudo observacional em atletas de elite, não de consenso; a deficiência populacional fica por volta de 200 pg/mL. Trate "abaixo do ideal" como sinal para conversar com quem te acompanha, não como diagnóstico.'
  },
  fonte: 'Krzywański et al., Nutrients 2020;12:1038 (PMC7230602) — faixa 400-700 pg/mL proposta em UM estudo de elite (não consenso); referência laboratorial de deficiência ~200 pg/mL. Verificado 2026-07.',
  revisadoEm: '2026-07'
},
{
  id: 'zinco-adequado',
  categoria: 'micronutriente',
  severidade: 'bom',
  prioridade: 10,
  requer: ['exames.zinco'],
  quando: e => e.exames.zinco.nivel >= 2,
  conteudo: {
    titulo: 'Zinco adequado',
    mecanismo: 'Participa da síntese proteica, da produção de testosterona e da integridade da mucosa intestinal.',
    noTreino: 'Sustenta o reparo de microlesões e a barreira intestinal. Atenção em blocos de calor: as perdas pelo suor derrubam esse valor em poucas semanas.',
    correcao: 'Manter carnes, sementes de abóbora, castanhas e leguminosas na rotina. Nota: o corte de adequação difere por sexo — abaixo de 70 µg/dL em mulheres e 74 µg/dL em homens indica status inadequado (em coleta de jejum matinal). O zinco sérico é um biomarcador individual fraco; leia junto com a dieta.'
  },
  fonte: 'NIH ODS — Zinc Fact Sheet (inadequado <70 µg/dL mulheres, <74 µg/dL homens); IZiNCG/BOND. Verificado 2026-07.',
  revisadoEm: '2026-07'
},

/* ═══════════════════ DISPONIBILIDADE ENERGÉTICA ════════════════════════ */
{
  id: 'ea-critica',
  categoria: 'energia',
  severidade: 'critico',
  prioridade: 99,
  requer: ['semana.ea'],
  quando: e => e.semana.ea < 30,
  suprime: ['ea-atencao', 'carbo-deficit'],
  conteudo: {
    titulo: 'Disponibilidade energética em {{semana.ea}} kcal/kg de massa livre de gordura',
    mecanismo: 'Disponibilidade energética é o que sobra para o organismo funcionar depois de descontado o gasto do treino. Abaixo de 30 kcal/kg de MLG o corpo entra em economia: caem hormônios tireoidianos e sexuais, cai a densidade óssea, cai a imunidade e cai a síntese proteica. É a síndrome RED-S.',
    noTreino: 'O resultado é sempre o mesmo: menos adaptação para o mesmo treino. Você continua treinando e para de evoluir — e o risco de fratura por estresse e de infecção sobe junto.',
    correcao: 'Aumentar a oferta de energia, principalmente carboidrato, em todas as refeições. Nenhum ajuste de treino resolve isto, porque o problema não está no treino.',
    encaminhar: 'RED-S é quadro clínico. Vale conversar com médico do esporte e nutricionista — e não é caso de esperar para ver.'
  },
  fonte: 'IOC — Mountjoy et al., Br J Sports Med 2018;52:687-697 (PMID 29771168) e REDs 2023;57:1073-1097 (doi:10.1136/bjsports-2023-106994); Loucks & Thuma, J Clin Endocrinol Metab 2003;88:297-311; AND/DC/ACSM 2016. Verificado 2026-07.',
  revisadoEm: '2026-07',
  pedeDado: 'Preciso da sua massa livre de gordura e do registro alimentar da semana para calcular disponibilidade energética.'
},
{
  id: 'ea-atencao',
  categoria: 'energia',
  severidade: 'serio',
  prioridade: 75,
  requer: ['semana.ea'],
  quando: e => e.semana.ea >= 30 && e.semana.ea < 38,
  conteudo: {
    titulo: 'Disponibilidade energética em {{semana.ea}} — zona cinzenta',
    mecanismo: 'Acima do limiar de 30, mas abaixo dos 40 a 45 kcal/kg de MLG associados a adaptação plena. Nesta faixa o organismo funciona, mas prioriza manutenção em vez de adaptação.',
    noTreino: 'O treino "não rende o que deveria". Sessões cumpridas, curva de evolução estagnada. É a explicação mais comum para platô em atleta amador que treina certo.',
    correcao: 'Reforçar carboidrato nas refeições em volta do treino e adicionar uma refeição intermediária nos dias de sessão dupla.'
  },
  fonte: 'AND/DC/ACSM — Thomas et al. 2016 (45 kcal/kg MLG = equilíbrio/ótimo; abaixo de 30 = prejuízos); IOC RED-S 2018/2023. Verificado 2026-07 (o rótulo "40-45 = adaptação plena" é paráfrase da faixa ótima).',
  revisadoEm: '2026-07'
},

/* ═════════════════════════════ CARBOIDRATO ═════════════════════════════ */
{
  id: 'carbo-meta-sessao',
  categoria: 'carboidrato',
  severidade: 'atencao',
  prioridade: 65,
  requer: ['hoje.tipoSessao', 'hoje.carboMeta', 'hoje.carboConsumido', 'contexto.horaDoDia'],
  quando: e => ['intenso', 'longo'].includes(e.hoje.tipoSessao) &&
               e.contexto.horaDoDia >= 14 &&
               e.hoje.carboConsumido < e.hoje.carboMeta * 0.55,
  conteudo: {
    titulo: 'Faltam {{hoje.carboRestante}} g de carboidrato para a sessão de hoje',
    noTreino: 'Acima de 80% do VO₂ máx o músculo depende quase exclusivamente de glicogênio. Chegar na sessão com o estoque pela metade não deixa o treino mais leve — deixa o mesmo pace mais caro, e a queda aparece nos dois últimos tiros.',
    correcao: 'Uma refeição com 1,5 g/kg de carboidrato três horas antes, com pouca fibra e pouca gordura para esvaziar rápido do estômago, mais 30 g de rápida absorção 40 minutos antes.'
  },
  fonte: 'ACSM/AND/DC 2016; Burke et al., J Sports Sci 2011',
  revisadoEm: '2026-07'
},
{
  id: 'carbo-deficit',
  categoria: 'carboidrato',
  severidade: 'atencao',
  prioridade: 40,
  requer: ['hoje.carboMeta', 'hoje.carboConsumido', 'contexto.horaDoDia'],
  quando: e => e.contexto.horaDoDia >= 20 && e.hoje.carboConsumido < e.hoje.carboMeta * 0.8,
  conteudo: {
    titulo: 'O dia fecha abaixo da meta de carboidrato',
    noTreino: 'Glicogênio não reposto hoje é combustível que falta amanhã. Dois ou três dias seguidos assim e a queda de pace aparece sem nenhuma explicação aparente no treino.',
    correcao: 'Não precisa compensar tudo agora. Uma porção extra de carboidrato no jantar e reforço no café da manhã já recuperam a maior parte.'
  },
  fonte: 'Burke et al., J Sports Sci 2011',
  revisadoEm: '2026-07'
},
{
  id: 'carbo-durante-longo',
  categoria: 'carboidrato',
  severidade: 'info',
  prioridade: 35,
  requer: ['hoje.duracaoPrevistaMin'],
  quando: e => e.hoje.duracaoPrevistaMin >= 90,
  conteudo: {
    titulo: 'Sessão de {{hoje.duracaoPrevistaMin}} min — leve carboidrato',
    noTreino: 'Acima de 90 minutos o glicogênio hepático se esgota e a glicemia cai. Cai junto a concentração, sobe a percepção de esforço e chega o muro.',
    correcao: '30 a 60 g por hora. Acima de 150 minutos, até 90 g/h com mistura glicose e frutose 2:1 — que usam transportadores diferentes e evitam o gargalo do SGLT1. Só suba a dose se o intestino já estiver treinado para ela.'
  },
  fonte: 'Jeukendrup, Sports Med 2014; ACSM/AND/DC 2016',
  revisadoEm: '2026-07'
},

/* ══════════════════════════════ PROTEÍNA ═══════════════════════════════ */
{
  id: 'proteina-dose-refeicao',
  categoria: 'proteina',
  severidade: 'atencao',
  prioridade: 45,
  requer: ['hoje.proteinaUltimaRefeicao', 'atleta.pesoKg'],
  quando: e => e.hoje.proteinaUltimaRefeicao < 0.3 * e.atleta.pesoKg,
  conteudo: {
    titulo: 'Esta refeição ficou abaixo da dose que dispara síntese proteica',
    noTreino: 'A síntese proteica funciona por limiar, não por soma: são necessários cerca de 0,3 a 0,4 g/kg por refeição, o suficiente para entregar 2,5 g de leucina. Abaixo disso o estímulo simplesmente não dispara, mesmo que o total do dia esteja correto.',
    correcao: 'Para você, cerca de {{atleta.doseProteinaAlvo}} g por refeição, em quatro refeições espaçadas de 3 a 4 horas. Um ovo a mais, um copo de leite ou uma colher de whey fecham a conta.'
  },
  fonte: 'ISSN — Jäger et al., J Int Soc Sports Nutr 2017;14:20 (doi:10.1186/s12970-017-0177-8): 0,25 g/kg ou 20-40 g por refeição, leucina 1-3 g. Verificado 2026-07.',
  revisadoEm: '2026-07'
},
{
  id: 'proteina-total-baixa',
  categoria: 'proteina',
  severidade: 'serio',
  prioridade: 68,
  requer: ['semana.proteinaGkgMedia'],
  quando: e => e.semana.proteinaGkgMedia < 1.4,
  conteudo: {
    titulo: 'Proteína média em {{semana.proteinaGkgMedia}} g/kg — abaixo da faixa de adaptação',
    noTreino: 'A faixa para atleta em treinamento é de 1,6 a 2,0 g/kg. Abaixo dela, o reparo das microlesões fica incompleto entre sessões: a dor muscular dura mais, a qualidade da sessão seguinte cai e a adaptação se acumula pela metade.',
    correcao: 'Distribuir em quatro refeições em vez de concentrar no jantar. Uma fonte proteica no café da manhã costuma ser a lacuna mais comum.'
  },
  fonte: 'ISSN — Jäger et al., J Int Soc Sports Nutr 2017;14:20 (faixa 1,4-2,0 g/kg/dia; o piso 1,6 do app fica dentro dela). Verificado 2026-07.',
  revisadoEm: '2026-07'
},
{
  id: 'proteina-pre-sono',
  categoria: 'proteina',
  severidade: 'info',
  prioridade: 20,
  requer: ['hoje.tipoSessao'],
  quando: e => ['intenso', 'longo', 'forca'].includes(e.hoje.tipoSessao),
  conteudo: {
    titulo: 'Vale uma dose de proteína antes de dormir',
    noTreino: '30 a 40 g de proteína de digestão lenta antes do sono aumentam a síntese proteica durante a noite, que é quando ocorre a maior parte do reparo tecidual.',
    correcao: 'Iogurte natural, queijo, leite ou caseína. Se juntar fontes de magnésio, glicina e triptofano, apoia também a qualidade do sono profundo.'
  },
  fonte: 'Snijders et al., Front Nutr 2019; ISSN Position Stand 2017',
  revisadoEm: '2026-07'
},

/* ═══════════════════════════════ GORDURA ═══════════════════════════════ */
{
  id: 'gordura-piso',
  categoria: 'gordura',
  severidade: 'serio',
  prioridade: 72,
  requer: ['semana.gorduraGkgMedia'],
  quando: e => e.semana.gorduraGkgMedia < 0.8,
  conteudo: {
    titulo: 'Gordura em {{semana.gorduraGkgMedia}} g/kg — abaixo do piso fisiológico',
    noTreino: 'A gordura é substrato para a produção de hormônios esteroides — testosterona e estrogênio — e veículo de absorção das vitaminas A, D, E e K. Cortar abaixo de 0,8 g/kg compromete o eixo hormonal e, com ele, toda a recuperação.',
    correcao: 'Azeite, castanhas, abacate, ovos e peixes gordos. Não é o macronutriente onde faz sentido economizar.'
  },
  fonte: 'ACSM/AND/DC 2016; IOC Consensus RED-S 2018',
  revisadoEm: '2026-07'
},

/* ═════════════════════════════ HIDRATAÇÃO ══════════════════════════════ */
{
  id: 'suor-salgado',
  categoria: 'hidratacao',
  severidade: 'atencao',
  prioridade: 58,
  requer: ['suor.sodioMgL', 'suor.taxaLh'],
  quando: e => e.suor.sodioMgL >= 800,
  conteudo: {
    titulo: 'Perfil de suador salgado — {{suor.sodioMgL}} mg de sódio por litro',
    noTreino: 'Sódio sustenta o volume plasmático, que é o sangue efetivamente circulando e levando oxigênio ao músculo. Com taxa de suor de {{suor.taxaLh}} L/h, uma sessão de duas horas custa mais de 2 g de sódio. Repondo só água você dilui ainda mais o que restou — daí vêm cãibra e queda de coordenação no fim da prova.',
    correcao: 'De 600 a 900 mg de sódio por litro na bebida em sessões acima de 90 minutos. Em prova longa e calor, comece a reposição desde o primeiro quilômetro, não quando a sede aparecer.'
  },
  fonte: 'ACSM Position Stand: Exercise and Fluid Replacement, 2007; Baker, Sports Med 2017',
  revisadoEm: '2026-07'
},
{
  id: 'desidratacao-2pct',
  categoria: 'hidratacao',
  severidade: 'serio',
  prioridade: 74,
  requer: ['suor.perdaPctUltimaSessao'],
  quando: e => e.suor.perdaPctUltimaSessao >= 2,
  conteudo: {
    titulo: 'Perda de {{suor.perdaPctUltimaSessao}}% da massa corporal na última sessão',
    noTreino: 'Cada 1% de desidratação eleva a frequência cardíaca em cerca de 3 bpm e reduz o volume de ejeção. A partir de 2% caem o desempenho aeróbio, a termorregulação e o tempo de reação — e a percepção de esforço sobe para o mesmo trabalho.',
    correcao: 'Reponha de 700 a 900 ml por hora de treino. Depois da sessão, 1,25 a 1,5 litro para cada quilo perdido, com sódio junto para reter o que você bebeu.'
  },
  fonte: 'ACSM Position Stand 2007; Sawka et al., Med Sci Sports Exerc 2007',
  revisadoEm: '2026-07'
},

/* ═════════════════════════ INTESTINO E MENTE ═══════════════════════════ */
{
  id: 'diversidade-vegetal-baixa',
  categoria: 'intestino',
  severidade: 'atencao',
  prioridade: 52,
  requer: ['semana.plantasDistintas'],
  quando: e => e.semana.plantasDistintas < 25,
  conteudo: {
    titulo: 'Diversidade vegetal em {{semana.plantasDistintas}} de 30 plantas',
    mecanismo: 'A diversidade de fibras determina a diversidade da microbiota, e é ela que produz os ácidos graxos de cadeia curta. O butirato alimenta os colonócitos, sela as junções da barreira intestinal e influencia a expressão de BDNF, ligada à plasticidade neural.',
    noTreino: 'Menos butirato aparece como humor instável, foco em queda e maior percepção de esforço nas semanas de volume alto. Cerca de 90% da serotonina do corpo é produzida no intestino, a partir do triptofano da dieta, sob regulação da microbiota — não é tema paralelo à performance, é parte dela.',
    correcao: 'Contar espécies distintas, não gramas: temperos, sementes, castanhas e leguminosas contam. Trocar a salada de sempre e variar a leguminosa da semana já move o número.'
  },
  fonte: 'McDonald et al., mSystems 2018 (American Gut Project); Dalile et al., Nat Rev Gastroenterol Hepatol 2019',
  revisadoEm: '2026-07'
},
{
  id: 'fibra-baixa',
  categoria: 'intestino',
  severidade: 'atencao',
  prioridade: 48,
  requer: ['semana.fibraMediaG'],
  quando: e => e.semana.fibraMediaG < 25,
  conteudo: {
    titulo: 'Fibra média em {{semana.fibraMediaG}} g por dia',
    noTreino: 'Fibra é o substrato da fermentação que gera butirato. Abaixo de 25 g por dia a produção cai, a barreira intestinal fica mais frágil e o treino intenso — que já reduz a irrigação do intestino — encontra um tecido menos protegido.',
    correcao: 'Aveia, leguminosas, frutas com casca e hortaliças. Suba aos poucos: um salto brusco de fibra causa desconforto por duas semanas até a microbiota acompanhar.'
  },
  fonte: 'Guia Alimentar para a População Brasileira, MS 2014; Reynolds et al., Lancet 2019',
  revisadoEm: '2026-07'
},
{
  id: 'sintomas-gi-treino',
  categoria: 'intestino',
  severidade: 'serio',
  prioridade: 66,
  requer: ['semana.sintomasGI'],
  quando: e => e.semana.sintomasGI >= 2,
  suprime: ['fibra-baixa'],
  conteudo: {
    titulo: '{{semana.sintomasGI}} episódios de desconforto gastrointestinal em treino nesta semana',
    mecanismo: 'Em esforços acima de 70% do VO₂ máx o fluxo sanguíneo é redirecionado para os músculos e a irrigação intestinal cai drasticamente — a isquemia esplâncnica. Isso afrouxa as junções da parede intestinal e permite passagem de endotoxinas para a circulação.',
    noTreino: 'Enjoo, cólica e a corrida ao banheiro no meio do longo. Além do incômodo, a inflamação sistêmica resultante atrasa a recuperação da sessão inteira.',
    correcao: 'Treino do intestino em seis semanas: comece com 30 g de carboidrato por hora nos longos, suba para 45 g e depois 60 g com glicose e frutose 2:1. A expressão dos transportadores SGLT1 e GLUT5 aumenta com exposição progressiva — a capacidade de absorver é treinável como qualquer outro tecido. E reduza fibra e FODMAPs nas 24 h antes de prova.'
  },
  fonte: 'Costa et al., Aliment Pharmacol Ther 2017; Jeukendrup, Sports Med 2017',
  revisadoEm: '2026-07'
},
{
  id: 'fermentados-poucos',
  categoria: 'intestino',
  severidade: 'info',
  prioridade: 25,
  requer: ['semana.fermentadosDias'],
  quando: e => e.semana.fermentadosDias < 4,
  conteudo: {
    titulo: 'Alimentos fermentados em {{semana.fermentadosDias}} de 7 dias',
    noTreino: 'Consumo regular de fermentados aumenta a diversidade da microbiota e reduz marcadores inflamatórios — o que se traduz em recuperação mais previsível entre sessões duras.',
    correcao: 'Kefir, iogurte natural, kimchi ou chucrute. Um por dia basta; a regularidade importa mais que a quantidade.'
  },
  fonte: 'Wastyk et al., Cell 2021',
  revisadoEm: '2026-07'
},

/* ═══════════════════════════ RECUPERAÇÃO ═══════════════════════════════ */
{
  id: 'sono-curto-recorrente',
  categoria: 'recuperacao',
  severidade: 'serio',
  prioridade: 76,
  requer: ['semana.sonoMedioH'],
  quando: e => e.semana.sonoMedioH < 7,
  conteudo: {
    titulo: 'Sono médio de {{semana.sonoMedioH}} h por noite',
    noTreino: 'É no sono profundo que ocorre o pico de hormônio do crescimento e a maior parte do reparo tecidual. Abaixo de 7 horas de forma recorrente caem a tolerância à glicose, a síntese proteica e a imunidade — e sobe a percepção de esforço para a mesma carga. Nenhum ajuste nutricional compensa isso.',
    correcao: 'Antecipar o jantar, reduzir luz azul na última hora e manter horário estável mesmo no fim de semana. Uma dose de proteína com magnésio, glicina e triptofano antes de deitar apoia a arquitetura do sono.'
  },
  fonte: 'Walker, Sleep 2017; Simpson et al., Eur J Sport Sci 2017',
  revisadoEm: '2026-07'
},
{
  id: 'vfc-queda',
  categoria: 'recuperacao',
  severidade: 'atencao',
  prioridade: 62,
  requer: ['recuperacao.vfc', 'recuperacao.vfcMedia7'],
  quando: e => e.recuperacao.vfc < e.recuperacao.vfcMedia7 * 0.88,
  conteudo: {
    titulo: 'VFC {{recuperacao.vfc}} ms, bem abaixo da sua média de 7 dias',
    noTreino: 'Queda expressiva da variabilidade da frequência cardíaca indica predomínio simpático — o corpo ainda está processando a carga anterior, ou algo fora do treino (sono, estresse, infecção iniciando) consumiu a reserva.',
    correcao: 'Não é motivo automático para cancelar a sessão, mas é motivo para reduzir a intensidade e reavaliar amanhã. Reforce carboidrato e hidratação hoje: os dois deprimem VFC quando faltam.'
  },
  fonte: 'Plews et al., Sports Med 2013; Buchheit, Front Physiol 2014',
  revisadoEm: '2026-07'
},

/* ════════════════════════════ CARGA ════════════════════════════════════ */
{
  id: 'acwr-alto',
  categoria: 'carga',
  severidade: 'serio',
  prioridade: 78,
  requer: ['recuperacao.acwr'],
  quando: e => e.recuperacao.acwr > 1.5,
  conteudo: {
    titulo: 'Razão aguda:crônica em {{recuperacao.acwr}}',
    noTreino: 'A carga desta semana está muito acima do que seu corpo vinha absorvendo. Acima de 1,5 a incidência de lesão sobe de forma consistente na literatura — e o ganho de adaptação não acompanha, porque adaptação depende de recuperação completa entre estímulos.',
    correcao: 'Segurar o volume por 7 a 10 dias e reforçar carboidrato e proteína neste período. Progressão sustentável fica entre 0,8 e 1,3.'
  },
  fonte: 'Gabbett, Br J Sports Med 2016; Hulin et al., Br J Sports Med 2016',
  revisadoEm: '2026-07'
},
{
  id: 'tudo-em-ordem',
  categoria: 'sintese',
  severidade: 'bom',
  prioridade: 5,
  requer: ['semana.ea', 'recuperacao.prontidao'],
  quando: e => e.semana.ea >= 40 && e.recuperacao.prontidao >= 75,
  conteudo: {
    titulo: 'Combustível e recuperação alinhados',
    noTreino: 'Disponibilidade energética em {{semana.ea}} kcal/kg de MLG e prontidão em {{recuperacao.prontidao}}. É o cenário em que o treino planejado rende o que promete — dá para buscar a sessão inteira.',
    correcao: 'Manter o que está sendo feito. Estabilidade por semanas seguidas é o que move a curva de VO₂ máx.'
  },
  fonte: 'IOC Consensus RED-S 2018',
  revisadoEm: '2026-07'
},

/* ═══════════════════ PERFIL FISIOLÓGICO (personaliza limiares) ══════════ */
{
  id: 'ferro-mulher-menstruada',
  categoria: 'micronutriente',
  severidade: 'serio',
  prioridade: 92,
  requer: ['exames.ferritina'],
  quando: e => e.perfil && e.perfil.sexo === 'feminino' &&
               ['regular','irregular'].indexOf(e.perfil.menstruacao) !== -1 &&
               e.exames.ferritina.nivel <= 1,
  suprime: ['ferritina-baixa-endurance', 'ferritina-limitrofe', 'ferro-combinacao'],
  conteudo: {
    titulo: 'Ferritina baixa — atenção redobrada pela perda menstrual',
    mecanismo: 'A menstruação é uma perda mensal e recorrente de ferro. Somada à hemólise de impacto da corrida, ao suor e ao microssangramento intestinal, ela torna a deficiência de ferro muito mais provável em mulheres que menstruam — e desloca a interpretação: a referência laboratorial geral foi construída sobre população mista e subestima o seu risco.',
    noTreino: 'A consequência é a mesma — transporte de oxigênio limitado, fadiga precoce, FC mais alta no mesmo pace — mas você chega lá mais rápido e com menos margem. Por isso o alvo para endurance (acima de 40 ng/mL) importa ainda mais no seu caso.',
    correcao: 'Ferro heme com vitamina C nas refeições, café só uma hora depois, e ferro pela manhã (a hepcidina fecha a absorção após treino intenso). Reavaliar em 90 dias — a trajetória diz mais que o valor isolado.',
    encaminhar: 'Ferritina baixa em mulher que menstrua, sobretudo com fluxo intenso, pede avaliação médica — e, se o fluxo for volumoso, também investigação ginecológica. Não suplemente ferro por conta própria.'
  },
  fonte: 'ACSM/AND/DC 2016; Sim et al., Eur J Appl Physiol 2019 — revisão sobre ferro em atletas mulheres',
  revisadoEm: '2026-07'
},
{
  id: 'proteina-masters',
  categoria: 'proteina',
  severidade: 'atencao',
  prioridade: 47,
  requer: ['hoje.proteinaUltimaRefeicao', 'atleta.pesoKg'],
  quando: e => e.perfil && e.perfil.idade >= 60 &&
               e.hoje.proteinaUltimaRefeicao < 0.4 * e.atleta.pesoKg,
  suprime: ['proteina-dose-refeicao'],
  conteudo: {
    titulo: 'Dose de proteína desta refeição pode não bastar na sua idade',
    noTreino: 'Com o avançar da idade surge a "resistência anabólica": o músculo responde menos ao mesmo estímulo de proteína. O limiar por refeição sobe de ~0,3 para cerca de 0,4 g/kg — abaixo disso, a síntese proteica não dispara com a mesma eficiência, e o reparo entre sessões fica incompleto.',
    correcao: 'Mire cerca de 0,4 g/kg por refeição, com fontes ricas em leucina (laticínios, ovos, carnes, whey). Distribuir em quatro refeições rende mais que concentrar no jantar.'
  },
  fonte: 'Morton et al., Br J Sports Med 2018; ISSN — Jäger et al. 2017 (~0,4 g/kg/refeição cobre variabilidade interindividual). Verificado 2026-07.',
  revisadoEm: '2026-07'
},
{
  id: 'triade-atleta-feminina',
  categoria: 'energia',
  severidade: 'critico',
  prioridade: 96,
  requer: ['semana.ea'],
  quando: e => e.perfil && e.perfil.sexo === 'feminino' &&
               ['irregular','ausente'].indexOf(e.perfil.menstruacao) !== -1 &&
               e.semana.ea < 45,
  suprime: ['ea-atencao'],
  conteudo: {
    titulo: 'Ciclo alterado + energia disponível em {{semana.ea}} — sinal da tríade da atleta',
    mecanismo: 'Irregularidade ou ausência de menstruação combinada com baixa disponibilidade energética é a assinatura da tríade da atleta feminina (parte do RED-S): baixa EA → disfunção menstrual → perda de densidade óssea. A alteração do ciclo não é "efeito do treino puxado" — é um sinal de que o corpo cortou funções por falta de combustível.',
    noTreino: 'Além da queda de desempenho e adaptação, o risco concreto é ósseo: menor densidade e mais fraturas por estresse. É um dos poucos sinais que pedem ação sem esperar para ver.',
    correcao: 'Aumentar a oferta de energia — principalmente carboidrato — em todas as refeições. Nenhum ajuste de treino corrige isto, porque a causa não está no treino.',
    encaminhar: 'Alteração menstrual associada a baixa energia disponível merece avaliação com médica(o) do esporte e ginecologista, e acompanhamento nutricional. Não é caso de esperar.'
  },
  fonte: 'De Souza et al., 2014 Female Athlete Triad Coalition Consensus, Br J Sports Med 2014 (PMID 24463911); IOC RED-S — Mountjoy et al. 2018 (PMID 29771168). Verificado 2026-07.',
  revisadoEm: '2026-07'
},

/* ═══════════ CONDIÇÕES DE SAÚDE (bloqueiam categoria + encaminham) ═══════ */
/* Estas regras NÃO prescrevem para a doença. Elas silenciam a orientação que
   ficaria perigosa diante da condição e deixam no lugar o encaminhamento. */
{
  id: 'cond-doenca-renal',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 90,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('doenca_renal') !== -1,
  suprimeCategorias: ['proteina', 'hidratacao'],
  conteudo: {
    titulo: 'Doença renal informada — silenciei proteína e sódio',
    noTreino: 'As recomendações padrão deste app para atleta — proteína alta (1,6–2,0 g/kg) e reposição generosa de sódio no suor — podem ser prejudiciais na doença renal, onde proteína, sódio e potássio precisam de controle individual. Por isso não mostro essas metas para você.',
    encaminhar: 'A sua meta de proteína e de eletrólitos deve ser definida pela(o) nefrologista e por nutricionista, considerando o seu estágio de função renal. Leve a eles a sua rotina de treino e suor.'
  },
  fonte: 'Regra de segurança: silencia orientação que exige manejo clínico (referência: manejo nutricional em DRC). Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-diabetes',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 88,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('diabetes') !== -1,
  suprimeCategorias: ['carboidrato'],
  conteudo: {
    titulo: 'Diabetes informado — metas de carboidrato exigem seu manejo',
    noTreino: 'As metas de carboidrato periodizado e a ingestão durante o exercício interagem diretamente com insulina e outros medicamentos — dose e timing errados podem causar hipo ou hiperglicemia. Por isso não mostro metas fixas de carboidrato para você; a lógica de combustível precisa ser individualizada com quem ajusta a sua medicação.',
    encaminhar: 'Converse com endocrinologista e nutricionista esportivo sobre carboidrato peri-treino, ajuste de insulina para exercício e monitorização de glicemia nos treinos longos.'
  },
  fonte: 'Regra de segurança: carboidrato peri-treino interage com terapia glicêmica. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-hipertensao',
  categoria: 'condicao',
  severidade: 'atencao',
  prioridade: 80,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('hipertensao') !== -1,
  suprimeCategorias: ['hidratacao'],
  conteudo: {
    titulo: 'Hipertensão informada — segurei a orientação de sódio',
    noTreino: 'A recomendação de repor sódio generosamente no suor faz sentido para performance, mas pode conflitar com o controle da pressão arterial. Como o balanço é individual, não mostro metas de sódio para você — elas precisam considerar a sua pressão e a sua medicação.',
    encaminhar: 'Ajuste a estratégia de sódio e hidratação com a(o) médica(o) que acompanha sua pressão, sobretudo para provas longas em calor.'
  },
  fonte: 'Regra de segurança: reposição de sódio pode conflitar com controle pressórico. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-dii',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 84,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('dii') !== -1,
  suprimeCategorias: ['intestino'],
  conteudo: {
    titulo: 'Doença inflamatória intestinal informada — silenciei o "treino do intestino"',
    noTreino: 'O protocolo de aumentar fibra e treinar a absorção de carboidrato assume um intestino saudável. Na doença inflamatória intestinal (Crohn, retocolite), fibra e certas estratégias podem piorar sintomas, sobretudo em atividade da doença. Por isso não mostro essa orientação de intestino para você.',
    encaminhar: 'Estratégias de fibra, carboidrato durante o exercício e manejo de sintomas gastrointestinais devem ser desenhadas com gastroenterologista e nutricionista que conheçam o seu quadro.'
  },
  fonte: 'Regra de segurança: orientação de fibra/intestino pode agravar DII ativa. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-celiaca',
  categoria: 'condicao',
  severidade: 'atencao',
  prioridade: 70,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('doenca_celiaca') !== -1,
  conteudo: {
    titulo: 'Doença celíaca informada — atenção às fontes de carboidrato',
    noTreino: 'As metas de carboidrato continuam válidas, mas as fontes precisam ser sem glúten: pão, macarrão e aveia comuns estão fora. Além disso, a absorção de ferro e outros micronutrientes pode estar comprometida se a dieta sem glúten não estiver bem ajustada — algo a acompanhar nos exames.',
    encaminhar: 'Mantenha acompanhamento com nutricionista para garantir carboidrato suficiente com fontes seguras (arroz, batata, mandioca, tapioca, quinoa) e monitore ferro e vitaminas nos exames periódicos.'
  },
  fonte: 'Regra de segurança e orientação: fontes de carboidrato sem glúten e absorção de micronutrientes. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-transtorno-alimentar',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 94,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('transtorno_alimentar') !== -1,
  suprimeCategorias: ['proteina', 'carboidrato', 'gordura'],
  conteudo: {
    titulo: 'Histórico de transtorno alimentar — modo cuidadoso ativado',
    noTreino: 'Você indicou histórico de transtorno alimentar. Por isso silenciei as metas detalhadas de macronutrientes: mirar gramas de perto pode alimentar fixação e fazer mal. O que este app mantém — e reforça — é a proteção da energia disponível: aqui, comer o suficiente é sempre o objetivo, e nunca há meta de peso ou restrição.',
    encaminhar: 'O acompanhamento com equipe especializada (médica(o), nutricionista e psicóloga(o) com experiência em transtornos alimentares) é o que sustenta treino e saúde juntos. Se estiver em sofrimento agora, procure apoio — no Brasil, o CVV atende no 188, 24h.'
  },
  fonte: 'Regra de segurança: evita orientação que pode reforçar fixação alimentar; preserva a proteção de energia disponível. Não substitui acompanhamento especializado.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-depressao',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 86,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('depressao') !== -1,
  conteudo: {
    titulo: 'Depressão informada — aqui a nutrição é apoio, não tratamento',
    noTreino: 'Existe uma conexão real entre intestino, alimentação e humor, e treinar bem ajuda a disposição. Mas isso é apoio complementar: não trata depressão e não substitui psicoterapia nem medicação. Em fases de baixa, o apetite muda e a energia disponível pode cair sem você perceber — a proteção de energia deste app segue valendo a seu favor, e comer o suficiente continua sendo o objetivo.',
    encaminhar: 'Mantenha o acompanhamento com psiquiatra e/ou psicóloga(o), e nunca ajuste medicação por causa deste app. Se estiver com pensamentos de se machucar, procure ajuda agora — no Brasil, o CVV atende no 188, 24h.'
  },
  fonte: 'Regra de apoio e segurança: nutrição como coadjuvante, jamais como tratamento de saúde mental. Não substitui acompanhamento profissional.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-ansiedade',
  categoria: 'condicao',
  severidade: 'atencao',
  prioridade: 78,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('ansiedade') !== -1,
  conteudo: {
    titulo: 'Ansiedade informada — dois pontos práticos',
    noTreino: 'Ansiedade e intestino conversam nos dois sentidos: sintomas gastrointestinais no treino podem ter um componente ansioso, e vale registrar isso para levar a quem te acompanha. Um ponto concreto e sob seu controle: excesso de cafeína (café, pré-treino, energéticos) pode intensificar sintomas de ansiedade e piorar o sono — algo a observar, sobretudo na semana de prova.',
    encaminhar: 'Este app não trata ansiedade nem substitui acompanhamento profissional. Se precisar de apoio emocional, o CVV atende no 188, 24h.'
  },
  fonte: 'Regra de apoio e segurança: orientação complementar, não tratamento. Não substitui acompanhamento profissional.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-bipolar',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 89,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('transtorno_bipolar') !== -1,
  suprimeCategorias: ['hidratacao'],
  conteudo: {
    titulo: 'Transtorno bipolar informado — silenciei sódio e hidratação',
    noTreino: 'Se você usa lítio, o equilíbrio de sódio e de líquidos afeta diretamente o nível de lítio no sangue: suar muito, repor sódio de forma agressiva ou mudar bruscamente a hidratação pode elevar o lítio a níveis tóxicos ou reduzi-lo demais. Por isso silenciei a orientação de sódio e hidratação para você. Além disso, sono e rotina são pilares da estabilidade no transtorno bipolar, e blocos de treino intenso mexem nos dois — vale acompanhar de perto.',
    encaminhar: 'Defina hidratação, sódio e carga de treino junto da(o) psiquiatra, sobretudo se usa lítio (que exige monitoração do nível sérico). Nunca ajuste medicação por causa deste app. Em crise, o CVV atende no 188.'
  },
  fonte: 'Regra de segurança: sódio e hidratação alteram a litemia; sono/rotina afetam estabilidade. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-tdah',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 82,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('tdah') !== -1,
  conteudo: {
    titulo: 'TDAH informado — atenção à fome mascarada pela medicação',
    noTreino: 'Os estimulantes usados no TDAH (metilfenidato, lisdexanfetamina e afins) costumam suprimir o apetite, sobretudo ao longo do dia. Para quem treina, isso é um risco concreto: dá para comer de menos sem sentir fome e derrubar a energia disponível — exatamente o que este app protege. A saída prática é comer por horário, não por fome: refeições e lanches marcados, aproveitando as janelas em que o efeito do remédio diminui (fim de tarde e noite). Vale saber ainda que estimulantes elevam a frequência cardíaca — sua FC de repouso e sua VFC podem vir alteradas pela medicação, não pelo treino.',
    encaminhar: 'Alinhe a medicação e o horário das refeições em torno dela com quem prescreve (psiquiatra ou neurologista) e, de preferência, com nutricionista. Nunca ajuste a medicação por causa deste app.'
  },
  fonte: 'Regra de apoio e segurança: estimulantes suprimem apetite (risco de baixa energia disponível) e elevam a frequência cardíaca. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
},
{
  id: 'cond-gravidez',
  categoria: 'condicao',
  severidade: 'serio',
  prioridade: 93,
  requer: ['perfil.condicoes'],
  quando: e => e.perfil && e.perfil.condicoes && e.perfil.condicoes.indexOf('gravidez_amamentacao') !== -1,
  suprimeCategorias: ['energia', 'proteina', 'carboidrato', 'micronutriente'],
  conteudo: {
    titulo: 'Gravidez ou amamentação — fora do escopo deste app',
    noTreino: 'A nutrição na gestação e na amamentação tem necessidades e contraindicações próprias, e a lógica de disponibilidade energética deste app — feita para garantir que você coma o suficiente para treinar — não se transfere para este período, em que as necessidades sobem e a orientação precisa ser individual. Por isso silenciei as metas de energia e de macronutrientes: elas foram feitas para outro contexto.',
    encaminhar: 'Sua nutrição e a segurança do treino neste período devem ser conduzidas por obstetra e por nutricionista com experiência em gestação. Este app volta a fazer sentido depois.'
  },
  fonte: 'Regra de segurança: necessidades da gestação/lactação diferem e exigem manejo próprio. Não substitui avaliação médica.',
  revisadoEm: '2026-07'
}

];

if (typeof module === 'object' && module.exports) module.exports = BASE_REGRAS;
