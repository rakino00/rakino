# Trocar a logo do Rakino

A logo pessoal usada no cabeçalho e na tela de login fica em `assets/img/logo.png`.

## PNG
1. Substitua `assets/img/logo.png` por outro PNG.
2. Mantenha o mesmo nome e não é necessário alterar código.
3. Faça o push.

## GIF no futuro
Abra `assets/js/site-config.js` e altere somente:

```js
export const LOGO_SRC = 'assets/img/logo.gif';
```

O site já aceita a extensão GIF nesse ponto. A extensão não precisa ser alterada em outros arquivos.

> A imagem de referência mencionada na solicitação não veio anexada junto deste ZIP; por isso, `logo.png` foi gerada a partir da marca SVG que já existia no projeto. Quando a imagem de referência estiver disponível, basta substituí-la nesse arquivo.
