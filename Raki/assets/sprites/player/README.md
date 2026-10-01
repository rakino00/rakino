# Player spritesheet

`player.png` é uma spritesheet local de exemplo com 4 quadros em uma linha.

```text
[ frame 0 ][ frame 1 ][ frame 2 ][ frame 3 ]
```

O `Raki/index.html` transforma cada quadro em um `THREE.Sprite`, então o personagem continua inserido em uma cena 3D e a câmera pode orbitar livremente.

Para substituir:

1. edite ou crie seu PNG;
2. mantenha 4 quadros horizontais, ou ajuste o divisor no código;
3. substitua `player.png`;
4. recarregue com o servidor local.
