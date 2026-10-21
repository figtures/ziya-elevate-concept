#!/usr/bin/env python3
"""Cut genuine client footage without selfie shots or baked dissolves.

The available master is 1280x720/24fps. 1080p is a delivery-size upscale,
not newly recovered detail. Four clean ranges total 3.333 seconds: longer
2.5–3 second shots and a sound showreel require the original recordings.
"""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil,subprocess

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'website/assets/hero-loop-v5.mp4'
RANGES=[
 {'label':'TEDx geniş plan','startFrame':6,'endFrame':27},
 {'label':'Büyük salon','startFrame':36,'endFrame':57},
 {'label':'Seyirci','startFrame':204,'endFrame':225},
 {'label':'Ziya sahnede orta plan','startFrame':172,'endFrame':189},
]
outputs=[]
for width,height,name,cap in [(1920,1080,'hero-stage-clean-1080.mp4',5_000_000),(1280,720,'hero-stage-clean-720.mp4',2_500_000)]:
 target=ROOT/'website/assets'/name
 filters=[]
 for i,c in enumerate(RANGES):
  filters.append(f'[0:v]trim=start_frame={c["startFrame"]}:end_frame={c["endFrame"]},setpts=PTS-STARTPTS[v{i}]')
 filters.append(''.join(f'[v{i}]' for i in range(4))+f'concat=n=4:v=1:a=0,scale={width}:{height}:flags=lanczos,setsar=1,format=yuv420p[out]')
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(SOURCE),'-filter_complex',';'.join(filters),'-map','[out]','-an','-c:v','libx264','-preset','slow','-crf','22','-r','24','-movflags','+faststart',str(target)],check=True)
 shutil.copyfile(target,ROOT/'public/assets'/name)
 if target.stat().st_size>cap:raise ValueError(f'{name} exceeds size limit')
 outputs.append({'src':f'/assets/{name}','width':width,'height':height,'bytes':target.stat().st_size,'codec':'h264','sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
poster_source=ROOT/'website/assets/tedx-oan-sahne-genis.jpg'
with Image.open(poster_source) as image:
 image=image.convert('RGB')
 for ext,settings in [('avif',{'quality':65}),('jpg',{'quality':88,'optimize':True})]:
  target=ROOT/'website/assets'/f'hero-stage-clean.{ext}'
  image.save(target,**settings);shutil.copyfile(target,ROOT/'public/assets'/target.name)
manifest={'source':'/assets/hero-loop-v5.mp4','sourceSize':[1280,720],'sourceFPS':24,'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'editing':'hard cuts; original timing; no selfie, generated footage, interpolation, freeze frames or dissolves','clips':[{**r,'duration':(r['endFrame']-r['startFrame'])/24} for r in RANGES],'duration':sum(r['endFrame']-r['startFrame'] for r in RANGES)/24,'outputs':outputs,'poster':'/assets/hero-stage-clean.avif','posterSource':'/assets/tedx-oan-sahne-genis.jpg','limitations':['1080p delivery is scaled from native720p.','Four2.5–3second shots require the longer original recordings.','Available original media has no audio.90second showreel requires original stage footage with sound.','Only actual existing photos were used. Native2400px stage photos and three highresolution portrait originals are not supplied.']}
(ROOT/'scripts/hero-media-edit.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
