# Changelog

## 2.1.1 — unificação com a revisão 2.0.7
- A revisão 2.0.7 (tema interativo em CSS puro + Takamae mobile) foi absorvida: mantida a versão com fundo canvas interativo; incorporados o `lostpointercapture` no Takamae e a guarda de largura no celular.
- `Frontier-Advance` mantém o nome com maiúsculas (evita problema de renomeação só de caixa no Git do Windows).
- Removido `docs/REVISAO-2.0.7.md` (conteúdo útil está neste changelog e no README).

## 2.1.0 — limpeza e tema interativo
- Temas: removidos `forge` e `dragon`; ficam `default` e `interactive` (fundo fluido: ponteiro, rolagem, troca de seção, abertura de projeto).
- Atributo do modo de cor renomeado de `data-theme` para `data-mode` (evita confusão com o tema visual).
- `main.js` dividido em `catalog.js`, `dock.js`, `admin.js` (mesmo comportamento).
- `sw.js`: lista de arquivos corrigida (antes apontava para arquivos inexistentes e a instalação falhava).
- Catálogo: removidos `_meta.json`, `frontier-advance.html` duplicado e pasta vazia; id `fontier-advance` corrigido para `frontier-advance`; `GAME_IDS` fixo substituído pela tag `jogo`.
- Deploy agora falha se algum arquivo do catálogo não existir.
- Jogos: botão Voltar/Sair centralizado em `_shared/game-shell.*`; some dentro do modal; HUDs e conteúdo não ficam mais sob ele.
- Takamae Vesikika (mobile): tiro automático enquanto mira, sem botão de tiro; armas em coluna translúcida na lateral direita; layouts para paisagem e telas de 320px.
- Frontier Advance: controles de toque posicionados em qualquer largura; tela cheia fora do HUD.

## 2.0.6
- FAB de Nova Notation acima do Chat; recordes inicializam Firebase ao abrir o jogo direto; destruRace redesenhado; navegação "← Voltar"/"Sair do jogo" padronizada.
