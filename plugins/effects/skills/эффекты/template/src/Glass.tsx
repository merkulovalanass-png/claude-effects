import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './glass.json';

// /эффекты стекло — floating iPhone-glass panels around the speaker (never over the face)
const BLACK = 'UnboundedBlack';
const LIGHT = 'UnboundedLight';
const h = delayRender('fonts');
Promise.all([[BLACK, 'fonts/UnboundedBlack.ttf'], [LIGHT, 'fonts/UnboundedLight.ttf']].map(async ([n, f]) => {
	document.fonts.add(await new FontFace(n, `url(${staticFile(f)})`).load());
})).then(() => continueRender(h));

const YELLOW = '#FFD60A';
const GREEN = '#34C759';
const ORANGE = '#D97757';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const soft = (t: number, at: number, d = 0.9) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: Easing.out(Easing.exp)});
const GLASS: React.CSSProperties = {
	background: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 100%)', border: '1.5px solid rgba(255,255,255,0.38)',
	boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 24px 60px rgba(0,0,0,0.4)', backdropFilter: 'blur(28px) saturate(1.5)', borderRadius: 36,
};
const SF = '-apple-system, "SF Pro Display", Helvetica, Arial';

// slow blur-in, gentle float, blur-out at the end
const Panel: React.FC<{t: number; at: number; end: number; x: number; y: number; w: number; seed: number; children: React.ReactNode}> = ({t, at, end, x, y, w, seed, children}) => {
	const q = soft(t, at) * (1 - soft(t, end - 0.35, 0.35));
	const fy = Math.sin(t * 0.9 + seed) * 10;
	const fx = Math.cos(t * 0.7 + seed * 2) * 6;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, ...GLASS, padding: '22px 26px', opacity: q,
			transform: `translate(${fx}px, ${fy + (1 - q) * 40}px) scale(${0.9 + 0.1 * q})`, filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : 'none'}}>
			{children}
		</div>
	);
};
const Small: React.FC<{c?: string; children: React.ReactNode}> = ({c = 'rgba(255,255,255,0.78)', children}) => (
	<div style={{fontFamily: SF, fontSize: 25, fontWeight: 600, color: c, whiteSpace: 'nowrap'}}>{children}</div>
);
const fmt = (v: number) => Math.round(v).toLocaleString('ru-RU').replace(/,/g, ' ');

export const Glass: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const c = cfg.cues;
	const views = interpolate(t, [c.views + 0.4, c.views + 2.6], [312, 12480], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const render = interpolate(t, [c.start, END - 0.6], [12, 100], clamp);
	const ring = interpolate(t, [c.ring, c.ring + 3], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const R = 62, L = 2 * Math.PI * R;
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			{/* soft vignette so glass reads */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)'}} />

			{/* top-left: effects counter */}
			<Panel t={t} at={c.start} end={END} x={40} y={250} w={300} seed={0}>
				<Small><span style={{color: ORANGE}}>✺</span> Claude</Small>
				<div style={{fontFamily: BLACK, fontSize: 92, color: 'white', lineHeight: 1.05}}>{cfg.count}</div>
				<Small>эффектов · 1 ролик</Small>
			</Panel>

			{/* top-right: rendering bar */}
			<Panel t={t} at={c.start + 0.5} end={END} x={630} y={265} w={310} seed={1.7}>
				<Small c={GREEN}>● Рендер</Small>
				<div style={{height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.2)', margin: '14px 0 10px', overflow: 'hidden'}}>
					<div style={{width: `${render}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${GREEN}, #7CF29A)`}} />
				</div>
				<Small>4K · {Math.round(render)}%</Small>
			</Panel>

			{/* mid-left: views growing */}
			<Panel t={t} at={c.views} end={END} x={40} y={790} w={330} seed={3.1}>
				<Small>{cfg.viewsLabel}</Small>
				<div style={{fontFamily: BLACK, fontSize: 54, color: views > 400 ? GREEN : 'white', lineHeight: 1.15, whiteSpace: 'nowrap'}}>{fmt(views)}</div>
				<svg width={278} height={70} viewBox="0 0 278 70">
					{(() => {
						const k = interpolate(views, [312, 12480], [0, 1], clamp);
						const pts = Array.from({length: 12}, (_, i) => {
							const x = (i / 11) * 270 + 4;
							const base = 60 - (i / 11) * 50 * k - Math.sin(i * 1.7) * 6 * (1 - k * 0.5);
							return `${x},${Math.max(6, Math.min(64, base))}`;
						});
						return <polyline points={pts.join(' ')} fill="none" stroke={GREEN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
					})()}
				</svg>
			</Panel>

			{/* mid-right: 4K ring */}
			<Panel t={t} at={c.ring} end={END} x={745} y={790} w={205} seed={4.4}>
				<svg width={158} height={158} viewBox="0 0 158 158">
					<circle cx={79} cy={79} r={R} stroke="rgba(255,255,255,0.22)" strokeWidth={12} fill="none" />
					<circle cx={79} cy={79} r={R} stroke={GREEN} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - ring)} transform="rotate(-90 79 79)" />
					<text x={79} y={92} textAnchor="middle" fontFamily={BLACK} fontSize={40} fill="white">4K</text>
				</svg>
			</Panel>

			{/* bottom: signature pill */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1470, display: 'flex', justifyContent: 'center'}}>
				{(() => {
					const q = soft(t, c.sign) * (1 - soft(t, END - 0.35, 0.35));
					return (
						<div style={{...GLASS, borderRadius: 60, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16, opacity: q,
							transform: `translateY(${(1 - q) * 30 + Math.sin(t) * 6}px)`, filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : 'none'}}>
							<span style={{fontSize: 34, color: ORANGE}}>✺</span>
							<span style={{fontFamily: SF, fontSize: 36, fontWeight: 700, color: 'white'}}>{cfg.sign}</span>
						</div>
					);
				})()}
			</div>
		</AbsoluteFill>
	);
};
