# Workstation V2 — Alexis Flores

Original Blender 5.1 product scene, built specifically for this portfolio. No downloaded models or third-party model licenses. The editable scene contains the camera, four area lights and a complete articulated laptop; exported GLB contains only the `Workstation` hierarchy.

## Rebuild

```powershell
& 'C:/Users/alexi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' assets-source/v2/make_textures.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python assets-source/v2/create_workstation.py -- --render
```

`make_textures.py` requires Pillow and NumPy. The textures are original deterministic images generated from seed 9014. Keyboard legends use the system Segoe UI font. No procedural-only shader is needed to display the model correctly in Three.js; all roughness and base-color maps are packed in the GLB.

The Blender source is `workstation-v2.blend`. The GLB is `../../public/models/workstation-v2.glb` and the web poster is `../../public/images/workstation-v2.webp`. Rebuild writes the GLB before rendering, so it can be integrated while the poster renders.

## Coordinates and animation

The following are **exported Three.js coordinates**. Blender's Z up is converted to Three.js Y up, and Blender +Y becomes Three.js -Z.

| Node | Position | Notes |
|---|---|---|
| `Workstation` | `(0, 0, 0)` | Scene root; no light or camera in GLB. |
| `Desk` | `(0, 0, 0)` | Top surface Y=0. Width 9.7, depth 4.85; slab thickness .32. |
| `Laptop` | `(0, .042, .08)` | Base-center pivot, detachable independently. Width 3.34, depth 2.16. |
| `LaptopBase` | `(0, 0, 0)` | Relative to `Laptop`. |
| `LaptopLid` | `(0, .170, -1.014)` | Relative to `Laptop`. Rear-hinge pivot. |
| `CoffeeCup` | `(2.43, .012, -.33)` | Hollow porcelain cup, coffee, handle, saucer. |
| `Notebook` | `(-2.64, .01, -.06)` | Paper, two covers, elastic band, red bookmark. |
| `Pen` | `(-1.75, .071, .41)` | Aluminum clip and tip. |
| `AccentObject` | `(2.07, .195, -1.32)` | Ruby acrylic paperweight. |

`LaptopLid.rotation.x` is **-8° by default**. Open by animating `rotation.x` to **-105°** (`-1.832596`). The hinge pivot stays attached to the base. Do not animate the screen separately.

`ScreenSurface` is a separate UV-mapped mesh below `LaptopLid`. Its local front normal when closed is `(0,-1,0)` in Three; opening turns it toward Three +Z. It has a packed default editorial screen image. To replace it with a CanvasTexture/VideoTexture in Three, set `texture.flipY = false` and `texture.colorSpace = THREE.SRGBColorSpace`, then assign a basic/unlit material or a physical material with restrained emission. Keep the texture 1.63:1 to match the panel.

The web implementation changes the screen with the scroll chapters. It keeps the packed image for the opening chapter, then switches to two original 1024 × 628 `CanvasTexture` compositions for the visual system and interaction chapters. The material is `MeshBasicMaterial` with `toneMapped: false`; the canvas textures use sRGB and `flipY: false`. The footer reuses the interaction composition. These are generated textures, not streamed videos.

Suggested Three camera for hero: `(5.8, 5.7, 9.4)`, target `(0,.05,-.12)`, FOV around 38–43°. Desktop edges are intentionally cropped for the cinematic composition. Use an environment map to illuminate the aluminum, supplemented by a broad warm key, white strip and red rim. The Blender poster uses a physical Cycles render at 64 samples with denoising.

## Precomputed web lighting

`../../scripts/bake-environment.html` builds the web reflection environment from Three.js `RoomEnvironment` using `PMREMGenerator.fromScene` with a cube size of 128. The resulting CubeUV atlas has the following format:

| Property | Value |
|---|---|
| Published file | `../../public/models/studio-environment.pmrem` |
| Dimensions | 384 × 512 pixels |
| Channels | RGBA, Float16, little endian |
| Compression | gzip |
| Current compressed size | 265,087 bytes |
| Color space | Linear sRGB |
| Mapping | `CubeUVReflectionMapping` |
| Texture settings | `HalfFloatType`, linear min/mag filters, `flipY: false` |

The runtime loads this file with `fetch`, decompresses it with `DecompressionStream('gzip')`, and reads the buffer as `Uint16Array` for a Three.js `DataTexture`. It assigns the texture to `scene.environment`. No PMREM environment is generated during the visitor's initial load.

To regenerate it:

1. Start `npm run dev` from the repository root.
2. Open `/scripts/bake-environment.html` on the local Vite server, normally `http://127.0.0.1:5173/scripts/bake-environment.html`.
3. Click **Generar reflejos precalculados**, then **Descargar iluminación**.
4. Copy the downloaded `studio-environment.pmrem` into `public/models/`, replacing the previous file.

The generator is a development tool and is not included in `dist/`. The compressed atlas is published with the model. Keep the dimensions, data type, color space and mapping in `src/scene.ts` aligned with this format if the generator changes.

## Materials and detail

- Precision-beveled graphite aluminum unibody; separate glass trackpad and narrow polished edge.
- Individual keyboard key geometry merged into one mesh, and legible atlas-based key printing.
- Speaker perforations, USB-C details, elastomer feet, machined hinge endcaps, glass bezel and tiny camera lens.
- Honed dark stone desktop with subtle packed grain/roughness textures.
- Hollow glazed porcelain cup, actual rim and handle, reflective espresso and crema ring.
- Layered notebook pages, woven closure band and small red bookmark.
- Ruby acrylic paperweight, used as the restrained red material accent.

The old cat/chair/floor diorama is not referenced by this scene.
