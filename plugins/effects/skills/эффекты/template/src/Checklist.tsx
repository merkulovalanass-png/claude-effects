import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './checklist.json';

// /эффекты чеклист — a dark-glass task card beside the speaker; items tick off one by one as she talks
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GREEN = '#34C759';
const ORANGE = '#D97757';
const SF = '-apple-system, "SF Pro Display", Helvetica, Arial';
const MONO = 'Menlo, "SF Mono", monospace';

const Mark: React.FC<{t: number; at: number}> = ({t, at}) => {
	const active = t > at - 0.9 && t < at;
	const done = interpolate(t, [at, at + 0.35], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const S = 40;
	if (done > 0)
		return (
			<svg width={S} height={S} viewBox="0 0 40 40" style={{transform: `scale(${0.6 + 0.4 * done})`}}>
				<circle cx={20} cy={20} r={19} fill={GREEN} />
				<path d="M11 20.5 L17.5 27 L29.5 14" fill="none" stroke="white" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round"
					strokeDasharray={30} strokeDashoffset={30 * (1 - Math.min(1, done))} />
			</svg>
		);
	return (
		<svg width={S} height={S} viewBox="0 0 40 40">
			<circle cx={20} cy={20} r={17} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={3} />
			{active && <circle cx={20} cy={20} r={17} fill="none" stroke={ORANGE} strokeWidth={3.4} strokeLinecap="round" strokeDasharray="28 80"
				transform={`rotate(${t * 520} 20 20)`} />}
		</svg>
	);
};

export const Checklist: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const q = interpolate(t, [cfg.start, cfg.start + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.exp)})
		* (1 - interpolate(t, [END - 0.4, END - 0.05], [0, 1], clamp));
	const doneN = cfg.items.filter((it) => t >= it.at).length;
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			<div style={{position: 'absolute', left: cfg.x, top: cfg.y, width: cfg.w, borderRadius: 34, padding: '26px 30px 22px',
				background: 'linear-gradient(160deg, rgba(28,28,32,0.72) 0%, rgba(14,14,18,0.6) 100%)', border: '1.5px solid rgba(255,255,255,0.22)',
				boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 30px 70px rgba(0,0,0,0.55)', backdropFilter: 'blur(26px) saturate(1.4)',
				opacity: q, transform: `translateY(${(1 - q) * 40 + Math.sin(t * 0.9) * 5}px) scale(${0.94 + 0.06 * q})`, filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : 'none'}}>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
					<div style={{fontFamily: SF, fontSize: 30, fontWeight: 700, color: 'white'}}><span style={{color: ORANGE}}>✺</span> {cfg.title}</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: 'rgba(255,255,255,0.6)'}}>{doneN} из {cfg.items.length}</div>
				</div>
				{cfg.items.map((it, i) => {
					const done = t >= it.at;
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '9px 0', borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none'}}>
							<Mark t={t} at={it.at} />
							<div style={{flex: 1, fontFamily: SF, fontSize: 29, fontWeight: 600, color: done ? 'white' : 'rgba(255,255,255,0.45)'}}>{it.text}</div>
							<div style={{fontFamily: MONO, fontSize: 21, color: done ? GREEN : 'rgba(255,255,255,0.3)'}}>{it.note}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
