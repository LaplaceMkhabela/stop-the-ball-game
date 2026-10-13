const ad = document.getElementById('ad');
const adBg = document.getElementById('adBg');
const adVideo = document.getElementById('adVideo');
const adPlayButton = document.getElementById('adPlayButton');
const adHint = document.getElementById('adHint');
const menu = document.getElementById('menu');

const skipAd = new URLSearchParams(window.location.search).has('menu') || window.location.hash === '#menu';

let adFinished = false;

function finishAd() {
    if (adFinished) return;
    adFinished = true;
    adBg.pause();
    ad.classList.add('ready');
    adHint.classList.remove('hidden');
}

function playAd() {
    return [adVideo.play(), adBg.play()];
}

adVideo.addEventListener('ended', finishAd);

adVideo.addEventListener('error', finishAd);

adVideo.addEventListener('timeupdate', () => {
    if (Math.abs(adBg.currentTime - adVideo.currentTime) > 0.3) {
        adBg.currentTime = adVideo.currentTime;
    }
});

if (skipAd) {
    ad.classList.add('hidden');
    menu.classList.remove('hidden');
} else {
    playAd().forEach((playback) => {
        if (playback && typeof playback.catch === 'function') {
            playback.catch(() => {
                adPlayButton.classList.remove('hidden');
            });
        }
    });
}

adPlayButton.addEventListener('click', (event) => {
    event.stopPropagation();
    adPlayButton.classList.add('hidden');
    playAd();
});

ad.addEventListener('click', () => {
    if (!adFinished) return;
    ad.classList.add('hidden');
    menu.classList.remove('hidden');
});

document.querySelectorAll('.mode-button').forEach((button) => {
    button.addEventListener('click', () => {
        window.location.href = button.dataset.href;
    });
});
