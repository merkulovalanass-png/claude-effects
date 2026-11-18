import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './orbit.json';

// /эффекты орбита — reel covers circle around the speaker: behind her head on the far side, in front (below the face) on the near side
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Card = {i: number; x: number; y: number; s: number; depth: number; q: number};

const Cover: React.FC<{c: Card}> = ({c}) => {
	const w = cfg.cardW, h = Math.round(cfg.cardW * 16 / 9);
	const dim = interpolate(c.depth, [-1, 1], [0.55, 1]);
	return (
		<div style={{position: 'absolute', left: c.x - w / 2, top: c.y - h / 2, width: w, height: h, borderRadius: 22, overflow: 'hidden',
			transform: `scale(${c.s * (0.6 + 0.4 * c.q)})`, opacity: c.q, filter: `brightness(${dim}) blur(${(1 - c.q) * 10 + (c.depth < -0.3 ? 1.2 : 0)}px)`,
			border: '2px solid rgba(255,255,255,0.55)', boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}>
			<Img src={staticFile(cfg.covers[c.i])} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
		</div>
	);
};

export const Orbit: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const n = cfg.covers.length;
	const spin = (t * 2 * Math.PI) / cfg.period;
	const cards: Card[] = cfg.covers.map((_, i) => {
		const a = spin + (i * 2 * Math.PI) / n;
		const depth = Math.sin(a);                       // +1 nearest to camera, -1 behind her
		const tilt = cfg.tilt * Math.cos(a);             // ring slightly tilted
		const q = interpolate(t, [cfg.start + i * 0.08, cfg.start + i * 0.08 + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.exp)})
			* (1 - interpolate(t, [END - 0.45, END - 0.05], [0, 1], clamp));
		return {i, x: cfg.cx + cfg.rx * Math.cos(a), y: cfg.cy + cfg.ry * depth + tilt, s: interpolate(depth, [-1, 1], [0.62, 1.08]), depth, q};
	});
	const back = cards.filter((c) => c.depth < 0).sort((a, b) => a.depth - b.depth);
	const front = cards.filter((c) => c.depth >= 0).sort((a, b) => a.depth - b.depth);
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)'}} />
			{back.map((c) => <Cover key={c.i} c={c} />)}
			<OffthreadVideo src={staticFile(cfg.fg)} transparent muted style={{position: 'absolute', inset: 0}} />
			{front.map((c) => <Cover key={c.i} c={c} />)}
		</AbsoluteFill>
	);
};
