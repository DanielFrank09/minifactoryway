"use strict";

(() => {
  const { columns, rows, point, neighbors, colors } = FactorySim;
  const cell = 42;
  const width = columns * cell;
  const height = rows * cell;
  const sprites = {};
  for (const [group, entries] of Object.entries(window.factorySprites)) {
    sprites[group] = {};
    for (const [name, url] of Object.entries(entries)) {
      if (!url) continue;
      const image = new Image();
      image.src = url;
      sprites[group][name] = image;
    }
  }

  function center(tile) {
    const { x, y } = point(tile);
    return [x * cell + cell / 2, y * cell + cell / 2];
  }

  class MapView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.background = document.createElement("canvas");
      this.background.width = width;
      this.background.height = height;
    }

    box(x, y, w, h, radius, color, stroke) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = color;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    sprite(group, name, x, y, w, h) {
      const image = sprites[group]?.[name];
      if (!image?.complete || !image.naturalWidth) return false;
      this.ctx.drawImage(image, x, y, w, h);
      return true;
    }

    landscape(run) {
      const ctx = this.ctx;
      const ground = ["#cbd0b8", "#c9ceb5", "#cfd2bd", "#c5cbb0"];
      for (let tile = 0; tile < run.terrain.length; tile++) {
        const { x, y } = point(tile);
        const left = x * cell;
        const top = y * cell;
        const mark = run.terrain[tile];
        const grain = (tile * 167 + Math.floor(x / 4) * 43 + run.district.seed) % 23;
        if (mark === "water") {
          ctx.fillStyle = grain % 3 === 0 ? "#7dacaf" : "#79a6aa";
          ctx.fillRect(left, top, cell, cell);
          ctx.fillStyle = "#b2d2c9";
          ctx.fillRect(left + grain % 13, top + 14 + grain % 12, 13, 1);
          ctx.fillRect(left + 23, top + 30, 9, 1);
          continue;
        }
        ctx.fillStyle = ground[(Math.floor(x / 4) + Math.floor(y / 3) + (grain > 16 ? 1 : 0)) % 4];
        ctx.fillRect(left, top, cell, cell);
        ctx.fillStyle = "#555d4730";
        ctx.fillRect(left, top, 2, 2);
        if (mark === "rock" && !this.sprite("terrain", "rock", left + 4, top + 4, 34, 34)) {
          this.box(left + 8, top + 14, 27, 20, 5, "#879077");
          this.box(left + 9, top + 9, 22, 20, 5, "#a9ad99", "#737c68");
          ctx.fillStyle = "#c9cbb8";
          ctx.fillRect(left + 13, top + 13, 11, 2);
        }
        if (mark === "trees" && !this.sprite("terrain", "trees", left + 4, top + 4, 34, 34)) {
          for (const [dx, dy, size] of [[14, 24, 6], [25, 15, 8], [30, 28, 5]]) {
            this.box(left + dx - size, top + dy - size, size * 2, size * 2, size, "#839678");
            this.box(left + dx - size, top + dy - size - 2, size * 2, size * 2, size, "#a2b092");
          }
        }
      }
    }

    drawRoads(run) {
      const ctx = this.ctx;
      const locations = new Set(run.roads.keys());
      for (const lane of run.lanes) {
        if (lane.active) {
          locations.add(lane.supplier);
          locations.add(lane.factory);
        }
      }
      for (const [color, weight] of [["#e2debf", 23], ["#414b43", 17], ["#aeb5a2", 1.5]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = weight;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash(weight < 2 ? [4, 6] : []);
        ctx.beginPath();
        for (const [tile] of run.roads) {
          const [x, y] = center(tile);
          ctx.moveTo(x - 1, y);
          ctx.lineTo(x + 1, y);
          for (const adjacent of neighbors(tile)) {
            if (!locations.has(adjacent)) continue;
            const [ax, ay] = center(adjacent);
            ctx.moveTo(x, y);
            ctx.lineTo((x + ax) / 2, (y + ay) / 2);
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const [tile, type] of run.roads) {
        if (type !== "bridge") continue;
        const [x, y] = center(tile);
        this.box(x - 7, y - 7, 14, 14, 3, "#d8af65", "#635739");
      }
    }

    building(tile, lane, isFactory) {
      const ctx = this.ctx;
      const [x, y] = center(tile);
      const palette = colors[lane.key];
      if (!lane.active) {
        this.box(x - 12, y - 12, 24, 24, 4, "#c4c9b1", "#a0a58f");
        ctx.fillStyle = "#5c6957";
        ctx.font = "bold 13px Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", x, y);
        return;
      }
      const size = isFactory ? 38 : 32;
      const radius = isFactory ? 5 : 16;
      if (!this.sprite(lane.key, isFactory ? "factory" : "supplier", x - size / 2, y - size / 2, size, size)) {
        this.box(x - size / 2, y - size / 2 + 4, size, size, radius, "#30392d50");
        this.box(x - size / 2, y - size / 2, size, size, radius, palette.fill, palette.dark);
        if (isFactory) {
          this.box(x - 14, y - 15, 28, 6, 2, palette.dark);
          this.box(x - 10, y + 13, 20, 3, 1, palette.dark);
        }
        ctx.fillStyle = palette.dark;
        ctx.font = "bold 17px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(palette.symbol, x, y + (isFactory ? 3 : 1));
      }
      if (isFactory && lane.backlog > 0) {
        this.box(x - 18, y + 24, 36, 5, 2, "#27382b40");
        this.box(x - 18, y + 24, 36 * Math.min(1, lane.backlog / 12), 5, 2, lane.backlog >= 8 ? "#a03220" : palette.dark);
      }
    }

    truck(lane, truck) {
      const ctx = this.ctx;
      const [x, y] = center(truck.route[truck.segment]);
      const [nx, ny] = center(truck.route[truck.segment + 1]);
      const palette = colors[lane.key];
      ctx.save();
      ctx.translate(x + (nx - x) * truck.progress, y + (ny - y) * truck.progress);
      ctx.rotate(Math.atan2(ny - y, nx - x));
      ctx.translate(0, 3.2);
      if (!this.sprite(lane.key, "truck", -10, -6, 20, 12)) {
        this.box(-9, -4, 18, 8, 2, palette.fill, "#27332b");
        this.box(3, -3, 4, 6, 1, "#fff7d8");
      }
      ctx.restore();
    }

    render(run, cursor) {
      const canvas = this.canvas;
      const density = Math.min(2, window.devicePixelRatio || 1);
      const screenWidth = Math.round(canvas.clientWidth * density);
      const screenHeight = Math.round(canvas.clientHeight * density);
      if (!screenWidth || !screenHeight) return;
      if (canvas.width !== screenWidth || canvas.height !== screenHeight) {
        canvas.width = screenWidth;
        canvas.height = screenHeight;
      }
      const ctx = this.ctx;
      if (this.terrain !== run.terrain || (this.loadedSprites !== this.countLoadedSprites())) {
        this.terrain = run.terrain;
        this.loadedSprites = this.countLoadedSprites();
        this.ctx = this.background.getContext("2d");
        this.landscape(run);
        this.ctx = ctx;
      }
      ctx.setTransform(screenWidth / width, 0, 0, screenHeight / height, 0, 0);
      ctx.drawImage(this.background, 0, 0);
      this.drawRoads(run);
      for (const lane of run.lanes) {
        this.building(lane.supplier, lane, false);
        this.building(lane.factory, lane, true);
      }
      for (const lane of run.lanes) {
        for (const truck of lane.trucks) this.truck(lane, truck);
      }
      if (cursor !== null) {
        const [x, y] = center(cursor);
        this.box(x - 18, y - 18, 36, 36, 4, "#e6f8a13d", "#506630");
      }
    }

    countLoadedSprites() {
      return Object.values(sprites).flatMap(Object.values).filter(image => image.naturalWidth).length;
    }
  }
  window.FactoryMapView = MapView;
})();
