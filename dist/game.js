"use strict";

(() => {
  const { Run, districts, columns, rows, index, point } = FactorySim;
  const $ = id => document.getElementById(id);
  const canvas = $("map");
  const view = new FactoryMapView(canvas);
  const dialog = $("dialog");
  const district = $("district");

  const playableCities = ["manila", "la", "munich", "tokyo", "london"];
  let selectedCity = "manila";
  let selectedMode = "endless";
  let screen = "landing"; // "landing" | "play"
  let tutorialStep = 0; // 0 = inactive, 1..4 = active steps

  let run = new Run(selectedCity, selectedMode);
  let tool = "road";
  let activeStrokeTool = "road";
  let status = "running";
  let speed = 1;
  let pointer = null;
  let cursor = null;
  let lastTile = null;
  let motorwayStart = null;
  let strokePitchStep = 0;
  let previousTime = performance.now();
  let dialogAction;
  let best = readBest(selectedCity);
  let displayScore = 0;
  let lastClockTick = -1;
  let panDrag = null;

  const hudDom = {
    score: $("score"),
    best: $("best"),
    shift: $("shift"),
    roads: $("roads"),
    roundabouts: $("roundabouts"),
    lights: $("lights"),
    bridges: $("bridges"),
    motorways: $("motorways"),
    boosts: $("boosts"),
    hubs: $("hubs"),
    districtLabel: $("district-label"),
    comboBadge: $("combo-badge"),
    heatmapBtn: $("heatmap-btn"),
    clockHand: $("clock-hand"),
    undo: $("undo"),
    pause: $("pause"),
  };

  const playSvg = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M4.5 3.2a.8.8 0 0 1 1.22-.68l7.2 4.8a.8.8 0 0 1 0 1.36l-7.2 4.8A.8.8 0 0 1 4.5 12.8V3.2Z"/></svg>';
  const pauseSvg = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>';
  const moonSvg = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 9.8A5.5 5.5 0 0 1 6.2 2.8a5.5 5.5 0 1 0 7 7Z"/></svg>';
  const sunSvg = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3"/></svg>';

  // Disasterpeace-style procedural Web Audio marimba & synth foley engine
  const SoundEngine = (() => {
    let ctx = null;
    const baseFreq = 261.63;
    const scaleSemitones = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 21, 23, 24, 26, 28, 31];

    function ensureCtx() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }

    function playNote(freq, duration = 0.11, type = "triangle", gainPeak = 0.075, filterFreq = 1400) {
      const ac = ensureCtx();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const sub = ac.createOscillator();
      const filter = ac.createBiquadFilter();
      const gain = ac.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      sub.type = "sine";
      sub.frequency.setValueAtTime(freq * 0.5, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(180, filterFreq * 0.35), now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + duration + 0.01);
      sub.stop(now + duration + 0.01);
    }

    return {
      tickExtend(step) {
        const idx = Math.max(0, Math.min(scaleSemitones.length - 1, step));
        playNote(baseFreq * Math.pow(2, scaleSemitones[idx] / 12), 0.12, "triangle", 0.07, 1650);
      },
      tickRetract(step) {
        const idx = Math.max(0, Math.min(scaleSemitones.length - 1, step));
        playNote(baseFreq * Math.pow(2, scaleSemitones[idx] / 12) * 0.94, 0.09, "sine", 0.055, 950);
      },
      bridgeLock(step) {
        const idx = Math.max(0, Math.min(scaleSemitones.length - 1, step));
        const freq = baseFreq * Math.pow(2, scaleSemitones[idx] / 12);
        playNote(freq * 0.5, 0.18, "triangle", 0.095, 820);
        setTimeout(() => playNote(freq, 0.14, "sine", 0.06, 1400), 32);
      },
      cureStroke(step) {
        const idx = Math.max(0, Math.min(scaleSemitones.length - 1, step));
        const freq = baseFreq * Math.pow(2, scaleSemitones[idx] / 12);
        playNote(freq, 0.16, "sine", 0.05, 1400);
        setTimeout(() => playNote(freq * 1.25, 0.2, "triangle", 0.048, 1800), 45);
      },
      eraseTick() {
        playNote(210, 0.09, "sine", 0.05, 700);
      },
      chimeSuccess() {
        playNote(523.25, 0.18, "sine", 0.065, 1800);
        setTimeout(() => playNote(659.25, 0.22, "triangle", 0.06, 2000), 70);
        setTimeout(() => playNote(783.99, 0.26, "sine", 0.06, 2200), 140);
      },
      boostPlace() {
        playNote(440, 0.12, "triangle", 0.065, 2200);
        setTimeout(() => playNote(659.25, 0.16, "sine", 0.06, 2600), 45);
      },
      hubPlace() {
        playNote(392, 0.15, "sine", 0.07, 1600);
        setTimeout(() => playNote(587.33, 0.18, "triangle", 0.065, 2200), 55);
        setTimeout(() => playNote(880, 0.22, "sine", 0.055, 2600), 110);
      },
      surgeChord() {
        playNote(523.25, 0.32, "sine", 0.06, 1800);
        setTimeout(() => playNote(659.25, 0.34, "sine", 0.055, 2000), 50);
        setTimeout(() => playNote(783.99, 0.38, "triangle", 0.055, 2400), 100);
        setTimeout(() => playNote(1046.5, 0.44, "sine", 0.05, 2800), 160);
      },
    };
  })();

  function readBest(key) {
    try { return Math.max(0, Number(localStorage.getItem("factory-ways:" + key)) || 0); }
    catch { return 0; }
  }

  function saveBest() {
    if (run.district.isTutorial || run.score <= best) return;
    best = run.score;
    try { localStorage.setItem("factory-ways:" + run.districtKey, String(best)); }
    catch { /* Private storage can be unavailable. */ }
  }

  function setText(id, value) {
    const element = $(id);
    if (!element) return;
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }

  function syncThemeBody() {
    const isDark = view.getPalette(run).isDark;
    document.body.dataset.theme = isDark ? "night" : "day";
    const btn = $("theme-toggle");
    if (btn) btn.innerHTML = isDark ? sunSvg : moonSvg;
  }

  // ================= LANDING PAGE & CITY CARDS =================
  function cityThumbSvg(key) {
    const d = districts[key];
    const p = d.palette;
    return (
      '<svg viewBox="0 0 120 75" preserveAspectRatio="none">' +
        '<rect width="120" height="75" fill="' + p.land + '"/>' +
        '<path d="M-8,12 Q32,28 24,80 L-8,80 Z" fill="' + p.water + '" stroke="' + p.shore + '" stroke-width="4"/>' +
        '<path d="M18,28 Q62,22 78,44 T126,56" fill="none" stroke="' + p.shore + '" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="M18,28 Q62,22 78,44 T126,56" fill="none" stroke="' + p.water + '" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M24,52 L54,52 L68,36 L98,36" fill="none" stroke="' + p.road + '" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M40,52 Q70,22 98,36" fill="none" stroke="' + p.motorwayInner + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<rect x="92" y="28" width="12" height="12" rx="3" fill="#e85458"/>' +
        '<circle cx="24" cy="52" r="5" fill="#f5b841"/>' +
      '</svg>'
    );
  }

  function renderCityCards() {
    const grid = $("city-grid");
    if (!grid) return;
    grid.innerHTML = playableCities.map(key => {
      const d = districts[key];
      const cityBest = readBest(key);
      const checked = key === selectedCity;
      return (
        '<button type="button" class="city-card" role="radio" data-city="' + key + '" aria-checked="' + checked + '">' +
          '<div class="city-thumb">' + cityThumbSvg(key) + '</div>' +
          '<span class="city-name">' + d.name + '</span>' +
          '<span class="city-region">' + d.region + '</span>' +
          '<span class="city-best">' + (cityBest > 0 ? "Best: " + cityBest : "New city") + '</span>' +
        '</button>'
      );
    }).join("");

    for (const card of grid.querySelectorAll(".city-card")) {
      card.addEventListener("click", () => {
        selectedCity = card.dataset.city;
        district.value = selectedCity;
        setText("play-btn-label", "Play " + districts[selectedCity].name);
        for (const c of grid.querySelectorAll(".city-card")) {
          c.setAttribute("aria-checked", String(c.dataset.city === selectedCity));
        }
        // Live-preview the selected real-world city behind the landing card!
        run = new Run(selectedCity, selectedMode);
        best = readBest(selectedCity);
        view.setThemeOverride(null);
        view.resetCamera();
        syncThemeBody();
      });
    }
  }

  function openLanding() {
    screen = "landing";
    tutorialStep = 0;
    view.tutorialGuide = null;
    $("tutorial-banner").hidden = true;
    $("upgrade-overlay").hidden = true;
    document.body.dataset.screen = "landing";
    if (run.district.isTutorial) {
      run = new Run(selectedCity, selectedMode);
    }
    renderCityCards();
    syncThemeBody();
  }

  function startCity(cityKey, mode = selectedMode) {
    finishPointer();
    selectedCity = cityKey;
    selectedMode = mode;
    district.value = cityKey;
    tutorialStep = 0;
    displayScore = 0;
    lastClockTick = -1;
    view.tutorialGuide = null;
    $("tutorial-banner").hidden = true;
    $("upgrade-overlay").hidden = true;
    run = new Run(cityKey, mode);
    best = readBest(cityKey);
    status = "running";
    speed = 1;
    screen = "play";
    document.body.dataset.screen = "play";
    view.setThemeOverride(null);
    view.resetCamera();
    setTool("road");
    setSpeed(1);
    syncThemeBody();
    updateHUD();
  }

  // ================= INTERACTIVE GUIDED TUTORIAL =================
  function startTutorial() {
    finishPointer();
    tutorialStep = 1;
    run = new Run("tutorial", "endless");
    status = "running";
    speed = 1;
    screen = "play";
    document.body.dataset.screen = "play";
    $("upgrade-overlay").hidden = true;
    view.setThemeOverride(null);
    view.resetCamera();
    setTool("road");
    setSpeed(1);
    syncThemeBody();
    updateTutorialUI();
    updateHUD();
  }

  function updateTutorialUI() {
    const banner = $("tutorial-banner");
    if (!tutorialStep) {
      banner.hidden = true;
      view.tutorialGuide = null;
      return;
    }
    banner.hidden = false;
    const nextBtn = $("tutorial-next");
    nextBtn.hidden = true;

    if (tutorialStep === 1) {
      setText("tutorial-step-num", "1 / 4");
      setText("tutorial-title", "Pour Your First Road");
      setText("tutorial-desc", "Drag smoothly from the glowing Yellow house to the Yellow destination. Roads flow like water and fuse automatically.");
      view.tutorialGuide = {
        fromTile: index(3, 6),
        toTile: index(7, 6),
        pulseTiles: [index(3, 6), index(7, 6)],
      };
    } else if (tutorialStep === 2) {
      setText("tutorial-step-num", "2 / 4");
      setText("tutorial-title", "Cross the River with a Bridge");
      setText("tutorial-desc", "Drag a road from the Red house across the gridded river to the circular Red destination. Bridges build automatically over water.");
      view.tutorialGuide = {
        fromTile: index(7, 9),
        toTile: index(15, 6),
        pulseTiles: [index(7, 9), index(15, 6)],
      };
    } else if (tutorialStep === 3) {
      setText("tutorial-step-num", "3 / 4");
      setText("tutorial-title", "Place a Roundabout or Motorway");
      setText("tutorial-desc", "Select Roundabout (2) and click a road tile, OR select Motorway (4) and drag an elevated overpass across the river.");
      view.tutorialGuide = {
        fromTile: null,
        toTile: null,
        pulseTiles: [index(6, 7)],
      };
    } else if (tutorialStep === 4) {
      setText("tutorial-step-num", "Done");
      setText("tutorial-title", "You’re Ready to Build!");
      setText("tutorial-desc", "Right-click anytime to erase, scroll to zoom, and choose weekly upgrades every Sunday.");
      view.tutorialGuide = null;
      nextBtn.hidden = false;
      nextBtn.textContent = "Pick a City";
    }
  }

  function checkTutorialProgress() {
    if (!tutorialStep || !run.district.isTutorial) return;
    if (tutorialStep === 1) {
      const yellowLane = run.lanes.find(l => l.key === "amber");
      if (yellowLane?.route) {
        tutorialStep = 2;
        SoundEngine.chimeSuccess();
        updateTutorialUI();
      }
    } else if (tutorialStep === 2) {
      const redLane = run.lanes.find(l => l.key === "copper");
      if (redLane?.route) {
        tutorialStep = 3;
        SoundEngine.chimeSuccess();
        updateTutorialUI();
      }
    } else if (tutorialStep === 3) {
      if (run.roundabouts.size > 0 || run.motorways.length > 0) {
        tutorialStep = 4;
        SoundEngine.chimeSuccess();
        updateTutorialUI();
      }
    }
  }

  // ================= WEEKLY SUNDAY UPGRADE MODAL =================
  function checkUpgradeModal() {
    const overlay = $("upgrade-overlay");
    if (!run.pendingUpgrade || screen !== "play") {
      overlay.hidden = true;
      return;
    }
    if (!overlay.hidden) return;
    overlay.hidden = false;
    setText("upgrade-week", run.pendingUpgrade.week);
    const wrap = $("upgrade-choices");
    wrap.innerHTML = run.pendingUpgrade.choices.map((ch, i) => (
      '<button type="button" class="upgrade-option" data-choice="' + i + '">' +
        '<strong>' + ch.title + '</strong>' +
        '<span>' + ch.desc + '</span>' +
      '</button>'
    )).join("");
    for (const btn of wrap.querySelectorAll(".upgrade-option")) {
      btn.addEventListener("click", () => {
        run.applyUpgrade(Number(btn.dataset.choice));
        overlay.hidden = true;
        SoundEngine.chimeSuccess();
        updateHUD();
      });
    }
  }

  function setElText(element, value) {
    if (!element) return;
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }

  function updateHUD() {
    setElText(hudDom.score, Math.round(displayScore));
    setElText(hudDom.best, best);
    setElText(hudDom.shift, run.dayName || "MON");
    setElText(hudDom.roads, run.inventory.road);
    setElText(hudDom.roundabouts, run.inventory.roundabout);
    setElText(hudDom.lights, run.inventory.light);
    setElText(hudDom.bridges, run.inventory.bridge);
    setElText(hudDom.motorways, run.inventory.motorway);
    setElText(hudDom.boosts, run.inventory.boost ?? 0);
    setElText(hudDom.hubs, run.inventory.hub ?? 0);

    const comboBadge = hudDom.comboBadge;
    if (comboBadge) {
      const mult = run.flowMultiplier || 1;
      const label = "×" + mult;
      if (comboBadge.textContent !== label) comboBadge.textContent = label;
      if (comboBadge.dataset.tier !== String(mult)) comboBadge.dataset.tier = String(mult);
    }

    const heatBtn = hudDom.heatmapBtn;
    if (heatBtn) {
      const wantHeat = String(Boolean(view.showHeatmap));
      if (heatBtn.getAttribute("aria-pressed") !== wantHeat) {
        heatBtn.setAttribute("aria-pressed", wantHeat);
      }
    }

    setElText(hudDom.districtLabel, run.district.name);

    const hand = hudDom.clockHand;
    if (hand) {
      const tick = Math.round((run.shiftProgress || 0) * 180);
      if (tick !== lastClockTick) {
        lastClockTick = tick;
        const angle = (run.shiftProgress || 0) * Math.PI * 2;
        hand.setAttribute("x2", (10 + Math.sin(angle) * 5.6).toFixed(2));
        hand.setAttribute("y2", (10 - Math.cos(angle) * 5.6).toFixed(2));
      }
    }

    if (hudDom.undo) hudDom.undo.disabled = !run.history.length;
    const pauseBtn = hudDom.pause;
    if (pauseBtn) {
      const wantState = status === "running" ? "running" : "paused";
      if (pauseBtn.dataset.iconState !== wantState) {
        pauseBtn.dataset.iconState = wantState;
        pauseBtn.innerHTML = status === "running" ? pauseSvg : playSvg;
        pauseBtn.setAttribute("aria-label", status === "running" ? "Pause" : "Resume");
      }
    }
  }

  function setTool(next) {
    tool = next;
    for (const button of document.querySelectorAll("[data-tool]")) {
      button.setAttribute("aria-pressed", String(button.dataset.tool === next));
    }
  }

  function setSpeed(next) {
    speed = next;
    if (status === "paused") status = "running";
    for (const button of document.querySelectorAll(".speed")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.speed) === next));
    }
    updateHUD();
  }

  function toggleTheme() {
    const isCurrentlyDark = view.getPalette(run).isDark;
    view.setThemeOverride(isCurrentlyDark ? null : "night");
    if (run.district.palette.isDark && isCurrentlyDark) {
      // Tokyo is natively dark; keep native palette unless overridden
      view.setThemeOverride(null);
    }
    syncThemeBody();
  }

  function toggleHeatmap() {
    view.showHeatmap = !view.showHeatmap;
    updateHUD();
  }

  function toggle() {
    status = status === "running" ? "paused" : "running";
    updateHUD();
  }

  function showDialog(title, body, button, action) {
    setText("dialog-title", title);
    $("dialog-body").innerHTML = body;
    $("dialog-actions").innerHTML = '<button class="primary" value="confirm">' + button + '</button>';
    dialogAction = action;
    dialog.returnValue = "";
    if (!dialog.open) dialog.showModal();
  }

  dialog.addEventListener("close", () => {
    const action = dialogAction;
    dialogAction = null;
    if (dialog.returnValue === "confirm") action?.();
  });

  // Landing page event listeners
  $("play-btn").addEventListener("click", () => startCity(selectedCity, selectedMode));
  $("tutorial-btn").addEventListener("click", startTutorial);
  $("tutorial-skip").addEventListener("click", openLanding);
  $("tutorial-next").addEventListener("click", openLanding);
  $("menu-btn").addEventListener("click", openLanding);

  for (const btn of document.querySelectorAll(".mode-btn")) {
    btn.addEventListener("click", () => {
      selectedMode = btn.dataset.mode;
      for (const b of document.querySelectorAll(".mode-btn")) {
        b.setAttribute("aria-pressed", String(b.dataset.mode === selectedMode));
      }
    });
  }

  $("help").addEventListener("click", startTutorial);

  $("settings-btn")?.addEventListener("click", () => {
    showDialog(
      "Settings & Shortcuts",
      '<div class="stats-list">' +
        '<div class="stat-row"><span>Game Mode</span><strong>' + (run.mode === "endless" ? "Endless (Infinite)" : "Classic") + '</strong></div>' +
        '<div class="stat-row"><span>Road / Roundabout / Signal</span><strong>Keys 1 / 2 / 3</strong></div>' +
        '<div class="stat-row"><span>Motorway / Bridge</span><strong>Keys 4 / 5</strong></div>' +
        '<div class="stat-row"><span>Boost Strip / Overcharge Hub / Erase</span><strong>Keys 6 / 7 / 8 (or Right-Click)</strong></div>' +
        '<div class="stat-row"><span>Traffic Heatmap / Night Mode</span><strong>Keys H / T</strong></div>' +
        '<div class="stat-row"><span>Zoom In / Out / Reset</span><strong>+ / − / 0 or Mouse Wheel</strong></div>' +
        '<div class="stat-row"><span>Pause / Menu</span><strong>Spacebar / Esc</strong></div>' +
      '</div>',
      "Done"
    );
  });

  $("stats-btn")?.addEventListener("click", () => {
    const activeCars = run.houses.reduce((acc, h) => acc + h.cars.filter(c => c.state !== "home").length, 0);
    const totalCars = run.houses.length * 2;
    const roadCount = [...run.roads.values()].filter(v => v === "road" || v === "bridge").length;
    showDialog(
      run.district.name + " Statistics",
      '<div class="stats-list">' +
        '<div class="stat-row"><span>Completed Trips</span><strong>' + run.score + ' (Flow ×' + (run.flowMultiplier || 1) + ')</strong></div>' +
        '<div class="stat-row"><span>Best Record</span><strong>' + Math.max(best, run.score) + '</strong></div>' +
        '<div class="stat-row"><span>Destinations</span><strong>' + run.factories.length + '</strong></div>' +
        '<div class="stat-row"><span>Houses & Active Cars</span><strong>' + run.houses.length + ' (' + activeCars + '/' + totalCars + ' moving)</strong></div>' +
        '<div class="stat-row"><span>Roads / Roundabouts / Signals</span><strong>' + roadCount + ' / ' + run.roundabouts.size + ' / ' + run.trafficLights.size + '</strong></div>' +
        '<div class="stat-row"><span>Boost Strips / Overcharge Hubs</span><strong>' + (run.boosts?.size || 0) + ' / ' + (run.hubs?.size || 0) + '</strong></div>' +
        '<div class="stat-row"><span>Elevated Motorways</span><strong>' + run.motorways.length + '</strong></div>' +
      '</div>',
      "Close"
    );
  });

  $("restart").addEventListener("click", () => {
    if (run.district.isTutorial) startTutorial();
    else startCity(run.districtKey, run.mode);
  });
  $("theme-toggle").addEventListener("click", toggleTheme);
  $("heatmap-btn")?.addEventListener("click", toggleHeatmap);

  district.addEventListener("change", () => {
    startCity(district.value, selectedMode);
  });

  $("pause").addEventListener("click", toggle);
  $("start")?.addEventListener("click", toggle);
  for (const button of document.querySelectorAll("[data-tool]")) {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  }
  for (const button of document.querySelectorAll(".speed")) {
    button.addEventListener("click", () => setSpeed(Number(button.dataset.speed)));
  }
  $("undo").addEventListener("click", () => { run.undo(); updateHUD(); });

  $("zoom-in")?.addEventListener("click", () => view.zoomBy(1.22));
  $("zoom-out")?.addEventListener("click", () => view.zoomBy(1 / 1.22));
  $("zoom-reset")?.addEventListener("click", () => view.resetCamera());

  canvas.addEventListener("wheel", event => {
    if (screen !== "play") return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    view.zoomBy(factor, event.clientX, event.clientY);
  }, { passive: false });

  function pointerTile(event) {
    return view.screenToTile(event.clientX, event.clientY);
  }

  function handleFoleySignal(sig) {
    if (!sig) return;
    if (sig === "extend") {
      SoundEngine.tickExtend(strokePitchStep);
      strokePitchStep = Math.min(15, strokePitchStep + 1);
    } else if (sig === "bridge-lock") {
      SoundEngine.bridgeLock(strokePitchStep);
      strokePitchStep = Math.min(15, strokePitchStep + 1);
    } else if (sig === "retract") {
      strokePitchStep = Math.max(0, strokePitchStep - 1);
      SoundEngine.tickRetract(strokePitchStep);
    } else if (sig === "erase") {
      SoundEngine.eraseTick();
    } else if (sig === "boost-place") {
      SoundEngine.boostPlace();
    } else if (sig === "hub-place") {
      SoundEngine.hubPlace();
    }
  }

  function paintTo(tile, worldPt = null, isRelease = false) {
    if (activeStrokeTool === "motorway") {
      view.motorwayDrag = { from: motorwayStart, to: tile };
      return;
    }
    if (
      activeStrokeTool === "roundabout" ||
      activeStrokeTool === "light" ||
      activeStrokeTool === "boost" ||
      activeStrokeTool === "hub"
    ) {
      if (lastTile === null) {
        const sig = run.edit(tile, activeStrokeTool);
        handleFoleySignal(sig);
        lastTile = tile;
        checkTutorialProgress();
        updateHUD();
      }
      return;
    }

    if (lastTile === null) {
      strokePitchStep = 0;
      const sig = run.edit(tile, activeStrokeTool);
      handleFoleySignal(sig);
      lastTile = tile;
      checkTutorialProgress();
      updateHUD();
      return;
    }

    // Fluid liquid-water lead on land (ultra-smooth low threshold) + physical resistance on water
    if (activeStrokeTool !== "erase" && worldPt) {
      const { x: lx, y: ly } = point(lastTile);
      const anchorX = lx * 68 + 34;
      const anchorY = ly * 68 + 34;
      const crossingWater =
        (tile !== lastTile && run.terrain[tile] === "water") ||
        run.terrain[lastTile] === "water";

      if (!view.bridgeDrag || view.bridgeDrag.anchorTile !== lastTile) {
        view.bridgeDrag = {
          anchorTile: lastTile,
          tipX: view.bridgeDrag ? view.bridgeDrag.tipX : anchorX,
          tipY: view.bridgeDrag ? view.bridgeDrag.tipY : anchorY,
          targetX: worldPt.x,
          targetY: worldPt.y,
          vx: view.bridgeDrag ? view.bridgeDrag.vx * 0.45 : 0,
          vy: view.bridgeDrag ? view.bridgeDrag.vy * 0.45 : 0,
          isWater: crossingWater,
        };
      } else {
        view.bridgeDrag.targetX = worldPt.x;
        view.bridgeDrag.targetY = worldPt.y;
        view.bridgeDrag.isWater = crossingWater;
      }

      const pullDist = Math.hypot(worldPt.x - anchorX, worldPt.y - anchorY);
      const snapThreshold = crossingWater ? 68 * 0.72 : 68 * 0.36;
      if (!isRelease && tile !== lastTile && pullDist < snapThreshold) {
        return;
      }
    }

    if (lastTile !== tile) {
      let { x, y } = point(lastTile);
      const target = point(tile);
      while (x !== target.x || y !== target.y) {
        const prevTile = index(x, y);
        const stepX = Math.sign(target.x - x);
        const stepY = Math.sign(target.y - y);
        x += stepX;
        y += stepY;
        const currTile = index(x, y);
        if (activeStrokeTool === "erase") {
          handleFoleySignal(run.edit(currTile, "erase"));
        } else {
          handleFoleySignal(run.connectTiles(prevTile, currTile, activeStrokeTool));
        }
      }
      lastTile = tile;
      if (view.bridgeDrag) view.bridgeDrag.anchorTile = lastTile;
      checkTutorialProgress();
    }
    updateHUD();
  }

  function finishPointer() {
    if (activeStrokeTool === "motorway" && motorwayStart !== null && view.motorwayDrag?.to !== null) {
      const msg = run.addMotorway(motorwayStart, view.motorwayDrag.to);
      if (msg && msg.startsWith("Motorway")) {
        SoundEngine.cureStroke(strokePitchStep + 2);
        checkTutorialProgress();
      }
    }
    view.motorwayDrag = null;
    view.bridgeDrag = null;
    motorwayStart = null;
    const cured = run.endStroke();
    if (cured) SoundEngine.cureStroke(strokePitchStep);
    strokePitchStep = 0;
    pointer = null;
    lastTile = null;
  }

  canvas.addEventListener("contextmenu", event => event.preventDefault());

  canvas.addEventListener("pointerdown", event => {
    if (screen !== "play") return;
    if (event.button === 1) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      panDrag = { id: event.pointerId, lastX: event.clientX, lastY: event.clientY };
      return;
    }
    if (pointer !== null || (event.button !== 0 && event.button !== 2)) return;
    const tile = pointerTile(event);
    if (tile === null) return;
    activeStrokeTool = event.button === 2 ? "erase" : tool;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    pointer = event.pointerId;
    cursor = tile;
    if (activeStrokeTool === "motorway") {
      motorwayStart = tile;
      view.motorwayDrag = { from: tile, to: tile };
    } else {
      run.beginStroke();
      paintTo(tile, view.screenToWorld(event.clientX, event.clientY), false);
    }
  });

  canvas.addEventListener("pointermove", event => {
    if (screen !== "play") return;
    if (panDrag && event.pointerId === panDrag.id) {
      view.targetPanX += event.clientX - panDrag.lastX;
      view.targetPanY += event.clientY - panDrag.lastY;
      panDrag.lastX = event.clientX;
      panDrag.lastY = event.clientY;
      return;
    }
    cursor = pointerTile(event);
    if (event.pointerId === pointer && cursor !== null) {
      paintTo(cursor, view.screenToWorld(event.clientX, event.clientY), false);
    }
  });

  canvas.addEventListener("pointerleave", () => { cursor = null; });

  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(name, event => {
      if (panDrag && event.pointerId === panDrag.id) {
        panDrag = null;
        return;
      }
      if (event.pointerId !== pointer) return;
      if (name === "pointerup") {
        const tile = pointerTile(event);
        if (tile !== null) {
          paintTo(tile, view.screenToWorld(event.clientX, event.clientY), true);
        }
      }
      finishPointer();
      if (event.pointerType !== "mouse") cursor = null;
      updateHUD();
    });
  }

  window.addEventListener("keydown", event => {
    if (dialog.open || event.altKey || (event.metaKey && event.key.toLowerCase() !== "z")) return;
    if (event.target === district) return;
    const key = event.key.toLowerCase();
    if (key === "escape" && screen === "play") {
      openLanding();
      return;
    }
    if (screen !== "play") return;

    const shortcuts = {
      "1": "road",
      "2": "roundabout",
      "3": "light",
      "4": "motorway",
      "5": "bridge",
      "6": "boost",
      "7": "hub",
      "8": "erase",
    };
    if (shortcuts[key]) setTool(shortcuts[key]);
    if (key === "t") toggleTheme();
    if (key === "h") toggleHeatmap();
    if (key === "+" || key === "=") view.zoomBy(1.2);
    if (key === "-" || key === "_") view.zoomBy(1 / 1.2);
    if (key === "0") view.resetCamera();
    if (key === "z") {
      event.preventDefault();
      finishPointer();
      run.undo();
      updateHUD();
    }
    if (key === " " && event.target.tagName !== "BUTTON") {
      event.preventDefault();
      if (!event.repeat) toggle();
    }
  });

  function frame(now) {
    const elapsed = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
    previousTime = now;
    if (status === "running" && !dialog.open && !document.hidden) {
      const stepCount = screen === "landing" ? 1 : speed;
      for (let i = 0; i < stepCount; i++) run.step(elapsed);
      if (screen === "play") {
        if (run.justSurged) {
          run.justSurged = false;
          SoundEngine.surgeChord();
        }
        run.justBoosted = false;
        run.justCharged = false;
        displayScore += (run.score - displayScore) * (1 - Math.exp(-16 * elapsed));
        if (Math.abs(run.score - displayScore) < 0.08) displayScore = run.score;
        saveBest();
        checkUpgradeModal();
        if (run.fault) {
          status = "paused";
          showDialog(
            "City Gridlock",
            "<p>A destination overflowed in Classic Mode. You completed <strong>" +
              run.score + "</strong> trips across <strong>" + run.district.name + "</strong>.</p>",
            "Try Again",
            () => startCity(run.districtKey, run.mode)
          );
        }
        updateHUD();
      }
    }
    view.render(run, screen === "play" ? cursor : null, now, elapsed);
    requestAnimationFrame(frame);
  }

  renderCityCards();
  syncThemeBody();
  updateHUD();
  requestAnimationFrame(frame);
})();
