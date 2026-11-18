import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from './matchcut.json';

// /эффекты склейка — rapid cuts between "press pages" starring her; one word stays locked in the same spot on every page
const BLACK = 'UnboundedBlack';
const MARCK = 'Marck';
const h = delayRender('fonts');
Promise.all([[BLACK, 'fonts/UnboundedBlack.ttf'], [MARCK, 'fonts/Marck.ttf']].map(async ([n, f]) => {
	document.fonts.add(await new FontFace(n, `url(${staticFile(f)})`).load());
})).then(() => continueRender(h));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const YELLOW = '#FFD60A';
const SERIF = 'Georgia, "Times New Roman", serif';
const SF = '-apple-system, "SF Pro Display", Helvetica, Arial';
const PY = cfg.plateY; // the locked word's centre line

// her live video inside a frame on the page (lip-sync continues)
const Live: React.FC<{x: number; y: number; w: number; hgt: number; r?: number; rot?: number; style?: React.CSSProperties; pos?: string}> = ({x, y, w, hgt, r = 0, rot = 0, style, pos = '50% 30%'}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, height: hgt, borderRadius: r, overflow: 'hidden', transform: `rotate(${rot}deg)`, ...style}}>
		<OffthreadVideo src={staticFile(cfg.video)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
	</div>
);
const Lines: React.FC<{x: number; y: number; w: number; n: number; color: string; gap?: number}> = ({x, y, w, n, color, gap = 22}) => (
	<>{Array.from({length: n}, (_, i) => <div key={i} style={{position: 'absolute', left: x, top: y + i * gap, width: w * (i === n - 1 ? 0.6 : 0.9 + 0.1 * Math.sin(i * 3)), height: 9, borderRadius: 4, background: color}} />)}</>
);
const T: React.FC<{y: number; size: number; color: string; font?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({y, size, color, font = BLACK, children, style}) => (
	<div style={{position: 'absolute', left: 40, right: 130, top: y, textAlign: 'center', fontFamily: font, fontSize: size, color, lineHeight: 1.02, ...style}}>{children}</div>
);

const PAGES: React.FC[] = [
	// newspaper
	() => (
		<AbsoluteFill style={{background: '#F3EEE3'}}>
			<div style={{position: 'absolute', top: 240, left: 60, right: 140, borderBottom: '3px solid #111', paddingBottom: 12, textAlign: 'center', fontFamily: SERIF, fontSize: 92, fontWeight: 700, color: '#111'}}>Вечерний Рилс</div>
			<div style={{position: 'absolute', top: 372, left: 60, right: 140, display: 'flex', justifyContent: 'space-between', fontFamily: SERIF, fontSize: 22, color: '#444', borderBottom: '1px solid #111', paddingBottom: 8}}>
				<span>ЧЕТВЕРГ</span><span>НЕЙРОСЕТИ · МОНТАЖ · БЛОГ</span><span>№ 15</span>
			</div>
			<Live x={60} y={430} w={880} hgt={560} style={{filter: 'grayscale(1) contrast(1.15)'}} />
			<T y={985} size={66} color="#111" font={SERIF} style={{fontStyle: 'italic', fontWeight: 700}}>Один промпт вернул</T>
			<T y={PY + 80} size={58} color="#111" font={SERIF} style={{fontStyle: 'italic'}}>и это только начало</T>
			<Lines x={60} y={1300} w={400} n={7} color="#bdb6a6" /><Lines x={500} y={1300} w={400} n={7} color="#bdb6a6" />
		</AbsoluteFill>
	),
	// red brief
	() => (
		<AbsoluteFill style={{background: '#E8322B'}}>
			<div style={{position: 'absolute', top: 230, left: 40, width: 640, background: '#111', color: 'white', fontFamily: BLACK, fontSize: 52, padding: '10px 20px'}}>ГЛАВНОЕ</div>
			<div style={{position: 'absolute', top: 252, left: 700, fontFamily: SF, fontWeight: 800, fontSize: 22, color: 'white', lineHeight: 1.2}}>ЭКСКЛЮЗИВ<br />ДЛЯ БЛОГЕРОВ</div>
			{[0, 1, 2].map((i) => <Live key={i} x={40 + i * 300} y={350} w={290} hgt={420} pos={`${30 + i * 20}% 30%`} />)}
			<T y={830} size={96} color="white">РИЛС<br />НАБРАЛ</T>
			<T y={PY + 70} size={92} color="#111">ЗА 1 ДЕНЬ</T>
			<div style={{position: 'absolute', top: 1360, left: 560, transform: 'rotate(-4deg)', background: '#111', color: YELLOW, fontFamily: BLACK, fontSize: 30, padding: '14px 20px', lineHeight: 1.1}}>1 ПРОМПТ<br />0 МОНТАЖЁРОВ</div>
		</AbsoluteFill>
	),
	// black poster
	() => (
		<AbsoluteFill style={{background: '#0d0d0f'}}>
			<T y={250} size={170} color="transparent" style={{WebkitTextStroke: `3px ${YELLOW}`}}>12 480</T>
			<Live x={290} y={470} w={420} hgt={420} r={210} style={{border: `6px solid ${YELLOW}`}} />
			<T y={940} size={90} color="white">ВОТ ЭТО</T>
			<T y={PY + 70} size={150} color={YELLOW} font={MARCK}>взлёт</T>
		</AbsoluteFill>
	),
	// yellow tabloid
	() => (
		<AbsoluteFill style={{background: YELLOW}}>
			<T y={235} size={112} color="#111" style={{transform: 'rotate(-2deg)'}}>СЕНСАЦИЯ!</T>
			<Live x={110} y={400} w={760} hgt={560} rot={-3} style={{border: '10px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'}} />
			<T y={1000} size={50} color="#111">БЛОГЕРША ПОДНЯЛА</T>
			<T y={PY + 80} size={64} color="#111">ОДНОЙ ФРАЗОЙ</T>
			<div style={{position: 'absolute', top: 1330, left: 90, width: 180, height: 180, borderRadius: 90, background: '#E8322B', color: 'white', fontFamily: BLACK, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)'}}>×40</div>
		</AbsoluteFill>
	),
	// tech news
	() => (
		<AbsoluteFill style={{background: '#0B1F3A', backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px'}}>
			<div style={{position: 'absolute', top: 240, left: 60, fontFamily: 'Menlo, monospace', fontSize: 30, color: '#5AC8FA'}}>TECH · НЕЙРОСЕТИ</div>
			<Live x={60} y={310} w={880} hgt={640} r={28} style={{border: '2px solid rgba(90,200,250,0.6)'}} />
			<T y={1000} size={64} color="white" font={SF} style={{fontWeight: 800}}>Нейросеть подняла</T>
			<T y={PY + 80} size={64} color="#5AC8FA" font={SF} style={{fontWeight: 800}}>в 40 раз</T>
			<Lines x={60} y={1340} w={840} n={4} color="rgba(255,255,255,0.15)" gap={26} />
		</AbsoluteFill>
	),
	// pink post
	() => (
		<AbsoluteFill style={{background: 'linear-gradient(160deg, #FF5FD2 0%, #FF2D6F 100%)'}}>
			<div style={{position: 'absolute', top: 250, left: 70, width: 800, height: 1240, background: 'white', borderRadius: 36, boxShadow: '0 30px 60px rgba(0,0,0,0.3)'}} />
			<div style={{position: 'absolute', top: 280, left: 110, fontFamily: SF, fontWeight: 700, fontSize: 30, color: '#111'}}>{cfg.handle}</div>
			<Live x={100} y={340} w={740} hgt={650} r={18} />
			<T y={1005} size={42} color="#111" font={SF} style={{fontWeight: 800}}>❤ 12 480 · новый рекорд</T>
			<T y={PY + 80} size={40} color="#555" font={SF} style={{fontWeight: 600}}>промпт — в описании</T>
		</AbsoluteFill>
	),
];

export const MatchCut: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const t = frame / fps;
	const END = durationInFrames / fps;
	const k = Math.floor((t - cfg.from) / cfg.step);
	const inBurst = t >= cfg.from && k < cfg.cuts;
	const local = t - cfg.from - k * cfg.step;
	const punch = inBurst ? interpolate(local, [0, 0.12], [1.05, 1], clamp) : 1;
	const Page = PAGES[((k % PAGES.length) + PAGES.length) % PAGES.length];
	const burstEnd = cfg.from + cfg.cuts * cfg.step;
	const plateQ = t < cfg.from ? 0 : 1 - interpolate(t, [Math.min(END - 0.5, burstEnd + 1.2), Math.min(END - 0.1, burstEnd + 1.6)], [0, 1], clamp);
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<OffthreadVideo src={staticFile(cfg.video)} />
			{inBurst && <AbsoluteFill style={{transform: `scale(${punch})`}}><Page /></AbsoluteFill>}
			{/* the locked word — identical position on every page */}
			<div style={{position: 'absolute', left: 0, right: 90, top: PY - 62, display: 'flex', justifyContent: 'center', opacity: plateQ}}>
				<div style={{background: YELLOW, color: '#111', fontFamily: BLACK, fontSize: 84, lineHeight: 1, padding: '20px 30px', borderRadius: 14, border: '4px solid #111',
					boxShadow: '0 12px 30px rgba(0,0,0,0.35)', transform: `rotate(-2deg)`}}>{cfg.word}</div>
			</div>
			{Array.from({length: cfg.cuts}, (_, i) => (
				<Sequence key={i} from={Math.round((cfg.from + i * cfg.step) * fps)} durationInFrames={20}>
					<Audio src={staticFile(i % 3 === 0 ? 'sfx/paper.wav' : 'sfx/camera_2.wav')} volume={0.28} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
