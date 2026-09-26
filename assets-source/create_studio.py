"""Original Alexis Flores desktop diorama. Blender 5.1, no external assets.
Run: blender --background --python assets-source/create_studio.py
"""
import bpy, math, os, sys
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / 'public' / 'models'
IMAGES = ROOT / 'public' / 'images'
MODELS.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, rgb, metallic=0, roughness=.4, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    if emission:
        p.inputs['Emission Color'].default_value = (*rgb, 1)
        p.inputs['Emission Strength'].default_value = emission
    return m

black = mat('Graphite · anodized aluminum', (.027,.033,.03), .55,.28)
edge = mat('Brushed charcoal edge', (.075,.088,.079), .65,.32)
rubber = mat('Soft touch charcoal', (.043,.05,.044), .03,.73)
cream = mat('Warm porcelain', (.89,.89,.82), .03,.27)
white = mat('Cat · warm white', (.91,.92,.86), .0,.6)
pink = mat('Cat · pink inner ears', (.76,.44,.44),0,.7)
ink = mat('Ink', (.018,.023,.018), 0,.5)
lime = mat('Studio lime', (.665,.88,.24), .1,.35)
screen = mat('Display warm paper', (.82,.86,.72),0,.6,.3)
coffee = mat('Espresso', (.03,.013,.008),0,.18)
soil = mat('Potting soil', (.025,.021,.012),0,1)
leafmat = mat('Leaves', (.16,.25,.105),0,.48)
brass = mat('Warm brushed metal', (.39,.3,.16),.8,.32)

def empty(name, loc=(0,0,0), parent=None):
    o = bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(o)
    o.location=loc
    if parent: o.parent=parent
    return o

studio=empty('Studio')
def finish(o,name,material,parent=studio,smooth=True):
    o.name=name
    if material: o.data.materials.append(material)
    if parent: o.parent=parent
    if smooth and hasattr(o.data,'polygons'):
        for p in o.data.polygons: p.use_smooth=True
    return o

def box(name,loc,size,material,bevel=.04,parent=studio):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object
    o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(o,name,material,parent)
    if bevel:
        m=o.modifiers.new('Soft manufactured edges','BEVEL'); m.width=bevel; m.segments=3
        bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL'); m.keep_sharp=True; m.weight=50
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o

def uv(name,loc,scale,material,parent=studio,segments=24,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=loc)
    o=bpy.context.object; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent)

def cylinder(name,loc,radius,depth,material,parent=studio,vertices=40,bevel=.025):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=finish(bpy.context.object,name,material,parent)
    if bevel:
        b=o.modifiers.new('Rounded rim','BEVEL'); b.width=bevel; b.segments=3
        bpy.ops.object.modifier_apply(modifier=b.name)
        w=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=w.name)
    return o

def tube(name,points,radius,material,parent=studio,resolution=2):
    c=bpy.data.curves.new(name,'CURVE'); c.dimensions='3D'; c.resolution_u=6
    s=c.splines.new('BEZIER'); s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points): p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    c.bevel_depth=radius; c.bevel_resolution=resolution; c.resolution_u=5
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o=bpy.context.object; o.select_set(False)
    return finish(o,name,material,parent)

def torus(name,loc,major,minor,material,parent=studio,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=36,minor_segments=10,location=loc,major_radius=major,minor_radius=minor,rotation=rotation)
    return finish(bpy.context.object,name,material,parent)

# A very thin plinth anchors shadows without filling the hero image.
plinth=cylinder('StudioPlinth',(0,-.25,-.04),3.36,.12,black,vertices=80,bevel=.045)
plinth.scale.y=.89
rim=torus('PlinthEdge',(0,-.25,.015),3.32,.013,edge); rim.scale.y=.89

# Architectural tabletop, subtly inset edge, two U legs.
desk=empty('Desk')
desk.parent=studio
box('DeskTop',(0,.45,2.12),(4.65,1.75,.16),black,.10,desk)
box('DeskShadowReveal',(0,.45,2.022),(4.4,1.61,.038),edge,.015,desk)
for x in [-1.94,1.94]:
    tube('DeskLegU',[(x,-.12,2.04),(x,-.12,.19),(x,.03,.10),(x,1.03,.10),(x,1.13,.19),(x,1.13,2.04)],.055,edge,desk)
box('DeskCrossbar',(0,1.10,1.94),(3.88,.055,.09),edge,.012,desk)

# Laptop, raised screen with hinge, keys and trackpad.
laptop=empty('Laptop',(.05,.47,2.22),studio)
laptop.rotation_euler.z=-.09
box('LaptopBase',(0,-.13,.045),(1.9,1.18,.075),edge,.045,laptop)
box('LaptopLowerLip',(0,-.70,.041),(1.85,.025,.025),black,.01,laptop)
hinge=cylinder('LaptopHinge',(0,.425,.09),.045,1.6,black,laptop); hinge.rotation_euler.y=math.pi/2
display=empty('LaptopDisplay',(0,.40,.11),laptop); display.rotation_euler.x=math.radians(-13)
box('DisplayFrame',(0,0,.64),(1.9,.065,1.23),black,.045,display)
box('DisplayGlass',(0,-.038,.652),(1.79,.009,1.10),screen,.025,display)
uv('Webcam',(0,-.039,1.224),(.018,.009,.009),ink,display,16,8)

# An original graphic composition, as actual geometry: restrained interface + lime circle.
box('ScreenRail',(-.78,-.046,.652),(.105,.007,.95),ink,.008,display)
for z in [1.04,.97,.90]: box('ScreenNav',(-.779,-.052,z),(.039,.006,.018),screen,.007,display)
box('ScreenTopline',(.035,-.046,1.073),(1.28,.009,.035),ink,.004,display)
box('ScreenHeadline',(-.155,-.046,.965),(.89,.009,.065),ink,.003,display)
box('ScreenSubtitle',(-.278,-.046,.871),(.64,.009,.026),ink,.003,display)
circle=cylinder('ScreenLimeDisc',(.32,-.05,.511),.32,.012,lime,display,64,.0); circle.rotation_euler.x=math.pi/2
ring=torus('ScreenBlackOrbit',(.30,-.066,.51),.30,.064,ink,display,rotation=(math.pi/2,0,0)); ring.scale.x=.6; ring.rotation_euler.z=.35
box('ScreenFooter',(-.24,-.047,.2),(.71,.007,.027),ink,.003,display)
for row in range(4):
    for col in range(12):
        box('LaptopKey',(-.756+col*.136,.25-row*.135,.09),(.113,.103,.015),black,.012,laptop)
box('LaptopSpacebar',(0,-.283,.09),(.60,.095,.015),black,.012,laptop)
box('LaptopTrackpad',(0,-.508,.087),(.59,.26,.007),black,.019,laptop)
box('TrackpadInset',(0,-.508,.092),(.572,.244,.006),edge,.018,laptop)

# Compact companion keyboard with a single lime escape key.
keyboard=empty('Keyboard',(-.10,-.17,2.226),studio)
keyboard.rotation_euler.z=-.09
box('KeyboardBody',(0,0,0),(1.63,.53,.065),black,.04,keyboard)
for r in range(3):
    for c in range(12):
        box('KeyboardKey',(-.715+c*.13,.168-r*.15,.047),(.105,.105,.035),lime if r==0 and c==0 else edge,.015,keyboard)
mouse=uv('Mouse',(1.30,-.16,2.285),(.155,.23,.08),cream)
tube('MouseCenterSeam',[(1.3,-.36,2.30),(1.3,-.25,2.357),(1.3,-.08,2.365)],.005,edge)
box('MousePad',(1.31,-.14,2.22),(.62,.69,.015),rubber,.12)

# Coffee cup with inner wall, dark drink and glazed handle.
cup=empty('CoffeeCup',(1.53,.83,2.215),studio)
cylinder('CupFoot',(0,0,.045),.17,.055,cream,cup)
cylinder('CupBody',(0,0,.22),.215,.34,cream,cup)
cylinder('CoffeeSurface',(0,0,.394),.175,.008,coffee,cup,48,.003)
torus('CupRim',(0,0,.394),.195,.020,cream,cup)
torus('CupHandle',(.235,0,.245),.125,.037,cream,cup,rotation=(math.pi/2,0,0))
torus('CoffeeCrema',(0,0,.400),.164,.005,brass,cup)

# Notebook and pen add a little human imperfection.
notebook=empty('Notebook',(-1.64,.57,2.227),studio); notebook.rotation_euler.z=.20
box('NotebookCover',(0,0,0),(.68,.85,.055),lime,.025,notebook)
box('NotebookPages',(0,-.004,.02),(.636,.80,.030),cream,.008,notebook)
box('NotebookTop',(0,0,.042),(.68,.85,.018),lime,.012,notebook)
box('NotebookElastic',(.225,0,.057),(.025,.848,.01),ink,.001,notebook)
pen=cylinder('Pen',(-.14,.03,.09),.025,.61,black,notebook,20,.008); pen.rotation_euler=(math.pi/2,0,.24)

# Chair: warm black shell, padded seat, brushed base and casters.
chair=empty('Chair',(-1.53,-1.48,0),studio); chair.rotation_euler.z=-.18
cylinder('ChairPost',(0,0,.66),.065,1.1,edge,chair)
cylinder('ChairCollar',(0,0,.40),.089,.34,black,chair)
for i in range(5):
    a=i*math.tau/5
    ex,ey=.55*math.cos(a),.55*math.sin(a)
    tube('ChairFoot',[(0,0,.19),(ex*.55,ey*.55,.15),(ex,ey,.14)],.039,edge,chair)
    caster=cylinder('ChairCaster',(ex,ey,.095),.075,.083,rubber,chair,20,.012); caster.rotation_euler.x=math.pi/2
box('ChairSeat',(0,0,1.24),(1.24,1.15,.16),black,.16,chair)
box('ChairCushion',(0,-.035,1.335),(1.10,1.02,.15),rubber,.16,chair)
back=box('ChairBack',(0,.47,1.83),(1.22,.16,1.09),black,.17,chair); back.rotation_euler.x=-.11
backpad=box('ChairBackPad',(0,.363,1.87),(1.06,.075,.85),rubber,.11,chair); backpad.rotation_euler.x=-.11
for x in [-.63,.63]:
    tube('ChairArm',[(x,.20,1.24),(x,.15,1.74),(x,-.28,1.74)],.039,edge,chair)
    box('ChairArmPad',(x,-.06,1.765),(.12,.51,.055),rubber,.045,chair)

# A small sleeping companion. Every meaningful part has an animation pivot.
cat=empty('Cat',(0,-.08,1.415),chair)
uv('CatBody',(0,.06,.285),(.38,.45,.33),white,cat,32,16)
uv('CatHaunchLeft',(-.26,.16,.205),(.24,.28,.23),white,cat)
uv('CatHaunchRight',(.26,.16,.205),(.24,.28,.23),white,cat)
for side,x in [('Left',-.205),('Right',.205)]:
    leg=empty('CatLeg'+side,(x,-.28,.20),cat)
    uv('CatLegMesh'+side,(0,0,-.035),(.103,.15,.21),white,leg)
    uv('CatPaw'+side,(0,-.065,-.145),(.132,.175,.087),white,leg)
    for dx in [-.039,.039]:
        tube('CatToe'+side,[(dx,-.211,-.127),(dx,-.215,-.153)],.005,cream,leg,1)
head=empty('CatHead',(0,-.30,.565),cat)
uv('CatHeadShape',(0,0,0),(.35,.278,.285),white,head,32,16)
uv('CatMuzzleL',(-.09,-.226,-.092),(.137,.09,.091),white,head)
uv('CatMuzzleR',(.09,-.226,-.092),(.137,.09,.091),white,head)
def ear(name,x):
    verts=[(x-.117,.065,.15),(x+.117,.065,.15),(x+.087,-.085,.17),(x-.087,-.085,.17),(x+(-.035 if x<0 else .035),.0,.452)]
    faces=[(0,1,2,3),(0,4,1),(1,4,2),(2,4,3),(3,4,0)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); finish(o,name,white,head)
    be=o.modifiers.new('Soft ear edges','BEVEL'); be.width=.026; be.segments=3
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=be.name)
    verts=[(x-.061,-.086,.199),(x+.061,-.086,.199),(x+(-.023 if x<0 else .023),-.023,.379)]
    mesh=bpy.data.meshes.new(name+'Pink'); mesh.from_pydata(verts,[],[(0,1,2)]); mesh.update()
    o=bpy.data.objects.new(name+'Pink',mesh); bpy.context.collection.objects.link(o); finish(o,name+'Pink',pink,head,False)
ear('CatEarLeft',-.237); ear('CatEarRight',.237)
eyes_closed=empty('CatEyesClosed',parent=head)
eyes_open=empty('CatEyesOpen',parent=head)
for x in [-.136,.136]:
    tube('CatSleepingEye',[(x-.053,-.247,.013),(x,-.265,-.014),(x+.053,-.247,.013)],.009,ink,eyes_closed)
    uv('CatOpenIris',(x,-.250,.018),(.060,.025,.069),lime,eyes_open,20,12)
    uv('CatOpenPupil',(x,-.274,.018),(.014,.008,.051),ink,eyes_open,16,10)
    uv('CatEyeGlint',(x-.015,-.282,.043),(.012,.005,.012),cream,eyes_open,12,8)
# Keep geometry in the GLB while making the initial sleeping pose unchanged.
# Runtime swaps these groups between scale (1,1,1) and (.001,.001,.001).
eyes_open.scale=(.001,.001,.001)
eyes_open['initialState']='collapsed; scale to 1 to wake the cat'
eyes_closed['initialState']='visible; collapse or hide when the cat wakes'
uv('CatNose',(0,-.314,-.083),(.038,.024,.026),pink,head,16,8)
tube('CatSmile',[(-.05,-.308,-.124),(0,-.32,-.139),(.05,-.308,-.124)],.005,ink,head,1)
for sign in [-1,1]:
    for i in range(2):
        tube('CatWhisker',[(sign*.16,-.28,-.095+i*.036),(sign*.28,-.30,-.089+i*.044),(sign*.41,-.267,-.063+i*.05)],.0028,cream,head,1)
tail=empty('CatTail',(.25,.29,.22),cat)
tube('CatTailShape',[(0,0,0),(.17,-.04,-.05),(.22,-.31,-.10),(.18,-.53,-.12),(-.02,-.66,-.12),(-.18,-.60,-.105)],.072,white,tail,3)
uv('CatTailTip',(-.18,-.60,-.105),(.076,.075,.073),white,tail)

# Small desk plant, asymmetric sculptural leaves.
plant=empty('Plant',(2.00,.83,2.22),studio)
cylinder('PlantPot',(0,0,.16),.19,.32,cream,plant)
cylinder('PlantSoil',(0,0,.324),.167,.008,soil,plant,32,.0)
for i in range(5):
    a=i*2.4
    h=.40+.1*(i%3)
    ex,ey=.18*math.cos(a),.18*math.sin(a)
    tube('PlantStem',[(0,0,.3),(ex*.35,ey*.35,.3+h*.6),(ex,ey,.3+h)],.011,leafmat,plant,1)
    leaf=uv('PlantLeaf',(ex,ey,.3+h),(.095,.045,.22),leafmat,plant,16,8)
    leaf.rotation_euler=(math.cos(a)*.6,math.sin(a)*.6,a)

# Batch static sibling geometry by material. This turns dozens of individual
# keycaps into a handful of GPU draw calls while retaining every animation pivot.
for parent in [studio,desk,laptop,display,keyboard,cup,notebook,chair,cat,head,eyes_closed,eyes_open,tail,plant]:
    batches={}
    for child in list(parent.children):
        if child.type=='MESH' and len(child.data.materials)==1:
            material=child.data.materials[0]
            batches.setdefault(material.name,[]).append(child)
    for material_name,objects in batches.items():
        if len(objects)<2: continue
        bpy.ops.object.select_all(action='DESELECT')
        for child in objects: child.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        bpy.context.object.name=parent.name+'Surface_'+material_name.split(' · ')[0].replace(' ','')

# Named root space, explicit metadata for consumers.
studio['license']='Original artwork created for Alexis Flores; editable source included.'
cat['interaction']='Animate CatHead and CatTail local rotations; Cat local translation for waking. Toggle CatEyesClosed and CatEyesOpen via visibility or scale.'
bpy.context.view_layer.update()

# Studio illumination. Lighting remains in the .blend; GLB uses web lighting.
world=bpy.context.scene.world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.18,.13,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5
def area(name,loc,power,color,size,target):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color; data.shape='DISK'; data.size=size
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Key softbox',(-3,-4,8),1100,(.94,1,.88),5,(0,0,1))
area('Lime rim',(3,4,5),1400,(.70,1,.36),4,(0,0,1.5))
area('Cool front',(4,-4,4),650,(.73,.85,1),4,(0,0,1))
area('Desk detail',(-4,2,4),650,(1,.89,.67),3,(0,0,2))

bpy.ops.object.camera_add(location=(7.8,-10.5,7.4))
camera=bpy.context.object; camera.name='EditorialCamera'
target=Vector((0,-.20,1.15)); camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'; camera.data.ortho_scale=8.05; camera.data.lens=50
scene=bpy.context.scene; scene.camera=camera
scene.render.engine='CYCLES'; scene.cycles.samples=40; scene.cycles.use_denoising=True
scene.cycles.device='CPU'
scene.render.resolution_x=1300; scene.render.resolution_y=1100; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'

# Export selected geometry and hierarchy only. Draco is deliberately omitted so
# loading works without a second decoder request; meshes share key geometry later.
bpy.ops.object.select_all(action='DESELECT')
def select_tree(o):
    o.select_set(True)
    for child in o.children: select_tree(child)
select_tree(studio)
bpy.context.view_layer.objects.active=studio
bpy.ops.export_scene.gltf(filepath=str(MODELS/'studio.glb'),export_format='GLB',use_selection=True,export_cameras=False,export_lights=False,export_animations=False,export_extras=True,export_yup=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-source'/'studio.blend'))
print('STUDIO_GLB_READY',os.path.getsize(MODELS/'studio.glb'),flush=True)
if '--skip-render' not in sys.argv:
    scene.render.filepath=str(IMAGES/'studio-poster.png')
    bpy.ops.render.render(write_still=True)
print('STUDIO_COMPLETE',flush=True)
