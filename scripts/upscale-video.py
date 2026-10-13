"""CPU neural super-resolution for an existing video, with unchanged timing.

Requires opencv-contrib-python-headless, ffmpeg, and FSRCNN_x4.pb from
https://github.com/Saafke/FSRCNN_Tensorflow/tree/master/models
The model adds estimated detail; it cannot recover a native HD camera master.
"""
import argparse
import cv2
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('target')
parser.add_argument('--model', required=True)
parser.add_argument('--scale', type=int, choices=[2,3,4], default=4)
args = parser.parse_args()
cv2.setNumThreads(4)
cap = cv2.VideoCapture(args.source)
if not cap.isOpened():
    raise SystemExit('Cannot open source video')
fps = cap.get(cv2.CAP_PROP_FPS)
width, height = (int(cap.get(p)) for p in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT))
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(args.model)
sr.setModel('fsrcnn', args.scale)
encoder = subprocess.Popen([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width*args.scale}x{height*args.scale}',
    '-r', str(fps), '-i', '-', '-an', '-c:v', 'libx264', '-threads', '3',
    '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    args.target
], stdin=subprocess.PIPE)
count = 0
started = time.monotonic()
try:
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        result = sr.upsample(frame)
        encoder.stdin.write(result.tobytes())
        count += 1
        if count % 60 == 0:
            print(f'{count} frames processed', flush=True)
finally:
    cap.release()
    encoder.stdin.close()
code = encoder.wait()
if code:
    raise SystemExit(code)
print(f'{count} frames, {width*args.scale}x{height*args.scale}, {time.monotonic()-started:.1f}s elapsed')
