"""Cut the speaker out of a 1080x1920 clip -> VP9 webm with alpha.  usage: matte.py clip.mp4 out.webm model.tflite"""
import subprocess, sys
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

src, out, model = sys.argv[1:4]
W, H = 1080, 1920
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-deadline", "realtime", "-cpu-used", "8",
                        "-row-mt", "1", "-auto-alt-ref", "0", "-g", "15", out], stdin=subprocess.PIPE)
prev, i = None, 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    res = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(i * 1000 / 30))
    person = np.clip((1.0 - res.confidence_masks[0].numpy_view() - 0.35) / 0.3, 0, 1)
    prev = person if prev is None else 0.6 * person + 0.4 * prev
    enc.stdin.write(np.dstack([rgb, (prev * 255).astype(np.uint8)]).tobytes())
    i += 1
enc.stdin.close()
enc.wait()
print("кадров вырезано:", i)
