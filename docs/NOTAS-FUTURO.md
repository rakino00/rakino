# Rakino — notas para o futuro (melhorias e críticas)

Escrito com franqueza: o que ficou de fora, onde eu tomei uma decisão por você e o que eu mudaria.

## 0. Estado da revisão atual

Nesta revisão do diretório entregue:

- JavaScript dos módulos principais foi validado com `node --check`.
- JavaScript embutido do `RakinoFood.html` foi validado com `node --check`.
- JSON de `data/web-projects.json`, `web-projects/_meta.json` e `manifest.webmanifest` foi validado.
- `tools/gerar_manifest.py` foi validado com `py_compile`.
- O workflow `.github/workflows/pages.yml` foi validado como YAML.
- Todos os Web Projects HTML presentes foram verificados quanto à existência de `<title>`.
- O manifest foi regenerado depois da inclusão do RakinoFood.
- Artefatos `__pycache__`/`.pyc` foram removidos do diretório e adicionados ao `.gitignore`.

Não foi possível considerar como teste completo nesta revisão:

- login Google contra o Firebase real;
- regras do Firestore contra o projeto real;
- teste visual em Chrome/Safari/Firefox físicos;
- teste real em Android/iPhone;
- desempenho 3D em hardware físico;
- deploy efetivo no GitHub Pages.

Portanto, a validação acima é **estática**, não uma promessa de que todos os ambientes reais foram testados.

## 1. Decisões que tomei por você (revise)

1. **Firebase (Auth + Firestore, plano Spark)** como "banco gratuito". Era a opção que dá login Google e
   dados por usuário sem servidor próprio. Alternativas: Supabase (o plano gratuito pausa projetos inativos —
   confira a política atual) ou só `localStorage` (grátis de verdade, mas sem sincronizar entre aparelhos).
2. **Qualquer conta Google pode entrar**, e cada uma tem as próprias notations privadas. Se você quer que
   *só você* entre, o caminho é uma lista de e-mails permitidos na regra do Firestore
   (`request.auth.token.email == 'seu@email.com'`) e um bloqueio equivalente na interface.
3. **As fotos de exemplo do upload antigo não foram para o site público.** Eram arte de um jogo com
   direitos autorais; ficaram só em `_legado-php/uploads/`. Use imagens suas ou com licença livre.
4. **Visitante = Web Projects + Experiences** (o que você pediu). Início também é liberado, mas só mostra esses dois.
5. **Modal de projeto usa `iframe`** (ampliar abre a página inteira).

## 2. Críticas honestas

- **"Área restrita" no front-end não é segurança.** Tech, Games, Experiences e a aba Python são JSON/HTML
  públicos no repositório; o bloqueio é só de interface. **Só as Notations são realmente protegidas**
  (regras do Firestore). Regra prática: nunca coloque no repositório nada que precise ser privado.
- **PHP não roda no GitHub Pages.** Web Projects `.php` só mostram um aviso. Se um projeto realmente
  precisa de PHP, o caminho é reescrever em JavaScript (recomendo, para ele rodar no portfólio) ou hospedar
  em outro lugar (as hospedagens PHP gratuitas costumam ter limites e pouca confiabilidade).
- **Dependência do Google.** Login e dados ficam presos ao Firebase. Vale exportar backup (ver §3).
- **`sandbox="allow-scripts allow-same-origin"` no iframe** é necessário para os projetos funcionarem
  (localStorage etc.), mas anula boa parte do isolamento. **Só publique código seu** em `web-projects/`.
- **O `acordePlus.html` desativa o zoom** (`user-scalable=no`, `maximum-scale=1`), o que prejudica
  acessibilidade. Não mexi porque é seu projeto; recomendo remover.
- **Projetos ampliados não têm botão "voltar ao Rakino"**; depende do botão voltar do navegador.
  Dá para gerar um link flutuante automaticamente no `gerar_manifest.py`.
- **Sem painel admin.** Editar conteúdo = editar JSON no GitHub. Funciona, mas é fácil errar uma vírgula.
  Opções gratuitas: Decap CMS, ou uma página admin que use a API do GitHub (cuidado ao guardar token no navegador).
- **README de Tech/Games aparece como texto puro**, sem Markdown renderizado.
- **Sem foco preso (focus trap) nos modais** e sem revisão completa de contraste/leitor de tela.
- **Dock com 5 ícones atualmente** é confortável em telas pequenas. O radial de desktop foi separado da navegação principal para não aumentar a barra.
- **Cache do service worker (stale-while-revalidate)**: após deploy, a primeira abertura pode mostrar a versão antiga.
- **Sem testes automatizados no repositório.** Os testes que fiz foram manuais/descartáveis.
- **"Nativo" aqui significa PWA.** É o mais próximo de app nativo que dá de graça; app de loja
  (Play Store/App Store) exigiria outro projeto e contas pagas (Apple, principalmente).

## 3. Melhorias para as Notations (uso diário — prioridade máxima)

Ordem sugerida:
1. **Desfazer** (toast "Excluída — Desfazer") e/ou lixeira: hoje excluir é definitivo.
2. **Exportar/Importar JSON** (backup em um toque).
3. **Adicionar rápido**: campo fixo no topo para digitar e dar Enter (título só), detalhes depois.
4. **Gestos**: arrastar para concluir/excluir.
5. **Busca** e **tags/projetos**; visão "Hoje / Amanhã / Semana".
6. **Recorrência** (diária, semanal) e **subtarefas**.
7. **Lembretes**: push de verdade precisa de servidor (Cloud Functions = plano pago). Alternativas gratuitas:
   avisos locais enquanto o app está aberto, exportar `.ics`, ou botão "adicionar ao Google Agenda".
8. Ordenação manual (arrastar) e fixar itens no topo.

## 4. Melhorias no site

- **Aba Python:** dá para rodar Python **no navegador, de graça**, com Pyodide — demos reais no portfólio,
  bem mais convincente que só texto. Para o app de automação (pyautogui) isso não serve (é desktop), mas
  vale mostrar código, prints e um vídeo curto.
- **Capas automáticas dos Web Projects:** um passo no GitHub Action com Playwright tira um screenshot de
  cada página e usa como `cover`. Fica muito mais bonito.
- **Listar repositórios do GitHub** automaticamente na aba Tech (API pública, sem custo).
- Página "Sobre mim", links (GitHub/LinkedIn), imagem Open Graph e `sitemap`, para o portfólio render em recrutadores.
- Analytics gratuito e sem cookies (GoatCounter ou Cloudflare Web Analytics).
- Tema claro/escuro e opção de reduzir animações (já respeitamos `prefers-reduced-motion`).
- Domínio próprio (opcional, custo anual pequeno): dá um ar mais profissional que `github.io`.
- CI: rodar os testes com Playwright a cada push, antes de publicar.

## 5. Pendências técnicas pequenas

- `Notes.openEditor` empurra uma entrada no histórico para o botão voltar fechar o formulário; se a URL
  estiver vazia, usa `#/notations`. Vale revisar se você adicionar novos pontos de entrada.
- Ícones do PWA são simples (estrela ciano em fundo roxo). Troque `assets/img/icon-*.png` e `icon.svg` pelo seu logo.
- Datas das notations são texto `AAAA-MM-DD` no fuso do aparelho (de propósito, para "atrasada" não virar o dia em UTC).
