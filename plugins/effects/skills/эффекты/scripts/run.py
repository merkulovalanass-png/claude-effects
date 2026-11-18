#!/usr/bin/env python3
"""/эффекты — apply one of 7 motion effects to a vertical talking-head video.

usage: run.py <effect> <video> [--set '{"word": "СВЕТОЧКА"}'] [--out path.mp4]
effects: стекло|glass, орбита|orbit, прожектор|spotlight, чеклист|checklist, таймлайн|timeline, склейка|matchcut, тумблеры|toggles

Engine (Remotion + node_modules) lives in ~/.effects/engine, the cut-out venv in ~/.effects/venv.
Personal defaults: ~/.effects/config.json  ({"spotlight": {"word": "..."}, "matchcut": {"handle": "..."}, "covers_dir": "..."}).
"""
import argparse, array, json, math, os, random, shutil, struct, subprocess, sys, wave
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
HOME = Path.home() / ".effects"
ENGINE = HOME / "engine"
VENV = HOME / "venv"
NAMES = {"стекло": "glass", "орбита": "orbit", "прожектор": "spotlight", "чеклист": "checklist", "таймлайн": "timeline",
         "склейка": "matchcut", "тумблеры": "toggles"}
RU = {v: k for k, v in NAMES.items()}
NEEDS_MATTE = {"orbit", "spotlight"}
REF = 8.7  # timings in the templates are tuned for a ~9 s clip and scale with the real length
SCALE_KEYS = {"glass": ["cues.views", "cues.ring", "cues.sign"], "checklist": ["items[].at"], "toggles": ["rows[].at"], "matchcut": ["from"]}


def log(*a):
    print("·", *a, flush=True)


def sh(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode:
        sys.exit(f"ошибка: {' '.join(map(str, cmd[:3]))} … (код {r.returncode})")
    return r


def need(tool, hint):
    if not shutil.which(tool):
        sys.exit(f"нужна программа «{tool}». {hint}")


# ---------- one-time setup ----------
def ensure_engine():
    need("node", "Установите Node.js 18+ (https://nodejs.org) или: brew install node")
    need("ffmpeg", "Установите: brew install ffmpeg")
    ENGINE.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SKILL / "template" / "src", ENGINE / "src", dirs_exist_ok=True)
    shutil.copy(SKILL / "template" / "package.json", ENGINE / "package.json")
    if not (ENGINE / "node_modules" / "@remotion" / "cli").exists():
        log("первый запуск: ставлю движок анимации (1–3 минуты)…")
        sh(["npm", "install", "--no-audit", "--no-fund", "--loglevel=error"], cwd=ENGINE)


def ensure_venv():
    py = VENV / "bin" / "python"
    if py.exists() and subprocess.run([py, "-c", "import mediapipe, numpy"], capture_output=True).returncode == 0:
        return py
    log("первый запуск: ставлю вырезку человека из фона (1–2 минуты)…")
    base = shutil.which("python3.12") or shutil.which("python3.11") or shutil.which("python3")
    sh([base, "-m", "venv", VENV])
    sh([py, "-m", "pip", "install", "-q", "--upgrade", "pip"])
    sh([py, "-m", "pip", "install", "-q", "mediapipe", "numpy"])
    return py


# ---------- assets ----------
def synth_sfx(d: Path):
    d.mkdir(exist_ok=True)
    sr = 44100

    def write(name, samples):
        with wave.open(str(d / name), "w") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
            w.writeframes(array.array("h", [int(max(-1, min(1, s)) * 30000) for s in samples]).tobytes())

    rnd = random.Random(7)
    pop = [math.sin(2 * math.pi * (900 - 500 * i / 2200) * i / sr) * math.exp(-i / 600) for i in range(2200)]
    shutter = []
    for burst in (0, 3500):
        shutter += [0.0] * (burst - len(shutter)) if burst > len(shutter) else []
        shutter += [rnd.uniform(-1, 1) * math.exp(-i / 500) * 0.8 for i in range(3000)]
    paper, prev = [], 0.0
    for i in range(9000):
        prev = 0.7 * prev + 0.3 * rnd.uniform(-1, 1)
        paper.append(prev * math.sin(math.pi * i / 9000) * 1.6)
    write("small_pop.wav", pop); write("camera_2.wav", shutter); write("paper.wav", paper)


def duration(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                capture_output=True, text=True).stdout.strip())


def waveform(clip: Path, n=140):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(clip), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    a = array.array("h", raw)
    if not a:
        return [0.3] * n
    seg = max(1, len(a) // n)
    v = [math.sqrt(sum(x * x for x in a[i * seg:(i + 1) * seg]) / seg) for i in range(n)]
    m = max(v) or 1
    return [round(x / m, 3) for x in v]


def covers(run: Path, clip: Path, dur: float, cfg_dir):
    out = run / "covers"
    out.mkdir(exist_ok=True)
    src = Path(os.path.expanduser(cfg_dir)) if cfg_dir else HOME / "covers"
    files = sorted(p for p in src.glob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".mp4", ".mov", ".webp"}) if src.exists() else []
    res = []
    if files:
        for i, f in enumerate(files[:12]):
            dst = out / f"c{i}.jpg"
            pre = ["-ss", "1.2"] if f.suffix.lower() in {".mp4", ".mov"} else []
            sh(["ffmpeg", "-y", "-v", "error", *pre, "-i", str(f), "-frames:v", "1", "-vf",
                "scale=270:480:force_original_aspect_ratio=increase,crop=270:480", str(dst)])
            res.append(f"covers/c{i}.jpg")
    else:  # no covers folder: stills from the video itself
        for i in range(9):
            sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{(i + 0.5) * dur / 9:.2f}", "-i", str(clip), "-frames:v", "1", "-vf", "scale=270:480",
                str(out / f"c{i}.jpg")])
            res.append(f"covers/c{i}.jpg")
    return res


# ---------- config ----------
def merge(a, b):
    for k, v in b.items():
        a[k] = merge(a.get(k, {}), v) if isinstance(v, dict) and isinstance(a.get(k), dict) else v
    return a


def scale_times(cfg, keys, s):
    for key in keys:
        if key.endswith("[].at"):
            for it in cfg[key.split("[")[0]]:
                it["at"] = round(it["at"] * s, 3)
        elif "." in key:
            a, b = key.split(".")
            cfg[a][b] = round(cfg[a][b] * s, 3)
        else:
            cfg[key] = round(cfg[key] * s, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("effect")
    ap.add_argument("video")
    ap.add_argument("--set", default="{}", help="JSON overrides for the effect")
    ap.add_argument("--out")
    a = ap.parse_args()
    eff = NAMES.get(a.effect.lower().strip(), a.effect.lower().strip())
    if eff not in RU:
        sys.exit("неизвестный эффект. Есть: " + ", ".join(NAMES))
    video = Path(os.path.expanduser(a.video)).resolve()
    if not video.exists():
        sys.exit(f"не нашла видео: {video}")

    ensure_engine()
    run = HOME / "runs" / f"{video.stem}-{eff}"
    if run.exists():
        shutil.rmtree(run)
    run.mkdir(parents=True)
    shutil.copytree(SKILL / "template" / "public" / "fonts", run / "fonts")
    synth_sfx(run / "sfx")

    log("готовлю видео 1080×1920…")
    clip = run / "clip.mp4"
    sh(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
        "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", str(clip)])
    dur = round(duration(clip), 3)

    user = json.loads((HOME / "config.json").read_text()) if (HOME / "config.json").exists() else {}
    cfg = json.loads((SKILL / "template" / "src" / f"{eff}.json").read_text())
    cfg["duration"] = dur
    scale_times(cfg, SCALE_KEYS.get(eff, []), max(0.6, min(dur / REF, 6)))
    cfg = merge(cfg, user.get(eff, {}))
    cfg = merge(cfg, json.loads(a.set))

    if eff in NEEDS_MATTE:
        py = ensure_venv()
        log("вырезаю тебя из фона…")
        sh([py, str(SKILL / "scripts" / "matte.py"), str(clip), str(run / "fg.webm"), str(SKILL / "models" / "selfie_multiclass.tflite")])
    if eff == "orbit":
        cfg["covers"] = covers(run, clip, dur, user.get("covers_dir"))
    if eff == "timeline":
        (run / "thumbs").mkdir()
        for i in range(8):
            sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{(i + 0.3) * dur / 8:.2f}", "-i", str(clip), "-frames:v", "1",
                "-vf", "crop=1080:1080:0:300,scale=90:90", str(run / "thumbs" / f"t{i}.jpg")])
        (ENGINE / "src" / "wave.json").write_text(json.dumps(waveform(clip)))

    (ENGINE / "src" / f"{eff}.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=1))
    out = Path(a.out).expanduser() if a.out else video.with_name(f"{video.stem} — {RU[eff]}.mp4")
    log(f"рендерю «{RU[eff]}» ({dur:.1f} с)…")
    sh(["npx", "remotion", "render", "src/index.ts", eff, str(out), f"--public-dir={run}", "--concurrency=4", "--log=error"], cwd=ENGINE)
    print(f"ГОТОВО: {out}")


if __name__ == "__main__":
    main()
