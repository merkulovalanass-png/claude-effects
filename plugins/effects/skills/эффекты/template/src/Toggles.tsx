import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './toggles.json';

// /эффекты тумблеры — an iPhone-style settings card under her face; switches flip on one by one
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GREEN = '#34C759';
const SF = '-apple-system, "SF Pro Display", Helvetica, Arial';

const Switch: React.FC<{p: number}> = ({p}) => {
	const W = 102, H = 62, K = 54;
	const x = 4 + p * (W - K - 8);
	const squish = 1 + 0.18 * Math.sin(Math.PI * Math.min(1, p));
	return (
		<div style={{position: 'relative', width: W, height: H, borderRadius: H / 2,
			background: `rgba(${Math.round(120 + (52 - 120) * p)}, ${Math.round(120 + (199 - 120) * p)}, ${Math.round(128 + (89 - 128) * p)}, ${0.45 + 0.55 * p})`}}>
			<div style={{position: 'absolute', top: 4, left: x - (squish - 1) * K * p, width: K * squish, height: K, borderRadius: K / 2, background: 'white',
				boxShadow: '0 3px 8px rgba(0,0,0,0.3)'}} />
		</div>
	);
};

export const Toggles: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const q = interpolate(t, [cfg.start, cfg.start + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.exp)})
		* (1 - interpolate(t, [END - 0.4, END - 0.05], [0, 1], clamp));
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			<div style={{position: 'absolute', left: cfg.x, top: cfg.y, width: cfg.w, borderRadius: 34, padding: '8px 26px',
				background: 'linear-gradient(160deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.1) 100%)', border: '1.5px solid rgba(255,255,255,0.4)',
				boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 26px 60px rgba(0,0,0,0.45)', backdropFilter: 'blur(30px) saturate(1.6)',
				opacity: q, transform: `translateY(${(1 - q) * 40 + Math.sin(t * 0.9) * 4}px) scale(${0.94 + 0.06 * q})`, filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : 'none'}}>
				{cfg.rows.map((r, i) => {
					const p = interpolate(t, [r.at, r.at + 0.28], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderTop: i ? '1px solid rgba(255,255,255,0.18)' : 'none'}}>
							<div style={{width: 52, height: 52, borderRadius: 13, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>{r.icon}</div>
							<div style={{flex: 1, fontFamily: SF, fontSize: 36, fontWeight: 600, color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>{r.text}</div>
							<Switch p={p} />
						</div>
					);
				})}
			</div>
			{cfg.rows.map((r, i) => (
				<Sequence key={i} from={Math.round(r.at * fps)} durationInFrames={20}>
					<Audio src={staticFile('sfx/small_pop.wav')} volume={0.45} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
