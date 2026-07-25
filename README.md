# ATLETA

App pessoal de nutrição para performance. Traduz combustível, micronutrientes
e eixo intestino–cérebro em **consequência de treino** — nunca em peso ou
estética.

- **Local-first**: todos os dados moram no aparelho. Sem conta, sem servidor,
  sem rede. Nada sai do seu celular.
- **Sem IA paga**: a camada de julgamento é um motor de regras determinístico,
  auditável e com fonte citada em cada regra.
- **Instalável**: PWA. Roda offline depois de aberto uma vez.

## Estrutura

```
app/                     ← o PWA (é só isto que vai ao ar no Pages)
  index.html             casca, 3 abas
  manifest.webmanifest   identidade do app instalado
  sw.js                  service worker (offline + instalabilidade)
  js/
    motor-regras.js      o avaliador — não contém conteúdo de saúde
    base-regras.js       as regras: limiar, fonte, data de revisão
    armazenamento.js     persistência local + backup exportar/importar
    app.js               telas e ligação com o motor
  icones/                PNGs gerados por código

motor/bancada.html       ferramenta de autoria: edite regras e veja o efeito
ferramentas/
  gerar-icones.js        regera os ícones (PNG puro, sem dependência)
  servidor.js            servidor local de desenvolvimento
simulacao-app.html       mockup de alta fidelidade das telas ainda não portadas
```

O motor vive em `app/js/` como fonte única — a bancada aponta para lá, então
editar uma regra atualiza o app e a bancada ao mesmo tempo.

## Rodar localmente

Service worker exige `localhost` ou HTTPS — abrir o `index.html` com duplo
clique (`file://`) não registra o SW nem oferece instalação.

```bash
node ferramentas/servidor.js
```

Abra <http://localhost:8080>.

## Publicar uma atualização

1. Edite o que precisar (uma regra em `app/js/base-regras.js`, uma tela…).
2. **Se mudou qualquer arquivo do app**, bump o `VERSAO` em `app/sw.js`
   (`atleta-v1` → `atleta-v2`). Sem isso, quem já instalou fica preso na
   versão antiga.
3. `git commit` e `git push`. O GitHub Actions republica sozinho.

## Instalar no celular

- **Android / Chrome**: botão "Instalar" no topo, ou menu → Instalar app.
- **iPhone**: só pelo **Safari** → Compartilhar → *Adicionar à Tela de Início*.
  A Apple não expõe o botão de instalação; este é o único caminho.

## Aviso

Conteúdo educativo baseado em literatura de nutrição esportiva. **Não
diagnostica, não prescreve e não substitui médico ou nutricionista.** Os
limiares vêm de consensos para atletas e podem não servir a todo caso.
