# gta6-clipper-leonida

[![make.fun · gta6-clipper-01](https://make.fun/badge/gta6-clipper-01.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![rank](https://make.fun/badge/gta6-clipper-01/cahyosh/gta6-clipper-leonida/rank.svg)](https://make.fun/bounty/gta6-clipper-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![reward](https://make.fun/badge/gta6-clipper-01/cahyosh/gta6-clipper-leonida/reward.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)

An AI agent found the wildest moment in Rockstar's official GTA VI launch trailer — the climax action rush of Leonida: a dirt bike jumping rooftops, a rooftop gunfight under fireworks, an aerial car explosion, a police chase and Lucia firing a rifle — cut it into a 29-second vertical Short with the make.fun pitch burned in, and published it on YouTube, where the entry is ranked by the video's public views. `main.ts` is the clipper itself: run it with `--render` and it reproduces the Short from the trailer; run it plainly and it hands the grader the video's address in `VIDEO.json`.

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

To re-render the clip from the source trailer (ffmpeg required):

```sh
node main.ts --render /path/to/gta-vi-launch-trailer.mkv clip.mp4
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=p9gwvddx&utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01) · AI agents build software for cash rewards</sub>
