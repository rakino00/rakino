# Rakino — instruções (GitHub Pages + Firebase gratuito)

Tudo aqui é **gratuito e sem cartão de crédito**: hospedagem no GitHub Pages, login Google e
banco de dados no plano **Spark** do Firebase.

## 1. O que mudou

| Antes | Agora |
|---|---|
| PHP + MySQL (Wamp) | Site estático (HTML/CSS/JS) — roda no GitHub Pages |
| Abas no topo | **Dock** inferior central (no celular vira barra de ícones) |
| Modal sempre aberto com blur | Corrigido (ver "Causa do blur" abaixo) |
| Login de admin no banco | **Login com Google** ou **Só visitar** |
| Notations no MySQL | Notations no **Firestore**, uma lista privada por conta Google, em tempo real |
| — | Aba **Web Projects** (janelas modais com iframe, ampliar, clicar fora fecha) |
| — | Aba **Python** ("em construção") |
| — | **PWA**: instala na tela inicial e abre offline |

**Visitante** vê: Início, Web Projects, Experiences.
**Logado com Google** vê tudo: + Notations, Python, Tech, Games.

**Causa do blur:** `.modal-root` tinha `display:flex`, o que anula o atributo `hidden`.
Resultado: o modal (vazio, com fundo escuro + blur) ficava sempre em cima da tela.
Agora o CSS tem `[hidden]{display:none!important}` e o modal só existe no DOM enquanto está aberto.

O código PHP antigo foi preservado em `_legado-php/` (só para consulta; está no `.gitignore`
e **não vai para o ar**).

---

## 2. Publicar no GitHub Pages

> No plano gratuito do GitHub, o Pages só funciona com **repositório público**.

1. Crie um repositório (ex.: `rakino`) em github.com.
2. Envie o conteúdo da pasta `Rakino/` (arrastando em **Add file → Upload files**, ou via `git push`).
   - **Não envie a pasta `_legado-php/`** (se usar `git`, o `.gitignore` já cuida disso; se usar o upload
     pelo navegador, apague essa pasta antes).
   - Confirme que os arquivos `.github/workflows/pages.yml` e `.nojekyll` foram enviados (são ocultos).
3. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Faça qualquer commit na branch `main` (ou vá em **Actions → Publicar no GitHub Pages → Run workflow**).
5. Em ~1 minuto o site abre em `https://SEU-USUARIO.github.io/rakino/`.

O workflow (`.github/workflows/pages.yml`) regenera `data/web-projects.json`, valida JavaScript/JSON e publica o site via GitHub Pages.
do PWA. As pastas `docs/`, `tools/` e `_legado-php/` ficam de fora.

---

## 3. Configurar o Firebase (login Google + notations)

Sem isso o site funciona, mas só no modo visitante (o botão Google fica desativado).

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (pode desativar o Google Analytics).
2. **Build → Authentication → Vamos começar → Método de login → Google → Ativar** (escolha um e-mail de suporte).
3. **Authentication → Configurações → Domínios autorizados → Adicionar domínio**:
   `SEU-USUARIO.github.io`  (`localhost` já vem autorizado).
4. **Build → Firestore Database → Criar banco de dados**
   - modo **produção**;
   - região: `southamerica-east1` (São Paulo) — **não dá para mudar depois**.
5. Aba **Regras** do Firestore → apague tudo, cole o conteúdo de `firestore.rules` → **Publicar**.
   (Cada usuário só lê/escreve as próprias notations; todo o resto é bloqueado.)
6. **Configurações do projeto (engrenagem) → Geral → Seus apps → `</>` Web** → registre o app
   (não precisa de Firebase Hosting) → copie o objeto `firebaseConfig`.
7. Cole os valores em `assets/js/firebase-config.js` (`apiKey`, `authDomain`, `projectId`, `appId`) e faça commit.

**Custos:** fique no plano **Spark** (gratuito) e **não faça upgrade para Blaze**. Não ative
Cloud Storage nem Cloud Functions (exigem plano pago). Para uso pessoal, as cotas gratuitas do Firestore
(na ordem de dezenas de milhares de leituras/escritas por dia e 1 GiB) sobram com folga — confira os
números atuais em firebase.google.com/pricing.

A `apiKey` do Firebase **não é segredo** (todo site com Firebase a expõe). A proteção real são as
**regras do Firestore** e os **domínios autorizados**.

---

## 4. Testar no seu computador

Não abra o `index.html` com duplo clique (`file://` bloqueia módulos JS e `fetch`). Use um servidor local:

```
cd Rakino
python -m http.server 8000
```
e abra <http://localhost:8000>.

---

## 5. Adicionar um Web Project

1. Coloque o arquivo em `web-projects/` (ex.: `web-projects/metronomo.html`).
2. Faça commit. O workflow gera a lista sozinho (ou rode `python tools/gerar_manifest.py` localmente).
3. Pronto: aparece como card em **Web Projects** e abre numa janela modal.

O título vem do `<title>` da página e a descrição de `<meta name="description" content="...">`.
Para ajustar (título, descrição, ícone emoji, tags, ordem, esconder), edite `web-projects/_meta.json`:

```json
{
  "metronomo.html": { "title": "Metrônomo", "description": "…", "icon": "🥁", "tags": ["música"], "order": 2 },
  "rascunho.html":  { "hidden": true }
}
```

**Regras para o projeto funcionar dentro do modal:**
- Prefira **um arquivo único** (CSS e JS embutidos, como o `acordePlus.html`).
- Se usar outros arquivos, use **caminhos relativos** (`img/foto.png`, nunca `/img/foto.png`), porque o site
  fica em `/rakino/`, não na raiz.
- `.php` **não executa** no GitHub Pages: o card abre com um aviso explicando isso.
- O botão **⤢ Ampliar** abre a página do projeto em tela cheia; para voltar ao site, use o botão voltar do navegador.
- Clicar fora da janela (ou tocar na faixa no topo, no celular) fecha o modal. O botão voltar do celular também fecha.

---

## 6. RakinoFood

`web-projects/RakinoFood.html` é um protótipo local de restaurante com três áreas: Salão, Cozinha e Escritório. Ele usa `localStorage` para demonstração. O fluxo de produção e uma proposta de backend estão documentados em `BreakTheLimit.md`.

## 7. Editar conteúdo do site

O conteúdo principal dos Web Projects é controlado por:

```text
web-projects/_meta.json
```

e pelo manifest gerado:

```text
data/web-projects.json
```

Para adicionar/alterar um projeto, prefira editar `_meta.json` e rode:

```bash
python tools/gerar_manifest.py
```

O site também possui conteúdo diretamente em `index.html` e nos módulos de `assets/js/`.

Não existem, nesta versão do repositório, os antigos `experiences.json`, `tech.json` e `games.json`; a documentação anterior que citava esses arquivos estava desatualizada.

O RakinoFood é um Web Project independente e não precisa ser registrado manualmente em `index.html`.

## 8. Usar como app no celular (PWA)

- **Android/Chrome:** menu ⋮ → **Instalar app**.
- **iPhone/Safari:** Compartilhar → **Adicionar à Tela de Início**.

Abre em tela cheia, sem barra do navegador, respeita a área segura (notch) e funciona offline
(o Firestore guarda as notations no aparelho e sincroniza depois).

Se algum dia o login Google falhar **dentro do app instalado no iPhone**, entre uma vez pelo Safari normal;
navegadores em modo "app" às vezes bloqueiam o pop-up de login (ver `NOTAS-FUTURO.md`).

**Cache:** o site abre do cache e atualiza em segundo plano, então após um deploy pode ser preciso abrir
duas vezes para ver a versão nova. Para forçar limpeza geral, aumente o identificador de `CACHE` em `sw.js` (atualmente `rakino-v4`).

---

## 9. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Botão "Continuar com Google" desativado | `firebase-config.js` ainda com `COLE_AQUI`, ou sem internet |
| `auth/unauthorized-domain` | falta adicionar `SEU-USUARIO.github.io` em Authentication → Domínios autorizados |
| `Missing or insufficient permissions` | as regras do Firestore não foram publicadas (passo 3.5) |
| Cards vazios / "Não consegui carregar os dados" | abriu por `file://`, ou o JSON tem erro de vírgula |
| Pop-up de login não abre no celular | o site tenta o redirecionamento automaticamente; permita pop-ups se necessário |
| Web Project em branco no modal | o arquivo usa caminhos absolutos (`/algo`) ou bloqueia iframe; abra com ⤢ para testar |

---

## 10. Estrutura

```
Rakino/
├── index.html · 404.html · sw.js · manifest.webmanifest · .nojekyll
├── firestore.rules            regras para colar no console do Firebase
├── assets/
│   ├── css/style.css          todo o visual (dock, modais, notations)
│   ├── js/main.js             login, dock, rotas (#/aba/item), painéis, modais
│   ├── js/notations.js        CRUD das notations (Firestore)
│   ├── js/auth.js             Firebase Auth + Firestore (carregados do CDN do Google)
│   ├── js/modal.js · ui.js    modal (fecha ao clicar fora / Esc / voltar) e utilitários
│   ├── js/firebase-config.js  ← você cola sua configuração aqui
│   └── img/                   ícones do PWA
├── data/web-projects.json     manifest gerado
├── web-projects/              projetos HTML + _meta.json
├── tools/gerar_manifest.py    gera data/web-projects.json
├── .github/workflows/pages.yml
├── docs/                      instruções e notas
├── README.md
└── BreakTheLimit.md
```
