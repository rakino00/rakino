# Rakino 2.0.6 — revisão de consolidação

## Diretórios oficiais

O catálogo oficial (`data/web-projects.json`) aponta para estes caminhos:

- `web-projects/acorde-plus/`
- `web-projects/minha-vida/`
- `web-projects/rakino-food/`
- `web-projects/rakino-race/`
- `web-projects/takamae-vesikika/`
- `web-projects/puzzle-suffers/`

As cópias com maiúsculas, camelCase ou nomes antigos foram removidas depois de comparar seus arquivos. A cópia de `RakinoFood` não era a correta: ela apontava o import do Firebase para `../assets/js/auth.js`; a versão oficial usa `../../assets/js/auth.js`.

## Jogos

`rakino-race`, `takamae-vesikika` e `puzzle-suffers` agora abrem diretamente em página completa pelo card. Os recordes públicos usam `gameRecords/<id>` no Firestore. Somente usuários autenticados gravam recordes online; visitantes continuam jogando normalmente.

O Saltador mantém o recorde local/online que já existia.

## Logo

A logo de uso geral do site está em `assets/img/logo.png`. Para trocar a imagem sem editar HTML, substitua esse arquivo. Para GIF no futuro, altere `assets/js/site-config.js`.

## Push

O ZIP de entrega não inclui `.git/`. Não apague nem substitua a pasta `.git` do seu repositório local. Extraia/substitua apenas os arquivos do projeto e depois confira o diff no GitHub Desktop antes do commit.
