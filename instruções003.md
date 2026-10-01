# Rakino — Atualização 003

## O que mudou

### 1. Web Projects agora é baseado em diretórios

A lista de Web Projects não depende mais de `data/web-projects.json` nem de documentos do Firestore. O site consulta a pasta pública `web-projects/` do repositório GitHub `rakino00/rakino`.

O GitHub disponibiliza o conteúdo de diretórios pela API de conteúdo do repositório, então o navegador consegue descobrir as pastas existentes sem manter uma lista manual.

Estrutura:

```text
web-projects/
├── acordeplus/
│   ├── project.md
│   └── index.html
├── rakino-race/
│   ├── project.md
│   └── index.html
└── meu-novo-projeto/
    ├── project.md
    ├── index.html
    └── assets/
```

### 2. `project.md` é obrigatório

Para o site reconhecer uma pasta como Web Project, ela precisa conter:

- `project.md`;
- um arquivo de entrada, normalmente `index.html`.

Sem `project.md`, a pasta é ignorada. Isso evita que pastas de suporte sejam exibidas como projetos.

### 3. Metadados

Exemplo mínimo:

```yaml
---
title: Meu Protótipo
description: Pequena descrição do projeto.
creators:
  - Rakino
icon: 🧩
type: html
tags:
  - javascript
  - protótipo
entry: index.html
status: prototype
---
```

Também podem ser usados `technologies`, `features`, `version`, `updated` e `cover`.

### 4. Capas automáticas

A prioridade é:

1. `cover:` definido no `project.md`;
2. primeira imagem encontrada na pasta;
3. capa gerada pelo próprio site.

### 5. Adicionar um novo projeto

No GitHub Desktop:

1. Crie uma pasta em `web-projects/`.
2. Coloque o protótipo dentro dela.
3. Renomeie o arquivo inicial para `index.html` ou informe outro nome em `entry:`.
4. Crie `project.md`.
5. Faça commit e push.
6. Abra o site e use **Atualizar** em Web Projects.

Não é necessário editar JavaScript, JSON ou Firestore para cadastrar o projeto.

### 6. Remover um projeto

Apague a pasta inteira pelo GitHub Desktop e faça commit/push. Depois de atualizar o site, o projeto desaparece da lista.

### 7. Alterar metadados

Edite somente `project.md` e faça commit/push. O cartão será atualizado na próxima leitura.

### 8. Painel Admin

O login administrativo continua existindo para as áreas que usam Firebase, mas Web Projects deixou de ser editado pelo Firestore. O painel Admin mostra a descoberta atual e oferece atualização da leitura.

Isso evita que o site fique com uma lista do Firebase diferente das pastas reais do GitHub.

### 9. Tema Red Dragon Scale

O tema foi alterado para uma identidade vermelho/crimson/laranja, com fundo escuro inspirado em escamas e sem depender de Docker.

O antigo dock inferior também foi simplificado: ele não usa mais efeitos de escala agressivos ao passar o mouse e funciona como uma barra horizontal estável, com rolagem em telas pequenas.

### 10. GitHub Desktop

O fluxo recomendado agora é:

```text
GitHub Desktop
      ↓
web-projects/NOME-DO-PROJETO/
      ↓
project.md + arquivos do protótipo
      ↓
Commit
      ↓
Push
      ↓
GitHub Pages
      ↓
Rakino descobre automaticamente
```

### Observação sobre atualização

O site consulta a API pública do GitHub sem usar um arquivo de manifesto local. A API de conteúdo do GitHub retorna arquivos e diretórios do repositório, permitindo essa descoberta dinâmica.

Se muitos acessos ocorrerem em pouco tempo, a API pública pode aplicar limite de requisições. Para um portfólio pessoal, a leitura sob demanda + botão de atualização é suficiente; se o projeto crescer bastante, podemos migrar a descoberta para um build automático do GitHub Actions.
