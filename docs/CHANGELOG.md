# Changelog

## 2.1.0 — limpeza e tema interativo
- Temas: removidos `forge` e `dragon`; ficam `default` e `interactive` (fundo fluido: ponteiro, rolagem, troca de seção, abertura de projeto).
- Atributo do modo de cor renomeado de `data-theme` para `data-mode` (evita confusão com o tema visual).
- `main.js` dividido em `catalog.js`, `dock.js`, `admin.js` (mesmo comportamento).
- `sw.js`: lista de arquivos corrigida (antes apontava para arquivos inexistentes e a instalação falhava).
- Catálogo: removidos `_meta.json`, `frontier-advance.html` duplicado e pasta vazia; `Frontier-Advance` → `frontier-advance`; id corrigido; `GAME_IDS` fixo substituído pela tag `jogo`.
- Deploy agora falha se algum arquivo do catálogo não existir.
- Jogos: botão Voltar/Sair centralizado em `_shared/game-shell.*`; some dentro do modal; HUDs e conteúdo não ficam mais sob ele.
- Takamae Vesikika (mobile): tiro automático enquanto mira, sem botão de tiro; armas em coluna translúcida na lateral direita; layouts para paisagem e telas de 320px.
- Frontier Advance: controles de toque posicionados em qualquer largura; tela cheia fora do HUD.

## 2.0.6
- FAB de Nova Notation acima do Chat; recordes inicializam Firebase ao abrir o jogo direto; destruRace redesenhado; navegação "← Voltar"/"Sair do jogo" padronizada.
