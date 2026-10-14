# Rakino

Site pessoal estático (GitHub Pages + Firebase para login, notas, chat e recordes).

## Onde mexer em quê

| Quero…                                   | Arquivo |
|------------------------------------------|---------|
| Adicionar/editar um projeto no catálogo  | `web-projects/<pasta>/metadata.md` (o deploy gera `data/web-projects.json`) |
| Marcar algo como jogo (abre em página própria + mostra recorde) | tag `jogo` no `metadata.md` |
| Mudar o fundo interativo                 | `assets/js/background.js` (constantes no topo) + bloco "Tema interactive" no fim de `assets/css/style.css` |
| Mudar o tema inicial / listar temas      | `assets/js/profile.js` (`DEFAULT_THEME`, `THEMES`) |
| Botão "← Voltar" / "Sair" dos jogos      | `web-projects/_shared/game-shell.css` (um só lugar) |
| Abas, rotas, login                       | `assets/js/main.js` |
| Cards e carregamento do catálogo         | `assets/js/catalog.js` |
| Dock inferior e menu radial              | `assets/js/dock.js` |
| Painel admin                             | `assets/js/admin.js` |

## Regras para os jogos
- Prefira pasta em **minúsculas-com-hífen** (GitHub Pages diferencia maiúsculas; nunca renomeie só trocando a caixa no Windows).
- No `<head>`: `<link rel="stylesheet" href="../_shared/game-shell.css"><script src="../_shared/game-shell.js"></script>` e `<a class="rakino-home" href="../../index.html#/web">← Voltar</a>`.
- HUD começa abaixo de ~58px (o botão Voltar ocupa o canto superior esquerdo).
- Teste em 390×780, 844×390 e 320×568; controles de toque devem usar `env(safe-area-inset-*)`.
- Pastas/arquivos começando com `_` são ignorados pelo gerador de catálogo.

## Temas
Só `default` e `interactive`. Modo claro/escuro é independente (`data-mode`); o tema visual é `data-rakino-theme`.


## Firebase e diagnóstico

Veja [`docs/FIREBASE-CHECKLIST.md`](docs/FIREBASE-CHECKLIST.md) para configurar domínios, publicar as regras do Firestore e entender como funcionam chat, recordes, RakinoFood e Minha Vida. Lembre-se: enviar `firestore.rules` ao GitHub não publica automaticamente as regras no Firebase Console.
