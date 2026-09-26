# Escena original · Alexis Flores

Creada desde cero para este portafolio, sin modelos de terceros, texturas externas ni servicios incrustados.

## Archivos

- `create_studio.py`: construcción reproducible de la geometría, materiales y luces en Blender 5.1.
- `studio.blend`: archivo editable con cámara y estudio de iluminación.
- `studio-poster.png`: render original transparente, 1300 × 1100 px.
- `../public/models/studio.glb`: modelo GLB para Three.js, sin cámaras ni luces.
- `../public/images/studio-poster.webp`: versión web con transparencia.

## Volver a generar

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python assets-source/create_studio.py
```

El script genera el PNG en `public/images`. Para comprimirlo, utilizar Pillow:

```python
from PIL import Image
Image.open('public/images/studio-poster.png').save('public/images/studio-poster.webp', quality=88, method=6)
```

## Integración Three.js

El GLB usa Y arriba. Cámara equivalente al render: posición `(7.8, 7.4, 10.5)`, objetivo `(0, 1.15, 0.2)`, cámara ortográfica con ancho de encuadre aproximado `8.05` para aspecto `1300/1100`. No se necesitan decodificadores Draco ni archivos de texturas.

La escena tiene aproximadamente 6.7 unidades de ancho, 6 de profundidad y 3.55 de altura. Los materiales negros necesitan iluminación ambiental y luces suaves, idealmente un ambiente de estudio.

### Nodos animables

```text
Studio
├── Desk
├── Laptop
│   └── LaptopDisplay
├── Keyboard
├── CoffeeCup
├── Notebook
├── Plant
└── Chair
    └── Cat
        ├── CatHead
        │   ├── CatEyesClosed
        │   └── CatEyesOpen
        ├── CatTail
        ├── CatLegLeft
        └── CatLegRight
```

`Cat` está ubicado sobre el cojín y se mueve en coordenadas locales de `Chair`. Cabeza, cola y patas son pivotes independientes para animación procedural. La pose inicial es dormida; no incluye esqueleto ni clips grabados. Los ojos cerrados y abiertos tienen grupos independientes. Los ojos abiertos incluyen iris lima, pupila y reflejo, y se exportan a escala `0.001` para conservarlos dentro del modelo sin verse en la pose inicial.

```js
const eyesOpen = scene.getObjectByName('CatEyesOpen');
const eyesClosed = scene.getObjectByName('CatEyesClosed');
// Despertar
eyesOpen.scale.setScalar(1);
eyesClosed.visible = false;
// Volver a dormir
eyesOpen.scale.setScalar(0.001);
eyesClosed.visible = true;
```

Las orejas, las patas, los bigotes y la cola están modelados con geometría separada. La pantalla contiene una composición original construida con geometría. Las piezas estáticas están agrupadas por material, con 46 meshes en total incluyendo ambos estados de los ojos.

El render usa Cycles CPU, 40 muestras, denoising, AgX y fondo transparente. Los materiales web pueden diferir ligeramente de Cycles según iluminación y tone mapping.
