const ad = document.getElementById('ad');
const adCanvas = document.getElementById('adCanvas');
const adCtx = adCanvas.getContext('2d');
const adVideo = document.getElementById('adVideo');
const adPlayButton = document.getElementById('adPlayButton');
const adHint = document.getElementById('adHint');
const menu = document.getElementById('menu');

const skipAd = new URLSearchParams(window.location.search).has('menu') || window.location.hash === '#menu';

let adFinished = false;
let adDrawing = false;
let adLastDraw = 0;

adCanvas.width = 96;
adCanvas.height = 54;

function paintAdFrame() {
    if (adVideo.readyState >= 2) {
        adCtx.drawImage(adVideo, 0, 0, adCanvas.width, adCanvas.height);
    }
}

function drawAdBackdrop(now) {
    if (!adDrawing) return;
    if (now - adLastDraw > 80) {
        adLastDraw = now;
        paintAdFrame();
    }
    requestAnimationFrame(drawAdBackdrop);
}

function startAdBackdrop() {
    if (adDrawing) return;
    adDrawing = true;
    adLastDraw = 0;
    requestAnimationFrame(drawAdBackdrop);
}

function stopAdBackdrop() {
    adDrawing = false;
}

function finishAd() {
    if (adFinished) return;
    adFinished = true;
    stopAdBackdrop();
    paintAdFrame();
    ad.classList.add('ready');
    adHint.classList.remove('hidden');
}

adVideo.addEventListener('ended', finishAd);

adVideo.addEventListener('error', finishAd);

adVideo.addEventListener('loadeddata', paintAdFrame);

adVideo.addEventListener('play', startAdBackdrop);

adVideo.addEventListener('pause', stopAdBackdrop);

function playAd() {
    return adVideo.play();
}

if (skipAd) {
    ad.classList.add('hidden');
    menu.classList.remove('hidden');
} else {
    const playback = playAd();
    if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {
            adPlayButton.classList.remove('hidden');
        });
    }
    startAdBackdrop();
}

adPlayButton.addEventListener('click', (event) => {
    event.stopPropagation();
    adPlayButton.classList.add('hidden');
    playAd().catch(() => {
        adPlayButton.classList.remove('hidden');
    });
});

ad.addEventListener('click', () => {
    if (!adFinished) return;
    stopAdBackdrop();
    ad.classList.add('hidden');
    menu.classList.remove('hidden');
});

/* ---------- Animated blurred background shapes ---------- */
(function () {
    const bg = document.getElementById('bg');
    if (!bg) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = [190, 206, 222, 168, 240, 154];
    const rand = (a, b) => a + Math.random() * (b - a);
    const dims = { w: window.innerWidth, h: window.innerHeight };

    const count = dims.w < 600 ? 4 : 6;
    const shapes = [];

    const blobRadius = () => {
        const r = () => Math.round(rand(30, 70));
        return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
    };

    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'shape';

        const base = Math.min(dims.w, dims.h);
        const w = base * rand(0.42, 0.7);
        const h = w * rand(0.9, 1.15);
        const hue = palette[i % palette.length] + rand(-8, 8);

        el.style.width = w + 'px';
        el.style.height = h + 'px';
        el.style.borderRadius = blobRadius();
        el.style.background = `radial-gradient(circle at 40% 40%, hsl(${hue} 90% 58% / .95), hsl(${hue + 18} 85% 40% / .2))`;
        el.style.opacity = rand(0.65, 0.85);
        bg.appendChild(el);

        shapes.push({
            el,
            w,
            h,
            x: rand(-0.1, 0.9) * dims.w,
            y: rand(-0.1, 0.9) * dims.h,
            vx: rand(-22, 22),
            vy: rand(-22, 22)
        });
    }

    const place = (s) => {
        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    };

    if (reduceMotion) {
        shapes.forEach((s) => {
            s.x = rand(-0.1, 0.9) * dims.w;
            s.y = rand(-0.1, 0.9) * dims.h;
            place(s);
        });
        return;
    }

    let last = performance.now();
    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        for (const s of shapes) {
            s.x += s.vx * dt;
            s.y += s.vy * dt;

            if (s.x < -s.w) s.x = dims.w;
            else if (s.x > dims.w) s.x = -s.w;
            if (s.y < -s.h) s.y = dims.h;
            else if (s.y > dims.h) s.y = -s.h;

            place(s);
        }

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', () => {
        dims.w = window.innerWidth;
        dims.h = window.innerHeight;
    });
})();
