#!/usr/bin/env python3
"""Make the V13 11-second hero from four genuine, non-selfie stage shots.

The supplied 720p montage contains dissolves and sub-second clean shots. Each
selected source range is retimed to 66 output frames (2.75 seconds at 24fps).
No new visual events, interpolation, dissolve, endpoint freeze, or audio is
created. Standard frame repetition is inherent to the slow-motion retiming.
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'website/assets/hero-loop-v5.mp4'
FPS = 24
SHOT_FRAMES = 66
RANGES = [
    {'label': 'TEDx geniş plan', 'startFrame': 6, 'endFrame': 27},
    {'label': 'Büyük salon', 'startFrame': 40, 'endFrame': 53},
    {'label': 'Seyirci genel plan', 'startFrame': 211, 'endFrame': 225},
    {'label': 'Ziya sahnede orta plan', 'startFrame': 174, 'endFrame': 189},
]

def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
    ]))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

outputs = []
for width, height, filename, limit in [
    (1920, 1080, 'hero-stage-v13-1080.mp4', 5_000_000),
    (1280, 720, 'hero-stage-v13-720.mp4', 2_500_000),
]:
    target = ROOT / 'website/assets' / filename
    filters = []
    for index, clip in enumerate(RANGES):
        source_frames = clip['endFrame'] - clip['startFrame']
        # Align first and last source frames with first and last output frames.
        # fps repeats existing frames; there is deliberately no minterpolate.
        factor = (SHOT_FRAMES - 1) / (source_frames - 1)
        filters.append(
            f'[0:v]trim=start_frame={clip["startFrame"]}:end_frame={clip["endFrame"]},'
            f'setpts=(PTS-STARTPTS)*{factor:.12f},fps={FPS}:round=near,'
            f'trim=end_frame={SHOT_FRAMES},setpts=PTS-STARTPTS[v{index}]'
        )
    filters.append(
        ''.join(f'[v{i}]' for i in range(len(RANGES)))
        + f'concat=n=4:v=1:a=0,scale={width}:{height}:flags=lanczos,setsar=1,format=yuv420p[out]'
    )
    subprocess.run([
        'ffmpeg', '-y', '-v', 'error', '-i', str(SOURCE), '-filter_complex', ';'.join(filters),
        '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
        '-r', str(FPS), '-g', str(SHOT_FRAMES), '-keyint_min', str(SHOT_FRAMES),
        '-force_key_frames', '0,2.75,5.5,8.25', '-movflags', '+faststart', str(target)
    ], check=True)
    info = probe(target)
    video = next(stream for stream in info['streams'] if stream['codec_type'] == 'video')
    if int(video['nb_frames']) != SHOT_FRAMES * len(RANGES):
        raise ValueError(f'{filename}: expected 264 frames, got {video["nb_frames"]}')
    if abs(float(info['format']['duration']) - 11) > 0.001:
        raise ValueError(f'{filename}: duration is not 11 seconds')
    if any(stream['codec_type'] == 'audio' for stream in info['streams']):
        raise ValueError('Hero must remain silent')
    if target.stat().st_size > limit:
        raise ValueError(f'{filename}: exceeds delivery size budget')
    shutil.copyfile(target, ROOT / 'public/assets' / filename)
    outputs.append({
        'src': f'/assets/{filename}', 'width': width, 'height': height,
        'duration': 11, 'frames': SHOT_FRAMES * len(RANGES), 'fps': FPS,
        'bytes': target.stat().st_size, 'codec': 'h264', 'sha256': sha(target),
    })

manifest = {
    'source': '/assets/hero-loop-v5.mp4', 'sourceSize': [1280, 720], 'sourceFPS': FPS,
    'sourceSha256': sha(SOURCE),
    'editing': 'four shots with three hard cuts; source frames retimed; no generated or interpolated images; no selfie or phone-recorded shot; no endpoint freeze; no audio',
    'duration': 11, 'frames': SHOT_FRAMES * len(RANGES), 'fps': FPS,
    'clips': [{
        **clip, 'sourceDuration': (clip['endFrame'] - clip['startFrame']) / FPS,
        'outputStart': index * SHOT_FRAMES / FPS,
        'outputEnd': (index + 1) * SHOT_FRAMES / FPS,
        'duration': SHOT_FRAMES / FPS, 'outputFrames': SHOT_FRAMES,
        'timestampScale': (SHOT_FRAMES - 1) / (clip['endFrame'] - clip['startFrame'] - 1),
    } for index, clip in enumerate(RANGES)],
    'outputs': outputs,
    'poster': '/assets/hero-stage-clean.avif',
    'excludedSource': {'src': '/assets/klip-uluslararasi.mp4', 'reason': 'Entire source is selfie/phone footage.'},
    'limitations': [
        'The supplied clean shot ranges are 0.542–0.875 seconds. They are retimed to 2.75 seconds; natural-speed 2.5–3 second takes are not available.',
        'Constant-frame-rate slow motion repeats source frames; no motion interpolation or new visual content is generated.',
        '1080p delivery is scaled from native 720p, not a native 1080p or 8K camera recording.',
        'All supplied source videos are silent and at most 11 seconds; a genuine 75–90 second showreel with punchlines and applause requires additional source recordings.',
    ],
    'verified': {'durationAndFrames': True, 'sourceContactsVisuallyInspected': True, 'hardCuts': [2.75, 5.5, 8.25], 'audioStreams': 0},
}
(ROOT / 'scripts/v13-hero-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'duration': manifest['duration'], 'shots': len(RANGES), 'outputs': outputs}, ensure_ascii=False, indent=2))
