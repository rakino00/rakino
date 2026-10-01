# Sprites do Saltador

Estrutura deliberadamente simples:

```text
assets/
└── sprites/
    └── saltador/
        ├── player.png
        ├── obstacles.png
        └── README.md
```

## Como trocar

- `player.png`: 4 quadros horizontais do personagem.
- `obstacles.png`: 4 quadros horizontais de obstáculos.
- Todos os quadros precisam ter a mesma largura e a mesma altura dentro de cada arquivo.
- O `runner.js` divide automaticamente a largura total em 4 partes.

Você pode editar os PNGs no Aseprite, Piskel, Krita, GIMP ou outro editor de pixel art e substituir o arquivo mantendo o nome.

## Referência externa CC0

Para estudar formatos de spritesheet, veja o **Base character spritesheet 16x16**, de Cough-E, no OpenGameArt. A página informa licença **CC0**: https://opengameart.org/content/base-character-spritesheet-16x16

O asset usado atualmente no Saltador é um placeholder local criado para o projeto; a referência externa serve como material de estudo e não é necessária para executar o jogo.
