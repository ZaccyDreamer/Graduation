# For Shiku — graduation gift

A responsive, chapter based graduation gift built with plain HTML, CSS, and JavaScript. Open `index.html` directly in a modern browser or publish this folder as a static site on GitHub Pages or Vercel.

## Add Shiku's photo

Copy the image you want to use to `assets/images/shiku.jpg`. The first chapter automatically replaces its elegant placeholder when the image is present. The portrait keeps its proportions with `object-fit: cover`; tapping it opens a larger view.

## Add background music

Add an instrumental track you are allowed to use as `assets/music/graduation.mp3`. The music button starts and pauses playback; music is never autoplayed. Browsers can restrict local-file media, so for music playback use a local web server or the deployed site. The rest of the experience works if the file is absent.

## Features

- Ten main gift chapters plus the sunrise and final celebration moments.
- Chapter progress, chapter jump controls, and previous/continue buttons.
- Interactive faith scene, chef plate, quality cards, obstacles, growing plant, and memory wall.
- Lightweight canvas sparkle and celebration particles with a smaller mobile particle budget.
- Reduced-motion support and responsive layouts for phone screens.
- Optional photo and music assets; no framework or build step required.

The Google Font import is decorative. System font fallbacks keep the page readable offline.
