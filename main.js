// Radio School — main.js
// Builds the tuning dial and runs the track player.
// You shouldn't need to edit this to add tracks; edit index.html instead.

(function () {
  const MIN = 88, MAX = 108;                 // FM band shown on the dial
  const pct = f => ((f - MIN) / (MAX - MIN)) * 100;

  // ---- Draw the dial ticks ----
  const scale = document.getElementById("dialScale");
  for (let f = MIN; f <= MAX + 0.001; f += 0.5) {
    const v = Math.round(f * 10) / 10;
    const tick = document.createElement("span");
    const major = v % 2 === 0;
    tick.className = "tick" + (major ? " major" : "");
    tick.style.left = pct(v) + "%";
    scale.appendChild(tick);
    if (major) {
      const label = document.createElement("span");
      label.className = "tick-label" + (v % 4 === 0 ? "" : " minor-label");
      label.style.left = pct(v) + "%";
      label.textContent = v;
      scale.appendChild(label);
    }
  }

  const needle = document.getElementById("needle");
  const setNeedle = f => { needle.style.left = pct(f) + "%"; };

  // On load the needle sweeps to the first track's station.
  const tracks = Array.from(document.querySelectorAll(".track"));
  setNeedle(MIN + 0.5);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (tracks[0]) setNeedle(parseFloat(tracks[0].dataset.freq));
  }));

  // ---- Player ----
  const audio = document.getElementById("audio");
  const progress = document.getElementById("progress");
  const fill = document.getElementById("progressFill");
  let current = null;

  const fmt = s => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  };

  // Fill in each track's length.
  tracks.forEach(t => {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = t.dataset.src;
    probe.addEventListener("loadedmetadata", () => {
      t.querySelector(".time").textContent = fmt(probe.duration);
    });
  });

  function select(t) {
    if (current) {
      current.classList.remove("is-playing");
      current.querySelector(".play").setAttribute("aria-label", "Play " + current.querySelector(".title").textContent);
    }
    current = t;
    audio.src = t.dataset.src;
    setNeedle(parseFloat(t.dataset.freq));
  }

  tracks.forEach((t, i) => {
    t.querySelector(".play").addEventListener("click", () => {
      if (current !== t) select(t);
      audio.paused ? audio.play() : audio.pause();
    });
  });

  audio.addEventListener("play", () => {
    current.classList.add("is-playing");
    current.querySelector(".play").setAttribute("aria-label", "Pause " + current.querySelector(".title").textContent);
  });
  audio.addEventListener("pause", () => {
    if (!current) return;
    current.classList.remove("is-playing");
    current.querySelector(".play").setAttribute("aria-label", "Play " + current.querySelector(".title").textContent);
  });
  audio.addEventListener("timeupdate", () => {
    const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fill.style.width = p + "%";
    progress.setAttribute("aria-valuenow", Math.round(p));
  });
  // Auto-advance to the next track.
  audio.addEventListener("ended", () => {
    const next = tracks[tracks.indexOf(current) + 1];
    if (next) { select(next); audio.play(); }
  });

  // Click or arrow keys to seek.
  progress.addEventListener("click", e => {
    if (!audio.duration) return;
    const r = progress.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });
  progress.addEventListener("keydown", e => {
    if (!audio.duration) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    if (e.key === "ArrowLeft")  audio.currentTime = Math.max(0, audio.currentTime - 5);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
