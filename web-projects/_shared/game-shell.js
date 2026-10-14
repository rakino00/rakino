/* game-shell.js — marca a página como "embutida" quando aberta dentro do modal do site (?embed=1).
   Carregue com <script src="../_shared/game-shell.js"></script> ainda no <head>. */
(function () {
  if (new URLSearchParams(location.search).get('embed') !== '1') return;
  document.documentElement.classList.add('embed-preview');
  document.addEventListener('DOMContentLoaded', function () { document.body.classList.add('embed'); });
})();
