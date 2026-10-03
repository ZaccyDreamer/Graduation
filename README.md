# For Shiku — graduation gift

A responsive, chapter based graduation gift built with plain HTML, CSS, and JavaScript. Open `index.html` directly in a modern browser or publish this folder as a static site on GitHub Pages or Vercel.

## Add Shiku's photo

Shiku's photo is included at `assets/images/shiku.jpg`. Replace that file to use a different image. The first chapter automatically falls back to its elegant placeholder if the photo is absent. The portrait keeps its proportions with `object-fit: cover`; tapping it opens a larger view.

## Add background music

Add an instrumental track you are allowed to use as `assets/music/graduation.mp3` to use it instead of the built-in gentle piano-like instrumental. The music button starts and pauses playback; music is never autoplayed. Browsers can restrict local-file media, so for music playback use a local web server or the deployed site.

## Features

- Ten main gift chapters plus the sunrise and final celebration moments.
- Chapter progress, chapter jump controls, and previous/continue buttons.
- Interactive faith scene, chef plate, quality cards, obstacles, growing plant, and memory wall.
- Lightweight canvas sparkle and celebration particles with a smaller mobile particle budget.
- Original synthesized instrumental fallback when no music file is present.
- Reduced-motion support and responsive layouts for phone screens.
- Optional photo and music assets; no framework or build step required.

The Google Font import is decorative. System font fallbacks keep the page readable offline.
