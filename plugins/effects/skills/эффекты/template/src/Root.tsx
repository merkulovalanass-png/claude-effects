import React from 'react';
import {Composition} from 'remotion';
import {Glass} from './Glass';
import glass from './glass.json';
import {Orbit} from './Orbit';
import orbit from './orbit.json';
import {Spotlight} from './Spotlight';
import spotlight from './spotlight.json';
import {Checklist} from './Checklist';
import checklist from './checklist.json';
import {Timeline} from './Timeline';
import timeline from './timeline.json';
import {MatchCut} from './MatchCut';
import matchcut from './matchcut.json';
import {Toggles} from './Toggles';
import toggles from './toggles.json';

export const Root: React.FC = () => (
	<>
		<Composition id="glass" component={Glass} durationInFrames={Math.round(glass.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="orbit" component={Orbit} durationInFrames={Math.round(orbit.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="spotlight" component={Spotlight} durationInFrames={Math.round(spotlight.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="checklist" component={Checklist} durationInFrames={Math.round(checklist.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="timeline" component={Timeline} durationInFrames={Math.round(timeline.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="matchcut" component={MatchCut} durationInFrames={Math.round(matchcut.duration * 30)} fps={30} width={1080} height={1920} />
		<Composition id="toggles" component={Toggles} durationInFrames={Math.round(toggles.duration * 30)} fps={30} width={1080} height={1920} />
	</>
);
