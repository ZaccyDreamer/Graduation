(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const opening = $('#opening');
  const journey = $('#journey');
  const chapters = $$('.chapter');
  const nav = $('#chapter-nav');
  const music = $('#bg-music');
  const musicButton = $('#music-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let audioContext;
  let audioAvailable = true;
  let synthGain;
  let synthTimer;
  let synthStep = 0;

  // Generate the chapter rail from the actual sections, so it stays in sync.
  chapters.forEach((chapter, index) => {
    const button = document.createElement('a');
    button.href = `#${chapter.id}`;
    button.setAttribute('aria-label', `Go to chapter ${index + 1}: ${chapter.dataset.title}`);
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')} — ${chapter.dataset.title}</span>`;
    button.addEventListener('click', event => { event.preventDefault(); showChapter(index); });
    nav.append(button);
  });
  const navButtons = $$('a', nav);

  function showChapter(index) {
    current = Math.max(0, Math.min(index, chapters.length - 1));
    chapters.forEach((chapter, i) => {
      chapter.classList.toggle('active', i === current);
      chapter.setAttribute('aria-hidden', String(i !== current));
    });
    navButtons.forEach((button, i) => {
      button.classList.toggle('active', i === current);
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#progress-label').textContent = `CHAPTER ${String(current + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    $('#progress-fill').style.width = `${((current + 1) / chapters.length) * 100}%`;
    $('#previous-chapter').disabled = current === 0;
    $('#next-chapter').textContent = current === chapters.length - 1 ? 'BACK TO THE BEGINNING ↺' : 'CONTINUE →';
    $('#next-chapter').setAttribute('aria-label', current === chapters.length - 1 ? 'Back to the beginning' : 'Continue to next chapter');
    $('#previous-chapter').style.opacity = current === 0 ? '.45' : '1';
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    if (window.innerWidth <= 700) {
      nav.scrollTo({ left: Math.max(0, navButtons[current].offsetLeft - (nav.clientWidth - navButtons[current].clientWidth) / 2), behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    if (chapters[current].id === 'chapter-3') window.setTimeout(() => $('#chapter-3').classList.add('lit'), 300);
    if (chapters[current].id === 'chapter-6') {
      window.setTimeout(() => {
        $('#chapter-6').classList.add('revealed');
        burst(110, ['gold', 'flower', 'cap', 'sparkle']);
      }, 450);
    }
    if (chapters[current].id === 'finale') burst(180, ['gold', 'flower', 'cap', 'confetti', 'heart', 'sparkle']);
  }

  function chime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext ||= new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();
      [523.25, 659.25, 783.99].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, audioContext.currentTime + i * .11);
        gain.gain.exponentialRampToValueAtTime(.07, audioContext.currentTime + i * .11 + .04);
        gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + i * .11 + .6);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(audioContext.currentTime + i * .11);
        oscillator.stop(audioContext.currentTime + i * .11 + .62);
      });
    } catch (_) { /* The website remains usable when Web Audio is unavailable. */ }
  }

  function setMusicPlaying(playing, fallback = false) {
    musicButton.classList.toggle('playing', playing);
    musicButton.classList.toggle('synth-playing', playing && fallback);
    musicButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicButton.title = playing ? (fallback ? 'Pause gentle instrumental music' : 'Pause background music') : 'Play background music';
  }

  function playSynthChord() {
    if (!audioContext || !synthGain || audioContext.state !== 'running') return;
    const chords = [
      [261.63, 329.63, 392.00, 523.25],
      [220.00, 261.63, 329.63, 440.00],
      [174.61, 220.00, 261.63, 349.23],
      [196.00, 246.94, 293.66, 392.00]
    ];
    const notes = chords[synthStep % chords.length];
    const start = audioContext.currentTime + .06;
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      const onset = start + index * .34;
      envelope.gain.setValueAtTime(.0001, onset);
      envelope.gain.exponentialRampToValueAtTime(index === 0 ? .34 : .2, onset + .045);
      envelope.gain.exponentialRampToValueAtTime(.0001, onset + 1.7);
      oscillator.connect(envelope).connect(synthGain);
      oscillator.start(onset);
      oscillator.stop(onset + 1.75);
    });
    synthStep++;
  }

  async function startSynthMusic() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      audioContext ||= new AudioCtx();
      await audioContext.resume();
      synthGain = audioContext.createGain();
      synthGain.gain.value = .22;
      synthGain.connect(audioContext.destination);
      synthStep = 0;
      playSynthChord();
      synthTimer = window.setInterval(playSynthChord, 2200);
      setMusicPlaying(true, true);
      return true;
    } catch (_) { return false; }
  }

  async function playMusic() {
    if (audioAvailable) {
      try {
        music.volume = .58;
        await music.play();
        setMusicPlaying(true);
        return true;
      } catch (_) {
        audioAvailable = false;
      }
    }
    return startSynthMusic();
  }

  function pauseMusic() {
    music.pause();
    if (synthTimer) window.clearInterval(synthTimer);
    synthTimer = null;
    if (synthGain && audioContext) {
      const oldGain = synthGain;
      synthGain = null;
      try {
        oldGain.gain.setTargetAtTime(.0001, audioContext.currentTime, .06);
        window.setTimeout(() => { try { oldGain.disconnect(); } catch (_) {} }, 500);
      } catch (_) {}
    }
    setMusicPlaying(false);
  }

  $('#open-surprise').addEventListener('click', async () => {
    chime();
    opening.classList.add('leaving');
    burst(150, ['gold', 'flower', 'cap', 'confetti', 'sparkle']);
    window.setTimeout(() => {
      opening.hidden = true;
      journey.hidden = false;
      showChapter(0);
    }, reducedMotion ? 0 : 700);
    playMusic();
  });
  $('#previous-chapter').addEventListener('click', () => showChapter(current - 1));
  $('#next-chapter').addEventListener('click', () => current === chapters.length - 1 ? showChapter(0) : showChapter(current + 1));
  $('#replay-button').addEventListener('click', () => {
    journey.hidden = true;
    opening.hidden = false;
    opening.classList.remove('leaving');
    showChapter(0);
    window.scrollTo(0, 0);
  });
  musicButton.addEventListener('click', async () => {
    if (!music.paused || musicButton.classList.contains('synth-playing')) pauseMusic();
    else await playMusic();
  });

  // Photo placeholder and full-screen image view.
  const photo = $('.portrait-frame img');
  photo.addEventListener('load', () => {
    if (photo.naturalWidth > 0) $('.portrait-frame').classList.add('has-photo');
  });
  photo.addEventListener('error', () => $('.portrait-frame').classList.remove('has-photo'));
  if (photo.complete && photo.naturalWidth > 0) $('.portrait-frame').classList.add('has-photo');
  const viewer = $('#photo-viewer');
  const closeViewer = () => { viewer.hidden = true; document.body.style.overflow = ''; };
  photo.addEventListener('click', () => { viewer.hidden = false; document.body.style.overflow = 'hidden'; });
  $('.photo-close').addEventListener('click', closeViewer);
  viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeViewer(); });

  $('#faith-scene .faith-trigger').addEventListener('click', () => {
    $('#chapter-3').classList.add('lit');
    burst(50, ['gold', 'sparkle']);
  });
  $('#plate-button').addEventListener('click', () => {
    const message = $('#plate-message');
    message.textContent = message.dataset.served ? 'You know I’m coming back for seconds. 😂' : 'ONE MORE SERVING? 😂';
    message.dataset.served = 'yes';
    burst(16, ['sparkle']);
  });
  const qualityMessages = {
    'Loving': 'You’ve done so much for me and our family. I know that comes from love. 💕',
    'Caring': 'You stayed with my younger brother and took care of him. ❤️',
    'Funny': 'You know how to make me laugh, even when I’m being too serious. 😂',
    'Beautiful': 'You’re beautiful, Shiku. I hope you know that. 🌸',
    'Good vibes': 'I’m glad you’re my sister. You make family feel like home. ✨',
    'Supportive': 'When I needed help, you were there. You never made me feel like a burden. 🤝',
    'Resilient': 'School had to wait, but when you could, you found your way back to it.',
    'Faithful': 'When things were hard, you kept saying, “God will work it out.” 🙏🏽',
    'Strong': 'You kept caring for us while dealing with your own struggles.',
    'Determined': 'You went back to school and finished. I’m proud of you. 👑',
    'Hopeful': 'You kept believing education was still possible for you. 🌟'
  };
  $$('#qualities button').forEach(button => button.addEventListener('click', () => {
    $$('#qualities button').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    $('#quality-message').textContent = qualityMessages[button.querySelector('span').textContent];
  }));
  $$('.obstacle').forEach(button => button.addEventListener('click', () => {
    button.classList.add('opened');
    $('#obstacle-message').textContent = button.dataset.message;
    burst(24, ['gold', 'flower', 'sparkle']);
  }));
  const stages = [
    ['🌱', 'DREAM'], ['🌿', 'FAITH'], ['🌷', 'SACRIFICE'], ['🌸', 'PERSISTENCE'], ['🌺', 'GROWTH'], ['🌳', 'GRADUATION']
  ];
  let plantStage = 0;
  $('#plant-button').addEventListener('click', () => {
    plantStage = Math.min(plantStage + 1, stages.length - 1);
    $('#plant-emoji').textContent = stages[plantStage][0];
    $('#plant-stage').textContent = stages[plantStage][1];
    if (plantStage === stages.length - 1) {
      $('#plant-message').textContent = 'You went back to school and finished, Shiku. Look at you now. I’m proud of you. 🎓';
      burst(28, ['flower', 'gold']);
    }
  });
  $$('.memory-grid button').forEach(button => button.addEventListener('click', () => button.classList.toggle('expanded')));

  // A small, capped canvas particle field with one animation loop.
  const canvas = $('#celebration-canvas');
  const ctx = canvas.getContext('2d');
  const particles = [];
  const glyphs = { flower: ['🌸', '🌷', '🌹', '💐'], cap: ['🎓'], sparkle: ['✦', '✧', '✦'], heart: ['💕', '❤️'], confetti: ['✦', '▪'], gold: ['•', '✧', '·'] };
  let width = 0, height = 0, dpr = 1, lastFrame = 0, frame = 0;
  const cap = () => Math.min(window.innerWidth < 500 ? 35 : 70, Math.floor(window.innerWidth / 7));
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();
  function addParticle(type, x = Math.random() * width, y = -20, force = false) {
    if (!force && particles.length >= cap()) return;
    const options = glyphs[type] || glyphs.gold;
    particles.push({ type, glyph: options[Math.floor(Math.random() * options.length)], x, y,
      vx: (Math.random() - .5) * (type === 'gold' ? .35 : .8), vy: .25 + Math.random() * (type === 'gold' ? .65 : 1.1),
      size: type === 'gold' ? 5 + Math.random() * 7 : 13 + Math.random() * 9, alpha: .35 + Math.random() * .58,
      rotation: Math.random() * 6, spin: (Math.random() - .5) * .012, sway: Math.random() * 2, life: 0, maxLife: height * (1.1 + Math.random() * .5) });
  }
  function burst(count, kinds) {
    if (reducedMotion) count = Math.min(count, 12);
    const available = Math.max(0, Math.min(count, 220 - particles.length));
    for (let i = 0; i < available; i++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      addParticle(kind, width * (.15 + Math.random() * .7), height * (.08 + Math.random() * .34), true);
      const particle = particles[particles.length - 1];
      particle.vy = -1.2 + Math.random() * 3.4;
      particle.vx = (Math.random() - .5) * 3.3;
      particle.maxLife = 90 + Math.random() * 120;
    }
  }
  function draw(now) {
    requestAnimationFrame(draw);
    if (document.hidden || now - lastFrame < (reducedMotion ? 100 : 33)) return;
    lastFrame = now; frame++;
    ctx.clearRect(0, 0, width, height);
    const ambientRate = reducedMotion ? 0 : window.innerWidth < 500 ? 0.13 : 0.23;
    if (Math.random() < ambientRate && particles.length < cap()) addParticle(Math.random() < .77 ? 'gold' : 'sparkle');
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life++; p.x += p.vx + Math.sin((frame + p.sway * 60) / 45) * .18; p.y += p.vy; p.rotation += p.spin;
      const lifeAlpha = p.life > p.maxLife - 35 ? Math.max(0, (p.maxLife - p.life) / 35) : 1;
      if (p.type === 'gold') {
        ctx.globalAlpha = p.alpha * lifeAlpha; ctx.fillStyle = '#efd38d'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = p.alpha * lifeAlpha; ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillText(p.glyph, 0, 0); ctx.restore();
      }
      if (p.y > height + 30 || p.life >= p.maxLife || p.x < -40 || p.x > width + 40) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(draw);
  if (!reducedMotion) for (let i = 0; i < Math.min(18, cap()); i++) addParticle('gold', Math.random() * width, Math.random() * height);

  // Keep chapter navigation usable on small screens with horizontal arrow keys.
  document.addEventListener('keydown', event => {
    if (journey.hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (event.key === 'ArrowRight') showChapter(current + 1);
    if (event.key === 'ArrowLeft') showChapter(current - 1);
  });
})();
