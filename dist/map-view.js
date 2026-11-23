"use strict";

(() => {
  const { columns, rows, point, index, colors } = FactorySim;
  const cell = 68;
  const width = columns * cell;
  const height = rows * cell;
  const padCols = 6;
  const padRows = 5;

  function center(tile) {
    const { x, y } = point(tile);
    return [x * cell + cell / 2, y * cell + cell / 2];
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function popThump(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const c1 = 2.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function motorwayCubicControlPoints(ax, ay, bx, by, id = 1) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = Math.min(155, len * 0.24) * (id % 2 === 1 ? -1 : 1);
    const cp1x = ax + dx * 0.33 + nx * bend;
    const cp1y = ay + dy * 0.33 + ny * bend;
    const cp2x = ax + dx * 0.67 + nx * bend;
    const cp2y = ay + dy * 0.67 + ny * bend;
    return [cp1x, cp1y, cp2x, cp2y, len];
  }

  function buildSmoothArcPath(run, route) {
    const rawPts = route.map(t => center(t));
    if (rawPts.length < 2) {
      return { pts: rawPts, lengths: [0], totalLength: 1, elevated: [] };
    }

    const pts = [];
    const elevated = [];

    const pushPt = (x, y, isElev = false) => {
      pts.push([x, y]);
      elevated.push(isElev);
    };

    pushPt(rawPts[0][0], rawPts[0][1], false);

    for (let i = 0; i < rawPts.length - 1; i++) {
      const currTile = route[i];
      const nextTile = route[i + 1];
      const [ax, ay] = rawPts[i];
      const [bx, by] = rawPts[i + 1];

      const mw = run.motorways.find(
        m => (m.from === currTile && m.to === nextTile) || (m.to === currTile && m.from === nextTile)
      );
      if (mw) {
        const [fa, fb] = center(mw.from);
        const [ta, tb] = center(mw.to);
        const [cp1x, cp1y, cp2x, cp2y] = motorwayCubicControlPoints(fa, fb, ta, tb, mw.id);
        const forward = mw.from === currTile;
        const c1x = forward ? cp1x : cp2x;
        const c1y = forward ? cp1y : cp2y;
        const c2x = forward ? cp2x : cp1x;
        const c2y = forward ? cp2y : cp1y;
        const steps = 30;
        for (let s = 1; s <= steps; s++) {
          const u = s / steps;
          const inv = 1 - u;
          pushPt(
            inv * inv * inv * ax + 3 * inv * inv * u * c1x + 3 * inv * u * u * c2x + u * u * u * bx,
            inv * inv * inv * ay + 3 * inv * inv * u * c1y + 3 * inv * u * u * c2y + u * u * u * by,
            true
          );
        }
        continue;
      }

      if (i < rawPts.length - 2) {
        const nextNextTile = route[i + 2];
        const nextIsMw = run.motorways.some(
          m => (m.from === nextTile && m.to === nextNextTile) || (m.to === nextTile && m.from === nextNextTile)
        );
        if (!nextIsMw) {
          const [cx, cy] = rawPts[i + 2];
          const mid1x = (ax + bx) / 2;
          const mid1y = (ay + by) / 2;
          const mid2x = (bx + cx) / 2;
          const mid2y = (by + cy) / 2;

          if (i === 0) {
            const steps0 = 8;
            for (let s = 1; s <= steps0; s++) {
              const u = s / steps0;
              pushPt(ax + (mid1x - ax) * u, ay + (mid1y - ay) * u, false);
            }
          }

          // If passing through a Roundabout, orbit smoothly around the circular ring!
          if (run.roundabouts?.has(nextTile)) {
            const inAngle = Math.atan2(mid1y - by, mid1x - bx);
            let outAngle = Math.atan2(mid2y - by, mid2x - bx);
            while (outAngle <= inAngle) outAngle += Math.PI * 2;
            const orbitR = 20;
            const orbitSteps = 18;
            for (let s = 0; s <= orbitSteps; s++) {
              const ang = inAngle + ((outAngle - inAngle) * s) / orbitSteps;
              pushPt(bx + Math.cos(ang) * orbitR, by + Math.sin(ang) * orbitR, false);
            }
          } else {
            const curveSteps = 14;
            for (let s = 1; s <= curveSteps; s++) {
              const u = s / curveSteps;
              const inv = 1 - u;
              pushPt(
                inv * inv * mid1x + 2 * inv * u * bx + u * u * mid2x,
                inv * inv * mid1y + 2 * inv * u * by + u * u * mid2y,
                false
              );
            }
          }

          if (i === rawPts.length - 3) {
            const stepsEnd = 8;
            for (let s = 1; s <= stepsEnd; s++) {
              const u = s / stepsEnd;
              pushPt(mid2x + (cx - mid2x) * u, mid2y + (cy - mid2y) * u, false);
            }
            break;
          }
          continue;
        }
      }

      const lastPt = pts[pts.length - 1];
      const steps = 12;
      for (let s = 1; s <= steps; s++) {
        const u = s / steps;
        pushPt(lastPt[0] + (bx - lastPt[0]) * u, lastPt[1] + (by - lastPt[1]) * u, false);
      }
    }

    const lengths = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lengths.push(total);
    }
    // Precompute smooth vertex tangent angles so car heading is C1-continuous with zero angle stepping!
    const angles = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      const pPrev = pts[Math.max(0, i - 1)];
      const pNext = pts[Math.min(pts.length - 1, i + 1)];
      angles[i] = Math.atan2(pNext[1] - pPrev[1], pNext[0] - pPrev[0]);
    }
    return { pts, lengths, angles, totalLength: Math.max(1, total), elevated };
  }

  function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  // De Casteljau subdivision of a quadratic Bezier curve from 0 to t in [0, 1]
  function traceSubQuad(ctx, x0, y0, cx, cy, x1, y1, t) {
    const q0x = x0 + (cx - x0) * t;
    const q0y = y0 + (cy - y0) * t;
    const q1x = cx + (x1 - cx) * t;
    const q1y = cy + (y1 - cy) * t;
    const ex = q0x + (q1x - q0x) * t;
    const ey = q0y + (q1y - q0y) * t;
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(q0x, q0y, ex, ey);
  }

  // True dt-independent semi-implicit spring step (sub-stepped for 60Hz–240Hz stability)
  function stepSpringVal(val, vel, target, stiffness, damping, dt) {
    const subSteps = 2;
    const h = Math.min(0.033, dt) / subSteps;
    let x = val;
    let v = vel;
    for (let i = 0; i < subSteps; i++) {
      const accel = (target - x) * stiffness - v * damping;
      v += accel * h;
      x += v * h;
    }
    return [x, v];
  }

  function sampleArcPath(pathObj, u) {
    const target = Math.max(0, Math.min(1, u)) * pathObj.totalLength;
    const { pts, lengths, angles, elevated } = pathObj;
    if (pts.length < 2) return { x: pts[0]?.[0] || 0, y: pts[0]?.[1] || 0, angle: 0, elevated: false, curvature: 0 };

    let lo = 0;
    let hi = lengths.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] <= target) lo = mid;
      else hi = mid;
    }
    const segLen = Math.max(0.0001, lengths[hi] - lengths[lo]);
    const t = (target - lengths[lo]) / segLen;
    const [ax, ay] = pts[lo];
    const [bx, by] = pts[hi];
    const angle = lerpAngle(angles[lo], angles[hi], t);

    const aheadIdx = Math.min(pts.length - 1, hi + 2);
    let diff = Math.abs(angles[aheadIdx] - angle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    return {
      x: ax + (bx - ax) * t,
      y: ay + (by - ay) * t,
      angle,
      elevated: elevated[lo] || elevated[hi],
      curvature: diff,
    };
  }

  function drawLongShadow(ctx, x, y, w, h, r, sx = 18, sy = 18, color = "rgba(25, 22, 16, 0.16)") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + sx, y + sy, w, h, r);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - r * 0.6, y + r * 0.6);
    ctx.lineTo(x + w - r * 0.6 + sx, y + r * 0.6 + sy);
    ctx.lineTo(x + r * 0.6 + sx, y + h - r * 0.6 + sy);
    ctx.lineTo(x + r * 0.6, y + h - r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPin(ctx, x, y, palette, scale = 1, night = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.arc(0, 1.8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = night ? "#1f242d" : "#2c323c";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(0, -2.2, 6.2, Math.PI * 0.82, Math.PI * 0.18, false);
    ctx.lineTo(0, 6.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.fill;
    ctx.beginPath();
    ctx.arc(0, -2.2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawShield(ctx, x, y, number, night = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 27, [6, 6, 13, 13]);
    ctx.fill();

    ctx.fillStyle = night ? "#262c36" : "#fdfaf2";
    ctx.strokeStyle = night ? "#e8eef7" : "#2c323c";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-13, -13, 26, 26, [6, 6, 12, 12]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = night ? "#f5f8fc" : "#222730";
    ctx.font = "800 13px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), 0, 1);
    ctx.restore();
  }

  class MapView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.background = document.createElement("canvas");
      this.bgTotalCols = columns + padCols * 2;
      this.bgTotalRows = rows + padRows * 2;
      this.background.width = this.bgTotalCols * cell;
      this.background.height = this.bgTotalRows * cell;
      this.baseScale = 1;
      this.scale = 1;
      this.userZoom = 1;
      this.targetZoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.targetPanX = 0;
      this.targetPanY = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.themeOverride = null; // null = city native palette, "night" = dark override
      this.showHeatmap = false;
      this.motorwayDrag = null;
      this.bridgeDrag = null;
      this.tutorialGuide = null; // { fromTile, toTile, pulseTiles: [] }
    }

    getPalette(run) {
      const base = run.district.palette;
      if (this.themeOverride === "night" && !base.isDark) {
        return {
          land: "#222833",
          landEdge: "#1b2029",
          water: "#2d547c",
          waterDeep: "#254668",
          waterGrid: "rgba(145, 200, 255, 0.14)",
          shore: "#171d26",
          hill: "#181d25",
          hillCrest: "#12161d",
          road: "#3d4452",
          curb: "#98a4b8",
          roadGuide: "rgba(255, 255, 255, 0.14)",
          motorwayOuter: "#6ad8f7",
          motorwayInner: "#d4f6ff",
          shadow: "rgba(0, 0, 0, 0.42)",
          isDark: true,
        };
      }
      return base;
    }

    setThemeOverride(next) {
      this.themeOverride = next;
      this.cachedKey = null;
    }

    zoomBy(factor, pivotX = null, pivotY = null) {
      const prevZoom = this.targetZoom;
      const nextZoom = Math.max(0.75, Math.min(2.1, prevZoom * factor));
      if (pivotX !== null && pivotY !== null) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = pivotX - rect.left - rect.width / 2;
        const cy = pivotY - rect.top - rect.height / 2;
        const ratio = nextZoom / prevZoom;
        this.targetPanX = cx - (cx - this.targetPanX) * ratio;
        this.targetPanY = cy - (cy - this.targetPanY) * ratio;
      }
      this.targetZoom = nextZoom;
      if (Math.abs(this.targetZoom - 1) < 0.04) {
        this.targetZoom = 1;
        this.targetPanX = 0;
        this.targetPanY = 0;
      }
    }

    resetCamera() {
      this.targetZoom = 1;
      this.targetPanX = 0;
      this.targetPanY = 0;
    }

    screenToWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: (clientX - rect.left - this.offsetX) / this.scale,
        y: (clientY - rect.top - this.offsetY) / this.scale,
      };
    }

    screenToTile(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const lx = (clientX - rect.left - this.offsetX) / (cell * this.scale);
      const ly = (clientY - rect.top - this.offsetY) / (cell * this.scale);
      const x = Math.floor(lx);
      const y = Math.floor(ly);
      return x < 0 || y < 0 || x >= columns || y >= rows ? null : index(x, y);
    }

    box(x, y, w, h, radius, color, stroke, lineWidth = 2) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      if (color) {
        ctx.fillStyle = color;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }

    // Authentic Mini Motorways Cartography:
    // - Playable land is 100% CLEAN solid color (NO grid lines on buildable area!)
    // - Unbuildable background water (bays & rivers) has subtle cartographic checkered/grid lines!
    landscape(run) {
      const ctx = this.ctx;
      const pal = this.getPalette(run);
      const W = this.background.width;
      const H = this.background.height;

      ctx.save();
      // 1. Clean, smooth, ungridded playable land surface with soft architectural lighting
      const bgGrad = ctx.createRadialGradient(W * 0.42, H * 0.36, 80, W * 0.5, H * 0.5, W * 0.72);
      bgGrad.addColorStop(0, pal.land);
      bgGrad.addColorStop(1, pal.landEdge);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      if (!pal.isDark) {
        const sunGrad = ctx.createRadialGradient(W * 0.25, H * 0.18, 20, W * 0.25, H * 0.18, W * 0.55);
        sunGrad.addColorStop(0, "rgba(255, 255, 255, 0.14)");
        sunGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Unbuildable rounded hill contours with minimalist 3-dot trees
      for (const hill of run.district.hills || []) {
        ctx.save();
        ctx.translate((hill.cx + padCols) * cell, (hill.cy + padRows) * cell);
        ctx.rotate(hill.angle || 0);
        const rx = hill.rx * cell;
        const ry = hill.ry * cell;
        const rad = Math.min(rx, ry) * 0.92;

        ctx.fillStyle = pal.hill;
        ctx.beginPath();
        ctx.roundRect(-rx, -ry, rx * 2, ry * 2, rad);
        ctx.fill();

        ctx.fillStyle = pal.hillCrest;
        ctx.beginPath();
        ctx.roundRect(-rx * 0.65, -ry * 0.65, rx * 1.3, ry * 1.3, rad * 0.65);
        ctx.fill();

        // Minimalist Mini Motorways tree dots on the hill
        for (const [tx, ty, tr, col] of [
          [-10, -4, 7, pal.isDark ? "#3c5470" : "#3a7f9c"],
          [5, -8, 8.5, pal.isDark ? "#4a6688" : "#64b2cf"],
          [2, 6, 6.5, pal.isDark ? "#2d425c" : "#2f6b85"],
        ]) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
          ctx.beginPath();
          ctx.arc(tx + 3, ty + 4, tr, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Helper: draw cartographic checkered grid ONLY inside a clipped unbuildable water region
      const drawWaterGridOverlay = () => {
        ctx.save();
        // Faint alternating checkered wash on unbuildable water
        ctx.fillStyle = pal.isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(255, 255, 255, 0.08)";
        for (let gy = -padRows; gy < rows + padRows; gy++) {
          for (let gx = -padCols; gx < columns + padCols; gx++) {
            if ((gx + gy) & 1) {
              ctx.fillRect((gx + padCols) * cell, (gy + padRows) * cell, cell, cell);
            }
          }
        }
        // Crisp cartographic map grid lines on unbuildable water
        ctx.strokeStyle = pal.waterGrid;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let gx = -padCols; gx <= columns + padCols; gx++) {
          const px = (gx + padCols) * cell;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, H);
        }
        for (let gy = -padRows; gy <= rows + padRows; gy++) {
          const py = (gy + padRows) * cell;
          ctx.moveTo(0, py);
          ctx.lineTo(W, py);
        }
        ctx.stroke();
        ctx.restore();
      };

      // 3. Unbuildable Bay / Ocean Polygon (with smooth cream shoreline + checkered water grid!)
      if (run.district.bay && run.district.bay.length >= 3) {
        const traceBay = () => {
          const pts = run.district.bay;
          ctx.beginPath();
          ctx.moveTo((pts[0][0] + padCols) * cell, (pts[0][1] + padRows) * cell);
          for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const next = pts[(i + 1) % pts.length];
            const cx = (curr[0] + padCols) * cell;
            const cy = (curr[1] + padRows) * cell;
            const nx = ((curr[0] + next[0]) / 2 + padCols) * cell;
            const ny = ((curr[1] + next[1]) / 2 + padRows) * cell;
            if (i === 1) ctx.lineTo(((prev[0] + curr[0]) / 2 + padCols) * cell, ((prev[1] + curr[1]) / 2 + padRows) * cell);
            ctx.quadraticCurveTo(cx, cy, nx, ny);
          }
          ctx.closePath();
        };

        // Shoreline cream border around the bay
        ctx.save();
        traceBay();
        ctx.lineJoin = "round";
        ctx.strokeStyle = pal.shore;
        ctx.lineWidth = 34;
        ctx.stroke();
        ctx.restore();

        // Fill bay + clip checkered water grid strictly inside the bay
        ctx.save();
        traceBay();
        ctx.fillStyle = pal.water;
        ctx.fill();
        ctx.clip();
        drawWaterGridOverlay();
        ctx.restore();

        if (run.district.bayName) {
          ctx.save();
          ctx.fillStyle = pal.waterGrid;
          ctx.globalAlpha = 2.2;
          ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(run.district.bayName, (1.5 + padCols) * cell, (2.2 + padRows) * cell);
          ctx.restore();
        }
      }

      // 4. Winding Rivers (cream shoreline + gridded water channel)
      const riverPixelWidth = run.district.riverRadius * 2 * cell;
      const traceRivers = () => {
        ctx.beginPath();
        for (const samples of run.riverSamples) {
          for (let i = 0; i < samples.length; i++) {
            const px = (samples[i][0] + padCols) * cell;
            const py = (samples[i][1] + padRows) * cell;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
      };

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Cream shoreline ribbon along riverbanks
      traceRivers();
      ctx.strokeStyle = pal.shore;
      ctx.lineWidth = riverPixelWidth + 32;
      ctx.stroke();

      // River water body
      traceRivers();
      ctx.strokeStyle = pal.water;
      ctx.lineWidth = riverPixelWidth;
      ctx.stroke();

      // Deeper inner river stream
      traceRivers();
      ctx.strokeStyle = pal.waterDeep;
      ctx.lineWidth = Math.max(14, riverPixelWidth - 20);
      ctx.stroke();

      // Subtle grid ticks across the river channel
      ctx.save();
      ctx.strokeStyle = pal.waterGrid;
      ctx.lineWidth = 1;
      for (const samples of run.riverSamples) {
        for (let i = 4; i < samples.length - 4; i += 8) {
          const [x1, y1] = samples[i - 1];
          const [x2, y2] = samples[i + 1];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const nx = (-dy / len) * (riverPixelWidth * 0.45);
          const ny = (dx / len) * (riverPixelWidth * 0.45);
          const px = (samples[i][0] + padCols) * cell;
          const py = (samples[i][1] + padRows) * cell;
          ctx.beginPath();
          ctx.moveTo(px - nx, py - ny);
          ctx.lineTo(px + nx, py + ny);
          ctx.stroke();
        }
      }
      ctx.restore();

      const mainRiver = run.riverSamples[0];
      if (mainRiver && mainRiver.length > 12) {
        const idx = Math.floor(mainRiver.length * 0.35);
        const [rx, ry] = mainRiver[idx];
        const [nx, ny] = mainRiver[Math.min(mainRiver.length - 1, idx + 3)];
        let angle = Math.atan2(ny - ry, nx - rx);
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
        ctx.save();
        ctx.translate((rx + padCols) * cell, (ry + padRows) * cell);
        ctx.rotate(angle);
        ctx.fillStyle = pal.isDark ? "rgba(180, 220, 255, 0.42)" : "rgba(35, 102, 120, 0.5)";
        ctx.font = "700 10.5px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = "3px";
        ctx.fillText(run.district.riverName || "", 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    drawRiverFlow(run, now) {
      const ctx = this.ctx;
      const pal = this.getPalette(run);
      ctx.save();
      ctx.lineCap = "round";

      // Primary liquid current shimmer
      ctx.strokeStyle = pal.isDark ? "rgba(170, 225, 255, 0.14)" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([20, 44]);
      ctx.lineDashOffset = -(now * 0.022);
      ctx.beginPath();
      for (const samples of run.riverSamples) {
        for (let i = 0; i < samples.length; i++) {
          const px = samples[i][0] * cell;
          const py = samples[i][1] * cell;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Secondary staggered soft ripple
      ctx.strokeStyle = pal.isDark ? "rgba(140, 210, 255, 0.08)" : "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 5.5;
      ctx.setLineDash([10, 62]);
      ctx.lineDashOffset = -(now * 0.014) - 24;
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();
    }

    getCachedGraph(run) {
      const key = (run.graphVersion || 0) + ":" + run.edges.size + ":" + run.districtKey;
      if (this._graphCacheKey === key && this._cachedAdj) {
        return { adj: this._cachedAdj, waterTiles: this._cachedWaterTiles };
      }
      const adj = new Map();
      const addAdj = (a, b) => {
        let list = adj.get(a);
        if (!list) {
          list = [];
          adj.set(a, list);
        }
        list.push(b);
      };
      for (const k of run.edges) {
        const sep = k.indexOf(":");
        const a = Number(k.slice(0, sep));
        const b = Number(k.slice(sep + 1));
        addAdj(a, b);
        addAdj(b, a);
      }
      const waterTiles = [];
      for (const t of adj.keys()) {
        if (run.terrain[t] === "water") waterTiles.push(t);
      }
      this._graphCacheKey = key;
      this._cachedAdj = adj;
      this._cachedWaterTiles = waterTiles;
      return { adj, waterTiles };
    }

    drawUnifiedPavement(run, now, dt) {
      const ctx = this.ctx;
      const pal = this.getPalette(run);
      const curbColor = pal.curb;
      const asphaltColor = pal.road;
      const shadowColor = pal.shadow;
      const night = pal.isDark;

      const { adj, waterTiles } = this.getCachedGraph(run);

      function aAfterB(a, b) {
        return a < b ? a + ":" + b : b + ":" + a;
      }

      // Critically-damped exponential liquid progression (zero wobble, zero overshoot jitter)
      for (const stamp of run.edgeStamps.values()) {
        if (stamp.prog < 0.999) {
          const rate = stamp.isBridge ? 11 : 22;
          stamp.prog = 1 - (1 - (stamp.prog || 0)) * Math.exp(-rate * dt);
          if (stamp.prog > 0.996) stamp.prog = 1;
        }
      }

      // Update live smooth drag tip (overdamped exponential follow -> zero wobble, zero joint!)
      let dragSegment = null;
      if (this.bridgeDrag) {
        const bd = this.bridgeDrag;
        const [ax, ay] = center(bd.anchorTile);
        const followRate = bd.isWater ? 13 : 28;
        const alpha = 1 - Math.exp(-followRate * dt);
        bd.tipX += (bd.targetX - bd.tipX) * alpha;
        bd.tipY += (bd.targetY - bd.tipY) * alpha;
        if (Math.hypot(bd.tipX - ax, bd.tipY - ay) > 1.5) {
          dragSegment = { ax, ay, tx: bd.tipX, ty: bd.tipY, isWater: bd.isWater };
        }
      }

      const traceDragTip = () => {
        if (!dragSegment) return;
        ctx.moveTo(dragSegment.ax, dragSegment.ay);
        ctx.lineTo(dragSegment.tx, dragSegment.ty);
      };

      const traceRoads = (onlyEdgeSet = null) => {
        for (const [tile, list] of adj) {
          const [x, y] = center(tile);
          const building = run.buildingTiles.get(tile);

          if (list.length === 2 && !building) {
            const [a, b] = list;
            const kA = aAfterB(tile, a);
            const kB = aAfterB(tile, b);
            if (onlyEdgeSet && !onlyEdgeSet.has(kA) && !onlyEdgeSet.has(kB)) continue;
            const [ax, ay] = center(a);
            const [bx, by] = center(b);
            const mx1 = (x + ax) / 2;
            const my1 = (y + ay) / 2;
            const mx2 = (x + bx) / 2;
            const my2 = (y + by) / 2;
            const sA = run.edgeStamps?.get(kA);
            const sB = run.edgeStamps?.get(kB);
            if (sB && sB.prog < 0.995 && sB.from === tile) {
              // Smoothly unroll the quadratic Bezier corner around the vertex using De Casteljau!
              traceSubQuad(ctx, mx1, my1, x, y, mx2, my2, Math.min(1, sB.prog));
            } else if (sA && sA.prog < 0.995 && sA.from === tile) {
              traceSubQuad(ctx, mx2, my2, x, y, mx1, my1, Math.min(1, sA.prog));
            } else {
              ctx.moveTo(mx1, my1);
              ctx.quadraticCurveTo(x, y, mx2, my2);
            }
            continue;
          }

          for (const n of list) {
            const k = aAfterB(tile, n);
            if (onlyEdgeSet && !onlyEdgeSet.has(k)) continue;
            const [nx, ny] = center(n);
            const mx = (x + nx) / 2;
            const my = (y + ny) / 2;
            const stamp = run.edgeStamps?.get(k);
            if (stamp && stamp.prog < 0.995) {
              if (stamp.from === tile) {
                const t = Math.min(1, stamp.prog);
                const ex = x + (nx - x) * t;
                const ey = y + (ny - y) * t;
                if (stamp.isBridge) {
                  const dx = nx - x;
                  const dy = ny - y;
                  const len = Math.hypot(dx, dy) || 1;
                  const flex = Math.sin(t * Math.PI) * 5;
                  ctx.moveTo(x, y);
                  ctx.quadraticCurveTo((x + ex) / 2 - (dy / len) * flex, (y + ey) / 2 + (dx / len) * flex, ex, ey);
                } else {
                  ctx.moveTo(x, y);
                  ctx.lineTo(ex, ey);
                }
              }
            } else {
              ctx.moveTo(x, y);
              ctx.lineTo(mx, my);
            }
          }
        }

        if (!onlyEdgeSet) {
          for (const [tile, kind] of run.roads) {
            if (kind === "compound" || kind === "driveway") continue;
            if (!adj.has(tile)) {
              const [x, y] = center(tile);
              ctx.moveTo(x - 0.5, y);
              ctx.lineTo(x + 0.5, y);
            }
          }
        }
      };

      // Helper for liquid-flowing house driveways ("doors")
      const traceHouseDoors = (extraWidth = 0) => {
        for (const house of run.houses) {
          if (house.doorExtend <= 0.02) continue;
          const [cx, cy] = center(house.tile);
          const reach = 24 * house.doorExtend;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(house.doorAngle) * reach, cy + Math.sin(house.doorAngle) * reach);
        }
      };

      // PASS 1: Soft 45-degree architectural shadows
      for (const factory of run.factories) {
        const age = now - factory.born;
        const scale = age < 340 ? easeOutBack(Math.max(0, age / 340)) : 1;
        const left = factory.x * cell + 5;
        const top = factory.y * cell + 5;
        const compW = cell * 2 - 10;
        const compH = cell * 2 - 10;
        ctx.save();
        if (scale !== 1) {
          const cx = left + compW / 2;
          const cy = top + compH / 2;
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        drawLongShadow(ctx, left, top, compW, compH, 18, 18, 18, shadowColor);
        ctx.restore();
      }

      for (const house of run.houses) {
        const age = now - house.born;
        const scale = age < 300 ? easeOutBack(Math.max(0, age / 300)) : 1;
        const [cx, cy] = center(house.tile);
        const size = 34;
        ctx.save();
        if (scale !== 1) {
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        drawLongShadow(ctx, cx - size / 2, cy - size / 2 - 2, size, size, 8, 13, 13, shadowColor);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(3, 4);
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 31;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      traceRoads();
      traceHouseDoors();
      traceDragTip();
      ctx.stroke();
      ctx.restore();

      // PASS 2: Unified Outer Curb Border (Roads + Live Drag Tip + House Doors + Roundabouts + Destination Lots)
      ctx.save();
      ctx.strokeStyle = curbColor;
      ctx.lineWidth = 31;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      traceRoads();
      traceHouseDoors();
      traceDragTip();
      ctx.stroke();
      ctx.restore();

      // Roundabouts outer ring
      for (const [tile, rb] of run.roundabouts) {
        const [rx, ry] = center(tile);
        const age = now - rb.born;
        const s = age < 220 ? easeOutCubic(Math.min(1, age / 220)) : 1;
        ctx.fillStyle = curbColor;
        ctx.beginPath();
        ctx.arc(rx, ry, 31 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const factory of run.factories) {
        const age = now - factory.born;
        const scale = age < 340 ? easeOutBack(Math.max(0, age / 340)) : 1;
        const left = factory.x * cell + 5;
        const top = factory.y * cell + 5;
        const compW = cell * 2 - 10;
        const compH = cell * 2 - 10;
        ctx.save();
        if (scale !== 1) {
          const cx = left + compW / 2;
          const cy = top + compH / 2;
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        this.box(left - 2.5, top - 2.5, compW + 5, compH + 5, 20, curbColor);
        ctx.restore();
      }

      // PASS 3: Unified Inner Pavement Fill (Roads + Live Drag Tip + Doors + Roundabouts + Destination Lots)
      ctx.save();
      ctx.strokeStyle = asphaltColor;
      ctx.lineWidth = 26;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      traceRoads();
      traceHouseDoors();
      traceDragTip();
      ctx.stroke();
      ctx.restore();

      for (const [tile, rb] of run.roundabouts) {
        const [rx, ry] = center(tile);
        const age = now - rb.born;
        const s = age < 220 ? easeOutCubic(Math.min(1, age / 220)) : 1;
        ctx.fillStyle = asphaltColor;
        ctx.beginPath();
        ctx.arc(rx, ry, 28 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.land;
        ctx.beginPath();
        ctx.arc(rx, ry, 10.5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = curbColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }

      for (const factory of run.factories) {
        const age = now - factory.born;
        const scale = age < 340 ? easeOutBack(Math.max(0, age / 340)) : 1;
        const left = factory.x * cell + 5;
        const top = factory.y * cell + 5;
        const compW = cell * 2 - 10;
        const compH = cell * 2 - 10;
        ctx.save();
        if (scale !== 1) {
          const cx = left + compW / 2;
          const cy = top + compH / 2;
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        this.box(left, top, compW, compH, 18, asphaltColor);
        ctx.restore();
      }

      // PASS 3B: Subtle smooth curing tint on active uncommitted stroke (zero jagged width jumps)
      if (run.activeStrokeEdges?.size || dragSegment) {
        ctx.save();
        ctx.strokeStyle = night ? "rgba(180, 215, 255, 0.16)" : "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 26;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (run.activeStrokeEdges?.size) traceRoads(run.activeStrokeEdges);
        traceDragTip();
        ctx.stroke();
        ctx.restore();
      }

      if (run.curedEdges?.size) {
        for (const [k, curedAt] of run.curedEdges) {
          if (now - curedAt >= 200) run.curedEdges.delete(k);
        }
      }

      // PASS 3C: Directional Erasure & Shrinking Decommissioning Splines
      if (run.decommissioning?.length) {
        run.decommissioning = run.decommissioning.filter(d => now - d.born < d.duration);
        for (const d of run.decommissioning) {
          const t = Math.max(0, Math.min(1, (now - d.born) / d.duration));
          const [ax, ay] = center(d.from);
          const [bx, by] = center(d.to);
          ctx.save();
          ctx.lineCap = "round";
          if (d.retract) {
            const rx = ax + (bx - ax) * t;
            const ry = ay + (by - ay) * t;
            ctx.strokeStyle = asphaltColor;
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 24 * (1 - t * 0.45);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(rx, ry);
            ctx.stroke();
          } else {
            ctx.strokeStyle = asphaltColor;
            ctx.globalAlpha = 1 - t;
            ctx.lineWidth = Math.max(1, 24 * (1 - t));
            ctx.setLineDash([7 * (1 - t * 0.4), 6 + t * 8]);
            ctx.beginPath();
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            const span = 1 - t * 0.7;
            ctx.moveTo(mx + (ax - mx) * span, my + (ay - my) * span);
            ctx.lineTo(mx + (bx - mx) * span, my + (by - my) * span);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // PASS 4: Subtle, faint curved intersection & turn guides
      ctx.save();
      ctx.strokeStyle = pal.roadGuide;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      for (const [tile, list] of adj) {
        if (run.buildingTiles.has(tile) || run.roundabouts.has(tile)) continue;
        const [x, y] = center(tile);
        if (list.length === 2) {
          const [a, b] = list;
          const [ax, ay] = center(a);
          const [bx, by] = center(b);
          ctx.moveTo((x + ax) / 2, (y + ay) / 2);
          ctx.quadraticCurveTo(x, y, (x + bx) / 2, (y + by) / 2);
        } else if (list.length >= 3) {
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const [ax, ay] = center(list[i]);
              const [bx, by] = center(list[j]);
              ctx.moveTo(x + (ax - x) * 0.34, y + (ay - y) * 0.34);
              ctx.quadraticCurveTo(x, y, x + (bx - x) * 0.34, y + (by - y) * 0.34);
            }
          }
        }
      }
      ctx.stroke();
      ctx.restore();

      // PASS 4B: Live Traffic Flow Heatmap overlay (emerald -> amber -> coral)
      if (this.showHeatmap) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 22;
        for (const k of run.edges) {
          const [aStr, bStr] = k.split(":");
          const a = Number(aStr);
          const b = Number(bStr);
          const density = Math.max(run.tileTraffic?.get(a) || 0, run.tileTraffic?.get(b) || 0);
          let heatColor;
          if (density > 1.8) heatColor = "rgba(244, 63, 94, 0.62)";
          else if (density > 0.7) heatColor = "rgba(245, 158, 11, 0.48)";
          else heatColor = "rgba(16, 185, 129, 0.28)";
          const [ax, ay] = center(a);
          const [bx, by] = center(b);
          ctx.strokeStyle = heatColor;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        ctx.restore();
      }

      // PASS 5: Concrete & Metal Bridges over river crossings (critically damped, zero vibration jitter!)
      if (waterTiles.length) {
        let bridgeLift = 0;
        for (const tile of waterTiles) {
          const stamp = run.tileStamps?.get(tile);
          if (stamp && now - stamp < 360) {
            const age = (now - stamp) / 360;
            bridgeLift = Math.max(bridgeLift, Math.sin(age * Math.PI) * 3.2);
          }
        }

        const traceWaterBridges = (offsetX = 0, offsetY = 0) => {
          ctx.beginPath();
          for (const tile of waterTiles) {
            const list = adj.get(tile) || [];
            const [rawX, rawY] = center(tile);
            const x = rawX + offsetX;
            const y = rawY + offsetY;
            if (list.length === 2) {
              const [a, b] = list;
              const [ax, ay] = center(a);
              const [bx, by] = center(b);
              ctx.moveTo((rawX + ax) / 2 + offsetX, (rawY + ay) / 2 + offsetY);
              ctx.quadraticCurveTo(x, y, (rawX + bx) / 2 + offsetX, (rawY + by) / 2 + offsetY);
            } else {
              for (const n of list) {
                const [nx, ny] = center(n);
                ctx.moveTo(x, y);
                ctx.lineTo((rawX + nx) / 2 + offsetX, (rawY + ny) / 2 + offsetY);
              }
            }
          }
        };

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        traceWaterBridges(4 + bridgeLift * 0.5, 6 + bridgeLift * 0.7);
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 35;
        ctx.stroke();

        traceWaterBridges(-bridgeLift * 0.25, -bridgeLift * 0.4);
        ctx.strokeStyle = night ? "#d8e4f2" : "#262c36";
        ctx.lineWidth = 34;
        ctx.stroke();

        ctx.strokeStyle = asphaltColor;
        ctx.lineWidth = 26;
        ctx.stroke();
        ctx.restore();
      }

      // PASS 5B: Animated Traffic Lights on intersections
      for (const [tile, tl] of run.trafficLights) {
        const [x, y] = center(tile);
        const age = now - tl.born;
        const s = age < 180 ? easeOutCubic(Math.min(1, age / 180)) : 1;
        const nsGreen = tl.phase < 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        const dirs = [
          [0, -15, nsGreen],
          [0, 15, nsGreen],
          [-15, 0, !nsGreen],
          [15, 0, !nsGreen],
        ];
        for (const [dx, dy, isGreen] of dirs) {
          ctx.fillStyle = "#1e242e";
          ctx.beginPath();
          ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isGreen ? "#4ae08c" : "#f05458";
          ctx.beginPath();
          ctx.arc(dx, dy, 2.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // PASS 5C: Kinetic Boost Strips (animated glowing teal-cyan chevrons inlaid in pavement)
      if (run.boosts?.size) {
        for (const [tile, b] of run.boosts) {
          const [x, y] = center(tile);
          const age = now - b.born;
          const s = age < 200 ? easeOutCubic(Math.min(1, age / 200)) : 1;
          const list = adj.get(tile) || [];
          let angle = 0;
          if (list.length >= 2) {
            const [ax, ay] = center(list[0]);
            const [bx, by] = center(list[1]);
            angle = Math.atan2(by - ay, bx - ax);
          } else if (list.length === 1) {
            const [nx, ny] = center(list[0]);
            angle = Math.atan2(ny - y, nx - x);
          }
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(s, s);

          // Recessed translucent glowing strip
          ctx.fillStyle = night ? "rgba(6, 182, 212, 0.26)" : "rgba(6, 182, 212, 0.18)";
          ctx.beginPath();
          ctx.roundRect(-22, -10.5, 44, 21, 9);
          ctx.fill();

          ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // 3 smoothly scrolling kinetic chevrons (>>>)
          const phase = (now * 0.0036) % 1;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 2.6;
          for (let i = 0; i < 3; i++) {
            const u = (phase + i / 3) % 1;
            const cx = -14 + u * 28;
            const alpha = Math.sin(u * Math.PI);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.25 + alpha * 0.75})`;
            ctx.beginPath();
            ctx.moveTo(cx - 4.5, -5.5);
            ctx.lineTo(cx + 1.5, 0);
            ctx.lineTo(cx - 4.5, 5.5);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // PASS 5D: Overcharge Hubs (hexagonal Liquid Glass energy gate that supercharges cars 2x)
      if (run.hubs?.size) {
        for (const [tile, h] of run.hubs) {
          const [x, y] = center(tile);
          const age = now - h.born;
          const s = age < 220 ? easeOutCubic(Math.min(1, age / 220)) : 1;
          const spin = now * 0.0014;
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);

          ctx.save();
          ctx.translate(x, y);
          ctx.scale(s, s);

          // Outer ambient golden aura
          ctx.fillStyle = `rgba(245, 158, 11, ${0.14 + pulse * 0.1})`;
          ctx.beginPath();
          ctx.arc(0, 0, 24 + pulse * 3, 0, Math.PI * 2);
          ctx.fill();

          // Hexagonal glass ring
          ctx.save();
          ctx.rotate(spin);
          ctx.fillStyle = night ? "rgba(251, 191, 36, 0.24)" : "rgba(255, 251, 235, 0.72)";
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * 18;
            const py = Math.sin(a) * 18;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Crisp central lightning / 2x charge emblem
          ctx.fillStyle = "#d97706";
          ctx.beginPath();
          ctx.moveTo(2, -8);
          ctx.lineTo(-5, 1);
          ctx.lineTo(0, 1);
          ctx.lineTo(-2, 8);
          ctx.lineTo(5, -1);
          ctx.lineTo(0, -1);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }

      // PASS 6: Gentle water wake ripple under drag tip when crossing river
      if (dragSegment?.isWater) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dragSegment.tx, dragSegment.ty, 16 + Math.sin(now * 0.008) * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawFactoryDetails(factory, run, now) {
      const ctx = this.ctx;
      const pal = this.getPalette(run);
      const night = pal.isDark;
      const palette = colors[factory.key];
      const left = factory.x * cell + 5;
      const top = factory.y * cell + 5;
      const compW = cell * 2 - 10;
      const compH = cell * 2 - 10;

      const age = now - factory.born;
      const scale = age < 340 ? easeOutBack(Math.max(0, age / 340)) : 1;

      ctx.save();
      if (scale !== 1) {
        const cx = left + compW / 2;
        const cy = top + compH / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      // Parking bay stalls & diagonal apron lines (subtle slate on white lots, light on dark lots)
      ctx.strokeStyle = pal.road === "#f6f2e8" || pal.road === "#ffffff"
        ? "rgba(60, 74, 88, 0.18)"
        : "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = 0; s < 4; s++) {
        const sy = top + 16 + s * 16;
        ctx.moveTo(left + 10, sy);
        ctx.lineTo(left + 26, sy);
      }
      ctx.stroke();

      // Single Entrance Port Gate Indicator (strictly ONE port per station!)
      const [epx, epy] = center(factory.entrance);
      ctx.save();
      ctx.translate(epx, epy);
      if (factory.portTarget === null) {
        // Gentle open-port invite ring so player sees where the single entrance port is
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
        ctx.strokeStyle = palette.fill;
        ctx.globalAlpha = 0.35 + pulse * 0.35;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 12.5 + pulse * 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Crisp colored port threshold marker
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = palette.fill;
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.road;
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3D Destination Building with tactile arrival micro-bounce
      const bSize = 54;
      const bx = left + compW - bSize - 11;
      const by = top + 11;
      const bcx = bx + bSize / 2;
      const bcy = by + bSize / 2;
      const bBounce = 1 + (factory.bounce || 0) * 0.14;

      ctx.save();
      if (Math.abs(bBounce - 1) > 0.002) {
        ctx.translate(bcx, bcy);
        ctx.scale(bBounce, 2 - bBounce);
        ctx.translate(-bcx, -bcy);
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      if (factory.circular) {
        ctx.beginPath();
        ctx.arc(bcx + 4, bcy + 7, bSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.dark;
        ctx.beginPath();
        ctx.arc(bcx, bcy + 5.5, bSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.fill;
        ctx.beginPath();
        ctx.arc(bcx, bcy, bSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.roof;
        ctx.beginPath();
        ctx.arc(bcx, bcy - 1.5, bSize * 0.34, 0, Math.PI * 2);
        ctx.fill();

        // Crisp architectural rim highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bcx, bcy, bSize / 2 - 1.2, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(bx + 4, by + 7, bSize, bSize, 11);
        ctx.fill();

        this.box(bx, by + 6, bSize, bSize, 11, palette.dark);
        this.box(bx, by, bSize, bSize, 11, palette.fill);
        this.box(bx + 4, by + 4, bSize - 8, bSize - 11, 7, palette.roof);
        // Subtle architectural skylight bevel
        this.box(bx + 6, by + 5.5, bSize - 12, 3.2, 2, "rgba(255, 255, 255, 0.26)");
        this.box(bx + 18, by + bSize - 6, 18, 6, 2.5, palette.dark);
      }

      // Smooth circular ticking countdown ring on building roof
      const prog = factory.demandProgress || 0;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(bcx, bcy, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = factory.overloadTimer > 0 ? "#ff3b30" : "#ffffff";
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(bcx, bcy, 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      // Animated demand pins (elastic spawn bounce + smooth pop-out when collected!)
      const pinSlots = [
        [left + 22, top + 22],
        [left + 38, top + 22],
        [left + 22, top + 42],
        [left + 38, top + 42],
        [left + 22, top + 62],
        [left + 38, top + 62],
        [left + 58, top + 90],
        [left + 76, top + 90],
      ];
      for (const pin of factory.pinItems || []) {
        if (pin.slot >= pinSlots.length || pin.scale <= 0.02) continue;
        const [px, py] = pinSlots[pin.slot];
        const bob = pin.state === "live" ? Math.sin(now * 0.0045 + pin.slot * 0.9) * 1.1 : 0;
        drawPin(ctx, px, py + bob - (pin.lift || 0), palette, pin.scale, night);
      }

      ctx.restore();
    }

    drawHouseRoof(house, now) {
      const ctx = this.ctx;
      const palette = colors[house.key];
      const [cx, cy] = center(house.tile);
      const size = 34;
      const hx = cx - size / 2;
      const hy = cy - size / 2 - 2;

      const age = now - house.born;
      const scale = age < 300 ? easeOutBack(Math.max(0, age / 300)) : 1;

      ctx.save();
      if (scale !== 1) {
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      this.box(hx, hy + 5.5, size, size, 8, palette.dark);
      this.box(hx, hy, size, size, 8, palette.fill);
      this.box(hx + 3, hy + 3, size - 6, size - 8.5, 5.5, palette.roof);
      this.box(hx + 5.5, hy + 4.5, size - 11, 2.4, 1.5, "rgba(255, 255, 255, 0.28)");

      ctx.restore();
    }

    drawCar(run, house, car, elevatedPass = false, dt = 0.016) {
      if (car.state === "home" || !car.route) return;
      if (!car.cachedPath || car.pathDirty) {
        car.cachedPath = buildSmoothArcPath(run, car.route);
        car.pathDirty = false;
      }

      let wx, wy, targetAngle, elevated = false;
      const laneOffset = 5.0;

      if (car.state === "turning") {
        // Silky semicircular U-turn arc inside the destination parking lot (zero 180-degree snap!)
        const endPose = sampleArcPath(car.cachedPath, 1);
        const tu = Math.max(0, Math.min(1, car.turnU || 0));
        const sweep = tu * Math.PI;
        const turnR = laneOffset;
        const perpX = -Math.sin(endPose.angle);
        const perpY = Math.cos(endPose.angle);
        const cx = endPose.x;
        const cy = endPose.y;
        wx = cx + Math.cos(endPose.angle) * Math.sin(sweep) * (turnR * 1.6) + perpX * Math.cos(sweep) * turnR;
        wy = cy + Math.sin(endPose.angle) * Math.sin(sweep) * (turnR * 1.6) + perpY * Math.cos(sweep) * turnR;
        targetAngle = endPose.angle - sweep;
        elevated = false;
      } else {
        const pose = sampleArcPath(car.cachedPath, car.u || 0);
        // Smooth continuous curvature slowdown (zero binary speed jumps!)
        car.turningFactor = 1 / (1 + pose.curvature * 1.4);
        targetAngle = pose.angle;
        elevated = Boolean(pose.elevated);
        wx = pose.x - Math.sin(targetAngle) * laneOffset;
        wy = pose.y + Math.cos(targetAngle) * laneOffset;
      }

      if (elevated !== elevatedPass) return;

      // Exponential shortest-arc angular smoothing
      if (car.renderAngle === undefined) car.renderAngle = targetAngle;
      else car.renderAngle = lerpAngle(car.renderAngle, targetAngle, 1 - Math.exp(-26 * dt));

      const ctx = this.ctx;
      const palette = colors[house.key];
      const pal = this.getPalette(run);

      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(car.renderAngle);

      const edgeScale = car.state === "turning"
        ? 1
        : Math.min(1, Math.min((car.u || 0) * 10 + 0.35, (1 - (car.u || 0)) * 10 + 0.35));
      if (edgeScale < 1) ctx.scale(edgeScale, edgeScale);

      // Zero-allocation silky local-space wake capsule behind car (100% sub-pixel lockstep, 120fps friendly!)
      const isBoosted = (car.boostTimer || 0) > 0 || (run.surgeTimer || 0) > 0;
      if (isBoosted) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.24)";
        ctx.beginPath();
        ctx.roundRect(-34, -3.2, 26, 6.4, 3.2);
        ctx.fill();
        ctx.fillStyle = "rgba(125, 211, 252, 0.48)";
        ctx.beginPath();
        ctx.roundRect(-22, -2.2, 14, 4.4, 2.2);
        ctx.fill();
      } else {
        ctx.fillStyle = palette.glow;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.roundRect(-20, -2.3, 12, 4.6, 2.3);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Luminous golden aura when car is Overcharged (2x pin delivery!)
      if (car.overcharged) {
        ctx.fillStyle = "rgba(251, 191, 36, 0.36)";
        ctx.beginPath();
        ctx.roundRect(-12, -7.2, 24, 14.4, 6);
        ctx.fill();
      }

      if (pal.isDark) {
        ctx.fillStyle = "rgba(255, 248, 200, 0.22)";
        ctx.beginPath();
        ctx.moveTo(8, -3.2);
        ctx.lineTo(22, -6.5);
        ctx.lineTo(22, 6.5);
        ctx.lineTo(8, 3.2);
        ctx.closePath();
        ctx.fill();
      }

      // Sleek modern car body with soft shadow, tinted windshield, and subtle specular highlight
      this.box(-9, -3.4, 18.5, 9.0, 3.6, "rgba(0, 0, 0, 0.19)");
      this.box(-9, -4.5, 18.5, 9.0, 3.6, palette.fill);
      // Tinted front windshield
      this.box(2.2, -3.2, 4.2, 6.4, 1.6, "rgba(18, 24, 34, 0.32)");
      // Modern roof cap
      this.box(-5.2, -3.0, 7.6, 6.0, 2.0, car.overcharged ? "#fde047" : car.state === "outbound" ? palette.light : palette.dark);
      // Crisp specular roof line
      this.box(-4.2, -2.4, 5.4, 1.4, 0.7, "rgba(255, 255, 255, 0.35)");
      // Subtle brake-light glow when slowing into curves
      if ((car.turningFactor || 1) < 0.82) {
        ctx.fillStyle = "rgba(255, 72, 72, 0.85)";
        ctx.beginPath();
        ctx.arc(-8.6, -2.4, 1.3, 0, Math.PI * 2);
        ctx.arc(-8.6, 2.4, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawMotorways(run, now = performance.now()) {
      const ctx = this.ctx;
      const pal = this.getPalette(run);
      const night = pal.isDark;

      const renderArc = (fromTile, toTile, id, born = -1000, isPreview = false) => {
        const [ax, ay] = center(fromTile);
        const [bx, by] = center(toTile);
        const [cp1x, cp1y, cp2x, cp2y, spanLen] = motorwayCubicControlPoints(ax, ay, bx, by, id);
        const heightOffset = Math.min(40, 10 + spanLen * 0.075);
        const age = now - born;
        const pop = !isPreview && age < 220 ? popThump(age / 220) : 1;

        ctx.save();
        if (isPreview) ctx.globalAlpha = 0.78;

        ctx.strokeStyle = pal.shadow;
        ctx.lineWidth = (25 + heightOffset * 0.12) * pop;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ax + 6, ay + 8);
        ctx.bezierCurveTo(
          cp1x + heightOffset * 0.65,
          cp1y + heightOffset,
          cp2x + heightOffset * 0.65,
          cp2y + heightOffset,
          bx + 6,
          by + 8
        );
        ctx.stroke();

        ctx.strokeStyle = pal.motorwayOuter;
        ctx.lineWidth = 24 * pop;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bx, by);
        ctx.stroke();

        ctx.strokeStyle = pal.motorwayInner;
        ctx.lineWidth = 18 * pop;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bx, by);
        ctx.stroke();

        for (const [tx, ty] of [[ax, ay], [bx, by]]) {
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#262c36";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(tx, ty, 8.5 * pop, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        const midX = 0.125 * ax + 0.375 * cp1x + 0.375 * cp2x + 0.125 * bx;
        const midY = 0.125 * ay + 0.375 * cp1y + 0.375 * cp2y + 0.125 * by;
        drawShield(ctx, midX, midY, id, night);
        ctx.restore();
      };

      for (const mw of run.motorways) {
        renderArc(mw.from, mw.to, mw.id, mw.born || -1000, false);
      }
      if (this.motorwayDrag && this.motorwayDrag.from !== null && this.motorwayDrag.to !== null && this.motorwayDrag.from !== this.motorwayDrag.to) {
        renderArc(this.motorwayDrag.from, this.motorwayDrag.to, run.nextMotorwayId, now, true);
      }
    }

    drawTutorialGuide(now) {
      if (!this.tutorialGuide) return;
      const ctx = this.ctx;
      const g = this.tutorialGuide;
      const pulse = (Math.sin(now * 0.006) + 1) * 0.5;

      ctx.save();
      for (const tile of g.pulseTiles || []) {
        const [x, y] = center(tile);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + pulse * 0.5})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(x, y, 28 + pulse * 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (g.fromTile !== null && g.toTile !== null) {
        const [ax, ay] = center(g.fromTile);
        const [bx, by] = center(g.toTile);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.setLineDash([10, 12]);
        ctx.lineDashOffset = -(now * 0.045);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    drawPulses(run, now) {
      const ctx = this.ctx;

      // City Flow Surge shockwave ring across the whole map
      if (run.surgeWave) {
        const elapsed = Math.max(0, now - run.surgeWave.born);
        if (elapsed < 1250) {
          const t = Math.max(0, Math.min(1, elapsed / 1250));
          const ease = easeOutCubic(t);
          const [sx, sy] = center(run.surgeWave.tile);
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - ease) * 0.72})`;
          ctx.lineWidth = 10 * (1 - ease * 0.65);
          ctx.beginPath();
          ctx.arc(sx, sy, 28 + ease * 1050, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - ease) * 0.55})`;
          ctx.lineWidth = 4 * (1 - ease * 0.5);
          ctx.beginPath();
          ctx.arc(sx, sy, 18 + ease * 880, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          run.surgeWave = null;
        }
      }

      if (!run.pulses?.length) return;
      run.pulses = run.pulses.filter(p => now - p.born < p.duration);
      for (const pulse of run.pulses) {
        const t = Math.max(0, Math.min(1, (now - pulse.born) / pulse.duration));
        const ease = easeOutCubic(t);
        const [x, y] = center(pulse.tile);
        const palette = colors[pulse.key];
        const stroke = palette ? palette.fill : "#ffffff";

        ctx.save();
        ctx.strokeStyle = stroke;
        ctx.globalAlpha = (1 - ease) * 0.85;
        ctx.lineWidth = 3 * (1 - ease * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, 16 + ease * 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawPopups(run, now) {
      if (!run.popups?.length) return;
      const ctx = this.ctx;
      const night = this.getPalette(run).isDark;
      run.popups = run.popups.filter(p => now - p.born < p.duration);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const pop of run.popups) {
        const t = Math.max(0, Math.min(1, (now - pop.born) / pop.duration));
        const lift = easeOutCubic(t) * (pop.surge ? 44 : 30);
        const alpha = t < 0.2 ? t / 0.2 : 1 - Math.pow((t - 0.2) / 0.8, 1.8);
        const [x, y] = center(pop.tile);
        const py = y - 22 - lift;

        ctx.globalAlpha = Math.max(0, alpha);
        if (pop.surge) {
          ctx.font = "800 12px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
          const w = 96;
          this.box(x - w / 2, py - 11, w, 22, 11, "rgba(14, 165, 233, 0.92)");
          ctx.fillStyle = "#ffffff";
          ctx.fillText(pop.text, x, py + 0.5);
        } else {
          ctx.font = "800 11.5px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
          const bg = pop.gold
            ? "rgba(245, 158, 11, 0.94)"
            : night
              ? "rgba(30, 38, 50, 0.88)"
              : "rgba(255, 255, 255, 0.9)";
          const fg = pop.gold ? "#ffffff" : night ? "#f2f6fc" : "#141a22";
          const w = pop.text.length * 7.4 + 14;
          this.box(x - w / 2, py - 9.5, w, 19, 9.5, bg);
          ctx.fillStyle = fg;
          ctx.fillText(pop.text, x, py + 0.5);
        }
      }
      ctx.restore();
    }

    render(run, cursor, now = performance.now(), dt = 0.016) {
      const canvas = this.canvas;
      const density = Math.min(2, window.devicePixelRatio || 1);
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      const screenWidth = Math.round(cssWidth * density);
      const screenHeight = Math.round(cssHeight * density);
      if (!screenWidth || !screenHeight) return;
      if (canvas.width !== screenWidth || canvas.height !== screenHeight) {
        canvas.width = screenWidth;
        canvas.height = screenHeight;
      }

      const ctx = this.ctx;
      const cacheKey = run.districtKey + ":" + (this.themeOverride || "native");
      if (this.cachedKey !== cacheKey) {
        this.cachedKey = cacheKey;
        this.ctx = this.background.getContext("2d");
        this.landscape(run);
        this.ctx = ctx;
      }

      // True dt-independent exponential camera zoom & pan smoothing
      const camAlpha = 1 - Math.exp(-14 * dt);
      this.userZoom += (this.targetZoom - this.userZoom) * camAlpha;
      this.panX += (this.targetPanX - this.panX) * camAlpha;
      this.panY += (this.targetPanY - this.panY) * camAlpha;

      this.baseScale = Math.min(cssWidth / width, cssHeight / height);
      this.scale = this.baseScale * this.userZoom;
      this.offsetX = (cssWidth - width * this.scale) / 2 + this.panX;
      this.offsetY = (cssHeight - height * this.scale) / 2 + this.panY;

      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      ctx.setTransform(
        density * this.scale,
        0,
        0,
        density * this.scale,
        density * this.offsetX,
        density * this.offsetY
      );

      ctx.drawImage(this.background, -padCols * cell, -padRows * cell);
      this.drawRiverFlow(run, now);
      this.drawUnifiedPavement(run, now, dt);

      for (const house of run.houses) {
        for (const car of house.cars) this.drawCar(run, house, car, false, dt);
      }

      for (const factory of run.factories) this.drawFactoryDetails(factory, run, now);
      for (const house of run.houses) this.drawHouseRoof(house, now);

      this.drawMotorways(run, now);
      for (const house of run.houses) {
        for (const car of house.cars) this.drawCar(run, house, car, true, dt);
      }

      this.drawTutorialGuide(now);
      this.drawPulses(run, now);
      this.drawPopups(run, now);

      // Silky spring-following cursor halo (glides smoothly instead of snapping tile-to-tile!)
      if (cursor !== null) {
        const [tx, ty] = center(cursor);
        if (this.cursorX === undefined) {
          this.cursorX = tx;
          this.cursorY = ty;
        } else {
          const cAlpha = 1 - Math.exp(-28 * dt);
          this.cursorX += (tx - this.cursorX) * cAlpha;
          this.cursorY += (ty - this.cursorY) * cAlpha;
        }
        const breathe = Math.sin(now * 0.005) * 1.4;
        ctx.save();
        ctx.strokeStyle = this.getPalette(run).isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(35, 42, 52, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.cursorX, this.cursorY, 19 + breathe, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        this.cursorX = undefined;
      }
    }
  }

  window.FactoryMapView = MapView;
})();
