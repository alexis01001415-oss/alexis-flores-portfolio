"""Render website derivatives from the completed Seicento Blender asset.

Run in a background Blender process. This never saves or changes the source blend.
"""
import bpy
import time
from pathlib import Path

OUT = Path(__file__).resolve().parent / "renders"
OUT.mkdir(parents=True, exist_ok=True)
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'OPTIX'

names = [('01', 'rubi-architecture'), ('02', 'rubi-light'), ('03', 'rubi-texture')]
for prefix, name in names:
    scene = next(s for s in bpy.data.scenes if s.name.startswith(prefix))
    bpy.context.window.scene = scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 128
    scene.cycles.adaptive_threshold = .015
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.use_border = False
    scene.render.filepath = str(OUT / f'{name}.png')
    start = time.time()
    bpy.ops.render.render(write_still=True)
    print('PORTFOLIO_STILL', name, round(time.time() - start, 1), flush=True)
