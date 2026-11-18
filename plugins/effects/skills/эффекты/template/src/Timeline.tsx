import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './timeline.json';
import wave from './wave.json';

// /эффекты таймлайн — an editor timeline floats above the speaker; a glowing playhead runs across it in sync with the video
const BLACK = 'UnboundedBlack';
const MARCK = 'Marck';
const h = delayRender('fonts');
Promise.all([[BLACK, 'fonts/UnboundedBlack.ttf'], [MARCK, 'fonts/Marck.ttf']].map(async ([n, f]) => {
	document.fonts.add(await new FontFace(n, `url(${staticFile(f)})`).load());
})).then(() => continueRender(h));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PINK = '#FF5FD2';
const VIOLET = '#9B6BFF';
const YELLOW = '#FFD60A';
const MONO = 'Menlo, "SF Mono", monospace';

const LABEL_W = 118;

export const Timeline: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const q = interpolate(t, [cfg.start, cfg.start + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.exp)})
		* (1 - interpolate(t, [END - 0.4, END - 0.05], [0, 1], clamp));
	const W = cfg.w - 44;                       // inner width
	const TW = W - LABEL_W;                    // track width
	const p = interpolate(t, [cfg.start + 0.4, END - 0.3], [0, 1], clamp);
	const ph = LABEL_W + TW * p;               // playhead x
	const pct = Math.round(p * 100);
	const Row: React.FC<{label: string; children: React.ReactNode; hgt?: number}> = ({label, children, hgt = 40}) => (
		<div style={{display: 'flex', alignItems: 'center', height: hgt, marginBottom: 8}}>
			<div style={{width: LABEL_W, fontFamily: MONO, fontSize: 17, color: 'rgba(255,255,255,0.55)', letterSpacing: 1}}>{label}</div>
			<div style={{position: 'relative', width: TW, height: hgt}}>{children}</div>
		</div>
	);
	const clip = (a: number, b: number, color: string, text: string) => (
		<div key={text} style={{position: 'absolute', left: a * TW, width: (b - a) * TW - 4, top: 0, bottom: 0, borderRadius: 8, background: color,
			opacity: p >= a ? 1 : 0.45, display: 'flex', alignItems: 'center', paddingLeft: 10, fontFamily: MONO, fontSize: 16, fontWeight: 700, color: '#1a0c24', overflow: 'hidden', whiteSpace: 'nowrap'}}>{text}</div>
	);
	const bars = (data: number[], color: string, hgt: number) => (
		<svg width={TW} height={hgt} style={{position: 'absolute', inset: 0}}>
			{data.map((v, i) => {
				const x = (i / data.length) * TW;
				const bh = Math.max(2, v * hgt * 0.9);
				return <rect key={i} x={x} y={(hgt - bh) / 2} width={TW / data.length - 1.2} height={bh} rx={1} fill={color} opacity={i / data.length <= p ? 1 : 0.35} />;
			})}
		</svg>
	);
	const music = Array.from({length: 90}, (_, i) => 0.35 + 0.3 * Math.abs(Math.sin(i * 0.9)) + 0.2 * Math.abs(Math.sin(i * 0.37)));
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			{/* title */}
			<div style={{position: 'absolute', top: cfg.y - 92, left: 0, right: 0, textAlign: 'center', opacity: q, transform: `translateY(${(1 - q) * 20}px)`, filter: q < 0.999 ? `blur(${(1 - q) * 12}px)` : 'none'}}>
				<span style={{fontFamily: BLACK, fontSize: 50, color: 'white', textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>Claude </span>
				<span style={{fontFamily: MARCK, fontSize: 64, color: YELLOW, textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>монтирует</span>
			</div>
			<div style={{position: 'absolute', left: cfg.x, top: cfg.y, width: cfg.w, borderRadius: 28, padding: '16px 22px 10px',
				background: 'linear-gradient(170deg, rgba(58,22,82,0.82) 0%, rgba(30,10,46,0.78) 100%)', border: `1.5px solid rgba(190,140,255,0.45)`,
				boxShadow: `0 0 40px rgba(155,107,255,0.35), 0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2)`, backdropFilter: 'blur(22px)',
				opacity: q, transform: `translateY(${(1 - q) * 40}px) scale(${0.95 + 0.05 * q})`, filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : 'none'}}>
				{/* top bar */}
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 10}}>
					<span><span style={{color: PINK}}>●</span> CLAUDE · РЕНДЕР</span>
					<span>0:0{Math.floor(t)} / 0:0{Math.floor(END)} · {pct}%</span>
				</div>
				<div style={{position: 'relative'}}>
					<Row label="ВИДЕО" hgt={58}>
						<div style={{display: 'flex', gap: 3, height: '100%'}}>
							{Array.from({length: 8}, (_, i) => (
								<Img key={i} src={staticFile(`thumbs/t${i}.jpg`)} style={{flex: 1, height: '100%', objectFit: 'cover', borderRadius: 6, opacity: i / 8 <= p ? 1 : 0.4}} />
							))}
						</div>
					</Row>
					<Row label="ТЕКСТ">
						{cfg.texts.map((x) => clip(x[0] as number, x[1] as number, PINK, x[2] as string))}
					</Row>
					<Row label="ГОЛОС">{bars(wave, '#7CF2C2', 40)}</Row>
					<Row label="МУЗЫКА">{bars(music, VIOLET, 40)}</Row>
					{/* glowing playhead */}
					<div style={{position: 'absolute', left: ph - 1.5, top: -8, bottom: -4, width: 3, background: 'white', borderRadius: 2,
						boxShadow: `0 0 8px white, 0 0 18px ${PINK}, 0 0 36px ${PINK}`}} />
					<div style={{position: 'absolute', left: ph - 9, top: -16, width: 18, height: 12, background: 'white', clipPath: 'polygon(0 0,100% 0,50% 100%)', filter: `drop-shadow(0 0 6px ${PINK})`}} />
				</div>
				{/* progress */}
				<div style={{height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', marginTop: 4, overflow: 'hidden'}}>
					<div style={{width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${VIOLET}, ${PINK})`}} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
