import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './spotlight.json';

// /эффекты прожектор — the room goes dark, she stays lit, a neon word glows behind her head
const BLACK = 'UnboundedBlack';
const h = delayRender('fonts');
new FontFace(BLACK, `url(${staticFile('fonts/UnboundedBlack.ttf')})`).load().then((f) => {
	document.fonts.add(f);
	continueRender(h);
});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Spotlight: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const dark = interpolate(t, [cfg.start, cfg.start + 0.9], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	// neon switches on with two short flickers, then hums softly
	const on = t < cfg.neon ? 0 : t < cfg.neon + 0.08 ? 1 : t < cfg.neon + 0.16 ? 0.15 : t < cfg.neon + 0.24 ? 0.9 : t < cfg.neon + 0.3 ? 0.3 : 1;
	const hum = 0.93 + 0.07 * Math.sin(t * 23) * Math.sin(t * 7);
	const glow = on * hum;
	const c = cfg.color;
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} muted={false}
				style={{filter: `brightness(${1 - 0.78 * dark}) saturate(${1 - 0.4 * dark})`}} />
			{/* neon word behind her */}
			<AbsoluteFill style={{alignItems: 'center', top: cfg.textY, height: 'auto'}}>
				<div style={{fontFamily: BLACK, fontSize: cfg.size, letterSpacing: 2, color: c, opacity: 0.25 + 0.75 * glow, whiteSpace: 'nowrap',
					textShadow: `0 0 ${8 * glow}px ${c}, 0 0 ${28 * glow}px ${c}, 0 0 ${70 * glow}px ${c}, 0 0 ${130 * glow}px ${c}`,
					WebkitTextStroke: `2px rgba(255,255,255,${0.35 * glow})`}}>{cfg.word}</div>
			</AbsoluteFill>
			{/* soft spill of light around her */}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 46% 38% at 50% 50%, rgba(255,214,170,${0.16 * dark}) 0%, rgba(0,0,0,0) 100%)`, mixBlendMode: 'screen'}} />
			{/* she stays lit */}
			<OffthreadVideo src={staticFile(cfg.fg)} transparent muted style={{position: 'absolute', inset: 0, filter: `brightness(${1 + 0.06 * dark})`}} />
		</AbsoluteFill>
	);
};
