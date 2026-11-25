const data = window.WORLD_EXPAND_DATA;

const matrixGrid = document.querySelector("#matrix-grid");
const comparisonGrid = document.querySelector("#comparison-grid");
const galleryGrid = document.querySelector("#gallery-grid");
const searchInput = document.querySelector("#search-input");
const emptyState = document.querySelector("#empty-state");
const matrixComparisons = data.matrixComparisons ?? [];

function videoMarkup(src, label, detail) {
  return `
    <div class="video-panel">
      <div class="video-label"><strong>${label}</strong><span>${detail}</span></div>
      <video controls muted loop autoplay playsinline preload="metadata" src="${src}"></video>
    </div>
  `;
}

for (const item of matrixComparisons) {
  const beforePanel = item.beforeVideo
    ? videoMarkup(item.beforeVideo, "Before Expansion", "Single-View GS")
    : `
      <div class="video-panel unavailable-panel">
        <div class="video-label"><strong>Before Expansion</strong><span>Single-View GS</span></div>
        <div class="media-placeholder">Not available</div>
      </div>
    `;
  const card = document.createElement("article");
  card.className = "comparison-card";
  card.innerHTML = `
    <div class="card-header">
      <h3 title="${item.id}">${item.id}</h3>
      <span class="tag">MATRIX3D COMPARISON</span>
    </div>
    <div class="video-grid video-quad">
      <div class="video-panel input-panel">
        <div class="video-label"><strong>Input</strong><span>Panorama</span></div>
        <img loading="lazy" src="${item.image}" alt="${item.id} input panorama" />
      </div>
      ${videoMarkup(item.matrixVideo, "Matrix3D", "Four-View GS")}
      ${beforePanel}
      ${videoMarkup(item.afterVideo, "After Expansion", "Expanded-World GS")}
    </div>
  `;
  matrixGrid.appendChild(card);
}

for (const item of data.comparisons) {
  const card = document.createElement("article");
  card.className = "comparison-card";
  card.innerHTML = `
    <div class="card-header">
      <h3 title="${item.id}">${item.id}</h3>
      <span class="tag">PAIRED COMPARISON</span>
    </div>
    <div class="input-strip">
      <img loading="lazy" src="${item.image}" alt="${item.id} input panorama" />
    </div>
    <div class="video-grid video-pair">
      ${videoMarkup(item.beforeVideo, "Before Expansion", "Single-View GS")}
      ${videoMarkup(item.afterVideo, "After Expansion", "Expanded-World GS")}
    </div>
  `;
  comparisonGrid.appendChild(card);
}

for (const item of data.examples) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  card.dataset.search = item.id.toLowerCase();
  card.innerHTML = `
    <div class="card-header">
      <h3 title="${item.id}">${item.id}</h3>
      <span class="tag">EXPANDED WORLD</span>
    </div>
    <div class="media">
      <img loading="lazy" src="${item.image}" alt="${item.id} input panorama" />
      <video controls muted loop autoplay playsinline preload="metadata" src="${item.video}"></video>
    </div>
  `;
  galleryGrid.appendChild(card);
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  for (const card of galleryGrid.children) {
    const matches = !query || card.dataset.search.includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  }
  emptyState.hidden = visible > 0;
});

const autoplayObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  },
  { threshold: [0, 0.35] },
);

for (const video of document.querySelectorAll("video")) {
  autoplayObserver.observe(video);
}

const heroVideo = document.querySelector(".hero-video");
const heroStartRate = 2.2;
const heroEndRate = 0.72;
const heroClips = heroVideo
  ? [heroVideo.getAttribute("src"), heroVideo.dataset.nextSrc].filter(Boolean)
  : [];
let heroClipIndex = 0;
let heroRateFrame = null;

function stopHeroRateRamp() {
  if (heroRateFrame !== null) {
    cancelAnimationFrame(heroRateFrame);
    heroRateFrame = null;
  }
}

function updateHeroRate() {
  if (
    !heroVideo ||
    heroClipIndex !== 0 ||
    heroVideo.paused ||
    !Number.isFinite(heroVideo.duration) ||
    heroVideo.duration <= 0
  ) {
    stopHeroRateRamp();
    return;
  }

  const progress = Math.min(heroVideo.currentTime / heroVideo.duration, 1);
  const easedProgress = progress * progress * (3 - 2 * progress);
  heroVideo.playbackRate =
    heroStartRate + (heroEndRate - heroStartRate) * easedProgress;
  heroRateFrame = requestAnimationFrame(updateHeroRate);
}

function startHeroRateRamp() {
  stopHeroRateRamp();
  if (!heroVideo) return;
  if (heroClipIndex !== 0) {
    heroVideo.playbackRate = 1;
    return;
  }
  heroVideo.playbackRate = heroStartRate;
  heroRateFrame = requestAnimationFrame(updateHeroRate);
}

function playHeroClip(index) {
  if (!heroVideo || heroClips.length === 0) return;
  stopHeroRateRamp();
  heroClipIndex = index % heroClips.length;
  heroVideo.src = heroClips[heroClipIndex];
  heroVideo.load();
  heroVideo.playbackRate = heroClipIndex === 0 ? heroStartRate : 1;
  heroVideo.play().catch(() => {});
}

if (heroVideo) {
  heroVideo.addEventListener("play", startHeroRateRamp);
  heroVideo.addEventListener("pause", stopHeroRateRamp);
  heroVideo.addEventListener("emptied", stopHeroRateRamp);
  heroVideo.addEventListener("ended", () => {
    playHeroClip(heroClipIndex + 1);
  });
  heroVideo.addEventListener("loadedmetadata", () => {
    if (!heroVideo.paused) startHeroRateRamp();
  });
  if (!heroVideo.paused) startHeroRateRamp();
}
