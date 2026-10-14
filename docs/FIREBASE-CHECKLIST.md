# Firebase: publicação e diagnóstico do Rakino

## Antes de testar

1. Abra `assets/js/firebase-config.js` e confira `apiKey`, `authDomain`, `projectId` e `appId` do app Web correto. Não troque esses valores por chaves de outro projeto.
2. No Firebase Console, em **Authentication → Sign-in method**, habilite **Google**.
3. Em **Authentication → Settings → Authorized domains**, adicione o domínio usado pelo GitHub Pages (por exemplo, `SEU-USUARIO.github.io`). Para desenvolvimento, adicione também `localhost`.
4. Abra **Firestore Database → Rules**, copie o conteúdo completo de `firestore.rules` e clique em **Publish**. O GitHub Pages publica os arquivos do site, mas **não publica as regras do Firestore automaticamente**.
5. Entre no site com Google e teste cada recurso. O modo visitante não equivale a uma sessão autenticada.

## Como os dados são guardados

- **Chat:** somente usuários autenticados podem ver e enviar mensagens. O botão do chat aparece após o login.
- **Recordes dos Web Projects:** todos podem ler recordes globais. Usuários autenticados sincronizam o recorde global; visitantes mantêm o recorde no `localStorage` daquele navegador. Um recorde local não é automaticamente um recorde global.
- **Saltador:** mantém o recorde local para convidados e sincroniza o documento `saltador/record` quando o usuário está autenticado.
- **RakinoFood:** requer login Google; os dados ficam em `users/{uid}/rakinoFood/state`, separados por conta.
- **Minha Vida:** a timeline é pública para leitura. Somente `rakifernn@gmail.com` pode criar, editar ou remover postagens, conforme as regras e o controle administrativo da página.
- **Notations:** cada usuário só acessa `users/{uid}/notations`.

## Se algo falhar

1. Abra o site, pressione `F12` e consulte **Console** e **Network**.
2. `permission-denied` geralmente indica regras não publicadas, conta errada ou email sem permissão administrativa.
3. `auth/unauthorized-domain` indica que o domínio do site não foi autorizado no Firebase Authentication.
4. Se o Firebase não inicializar, confira a configuração e a conexão com `www.gstatic.com`; os recursos Firebase não funcionam offline.
5. Após publicar alterações de `firestore.rules`, recarregue o site e teste novamente. As regras do Firestore são independentes do deploy do GitHub Pages.

## Recordes: funcionamento esperado

O evento do jogo usa o identificador da pasta/projeto (por exemplo, `puzzle-suffers`, `takamae-vesikika` e `rakino-race`). Para validar a sincronização global, entre com Google, termine uma partida com pontuação maior que o recorde atual e verifique `gameRecords/{id}` no Firestore. Os recordes locais aparecem apenas no mesmo navegador/perfil até serem sincronizados por uma pontuação superior com login.
