# Frontier Advance — Tower Advance 3D

Protótipo local feito com HTML, CSS, JavaScript modular e Three.js. **Singleplayer nesta versão**; multiplayer, salas/convites e recordes online não estão implementados. Os recordes ficam no `localStorage` deste navegador.

## Executar
Use VS Code + Live Server ou `python -m http.server 8000` e acesse `http://localhost:8000`. Não abra via `file://`: módulos JavaScript e Three.js via CDN exigem servidor HTTP e internet na primeira carga.

## Controles
PC: WASD mover, clique no jogo para capturar o mouse, mouse olhar livremente na horizontal e vertical, Espaço pular, Shift impulso, E ataque básico, 1/2 habilidades, Q ultimate. Android/tablet: joystick compacto à esquerda; arraste o lado direito da área de jogo para mirar em ambos os eixos; botões compactos à direita. O layout adapta-se a retrato e paisagem.

## Organização
- `js/systems/characters.js`: HP, ataque, defesa, velocidade, alcance e classes.
- `js/systems/Game.js`: mundo 3D, torres, ondas, combate, inimigos e câmera.
- `js/systems/Input.js`: teclado, mouse e joystick.
- `js/systems/Records.js`: recordes locais.
- `css/style.css`: interface responsiva.
- `assets/models/characters`, `assets/models/enemies`, `assets/models/environment`: modelos GLB separados para substituir as formas provisórias.
- `assets/textures`, `assets/audio`: texturas e sons.

## Blender → Three.js
Exporte personagens/props como **glTF Binary (.glb)**. Aplique Rotation & Scale (`Ctrl+A`), use nomes como `hero-warrior.glb`, `hero-mage.glb`, `hero-archer.glb`, e coloque na pasta adequada. Depois integre com `GLTFLoader` no `Game.js`. Os meshes atuais são formas geométricas temporárias. A câmera agora é em primeira pessoa (FPS), com pitch/yaw, colisão contra árvores/torres/unidades, dano recebido por lacaios e monstros, e impulso mais rápido.

## Regras incluídas
- Escolha Guerreiro, Arqueiro ou Mago.
- Hordas progressivas: a primeira tem 1 inimigo, a segunda 2, depois 3 e assim sucessivamente. A próxima horda começa após eliminar a horda atual, com aviso breve e sem pausa.
- O herói nasce ao lado da torre aliada; ataques básicos não têm recarga.
- Armas em primeira pessoa por classe: espadas duplas, arco e flecha, ou livro mágico. Ataques e projéteis têm colisão.
- Joystick e botões touch em dispositivos com tela tátil; botão compacto de tela cheia.
- Inimigos de floresta perseguem ao chegar perto.
- Vitória ao destruir a torre inimiga; derrota ao perder a torre aliada ou o herói.
- Recordes locais de pontuação.
\n\n## Combate visual\nCrosshair central, barras de vida flutuantes para unidades e torres, efeitos de impacto/partículas, habilidades com cores e formas distintas, e disparos da torre inimiga que priorizam aliados vivos próximos; sem aliados vivos, a torre pode alvejar o herói quando ele entra no alcance.\n

## Atualização visual e de rotas
- Cinco rotas paralelas com marcadores de borda.
- Unidades aliadas e inimigas quadrúpedes estilizadas com quatro pernas cilíndricas animadas.
- Projéteis do jogador menores e mais rápidos.
- Indicadores numéricos de recarga nas habilidades 1–4.
- Nuvens animadas e montanhas low-poly no horizonte.
- Disparos de torre com projéteis, clarão e efeito de disparo.


## Correções e melhorias desta revisão
- Corrigido o erro de interface `Cannot set properties of null (setting 'textContent')`: a atualização tentava escrever em `#timer`, elemento que não existe no HTML. As atualizações de texto e barras agora verificam a existência dos elementos antes de alterá-los.
- Ajustes de desempenho para dispositivos móveis: antialiasing desativado em telas com ponteiro de toque e limite de pixel ratio mais conservador; mantém resolução responsiva ao redimensionar.
- Inimigos da floresta agora são criaturas voadoras sem patas, com asas animadas, alturas variadas e perseguição aérea limitada a uma faixa de altura visível.
- Ao concluir uma horda, surge uma relíquia dourada brilhante. Ela fica no mapa por 5 segundos; coletá-la restaura todas as recargas e recupera 10% da vida máxima da torre aliada. Se a torre já estiver com vida cheia, ela brilha em dourado até a conclusão da horda seguinte.
- Se a relíquia não for coletada, ela desaparece e a próxima horda começa após um breve intervalo. O tamanho da horda continua aumentando progressivamente.
- A HUD agora mostra também a vida da torre aliada e um indicador de tempo da relíquia.
- Corrigido o feedback de dano em inimigos compostos por grupos 3D; a mudança de material agora percorre os meshes internos sem acessar propriedades inexistentes.
- Corrigido o descarte dos listeners de teclado do sistema de entrada, evitando acumular listeners ao reiniciar partidas.
- A interface recebeu refinamentos de contraste, feedback de botões e destaque animado para a relíquia.

### Verificação
Os módulos JavaScript passaram na verificação sintática do Node.js (`node --check`). O projeto usa Three.js via CDN, portanto a execução completa requer internet e servidor HTTP local. Não foi possível validar comportamento real em aparelhos físicos nesta sessão; recomenda-se testar toque, rotação de tela e coleta da relíquia no navegador mobile.
