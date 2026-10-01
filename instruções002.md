# Rakino — atualização 002

Esta versão parte do projeto Rakino já existente e foi preparada para ser usada com **GitHub Desktop + GitHub Pages + Firebase**.

## O que foi alterado

### 1. Seções mantidas
O site agora mantém somente:

- **Início**
- **Web Projects**
- **Notations**
- **Python**

Foram removidas da interface e do projeto:

- Experiences
- Tech
- Games

Os arquivos JSON dessas três áreas também foram removidos.

### 2. Python com Pyodide

A aba **Python** agora possui um laboratório executável no navegador.

- Usa **Pyodide** carregado pelo CDN oficial do projeto.
- Não exige instalação do Python no computador do visitante.
- Permite escrever código Python e executar.
- Mostra a saída e erros.
- Inclui exemplos básicos.

O arquivo responsável é:

`assets/js/python.js`

Observação: como o Pyodide é carregado pela internet, a primeira execução precisa de conexão. Depois que o navegador carregar os recursos, o comportamento pode variar conforme o cache/PWA.

### 3. Capas automáticas dos Web Projects

Os Web Projects agora recebem uma capa automática gerada pelo próprio JavaScript usando:

- título do projeto;
- emoji/ícone;
- tags;
- identidade visual do Rakino.

Não é necessário criar uma imagem para cada projeto.

Se no futuro você colocar `cover` no cadastro de um projeto, a imagem cadastrada pode continuar sendo usada no lugar da capa automática.

### 4. Tema claro/escuro

Foi adicionado um botão no topo do site.

- 🌙 = tema escuro
- ☀️ = tema claro

A preferência fica salva no navegador usando `localStorage`.

### 5. Painel do administrador

O painel **Admin** só aparece para a conta Google cujo e-mail seja exatamente:

`rakifernn@gmail.com`

O login continua sendo feito pelo **Google/Firebase Authentication**.

No painel é possível:

- cadastrar Web Projects;
- editar Web Projects;
- excluir Web Projects;
- importar os projetos existentes de `data/web-projects.json` para o Firestore.

Os Web Projects passam a poder ser armazenados na coleção:

`webProjects`

O público pode ler essa coleção, mas somente o e-mail administrativo pode criar, alterar ou excluir documentos.

### 6. Segurança do Firestore

`firestore.rules` foi atualizado.

As regras continuam protegendo as Notations para que cada usuário veja apenas as próprias Notations.

Para Web Projects:

- leitura: pública;
- criação: somente `rakifernn@gmail.com`;
- alteração: somente `rakifernn@gmail.com`;
- exclusão: somente `rakifernn@gmail.com`.

> Importante: regras do Firestore precisam ser publicadas no Firebase Console para entrarem em vigor.

---

# Como atualizar usando GitHub Desktop

## Opção recomendada

### 1. Faça backup

Antes de substituir os arquivos, faça uma cópia da sua pasta atual do projeto Rakino.

Por exemplo:

`Rakino-backup`

Isso permite voltar facilmente à versão anterior.

### 2. Extraia o ZIP

Extraia o conteúdo deste ZIP.

A pasta principal contém:

- `index.html`
- `assets/`
- `data/`
- `web-projects/`
- `firestore.rules`
- `instruções002.md`
- etc.

### 3. Abra a pasta do repositório pelo GitHub Desktop

No GitHub Desktop:

**File → Add local repository**

Selecione a pasta do seu repositório Rakino.

Se o repositório já estiver configurado no GitHub Desktop, não é necessário adicioná-lo novamente.

### 4. Substitua os arquivos

Copie os arquivos desta atualização para dentro do repositório Rakino, substituindo os arquivos antigos.

Não copie uma pasta `.git` de outro projeto.

O GitHub Desktop deve identificar as alterações automaticamente.

### 5. Confira as alterações

No GitHub Desktop, verifique a lista de arquivos modificados.

Você deverá encontrar alterações principalmente em:

- `index.html`
- `assets/css/style.css`
- `assets/js/main.js`
- `assets/js/ui.js`
- `assets/js/python.js`
- `firestore.rules`
- `manifest.webmanifest`
- `sw.js`

E remoções de:

- `data/experiences.json`
- `data/tech.json`
- `data/games.json`

### 6. Faça um commit

Sugestão de mensagem:

`Atualização 002 - Python Pyodide, temas, Web Projects e Admin`

Clique em:

**Commit to main**

Depois:

**Push origin**

---

# Configuração do Firebase

A configuração do projeto já existente foi preservada em:

`assets/js/firebase-config.js`

Ela aponta para o projeto Firebase já utilizado pelo Rakino.

## Authentication

No Firebase Console:

**Authentication → Sign-in method**

Confirme que:

**Google**

está habilitado.

## Domínio do GitHub Pages

Em:

**Authentication → Settings → Authorized domains**

confirme que o domínio usado pelo site está autorizado.

Para o projeto atual, o domínio é:

`rakino00.github.io`

## Firestore

No Firebase Console:

**Firestore Database → Rules**

Substitua as regras pelas regras presentes em:

`firestore.rules`

Depois clique para publicar.

---

# Primeiro acesso ao painel Admin

1. Abra o site publicado.
2. Clique em **Entrar**.
3. Entre usando o Google com:

`rakifernn@gmail.com`

4. Depois do login, aparecerá a opção:

**Admin**

5. Abra Admin.
6. Clique em:

**Importar JSON atual**

Isso copia os Web Projects existentes em:

`data/web-projects.json`

para a coleção Firestore:

`webProjects`

Depois disso, o painel passa a administrar os projetos pelo Firebase.

---

# Adicionando um novo Web Project

No painel Admin:

**+ Novo Web Project**

Preencha:

- **ID** — identificador único, por exemplo `meu-projeto`;
- **Título** — nome exibido;
- **Arquivo HTML** — por exemplo `web-projects/meu-projeto.html`;
- **Descrição**;
- **Ícone/emoji**;
- **Tags**;
- **Ordem**.

Depois salve.

### Importante

O painel administra os **dados do projeto**, mas não envia arquivos HTML para o GitHub.

O arquivo HTML do projeto deve ser colocado normalmente no repositório usando o fluxo que você já utiliza com o GitHub Desktop.

Exemplo:

`web-projects/meu-projeto.html`

Depois faça:

**Commit → Push origin**

---

# Como funciona a capa automática

Se um projeto não possuir uma imagem `cover`, o site gera automaticamente uma capa baseada nos dados cadastrados.

Exemplo:

```json
{
  "id": "acordeplus",
  "title": "Círculo das Quintas",
  "file": "web-projects/acordePlus.html",
  "description": "Roda interativa das tonalidades.",
  "icon": "🎸",
  "tags": ["música", "SVG"]
}
```

O site gera a capa automaticamente.

---

# Notations

As Notations continuam usando:

`users/{uid}/notations/{id}`

Cada usuário autenticado continua tendo acesso somente às próprias Notations.

A funcionalidade de criar, editar, concluir e excluir Notations foi preservada.

---

# Python / Pyodide

A execução acontece no navegador.

Exemplo:

```python
nome = "Rakino"
print("Olá,", nome)
```

Clique em:

**Executar**

O resultado aparece no quadro de saída.

Não é necessário instalar Python no Windows para utilizar essa área.

---

# Se o site continuar mostrando a versão antiga

Como o projeto possui PWA/service worker, o navegador pode manter arquivos antigos em cache.

Nesta atualização o cache foi alterado para:

`rakino-v2`

Se ainda aparecer uma versão antiga:

1. Feche o site.
2. Abra novamente.
3. Faça um recarregamento forçado (`Ctrl + F5`).
4. Se necessário, remova os dados/cache do site e abra novamente.

---

# Ordem recomendada para testar

Depois do Push:

1. Abra o site como visitante.
2. Confirme que aparecem somente:
   - Início
   - Web Projects
   - Notations
   - Python
3. Abra um Web Project.
4. Confirme a capa automática.
5. Alterne entre tema claro e escuro.
6. Abra Python.
7. Execute um exemplo.
8. Faça login com Google.
9. Confirme que Notations continuam funcionando.
10. Confirme que **Admin** aparece somente para `rakifernn@gmail.com`.
11. Abra Admin.
12. Importe o JSON atual.
13. Cadastre um projeto de teste.
14. Verifique o projeto como visitante.
15. Exclua o projeto de teste.

---

# Observação sobre GitHub Desktop

O GitHub Desktop continua sendo usado para:

- adicionar arquivos;
- alterar HTML/CSS/JS;
- adicionar novos Web Projects;
- criar commits;
- enviar as alterações para o GitHub.

O painel Admin/Firebase é usado principalmente para administrar os **dados e metadados dos Web Projects**.

Assim, você não precisa abandonar o fluxo atual de desenvolvimento pelo GitHub Desktop.

## Rakino Race — novo Web Project

### O que foi adicionado

O projeto `web-projects/rakino-race.html` é uma corrida infinita 2D/2.5D feita em Canvas, sem necessidade de modelos externos.

- velocidade aumenta gradualmente;
- três faixas de corrida;
- munição obtida ao atravessar zonas luminosas;
- tiros reduzem temporariamente a velocidade do adversário;
- corrida sem fim, adequada para celular e PC;
- login Google obrigatório para multiplayer;
- criação de sala e entrada por código/link de convite;
- até 4 pilotos é a configuração recomendada para esta primeira versão;
- sincronização dos jogadores usa Firebase Firestore + WebRTC poderá ser adicionada numa etapa posterior; esta versão usa sincronização Firebase simples, priorizando facilidade de implementação.

### Como colocar no GitHub Desktop

1. Extraia o ZIP desta atualização.
2. Copie o conteúdo da pasta `rakino` para a pasta local do seu repositório.
3. Abra o GitHub Desktop.
4. Confira as alterações.
5. Faça um commit, por exemplo: `Adiciona Rakino Race multiplayer`.
6. Clique em **Push origin**.
7. Aguarde o GitHub Pages publicar a alteração.
8. Abra o site Rakino e entre com Google.
9. Vá em **Web Projects** e abra **Rakino Race**.

### Firebase / Firestore

As regras desta atualização incluem `raceRooms`, jogadores e eventos de tiro. No Firebase Console, abra **Firestore Database → Rules**, substitua as regras pelas do arquivo `firestore.rules` e publique.

O jogo usa o mesmo Firebase do site. Não crie outro projeto Firebase.

### Convites

O botão **Copiar convite** cria um link parecido com:

`https://SEU-USUARIO.github.io/rakino/web-projects/rakino-race.html?room=ABC123`

Envie esse link para outro usuário que também tenha feito login com Google no Rakino. Ao abrir o link, ele poderá entrar diretamente na sala.

### Capas e modelos de carros/pistas

A primeira versão não precisa de arquivos de modelos. Isso facilita testar e publicar o jogo imediatamente.

Se você quiser transformar a corrida em 3D depois, recomendo usar **GLB/glTF (`.glb` ou `.gltf`)** para carros e elementos da pista. É o formato mais conveniente para navegador. Texturas normalmente podem ser `.png`, `.jpg` ou `.webp`.

Também é possível trabalhar com `.obj`, mas GLB/glTF é preferível para o projeto web. Arquivos `.fbx` normalmente devem ser convertidos antes de serem usados no navegador.

Para os carros, o ideal é um modelo com:

- rodas separadas ou identificáveis;
- origem/pivô central bem definido;
- escala consistente;
- poucas dezenas de milhares de triângulos para manter o jogo leve;
- texturas pequenas e comprimidas.

Para a pista, o ideal é um modelo modular ou dividido em segmentos. Assim podemos gerar uma pista infinita juntando segmentos durante a corrida, em vez de carregar uma pista enorme.

### Próxima evolução possível

A estrutura atual foi feita para que o jogo possa evoluir para:

1. carros 3D reais;
2. pista 3D modular infinita;
3. skins selecionáveis;
4. placar e recordes;
5. salas privadas;
6. lista de amigos/convites dentro do Rakino;
7. WebRTC para reduzir a quantidade de dados enviados ao Firebase;
8. efeitos de colisão e itens adicionais.

---

# Atualização 003 — Jogos 3D

## 1. O que foi alterado

Esta versão substitui o **Rakino Race** em visão superior por uma versão **3D em terceira pessoa** e acrescenta um segundo projeto independente chamado **Aim Arena 3D**.

Os dois jogos funcionam sem modelos 3D externos nesta primeira versão. Isso facilita testar e publicar pelo GitHub Pages antes de trocar os objetos provisórios por modelos próprios.

### Projetos adicionados/alterados

- `web-projects/rakino-race.html`
  - Corrida infinita em terceira pessoa.
  - Câmera atrás do carro.
  - Pista 3D.
  - Velocidade aumenta gradualmente.
  - Troca entre três faixas.
  - Munição.
  - Tiros que reduzem temporariamente a velocidade do adversário.
  - Zonas azuis de recarga.
  - Multiplayer por Firebase/Firestore.
  - Salas com código e convite por link.
  - Login Google da página Rakino é utilizado para identificar o jogador.

- `web-projects/aim-arena-3d.html`
  - Jogo independente de treino de mira em terceira pessoa.
  - Arena fechada.
  - Bolas móveis que ricocheteiam nas paredes.
  - Cada acerto remove uma bola durante 10 segundos.
  - Depois dos 10 segundos, o reaparecimento gera duas bolas.
  - Contador de acertos durante 60 segundos.
  - Contador de acertos considerados perfeitos: acertar a bola até 2 segundos depois de seu aparecimento.
  - Reinício do treino sem recarregar a página.

## 2. Como atualizar usando GitHub Desktop

1. Feche a versão antiga do site no navegador.
2. Faça uma cópia da pasta atual do seu repositório como backup.
3. Extraia `rakino-atualizacao004.zip`.
4. Abra a pasta extraída e entre na pasta `rakino`.
5. Copie os arquivos dessa pasta para a pasta local do seu repositório GitHub.
6. Quando o Windows perguntar, escolha substituir os arquivos existentes.
7. Não copie uma pasta `.git` para dentro do repositório. Este ZIP não deve substituir o histórico Git existente.
8. Abra o GitHub Desktop.
9. Confira a lista de alterações.
10. Faça um commit, por exemplo:

   `Atualização 003 - jogos 3D`

11. Clique em **Push origin**.
12. Aguarde o GitHub Pages publicar a nova versão.

## 3. Como testar o Rakino Race 3D

1. Entre na página Rakino.
2. Faça login usando Google.
3. Abra **Web Projects**.
4. Abra **Rakino Race 3D**.
5. Clique em **Criar corrida**.
6. Copie o convite.
7. Outro usuário precisa estar autenticado com Google e abrir o convite.
8. O anfitrião clica em **Iniciar**.
9. Os jogadores passam a aparecer na mesma sala.

### Controles

PC:

- `A` ou `←` — faixa esquerda.
- `D` ou `→` — faixa direita.
- `Espaço` — disparar.

Celular:

- Botões inferiores para trocar de faixa.
- Botão circular para disparar.

## 4. Firebase do multiplayer

O Rakino Race usa as seguintes estruturas do Firestore:

```text
raceRooms/{roomId}
raceRooms/{roomId}/players/{uid}
raceRooms/{roomId}/shots/{shotId}
```

As regras já incluídas em `firestore.rules` permitem:

- usuários autenticados criarem salas;
- o anfitrião alterar o estado da sala;
- jogadores autenticados atualizarem apenas seus próprios dados;
- jogadores autenticados lerem os jogadores da sala;
- jogadores autenticados criarem eventos de tiro identificados pelo próprio UID.

Se você já publicou as regras da versão anterior, publique novamente o arquivo `firestore.rules` caso tenha feito alterações no Firebase depois dela.

## 5. Como testar o Aim Arena 3D

1. Abra **Web Projects**.
2. Abra **Aim Arena 3D**.
3. Clique em **Começar treino**.
4. Mire pelo centro da tela.
5. Clique com o botão esquerdo do mouse para disparar.
6. No celular, use o botão de disparo.
7. O treino dura 60 segundos.
8. O placar mostra quantas bolas foram atingidas.
9. `Bônus perfeito` conta os acertos feitos até 2 segundos após o aparecimento da bola.

## 6. Sobre modelos 3D personalizados

A versão atual usa modelos geométricos criados pelo próprio código. Portanto, nenhum arquivo 3D é obrigatório.

Quando você quiser substituir os carros ou criar uma pista visualmente mais elaborada, recomendo usar principalmente:

- `.glb` — recomendado para modelos 3D completos;
- `.gltf` — também recomendado;
- `.png` / `.jpg` / `.webp` — texturas;
- `.fbx` — pode ser convertido para GLB;
- `.obj` — pode ser usado, mas normalmente exige mais arquivos e configuração.

Para o projeto web, prefira entregar o modelo final em `.glb`.

### Carro

O ideal é um único arquivo:

```text
carro.glb
```

Com materiais/texturas incorporados quando possível.

### Pista

O ideal é:

```text
pista.glb
```

Se a pista tiver texturas externas, mantenha-as organizadas em uma pasta `assets`.

## 7. Próximas evoluções possíveis

A estrutura foi deixada separada para permitir evoluções sem misturar os dois jogos.

### Rakino Race

Possíveis próximas etapas:

- substituir o carro geométrico por `.glb`;
- pista 3D com curvas;
- obstáculos;
- efeitos de tiro;
- colisões;
- itens de velocidade;
- diferentes tipos de munição;
- ranking da corrida;
- largada sincronizada;
- convite com nome do jogador;
- salas privadas;
- melhorias no sincronismo de rede;
- tela de chegada;
- skins dos carros.

### Aim Arena

Possíveis próximas etapas:

- mira controlada pelo mouse;
- movimentação do personagem;
- diferentes armas;
- alvos com tamanhos diferentes;
- alvos móveis em diferentes velocidades;
- combo de acertos;
- precisão percentual;
- ranking local;
- ranking online;
- modelos 3D próprios;
- fases diferentes.

## 8. Observação sobre multiplayer

O Rakino Race já possui uma implementação inicial de multiplayer baseada em Firestore. Ela é adequada para protótipo/portfólio, mas ainda não deve ser considerada uma infraestrutura competitiva definitiva.

Para uma versão competitiva futura, será interessante migrar a sincronização em tempo real para uma arquitetura própria de servidor/WebSocket ou serviço especializado, mantendo o Firebase para autenticação, contas, convites e dados persistentes.


## Correção 002.1 — projetos que não apareciam

A Atualização 005 corrige dois problemas da versão anterior:

1. **Web Projects + Firestore:** o site agora junta o `data/web-projects.json` publicado no GitHub com a coleção `webProjects` do Firebase. Um Firestore antigo não consegue mais esconder os projetos novos do repositório.
2. **Cache/PWA:** o Service Worker passou a usar rede primeiro e cache somente como fallback offline. A versão do cache também foi alterada para `rakino-v3`.

### Como atualizar pelo GitHub Desktop

1. Feche a página do Rakino no navegador.
2. Extraia o conteúdo desta atualização sobre a pasta do seu repositório, substituindo os arquivos quando solicitado.
3. Abra o **GitHub Desktop**.
4. Confira as alterações e faça **Commit to main**.
5. Clique em **Push origin**.
6. Aguarde o GitHub Pages publicar.
7. Abra `https://rakino00.github.io/rakino/`.
8. Se a página ainda mostrar a versão antiga, faça **Ctrl + Shift + R** uma vez.

### Não apague o Firestore

Não é necessário apagar a coleção `webProjects` nem importar novamente o JSON. A página agora combina as duas fontes. O painel Admin continua podendo alterar os projetos do Firestore; o arquivo JSON continua sendo a base publicada pelo GitHub.

## Atualização 008 — Rakino Race Single Player

O `web-projects/rakino-race.html` foi convertido para uma versão **single player**.

- Não exige login Google.
- Não usa Firebase para iniciar a corrida.
- Não cria salas nem depende de convite.
- A corrida começa pelo botão **Iniciar corrida**.
- Existem pilotos controlados pelo computador.
- A velocidade aumenta gradualmente.
- A corrida dura até 3 minutos ou até o jogador encerrar a página.
- A pista continua em terceira pessoa.
- A/D ou setas trocam de faixa.
- Espaço ou o botão `●` usa uma carga.
- As zonas azuis representam pontos de recarga.

### Publicação com GitHub Desktop

1. Substitua os arquivos do repositório pelos arquivos desta atualização.
2. Abra o GitHub Desktop.
3. Confira a alteração em `web-projects/rakino-race.html` e `data/web-projects.json`.
4. Faça o commit.
5. Clique em **Push origin**.
6. Aguarde o GitHub Pages publicar.
7. Abra a página novamente usando `Ctrl + Shift + R` se o navegador ainda mostrar uma versão anterior.

Nenhuma alteração nas regras do Firebase é necessária para jogar esta versão single player.
