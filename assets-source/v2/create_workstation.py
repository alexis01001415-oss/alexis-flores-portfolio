"""Original, editable Blender product scene for Alexis Flores. Blender 5.1.
Build: blender --background --python assets-source/v2/create_workstation.py
Optional -- --render after script name renders the closed hero and an open QA shot.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)

def rgb(h):
    c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in c)

def material(name,hex,metal=0,rough=.4):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*rgb(hex),1)
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb(hex),1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m

def image_texture(mat,path,socket,noncolor=False):
    nodes=mat.node_tree.nodes; p=nodes.get('Principled BSDF')
    t=nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(HERE/path),check_existing=True)
    if noncolor:t.image.colorspace_settings.name='Non-Color'
    mat.node_tree.links.new(t.outputs['Color'],p.inputs[socket]);return t

aluminum=material('Brushed graphite aluminum','A6A7AA',.94,.29)
image_texture(aluminum,'aluminum-base.png','Base Color')
image_texture(aluminum,'aluminum-roughness.png','Roughness',True)
polished=material('Precision polished aluminum bevel','A9AAAD',.97,.19)
stone=material('Honed dark basalt · fine mineral grain','201E1C',.04,.44)
image_texture(stone,'stone-base.png','Base Color')
image_texture(stone,'stone-roughness.png','Roughness',True)
rubber=material('Black elastomer','141414',0,.65)
keymat=material('Concave graphite keycaps','1D1D1E',.03,.39)
bezelmat=material('Black glass bezel','0C0C0D',.1,.13)
porcelain=material('Warm ivory glazed porcelain','F2EAE3',0,.19)
p=porcelain.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.3;p.inputs['Coat Roughness'].default_value=.13
paper=material('Warm uncoated paper','DCD6CE',0,.82)
cover=material('Black buckram notebook cover','252322',0,.74)
red=material('Red translucent acrylic','FF073A',.04,.17)
p=red.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.25;p.inputs['IOR'].default_value=1.46;p.inputs['Coat Weight'].default_value=.45
coffee=material('Espresso · dark reflective surface','211009',0,.15)
crema=material('Fine espresso crema at meniscus','985D24',0,.32)
screenmat=material('Retina display · replace at runtime','F2EAE3',0,.6)
t=image_texture(screenmat,'screen-default.jpg','Base Color')
p=screenmat.node_tree.nodes.get('Principled BSDF');screenmat.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.4
legends=material('Printed pale gray key legends','D0C9C3',0,.7)
t=image_texture(legends,'key-legends.png','Base Color')
legends.node_tree.links.new(t.outputs['Alpha'],legends.node_tree.nodes.get('Principled BSDF').inputs['Alpha'])
legends.surface_render_method='DITHERED'

def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
work=empty('Workstation')
def finish(o,name,mat,parent,smooth=True):
    o.name=name;o.parent=parent
    if mat:o.data.materials.append(mat)
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    return o
def box(name,loc,size,mat,parent,bevel=.015,segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(o,name,mat,parent)
    if bevel:
        mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=segments
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Weighted machined normals','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def cyl(name,loc,radius,depth,mat,parent,vertices=48,bevel=.005):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=finish(bpy.context.object,name,mat,parent)
    if bevel:
        mod=o.modifiers.new('Edge radius','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def torus(name,loc,major,minor,mat,parent,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=10,location=loc,major_radius=major,minor_radius=minor,rotation=rotation)
    return finish(bpy.context.object,name,mat,parent)
def join(objects,name,parent):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;o.parent=parent;return o
def mesh(name,verts,faces,mat,parent,uvs=None,smooth=False):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);finish(o,name,mat,parent,smooth)
    if uvs:
        layer=data.uv_layers.new(name='UVMap')
        for poly in data.polygons:
            for li in poly.loop_indices:layer.data[li].uv=uvs[data.loops[li].vertex_index]
    return o
def lathe(name,profile,mat,parent,sides=96):
    verts=[];faces=[]
    for r,z in profile:
        for i in range(sides):
            a=i*math.tau/sides;verts.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(sides):
            k=j*sides+i;n=j*sides+(i+1)%sides;faces.append((k,n,n+sides,k+sides))
    return mesh(name,verts,faces,mat,parent,smooth=True)

# A slab with micro bevels, no supporting floor/platform or furniture.
desk=empty('Desk',parent=work)
box('Basalt desktop',(0,.15,-.16),(9.7,4.85,.32),stone,desk,.045,4)
box('Under edge shadow line',(0,.15,-.286),(9.60,4.75,.058),rubber,desk,.024)

# Laptop. Local Blender +Y is the hinge/back. Lid rotates about local X.
laptop=empty('Laptop',(0,-.08,.042),work)
base=empty('LaptopBase',parent=laptop)
box('Unibody lower shell',(0,0,.058),(3.34,2.16,.116),aluminum,base,.062,5)
box('Machined upper deck',(0,0,.111),(3.31,2.13,.035),aluminum,base,.043,4)
box('Keyboard recessed well',(0,.315,.132),(2.76,1.225,.011),rubber,base,.035,4)
box('Trackpad polished perimeter',(0,-.623,.133),(1.33,.623,.01),polished,base,.038,4)
box('Large glass trackpad',(0,-.623,.140),(1.309,.602,.01),aluminum,base,.033,4)
box('Front opening finger recess',(0,-1.074,.093),(.47,.012,.035),rubber,base,.012)

# Every key has its own beveled volume; one merged mesh keeps draw calls low.
rows=[(['esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','●'],[1]*14),
      (['`','1','2','3','4','5','6','7','8','9','0','−','=','⌫'],[1]*13+[1.45]),
      (['tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],[1.45]+[1]*13),
      (['caps','A','S','D','F','G','H','J','K','L',';','\u0027','enter'],[1.75]+[1]*11+[1.70]),
      (['shift','Z','X','C','V','B','N','M',',','.','/','shift'],[2.20]+[1]*10+[2.25]),
      (['fn','ctrl','opt','cmd','','cmd','opt','←','↑','↓','→'],[1,1,1,1.25,4.5,1.25,1,1,1,1,1])]
caps=[];verts=[];faces=[];uvs=[];idx=0
for row,(labels,weights) in enumerate(rows):
    total=sum(weights);unit=2.67/total;y=.843-row*.194
    cursor=-1.335
    for label,weight in zip(labels,weights):
        w=unit*weight;x=cursor+w/2;cursor+=w
        caps.append(box('Keycap', (x,y,.15),(w-.022,.168 if row else .139,.027),keymat,base,.016,3))
        sw=(w-.022)*.75;sh=.122 if row else .11;v=len(verts)
        verts += [(x-sw/2,y-sh/2,.1645),(x+sw/2,y-sh/2,.1645),(x+sw/2,y+sh/2,.1645),(x-sw/2,y+sh/2,.1645)]
        faces.append((v,v+1,v+2,v+3))
        col=idx%8;r=idx//8;u0=col*128/1024;u1=(col+1)*128/1024;v0=1-(r+1)*80/1024;v1=1-r*80/1024
        uvs += [(u0,v0),(u1,v0),(u1,v1),(u0,v1)];idx+=1
join(caps,'Keyboard · 78 individually shaped keycaps',base)
mesh('Keyboard legends',verts,faces,legends,base,uvs)

# Speaker perforations, microphone and USB-C port details.
holes=[];faces=[]
for sx in [-1,1]:
    for yi in range(30):
        for xi in range(4):
            x=sx*(1.43+xi*.032);y=-.22+yi*.034;v=len(holes)
            holes += [(x+math.cos(i*math.tau/6)*.007,y+math.sin(i*math.tau/6)*.007,.130) for i in range(6)]
            faces.append(tuple(range(v,v+6)))
mesh('Laser drilled speaker arrays',holes,faces,rubber,base)
for sx in [-1,1]:
    for y in [.50,.78]:
        box('USB-C recessed port',(sx*1.664,y,.071),(.005,.122,.042),rubber,base,.014)
        box('USB-C center tongue',(sx*1.668,y,.071),(.006,.072,.013),polished,base,.004)
for x in [-1.18,1.18]:
    for y in [-.72,.70]:cyl('Rubber foot',(x,y,-.004),.112,.028,rubber,base)
hinge=cyl('Continuous precision hinge',(0,1.011,.153),.068,2.79,rubber,base,64)
hinge.rotation_euler[1]=math.pi/2
for x in [-1.44,1.44]:
    h=cyl('Hinge polished end cap',(x,1.011,.153),.066,.084,polished,base,48);h.rotation_euler[1]=math.pi/2

lid=empty('LaptopLid',(0,1.014,.170),laptop)
box('Display rear aluminum enclosure',(0,-1.026,.012),(3.34,2.106,.066),aluminum,lid,.055,5)
box('Display glass black bezel',(0,-1.026,-.027),(3.269,2.035,.012),bezelmat,lid,.038,4)
# Display underside: normals are local -Z, UV top is hinge side while open.
w=3.08;bottom=-1.971;top=-.082;z=-.034
screen=mesh('ScreenSurface',[(-w/2,bottom,z),(-w/2,top,z),(w/2,top,z),(w/2,bottom,z)],[(0,1,2,3)],screenmat,lid,[(0,1),(0,0),(1,0),(1,1)])
cameraLens=cyl('Camera lens',(0,-1.996,-.0355),.011,.005,rubber,lid,24);cameraLens.rotation_euler[0]=math.pi
lid.rotation_euler[0]=math.radians(-8)

# Warm porcelain cup is a revolved real hollow vessel with rounded lip.
cup=empty('CoffeeCup',(2.43,.33,.012),work)
profile=[(.0,.012),(.153,.012),(.166,.020),(.184,.065),(.224,.33),(.231,.397),(.230,.409),(.223,.416),(.214,.413),(.210,.403),(.205,.338),(.166,.092),(.147,.055),(.0,.055)]
lathe('Porcelain cup hollow shell',profile,porcelain,cup)
handle=torus('Porcelain loop handle',(.249,0,.244),.116,.033,porcelain,cup,(math.pi/2,0,0));handle.scale=(.9,1,1.25)
cyl('Espresso surface',(0,0,.363),.206,.005,coffee,cup,96,0)
torus('Espresso crema meniscus',(0,0,.366),.198,.007,crema,cup)
saucer=lathe('Porcelain saucer',[(0,0),(.275,0),(.335,.018),(.395,.042),(.397,.052),(.386,.060),(.316,.034),(.21,.022),(0,.022)],porcelain,cup)

# Stitched notebook with separated pages, bookmark and closure strap.
notebook=empty('Notebook',(-2.64,.06,.01),work);notebook.rotation_euler[2]=math.radians(-12)
box('Notebook paper block',(0,0,.081),(1.34,1.79,.133),paper,notebook,.023,3)
box('Notebook bottom cover',(0,0,.015),(1.42,1.86,.026),cover,notebook,.036)
box('Notebook upper cover',(0,0,.163),(1.42,1.86,.030),cover,notebook,.038)
box('Notebook binding spine',(-.684,0,.085),(.073,1.855,.145),cover,notebook,.036)
box('Notebook woven closure band',(.466,0,.183),(.043,1.86,.009),rubber,notebook,.003)
box('Red woven bookmark',(-.303,-.76,.115),(.055,.64,.007),red,notebook,.002)
pages=[]
for z in [.036,.05,.065,.08,.093,.107,.124,.14]:
    pages.append(box('Paper edge',(0,-.90,z),(1.29,.003,.002),cover,notebook,.0008,1))
join(pages,'Subtle paper page divisions',notebook)

pen=empty('Pen',(-1.75,-.41,.071),work);pen.rotation_euler[2]=math.radians(-13)
barrel=cyl('Anodized pen barrel',(0,0,0),.029,1.15,cover,pen,32);barrel.rotation_euler[0]=math.pi/2
tip=cyl('Machined pen nose',(0,-.598,0),.021,.086,polished,pen,32);tip.rotation_euler[0]=math.pi/2
end=cyl('Pen end cap',(0,.601,0),.030,.06,polished,pen,32);end.rotation_euler[0]=math.pi/2
box('Pen spring pocket clip',(0,.381,.031),(.019,.30,.012),polished,pen,.007)

accent=empty('AccentObject',(2.07,1.32,.195),work);accent.rotation_euler[2]=math.radians(16)
box('Solid ruby acrylic paperweight',(0,0,0),(.39,.39,.39),red,accent,.019,5)

# Render lights and camera are excluded from web export.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.world.color=(.05,.05,.05)
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(*rgb('2C2927'),1);bg.inputs['Strength'].default_value=.35
def area(name,loc,power,color,size,target,shape='DISK',size_y=None):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape=shape;d.size=size
    if size_y and hasattr(d,'size_y'):d.size_y=size_y
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
area('Large warm key',(-3,-1.7,5.4),650,(1,.9,.79),5,(0,0,0),'RECTANGLE',3.5)
area('Long white strip edge',(1.3,3.4,3.4),820,(1,.97,.92),6.0,(0,0,0),'RECTANGLE',.65)
area('Quiet front fill',(2,-4,2.8),145,(.77,.85,1),4,(0,0,0))
area('Neutral grazing edge',(4,1.7,1.8),150,(1,.97,.92),2.5,(0,0,0),'RECTANGLE',.4)
cameraData=bpy.data.cameras.new('Product camera');camera=bpy.data.objects.new('Product camera',cameraData);bpy.context.collection.objects.link(camera)
camera.location=(5.8,-9.4,5.7);target=Vector((0,.12,.05));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();cameraData.type='PERSP';cameraData.lens=48;scene.camera=camera
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.25
scene.render.image_settings.color_mode='RGB'

# Keep the scene editable; apply bevels already present in export meshes.
for img in bpy.data.images:
    if img.source=='FILE':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'workstation-v2.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in work.children_recursive+[work]:obj.select_set(True)
bpy.context.view_layer.objects.active=work
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/workstation-v2.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_materials='EXPORT',export_image_format='AUTO',export_texcoords=True,export_normals=True)
print('ASSET_READY',sum(o.type=='MESH' for o in work.children_recursive),(ROOT/'public/models/workstation-v2.glb').stat().st_size)
if '--render' in sys.argv:
    scene.render.filepath=str(HERE/'hero-render.png');bpy.ops.render.render(write_still=True)
    lid.rotation_euler[0]=math.radians(-105)
    scene.render.filepath=str(HERE/'open-laptop-qa.png');bpy.ops.render.render(write_still=True)
    print('RENDERS_READY')
