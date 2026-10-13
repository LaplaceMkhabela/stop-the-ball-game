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
