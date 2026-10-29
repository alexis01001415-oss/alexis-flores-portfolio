"""Export the original Cristal Rubi bottle for the portfolio's WebGL viewer.

Run with Blender --background SOURCE.blend --python THIS.py. Source is never saved.
Creates a single closed, normalized product with independently movable cap.
Geometry is derived from the approved asset collections, without sets or copies.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models/seicento'
OUT.mkdir(parents=True, exist_ok=True)
WORK = ROOT / 'tmp/seicento-v10'
WORK.mkdir(parents=True, exist_ok=True)

source_path = bpy.data.filepath
body_source = bpy.data.collections['ASSET | Frasco · vidrio y aceite']
cap_source = bpy.data.collections['ASSET | Tapa y aplicador']
scene = bpy.data.scenes.new('Portfolio | Cristal Rubi web')
bpy.context.window.scene = scene
scene.unit_settings.system = 'NONE'

# Native product measures 93 mm overall. Bake normalized transforms into meshes.
source_height = .093
normalize = Matrix.Scale(1 / source_height, 4) @ Matrix.Translation((0, 0, -source_height / 2))
product = bpy.data.objects.new('RubiProduct', None)
scene.collection.objects.link(product)
groups = {}
for name in ['RubiBody', 'RubiCap']:
    group = bpy.data.objects.new(name, None)
    scene.collection.objects.link(group)
    group.parent = product
    groups[name] = group

def material(name, color, roughness, metallic=0, transmission=0, ior=1.5):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Transmission Weight'].default_value = transmission
    shader.inputs['IOR'].default_value = ior
    return mat

materials = {
    'glass': material('RubiGlass', (.95, .975, .98), .065, transmission=1, ior=1.505),
    'oil': material('RubiLiquid', (.48, .007, .034), .12, transmission=.42, ior=1.46),
    'metal': material('RubiCapMetal', (.64, .61, .55), .22, metallic=1),
    'graphite': material('RubiGraphite', (.018, .019, .023), .26, metallic=.75),
    'stem': material('RubiStem', (.81, .79, .74), .24, transmission=.08, ior=1.47),
    'flock': material('RubiFlock', (.36, .009, .035), .72),
    'gel': material('RubiGloss', (.44, .003, .026), .1, transmission=.28, ior=1.46),
    'reducer': material('RubiReducer', (.65, .63, .58), .33),
}

def choose_material(name):
    if name.startswith(('FRASCO', 'CUELLO')): return materials['glass']
    if name.startswith('CONTENIDO'): return materials['oil']
    if name.startswith('BOCA'): return materials['reducer']
    if 'grafito' in name: return materials['graphite']
    if name.startswith('TAPA'): return materials['metal']
    if name.startswith('VARILLA'): return materials['stem']
    if 'carga' in name: return materials['gel']
    return materials['flock']

report = []
for collection, group_name in [(body_source, 'RubiBody'), (cap_source, 'RubiCap')]:
    for index, original in enumerate(collection.all_objects):
        if original.hide_render or original.type != 'MESH' or 'microburbujas' in original.name:
            continue
        mesh = original.data.copy()
        obj = bpy.data.objects.new(f'{group_name}_{index:02d}', mesh)
        scene.collection.objects.link(obj)
        obj['sourceObject'] = original.name
        mesh.transform(normalize @ original.matrix_world)
        mesh.materials.clear()
        mesh.materials.append(choose_material(original.name))
        obj.parent = groups[group_name]
        # Preserve authored split normals/flat faces around the engraved glass.
        # Dense sculpted gel and nylon are reduced; glass and cap profile preserved.
        ratio = .18 if 'carga' in original.name else .4 if 'doe-foot' in original.name else 1
        if ratio < 1:
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            decimate = obj.modifiers.new('Web detail reduction', 'DECIMATE')
            decimate.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=decimate.name)
            obj.select_set(False)
        report.append({'node': obj.name, 'source': original.name, 'vertices': len(mesh.vertices), 'triangles': sum(len(p.vertices)-2 for p in mesh.polygons)})

# Convert a deterministic subset of original fibre curves to thin triangular tubes.
# WebGL cannot render Blender's native Curves; geometry retains the source direction.
hair = next((o for o in cap_source.all_objects if o.type == 'CURVES' and not o.hide_render), None)
if hair:
    curves = hair.data.curves
    points = hair.data.points
    verts, faces = [], []
    stride = max(1, math.ceil(len(curves) / 1400))
    for curve in list(curves)[::stride]:
        if curve.points_length < 2: continue
        start = curve.first_point_index
        a = normalize @ hair.matrix_world @ points[start].position
        b = normalize @ hair.matrix_world @ points[start + curve.points_length - 1].position
        direction = b-a
        if direction.length < 1e-8: continue
        side = direction.cross(Vector((0, 1, 0)))
        if side.length < 1e-8: side = direction.cross(Vector((1, 0, 0)))
        side.normalize()
        up = direction.normalized().cross(side)
        radius = .000012 / source_height
        offset = len(verts)
        for center, r in [(a, radius), (b, radius*.25)]:
            for k in range(3):
                angle = k*math.tau/3
                verts.append(tuple(center + r*(side*math.cos(angle)+up*math.sin(angle))))
        for k in range(3):
            nxt = (k+1)%3
            faces.append((offset+k, offset+nxt, offset+3+nxt, offset+3+k))
    if verts:
        mesh = bpy.data.meshes.new('RubiFibres')
        mesh.from_pydata(verts, [], faces)
        mesh.materials.append(materials['flock'])
        obj = bpy.data.objects.new('RubiFibres', mesh)
        scene.collection.objects.link(obj)
        obj.parent = groups['RubiCap']
        report.append({'node': obj.name, 'source': hair.name, 'vertices': len(verts), 'triangles': len(faces)*2, 'sourceCurves': len(curves), 'samplingStride': stride})

bpy.context.view_layer.update()
objects = [o for o in scene.objects if o.type == 'MESH']
all_points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
lo = [min(p[i] for p in all_points) for i in range(3)]
hi = [max(p[i] for p in all_points) for i in range(3)]
for obj in scene.objects: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cristal-rubi.glb'), export_format='GLB', use_selection=True, use_active_scene=True,
    export_yup=True, export_apply=True, export_animations=False, export_cameras=False,
    export_lights=False, export_materials='EXPORT', export_extras=True)

metadata = {
    'sourceBlend': 'Lip_Oil_Cristal/blend/' + Path(source_path).name, 'product': 'Cristal Rubí — SEICENTO',
    'root': 'RubiProduct', 'body': 'RubiBody', 'cap': 'RubiCap',
    'axis': 'Y up, front +Z in glTF', 'originalHeightMeters': source_height,
    'normalization': 'Closed product centered around origin, height approximately 1; all cap/applicator nodes under RubiCap. Translate RubiCap along +Y to open.',
    'blenderBounds': {'min': lo, 'max': hi},
    'gltfBounds': {'min': [lo[0],lo[2],-hi[1]], 'max':[hi[0],hi[2],-lo[1]]},
    'objects': report, 'triangles': sum(o['triangles'] for o in report),
    'bytes': (OUT/'cristal-rubi.glb').stat().st_size,
    'materialsNote': 'Original geometry. Procedural Cycles materials approximated by glTF PBR transmission/metallic-roughness, fibre subset converted to geometry. No source blend changes.'
}
(OUT/'cristal-rubi.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf8')
print('EXPORT_RESULT', json.dumps(metadata,ensure_ascii=False),flush=True)

# Render a web-material proof, using the exact exported scene geometry.
if '--proof' in __import__('sys').argv:
    scene.render.engine='CYCLES'
    scene.cycles.samples=48
    scene.cycles.use_denoising=True
    scene.render.resolution_x=800
    scene.render.resolution_y=1000
    scene.render.resolution_percentage=100
    scene.render.film_transparent=False
    scene.world=bpy.data.worlds.new('Web proof world')
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.78,.75,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.6
    def aim(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    for name,location,power,size in [('key',(-2,-3,3),500,3),('rim',(2,1,2),600,2),('strip',(1,-1,1),160,1)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE';data.size=size;data.size_y=size*2
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=location;aim(obj,(0,0,0))
    camera_data=bpy.data.cameras.new('Proof camera');camera=bpy.data.objects.new('Proof camera',camera_data)
    scene.collection.objects.link(camera);scene.camera=camera
    camera.location=(1.4,-3.2,1.2);aim(camera,(0,0,.18));camera_data.type='ORTHO';camera_data.ortho_scale=1.8
    groups['RubiCap'].location.z=.55
    scene.view_settings.view_transform='AgX'
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(WORK/'rubi-web-proof.png')
    bpy.ops.render.render(write_still=True)
