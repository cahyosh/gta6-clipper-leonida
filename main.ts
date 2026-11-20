// gta6-clipper-01 entry: "GTA 6 Is Out Now — Leonida Goes Wild"
//
// This program does two jobs.
//
// 1) The grader's job (the default run, `node main.ts`): copy VIDEO.json from
//    the repository root to the output directory, byte for byte, and print
//    nothing on success. The house reads the video named there through the
//    YouTube Data API and ranks this entry by that video's public views.
//    This run is deterministic: no network, no clock, no randomness, and no
//    files outside the repository and the output directory.
//
// 2) The clipper's job (`node main.ts --render <source> <out.mp4>`): the tool
//    that actually made the entry's video. It cuts the chosen moment out of
//    Rockstar's official Grand Theft Auto VI launch trailer, crops it to a
//    vertical 1080x1920 frame, burns in the hook, the mid-card and the
//    make.fun pitch lines, appends a pitch end card, and renders the Short
//    with ffmpeg (driven through node:child_process; Node standard library
//    only). Every creative parameter lives in CLIP_PLAN below, so the render
//    is exactly reproducible from this file plus the source trailer.
//
// The moment (see CLIP_PLAN): the launch trailer's climax action rush,
// 48.5s-73.0s of https://www.youtube.com/watch?v=rz1B4B2yBZY — a dirt bike
// jumping between rooftops, a rooftop gunfight under fireworks, an aerial
// car explosion, Lucia and Jason on a balcony at sunset, a man falling past
// a shattering skyscraper, a police chase, and Lucia firing a rifle with
// fire behind her as the peak-end frame. It was picked because the game
// launched this week (19 Nov 2026), every shot in the window is centred
// enough to survive a 9:16 centre crop, the pace never lets up, and the
// last shot is the one viewers remember and loop for.

import { copyFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_DIR = dirname(fileURLToPath(import.meta.url));
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ---------------------------------------------------------------------------
// The creative plan: one source, one window, every overlay spelled out.
// Times in `texts` are seconds relative to the start of the cut window.
// ---------------------------------------------------------------------------

interface OverlayText {
  text: string;
  from: number; // seconds into the cut, inclusive
  until: number; // seconds into the cut, exclusive
  size: number; // font size in pixels on the 1080x1920 canvas
  color: string; // ffmpeg drawtext fontcolor
  y: number; // baseline offset from the top of the frame
}

interface ClipPlan {
  sourceTitle: string;
  sourceUrl: string;
  teaserStart: number; // cold open: the peak shot, shown before anything else
  teaserEnd: number;
  teaserText: OverlayText;
  windowStart: number; // seconds into the source trailer
  windowEnd: number;
  endCardSeconds: number;
  endCardFrameAt: number; // source timestamp frozen behind the end card
  width: number;
  height: number;
  fps: number;
  cropWidth: number; // crop taken out of the 2560x1440 source
  cropHeight: number;
  cropX: number;
  cropY: number;
  font: string;
  texts: OverlayText[];
  endCardTexts: OverlayText[];
}

const CLIP_PLAN: ClipPlan = {
  sourceTitle: 'Grand Theft Auto VI Launch Trailer (Rockstar Games)',
  sourceUrl: 'https://www.youtube.com/watch?v=rz1B4B2yBZY',
  // The hook, built in three beats: a 1.1-second cold open on the trailer's
  // peak shot (Lucia, rifle, fire) asking the question, the main window's
  // own opening line answering it, and a mid-clip promise that the payoff
  // is still coming. The peak shot returns at the end of the main window,
  // so staying to the end pays the teaser off.
  teaserStart: 71.9,
  teaserEnd: 73.0,
  teaserText: { text: 'THIS IS GTA 6?!', from: 0.0, until: 1.1, size: 108, color: 'white', y: 860 },
  windowStart: 48.5,
  windowEnd: 73.0,
  endCardSeconds: 4.5,
  endCardFrameAt: 72.3,
  width: 1080,
  height: 1920,
  fps: 30,
  cropWidth: 810,
  cropHeight: 1440,
  cropX: 875,
  cropY: 0,
  font: '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  texts: [
    // The answer to the teaser's question, over the bike jump.
    { text: 'GTA 6 JUST DROPPED', from: 0.0, until: 3.4, size: 92, color: 'white', y: 170 },
    { text: 'AND LEONIDA IS WILD', from: 0.0, until: 3.4, size: 64, color: '0xFFD23F', y: 292 },
    // The mid-clip promise, over the beach and the gym shots: the craziest
    // shots (explosion, police chase, the teaser payoff) are still ahead.
    { text: 'IT GETS CRAZIER', from: 7.0, until: 10.5, size: 62, color: 'white', y: 170 },
    // The pitch: stacked lines that stay up together until the cut ends, so
    // a viewer who only catches the last seconds still reads all of it.
    { text: 'AN AI AGENT CUT THIS CLIP', from: 16.5, until: 24.5, size: 56, color: 'white', y: 1050 },
    { text: 'MAKE CLIPS LIKE THIS WITH AI', from: 18.0, until: 24.5, size: 56, color: 'white', y: 1148 },
    { text: 'EARN MONEY ON MAKE.FUN', from: 19.5, until: 24.5, size: 66, color: '0xFFD23F', y: 1246 },
    { text: 'make.fun/bounty/gta6-clipper-01', from: 21.0, until: 24.5, size: 50, color: '0x7FE7FF', y: 1362 },
  ],
  endCardTexts: [
    { text: 'EARN MONEY MAKING', from: 0.0, until: 4.5, size: 68, color: 'white', y: 640 },
    { text: 'CLIPS WITH AI', from: 0.0, until: 4.5, size: 68, color: 'white', y: 738 },
    { text: 'make.fun', from: 0.0, until: 4.5, size: 168, color: '0xFFD23F', y: 872 },
    { text: 'make.fun/bounty/gta6-clipper-01', from: 0.0, until: 4.5, size: 52, color: '0x7FE7FF', y: 1096 },
    { text: 'LINK IN THE DESCRIPTION', from: 0.0, until: 4.5, size: 56, color: 'white', y: 1212 },
  ],
};

// ---------------------------------------------------------------------------
// ffmpeg filter construction (pure functions of the plan: same plan in,
// same filter string out).
// ---------------------------------------------------------------------------

function drawtext(t: OverlayText, font: string): string {
  // Escape the two characters drawtext treats specially inside a value.
  const safe = t.text.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
  return (
    `drawtext=fontfile=${font}:text='${safe}':fontsize=${t.size}:fontcolor=${t.color}` +
    `:borderw=5:bordercolor=black:shadowcolor=black:shadowx=2:shadowy=2` +
    `:x=(w-text_w)/2:y=${t.y}:enable='between(t,${t.from},${t.until})'`
  );
}

function frameChain(plan: ClipPlan, start: number, end: number, texts: OverlayText[]): string {
  return [
    `trim=start=${start}:end=${end}`,
    'setpts=PTS-STARTPTS',
    `crop=${plan.cropWidth}:${plan.cropHeight}:${plan.cropX}:${plan.cropY}`,
    `scale=${plan.width}:${plan.height}`,
    `fps=${plan.fps}`,
    ...texts.map((t) => drawtext(t, plan.font)),
    'format=yuv420p',
  ].join(',');
}

function segmentFilter(plan: ClipPlan): string {
  const dur = plan.windowEnd - plan.windowStart;
  const teaserAudio =
    `atrim=start=${plan.teaserStart}:end=${plan.teaserEnd},asetpts=PTS-STARTPTS,aresample=48000`;
  const mainAudio =
    `atrim=start=${plan.windowStart}:end=${plan.windowEnd},asetpts=PTS-STARTPTS,` +
    `afade=t=out:st=${(dur - 1).toFixed(2)}:d=1,aresample=48000`;
  return (
    `[0:v]${frameChain(plan, plan.teaserStart, plan.teaserEnd, [plan.teaserText])}[vT];` +
    `[0:a]${teaserAudio}[aT];` +
    `[0:v]${frameChain(plan, plan.windowStart, plan.windowEnd, plan.texts)}[v0];` +
    `[0:a]${mainAudio}[a0]`
  );
}

function endCardFilter(plan: ClipPlan): string {
  const chain = [
    `crop=${plan.cropWidth}:${plan.cropHeight}:${plan.cropX}:${plan.cropY}`,
    `scale=${plan.width}:${plan.height}`,
    `fps=${plan.fps}`,
    'boxblur=18:2',
    'eq=brightness=-0.28:saturation=0.85',
    ...plan.endCardTexts.map((t) => drawtext(t, plan.font)),
    'format=yuv420p',
  ].join(',');
  return `[1:v]${chain}[v1];[vT][aT][v0][a0][v1][2:a]concat=n=3:v=1:a=1[outv][outa]`;
}

function buildFfmpegArgs(plan: ClipPlan, source: string, endCardImage: string, outFile: string): string[] {
  const filter = `${segmentFilter(plan)};${endCardFilter(plan)}`;
  return [
    '-y',
    '-i', source,
    // The end card's frozen frame: a still of the peak shot, extracted by
    // renderClip below and looped for the card's few seconds.
    '-loop', '1', '-t', String(plan.endCardSeconds), '-i', endCardImage,
    // The end card carries no trailer audio: clean silence under the pitch.
    '-f', 'lavfi', '-t', String(plan.endCardSeconds), '-i', 'anullsrc=r=48000:cl=stereo',
    '-filter_complex', filter,
    '-map', '[outv]', '-map', '[outa]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart',
    outFile,
  ];
}

// ---------------------------------------------------------------------------
// The clipper's job: render the Short from the plan.
// ---------------------------------------------------------------------------

function renderClip(source: string, outFile: string): number {
  // First pull the still that sits behind the end card: the peak frame,
  // Lucia with the rifle, taken straight from the source trailer.
  const endCardImage = `${outFile}.endcard.jpg`;
  const grab = spawnSync(
    'ffmpeg',
    ['-y', '-ss', String(CLIP_PLAN.endCardFrameAt), '-i', source, '-frames:v', '1', '-q:v', '2', endCardImage],
    { stdio: 'inherit' },
  );
  if (grab.status !== 0) {
    console.error('ffmpeg could not extract the end-card frame');
    return grab.status ?? 1;
  }
  const args = buildFfmpegArgs(CLIP_PLAN, source, endCardImage, outFile);
  const res = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (res.error) {
    console.error(`ffmpeg could not start: ${res.error.message}`);
    return 1;
  }
  return res.status ?? 1;
}

// ---------------------------------------------------------------------------
// Entry point. With no arguments the program does the grader's job; with
// --render it makes the clip; with --plan it prints the plan as JSON.
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);

if (argv[0] === '--plan') {
  console.log(JSON.stringify(CLIP_PLAN, null, 2));
} else if (argv[0] === '--render') {
  const source = argv[1] ?? join(REPO_DIR, 'src', 'launch-trailer.mkv');
  const outFile = argv[2] ?? join(REPO_DIR, 'clip.mp4');
  process.exit(renderClip(source, outFile));
} else {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  try {
    copyFileSync(join(BOT_DIR, 'VIDEO.json'), join(OUTPUT_DIR, 'VIDEO.json'));
  } catch (err) {
    console.error(`VIDEO.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
    process.exit(1);
  }
}
