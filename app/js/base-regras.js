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
  quando: e => e.exames.ferritina.v < 30 && e.atleta.modalidade === 'endurance',
  suprime: ['ferritina-limitrofe', 'ferro-combinacao'],
  conteudo: {
    titulo: 'Ferritina em {{exames.ferritina.v}} ng/mL — é o seu limitador de oxigênio',
    mecanismo: 'O ferro é o núcleo da hemoglobina e da mioglobina. Com o estoque baixo, falta matéria-prima para produzir hemácias novas, e o transporte de O₂ até a mitocôndria fica limitado. O ferro também compõe os citocromos da cadeia respiratória — mesmo com hemoglobina ainda normal, a produção aeróbia de ATP já perde eficiência.',
    noTreino: 'Fadiga precoce nas séries longas, frequência cardíaca 5 a 8 bpm acima do normal no mesmo pace, pernas pesadas já no aquecimento e recuperação lenta entre tiros. O limiar aeróbio desce sem que nada tenha mudado no treino.',
    correcao: 'Ferro heme (carne vermelha magra, fígado uma vez por semana) absorve 15 a 35%. Fontes vegetais absorvem 2 a 10% — combine sempre com vitamina C na mesma refeição. Segure café, chá e leite por uma hora antes e depois. Priorize ferro pela manhã: a hepcidina sobe por 3 a 6 h após treino intenso e fecha a absorção intestinal.',
    encaminhar: 'Ferritina abaixo de 30 em atleta pede avaliação médica com hemograma, saturação de transferrina e PCR antes de qualquer suplementação. Ferro suplementado sem indicação é hepatotóxico.'
  },
  fonte: 'ACSM/AND/DC Joint Position Stand 2016; Sim et al., Eur J Appl Physiol 2019 (hepcidina e exercício)',
  revisadoEm: '2026-07',
  pedeDado: 'Cadastre sua ferritina mais recente para eu avaliar transporte de oxigênio.'
},
{
  id: 'ferritina-limitrofe',
  categoria: 'micronutriente',
  severidade: 'atencao',
  prioridade: 60,
  requer: ['exames.ferritina', 'atleta.modalidade'],
  quando: e => e.exames.ferritina.v >= 30 && e.exames.ferritina.v < 45 && e.atleta.modalidade === 'endurance',
  conteudo: {
    titulo: 'Ferritina em {{exames.ferritina.v}} ng/mL — dentro da referência clínica, abaixo do ideal para endurance',
    mecanismo: 'A referência laboratorial comum considera deficiência abaixo de 15 a 30 ng/mL, porque foi construída para a população geral. Corredores perdem ferro por três vias somadas: hemólise de impacto na pisada, suor e microssangramento gastrointestinal.',
    noTreino: 'Nesta faixa você provavelmente não sente nada em rodagem, mas a reserva não sustenta um bloco de volume alto. É a faixa em que a queda aparece seis semanas depois, já como perda de pace no limiar.',
    correcao: 'Manter ferro heme em duas refeições semanais, leguminosa com fonte de vitamina C nas demais, e repetir o exame em 90 dias para saber a direção da curva — o valor isolado importa menos que a trajetória.'
  },
  fonte: 'ACSM/AND/DC 2016; Peeling et al., Sports Med 2008',
  revisadoEm: '2026-07'
},
{
  id: 'ferro-combinacao',
  categoria: 'micronutriente',
  severidade: 'info',
  prioridade: 30,
  requer: ['exames.ferritina', 'hoje.refeicaoTemFerroNaoHeme', 'hoje.refeicaoTemVitaminaC'],
  quando: e => e.exames.ferritina.v < 45 && e.hoje.refeicaoTemFerroNaoHeme && !e.hoje.refeicaoTemVitaminaC,
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
  quando: e => e.exames.magnesio.v < 2.0 && e.semana.caibras > 0,
  suprime: ['magnesio-baixo'],
  conteudo: {
    titulo: 'Magnésio em {{exames.magnesio.v}} mg/dL e {{semana.caibras}} episódio(s) de cãibra nesta semana',
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
  quando: e => e.exames.magnesio.v < 1.8,
  conteudo: {
    titulo: 'Magnésio no limite inferior — {{exames.magnesio.v}} mg/dL',
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
  quando: e => e.exames.vitaminaD.v < 20,
  suprime: ['vitd-insuficiente'],
  conteudo: {
    titulo: 'Vitamina D em {{exames.vitaminaD.v}} ng/mL — faixa de deficiência',
    mecanismo: 'A vitamina D age como hormônio, com receptores dentro da própria fibra muscular. Influencia força, potência e velocidade de contração das fibras tipo II, além de governar o remodelamento ósseo e a imunidade de mucosa.',
    noTreino: 'Queda documentada de desempenho neuromuscular, risco elevado de fratura por estresse em tíbia e metatarso, e mais infecções de vias aéreas justamente nas semanas em que o volume sobe. Perder dez dias de treino por um resfriado custa mais adaptação do que qualquer sessão isolada entrega.',
    correcao: 'Exposição solar de 15 a 20 minutos com braços e pernas descobertos, sardinha, gema de ovo.',
    encaminhar: 'Abaixo de 20 ng/mL há indicação de reposição orientada por médico, com dose e reavaliação definidas por ele.'
  },
  fonte: 'Owens et al., Sports Med 2018; Endocrine Society Clinical Practice Guideline',
  revisadoEm: '2026-07'
},
{
  id: 'vitd-insuficiente',
  categoria: 'micronutriente',
  severidade: 'serio',
  prioridade: 70,
  requer: ['exames.vitaminaD'],
  quando: e => e.exames.vitaminaD.v >= 20 && e.exames.vitaminaD.v < 32,
  conteudo: {
    titulo: 'Vitamina D em {{exames.vitaminaD.v}} ng/mL — insuficiente para atleta',
    mecanismo: 'Receptores de vitamina D existem no músculo esquelético e nas células de defesa das vias aéreas. A faixa alvo para atletas (40 a 60 ng/mL) é mais alta que a da população geral porque a demanda de remodelamento ósseo e de imunidade é maior.',
    noTreino: 'Abaixo de 30 ng/mL há perda mensurável de desempenho neuromuscular e maior incidência de infecção respiratória em blocos de volume alto. O osso responde pior à carga de impacto — terreno para fratura por estresse.',
    correcao: 'Sol de 15 a 20 minutos por dia sem protetor nos braços, sardinha e gema de ovo na rotina. Reavaliar em 90 dias; se não subir com exposição solar, conversar com seu médico sobre reposição.'
  },
  fonte: 'Owens et al., Sports Med 2018; ACSM/AND/DC 2016',
  revisadoEm: '2026-07'
},

/* ═══════════════════════ OUTROS MICRONUTRIENTES ════════════════════════ */
{
  id: 'b12-baixa',
  categoria: 'micronutriente',
  severidade: 'atencao',
  prioridade: 55,
  requer: ['exames.b12'],
  quando: e => e.exames.b12.v < 300,
  conteudo: {
    titulo: 'B12 em {{exames.b12.v}} pg/mL',
    mecanismo: 'Trabalha junto com o folato na eritropoiese — a formação de hemácias novas — e na manutenção da bainha de mielina.',
    noTreino: 'Fadiga que não melhora com descanso, formigamento em extremidades e, quando somada a ferro baixo, um gargalo duplo na produção de hemácias: falta o mineral e falta o cofator.',
    correcao: 'Carnes, ovos, laticínios e peixes. Em dieta vegetariana estrita, a suplementação é obrigatória — não existe fonte vegetal confiável.'
  },
  fonte: 'NIH ODS — Vitamin B12 Fact Sheet; ACSM/AND/DC 2016',
  revisadoEm: '2026-07'
},
{
  id: 'zinco-adequado',
  categoria: 'micronutriente',
  severidade: 'bom',
  prioridade: 10,
  requer: ['exames.zinco'],
  quando: e => e.exames.zinco.v >= 70,
  conteudo: {
    titulo: 'Zinco adequado — {{exames.zinco.v}} µg/dL',
    mecanismo: 'Participa da síntese proteica, da produção de testosterona e da integridade da mucosa intestinal.',
    noTreino: 'Sustenta o reparo de microlesões e a barreira intestinal. Atenção em blocos de calor: as perdas pelo suor derrubam esse valor em poucas semanas.',
    correcao: 'Manter carnes, sementes de abóbora, castanhas e leguminosas na rotina.'
  },
  fonte: 'NIH ODS — Zinc Fact Sheet',
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
  fonte: 'IOC Consensus Statement on RED-S, Br J Sports Med 2018 (atualizado 2023); Mountjoy et al.',
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
  fonte: 'IOC Consensus RED-S 2018; Loucks et al., J Sports Sci 2011',
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
  fonte: 'ISSN Position Stand: Protein and Exercise, JISSN 2017; Moore et al., J Gerontol 2015',
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
  fonte: 'ISSN Position Stand: Protein and Exercise, JISSN 2017',
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
}

];

if (typeof module === 'object' && module.exports) module.exports = BASE_REGRAS;
