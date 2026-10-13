"""Restore original client footage with official Real-ESRGAN general x4v3.

Estimated detail, not native HD/8K. No face replacement or generative new frames.
Requires torch (CPU), opencv-python, numpy and ffmpeg.
Model: https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0
Vendored architecture attribution is in vendor/Real-ESRGAN-LICENSE.txt.
"""
import argparse, cv2, json, numpy as np, subprocess, time, torch
from vendor.srvgg_arch import SRVGGNetCompact

parser=argparse.ArgumentParser()
parser.add_argument('source');parser.add_argument('target')
parser.add_argument('--model',required=True)
parser.add_argument('--width',type=int,required=True)
parser.add_argument('--threads',type=int,default=7)
args=parser.parse_args()
torch.set_num_threads(args.threads)
cv2.setNumThreads(1)
model=SRVGGNetCompact(num_conv=32).eval()
model.load_state_dict(torch.load(args.model,map_location='cpu',weights_only=True)['params'])
model=model.to(dtype=torch.bfloat16,memory_format=torch.channels_last)
cap=cv2.VideoCapture(args.source)
if not cap.isOpened(): raise SystemExit('Cannot open source')
fps=cap.get(cv2.CAP_PROP_FPS)
w,h=(int(cap.get(p)) for p in (cv2.CAP_PROP_FRAME_WIDTH,cv2.CAP_PROP_FRAME_HEIGHT))
height=round(args.width*h/w)//2*2
encoder=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{args.width}x{height}','-r',str(fps),'-i','-','-an','-c:v','libx264','-threads','2','-preset','slow','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',args.target],stdin=subprocess.PIPE)
started=time.monotonic();count=0
try:
 with torch.inference_mode():
  while True:
   ok,frame=cap.read()
   if not ok: break
   x=torch.from_numpy(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB).transpose(2,0,1).copy()).unsqueeze(0).to(dtype=torch.bfloat16,memory_format=torch.channels_last)/255
   result=model(x).float().clamp_(0,1).squeeze(0).permute(1,2,0).numpy()
   result=cv2.cvtColor(np.uint8(np.rint(result*255)),cv2.COLOR_RGB2BGR)
   if result.shape[1]!=args.width: result=cv2.resize(result,(args.width,height),interpolation=cv2.INTER_AREA)
   # Retain a small amount of source texture rather than an entirely smoothed result.
   original=cv2.resize(frame,(args.width,height),interpolation=cv2.INTER_CUBIC)
   result=cv2.addWeighted(result,.85,original,.15,0)
   encoder.stdin.write(result.tobytes());count+=1
   if count%24==0: print(json.dumps({'source':args.source,'frames':count,'elapsed_seconds':round(time.monotonic()-started)}),flush=True)
finally:
 cap.release();encoder.stdin.close()
if encoder.wait(): raise SystemExit('Encoder failed')
print(json.dumps({'frames':count,'width':args.width,'height':height,'seconds':round(time.monotonic()-started)}),flush=True)
