# Rakino00 — revisão estrutural 2.0.7

## O que mudou nesta revisão
- Temas disponíveis reduzidos a `Default` e `Interativo`. O tema `Default` é a opção inicial; preferências antigas não reconhecidas voltam ao padrão.
- `Interativo` usa uma atmosfera escura neutra, gradientes discretos e transições suaves. Respeita `prefers-reduced-motion`.
- Takamae Vesikika no mobile: removido o botão dedicado de tiro; manter o dedo na área direita para mirar e disparar automaticamente. O direcional permanece no canto inferior esquerdo; seletor de armas passa para a lateral direita com fundo translúcido.
- Ajustes básicos de contenção para modais e conteúdo em telas estreitas.

## Mapa rápido do projeto
- `index.html`: estrutura principal do site.
- `assets/css/style.css`: componentes e layout global; regras compartilhadas devem ficar aqui, não dentro dos jogos.
- `assets/js/main.js`: inicialização, rotas e composição das seções.
- `assets/js/profile.js`: perfil, tema visual e preferências de cor.
- `assets/js/site-config.js`: configuração simples da marca/logo.
- `web-projects/<id>/index.html`: protótipo/jogo independente.
- `web-projects/<id>/metadata.md`: título, descrição, criadores, tags e arquivo de entrada.
- `data/web-projects.json`: catálogo gerado/consumido pelo site; evite editar manualmente se o fluxo de build o gera.

## Regras recomendadas para futuras alterações
1. Antes de alterar um jogo, identifique primeiro o HTML/HUD, depois CSS de layout, depois os handlers de entrada e por fim o loop de jogo.
2. Mantenha controles de toque dentro de uma zona definida, use `env(safe-area-inset-*)` e teste em largura de 320–390 px.
3. Não posicione controles só com coordenadas absolutas sem reservar espaço para HUD, teclado virtual e áreas seguras.
4. Respeite `prefers-reduced-motion`; animações devem ser decorativas e não esconder informação.
5. Evite adicionar outro tema por cópia de blocos CSS. Use variáveis compartilhadas e apenas diferenças específicas.
6. Faça uma alteração por vez e teste desktop + celular antes de empilhar mudanças.

## Limite desta revisão
Esta revisão reduz fontes de inconsistência e corrige a interação mobile identificada em Takamae. Ela não substitui testes manuais de cada jogo em dispositivos reais nem uma refatoração completa de todos os arquivos.
