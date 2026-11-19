"use strict";

(() => {
  const { Run, colors, columns, rows, index, point } = FactorySim;
  const $ = id => document.getElementById(id);
  const canvas = $("map");
  const view = new FactoryMapView(canvas);
  const dialog = $("dialog");
  const district = $("district");
  const orders = $("orders");
  let run = new Run(district.value);
  let tool = "road";
  let status = "planning";
  let speed = 1;
  let pointer = null;
  let cursor = null;
  let lastTile = null;
  let previousTime = performance.now();
  let cardSignature = "";
  let dialogAction;
  let best = readBest();
  const startHint = "Drag from a supplier to its matching factory. You can plan before starting the shift.";
  const playHint = "Keep each factory supplied. A backlog of 12 shuts down the district.";

  function readBest() {
    try { return Math.max(0, Number(localStorage.getItem("factory-ways:" + district.value)) || 0); }
    catch { return 0; }
  }

  function saveBest() {
    if (run.score <= best) return;
    best = run.score;
    try { localStorage.setItem("factory-ways:" + district.value, String(best)); }
    catch { /* Private storage can be unavailable. */ }
  }

  function setText(id, value) {
    const element = $(id);
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }

  function updateOrders() {
    const lanes = run.lanes.filter(lane => lane.active);
    const signature = lanes.map(lane => [lane.key, Boolean(lane.route), lane.backlog].join(":")).join(";");
    if (signature === cardSignature) return;
    cardSignature = signature;
    setText("connected", lanes.filter(lane => lane.route).length + " / " + lanes.length + " linked");
    orders.innerHTML = lanes.map(lane => {
      const palette = colors[lane.key];
      const state = lane.backlog >= 8 ? "Backlog high" : lane.route ? "Linked" : "Unlinked";
      const fill = lane.backlog >= 8 ? "#b84632" : palette.dark;
      return '<article class="order"><div class="order-top"><span class="swatch" style="background:' + palette.fill + '">' +
        palette.symbol + '</span>' + palette.label + '</div><p><span>' + state + '</span><span>' + lane.backlog +
        '/12</span></p><div class="bar" aria-hidden="true"><b style="background:' + fill + ';width:' +
        Math.min(100, lane.backlog / 12 * 100) + '%"></b></div></article>';
    }).join("");
  }

  function updateHUD() {
    setText("score", String(run.score).padStart(3, "0"));
    setText("best", String(best).padStart(3, "0"));
    setText("shift", String(run.shift).padStart(2, "0"));
    setText("roads", run.inventory.road);
    setText("bridges", run.inventory.bridge);
    setText("mode", { planning: "Planning", running: "Shift active", paused: "Paused", ended: "Shutdown" }[status]);
    setText("start", { planning: "Start shift", running: "Pause shift", paused: "Resume shift", ended: "Try again" }[status]);
    $("undo").disabled = !run.history.length || status === "ended";
    $("pause").textContent = status === "running" ? "Ⅱ" : "▶";
    $("pause").setAttribute("aria-label", status === "running" ? "Pause shift" : "Start or resume shift");
    updateOrders();
  }

  function setTool(next) {
    tool = next;
    for (const button of document.querySelectorAll("[data-tool]")) {
      button.setAttribute("aria-pressed", String(button.dataset.tool === next));
    }
    const hints = {
      road: status === "planning" ? startHint : playHint,
      bridge: "Paint bridge tiles on water, then join them to roads on both banks.",
      erase: "Drag over roads or bridges to reclaim their tiles.",
    };
    if (status !== "ended") setText("hint", hints[next]);
  }

  function setSpeed(next) {
    speed = next;
    for (const button of document.querySelectorAll(".speed")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.speed) === next));
    }
  }

  function reset(key) {
    finishPointer();
    district.value = key;
    run = new Run(key);
    status = "planning";
    cardSignature = "";
    best = readBest();
    cursor = null;
    setTool("road");
    setSpeed(1);
    updateHUD();
  }

  function toggle() {
    if (status === "ended") {
      reset(district.value);
      return;
    }
    status = status === "running" ? "paused" : "running";
    if (status === "running") setText("hint", playHint);
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

  $("help").addEventListener("click", () => {
    showDialog("How to play", '<ol><li>Drag roads between a round supplier and a square factory with the same symbol.</li>' +
      '<li>Use bridges on water tiles. Erase to recover materials, or undo your last stroke.</li>' +
      '<li>Start the shift. Trucks deliver automatically, and new shifts bring more supplies and busier factories.</li>' +
      '<li>Keep backlogs below 12. Short routes and separate lanes reduce congestion.</li></ol>' +
      '<p>Press 1–3 to switch tools, Z to undo, or Space to pause. With the map focused, move with arrow keys, press Enter to build, or hold Shift while moving to paint.</p>', "Back to map");
  });
  $("restart").addEventListener("click", () => {
    if (status === "planning" && !run.roads.size || status === "ended") return reset(district.value);
    showDialog("Start a new run?", "<p>Your current network will be cleared. Your best score is saved for this district.</p>",
      "New run", () => reset(district.value));
  });
  district.addEventListener("change", () => {
    const key = district.value;
    const current = Object.keys(FactorySim.districts).find(id => FactorySim.districts[id] === run.district);
    if (status === "ended" || (status === "planning" && !run.roads.size)) return reset(key);
    district.value = current;
    showDialog("Switch district?", "<p>Switching districts ends this run and clears the current network.</p>",
      "Switch district", () => reset(key));
  });
  $("pause").addEventListener("click", toggle);
  $("start").addEventListener("click", toggle);
  for (const button of document.querySelectorAll("[data-tool]")) button.addEventListener("click", () => setTool(button.dataset.tool));
  for (const button of document.querySelectorAll(".speed")) button.addEventListener("click", () => setSpeed(Number(button.dataset.speed)));
  $("undo").addEventListener("click", () => { run.undo(); updateHUD(); });

  function pointerTile(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * columns);
    const y = Math.floor((event.clientY - rect.top) / rect.height * rows);
    return x < 0 || y < 0 || x >= columns || y >= rows ? null : index(x, y);
  }

  function paint(tile) {
    if (status === "ended") return;
    const message = run.edit(tile, tool);
    if (message) setText("hint", message);
  }

  function paintTo(tile) {
    if (lastTile === null) {
      paint(tile);
    } else {
      let { x, y } = point(lastTile);
      const target = point(tile);
      const dx = Math.abs(target.x - x);
      const dy = Math.abs(target.y - y);
      let horizontal = 0;
      let vertical = 0;
      while (x !== target.x || y !== target.y) {
        if (x !== target.x && (y === target.y || (horizontal + .5) / dx <= (vertical + .5) / dy)) {
          x += Math.sign(target.x - x);
          horizontal++;
        } else {
          y += Math.sign(target.y - y);
          vertical++;
        }
        paint(index(x, y));
      }
    }
    lastTile = tile;
    updateHUD();
  }

  function finishPointer() {
    run.endStroke();
    pointer = null;
    lastTile = null;
  }

  canvas.addEventListener("pointerdown", event => {
    if (pointer !== null || status === "ended" || event.button !== 0) return;
    const tile = pointerTile(event);
    if (tile === null) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    pointer = event.pointerId;
    cursor = tile;
    run.beginStroke();
    paintTo(tile);
  });
  canvas.addEventListener("pointermove", event => {
    cursor = pointerTile(event);
    if (event.pointerId === pointer && cursor !== null) paintTo(cursor);
    if (cursor === null) lastTile = null;
  });
  canvas.addEventListener("pointerleave", () => { cursor = null; });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(name, event => {
      if (event.pointerId !== pointer) return;
      if (name === "pointerup") {
        const tile = pointerTile(event);
        if (tile !== null) paintTo(tile);
      }
      finishPointer();
      if (event.pointerType !== "mouse") cursor = null;
      updateHUD();
    });
  }

  window.addEventListener("keydown", event => {
    if (dialog.open || event.altKey || event.metaKey && event.key.toLowerCase() !== "z") return;
    if (event.target === district) return;
    const key = event.key.toLowerCase();
    const shortcuts = { "1": "road", "2": "bridge", "3": "erase" };
    if (shortcuts[key]) setTool(shortcuts[key]);
    if (key === "z" && status !== "ended") {
      event.preventDefault();
      finishPointer();
      run.undo();
      updateHUD();
    }
    if (key === " " && event.target.tagName !== "BUTTON") {
      event.preventDefault();
      if (!event.repeat) toggle();
    }
    if (event.target !== canvas || pointer !== null) return;
    const direction = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[key];
    if (!direction && key !== "enter") return;
    event.preventDefault();
    if (cursor === null) cursor = run.lanes[0].supplier;
    if (direction) {
      const { x, y } = point(cursor);
      cursor = index(Math.max(0, Math.min(columns - 1, x + direction[0])), Math.max(0, Math.min(rows - 1, y + direction[1])));
    }
    if (key === "enter" || event.shiftKey) {
      run.beginStroke();
      paint(cursor);
      run.endStroke();
      updateHUD();
    }
  });

  function frame(now) {
    const elapsed = Math.min(.1, (now - previousTime) / 1000);
    previousTime = now;
    if (status === "running" && !dialog.open && !document.hidden) {
      const previousShift = run.shift;
      for (let i = 0; i < speed; i++) run.step(elapsed);
      saveBest();
      if (run.shift !== previousShift) setText("hint", "Shift " + run.shift + " began. Supplies replenished and demand increased.");
      if (run.fault) {
        status = "ended";
        finishPointer();
        setText("hint", colors[run.fault].label + " orders backed up. Start a new run to try another network.");
        showDialog("District shutdown", "<p>" + colors[run.fault].label + " reached 12 pending orders. You delivered <strong>" +
          run.score + "</strong> shipments and reached shift <strong>" + run.shift + "</strong>.</p>", "Try again",
          () => reset(district.value));
      }
      updateHUD();
    }
    view.render(run, cursor);
    requestAnimationFrame(frame);
  }
  updateHUD();
  requestAnimationFrame(frame);
})();
