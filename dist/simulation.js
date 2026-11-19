"use strict";

(() => {
  const columns = 24;
  const rows = 16;
  const colors = {
    copper: { label: "Copper", symbol: "●", fill: "#ed996d", dark: "#82462e" },
    mint: { label: "Machinery", symbol: "◆", fill: "#94cca5", dark: "#345f48" },
    violet: { label: "Ceramics", symbol: "▲", fill: "#c4ade6", dark: "#644881" },
    amber: { label: "Grain", symbol: "✚", fill: "#f4ce75", dark: "#7d601c" },
  };
  const districts = {
    canal: {
      name: "Canal Works", seed: 19,
      water: (x, y) => x === 11 + Math.round(Math.sin(y * .44)) || (x === 12 + Math.round(Math.sin(y * .44)) && y < 5),
      lanes: [[3, 5, 8, 8], [15, 4, 20, 8], [5, 12, 16, 10], [21, 12, 7, 3]],
    },
    quarry: {
      name: "Granite Basin", seed: 79,
      water: (x, y) => y === 10 + Math.round(Math.sin(x * .36)) && x > 9,
      lanes: [[3, 4, 8, 9], [14, 3, 19, 7], [4, 12, 16, 13], [21, 12, 11, 5]],
    },
    coast: {
      name: "Tidebreak Port", seed: 137,
      water: (x, y) => y < 3 + Math.round(Math.sin(x * .38)) || (x === 13 && y >= 8),
      lanes: [[3, 6, 8, 9], [15, 5, 21, 9], [5, 13, 17, 12], [20, 13, 10, 5]],
    },
  };

  function index(x, y) { return y * columns + x; }
  function point(tile) { return { x: tile % columns, y: Math.floor(tile / columns) }; }
  function neighbors(tile) {
    const { x, y } = point(tile);
    const result = [];
    if (x > 0) result.push(tile - 1);
    if (x < columns - 1) result.push(tile + 1);
    if (y > 0) result.push(tile - columns);
    if (y < rows - 1) result.push(tile + columns);
    return result;
  }

  function terrainFor(district, endpoints) {
    return Array.from({ length: columns * rows }, (_, tile) => {
      if (endpoints.some(endpoint => endpoint === tile || neighbors(endpoint).includes(tile))) return "open";
      const { x, y } = point(tile);
      if (district.water(x, y)) return "water";
      const seed = Math.imul(tile + 1, 0x45d9f3b) ^ Math.imul(district.seed, 0x27d4eb2d);
      const shade = (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0) % 127;
      if (shade < 11) return "rock";
      return shade < 31 ? "trees" : "open";
    });
  }

  class Run {
    constructor(key) {
      this.district = districts[key];
      this.inventory = { road: 36, bridge: 4 };
      this.roads = new Map();
      this.history = [];
      this.stroke = null;
      this.time = 0;
      this.shift = 1;
      this.score = 0;
      this.fault = null;
      this.lanes = this.district.lanes.map(([sx, sy, fx, fy], i) => ({
        key: Object.keys(colors)[i],
        supplier: index(sx, sy),
        factory: index(fx, fy),
        backlog: 0,
        demand: 0,
        cooldown: 0,
        route: null,
        trucks: [],
        active: i < 2,
      }));
      this.endpoints = new Set(this.lanes.flatMap(lane => [lane.supplier, lane.factory]));
      this.terrain = terrainFor(this.district, [...this.endpoints]);
    }

    beginStroke() {
      if (!this.stroke) this.stroke = new Map();
    }

    edit(tile, tool) {
      if (!this.stroke || !Number.isInteger(tile) || tile < 0 || tile >= this.terrain.length) return "";
      if (this.endpoints.has(tile)) return "";
      const current = this.roads.get(tile);
      const next = tool === "erase" ? undefined : tool;
      if (current === next || (current && next)) return "";
      const terrain = this.terrain[tile];
      if (next === "road" && terrain === "water") return "Use the bridge tool to cross water.";
      if (next === "road" && terrain === "rock") return "Route around solid obstacles.";
      if (next === "bridge" && terrain !== "water") return "Bridge tiles go on water. Use roads on land.";
      if (next && this.inventory[next] <= 0) return "Out of tiles. Erase a tile or earn more next shift.";
      if (!this.stroke.has(tile)) this.stroke.set(tile, current);
      this.replace(tile, next);
      return "";
    }

    replace(tile, next) {
      const current = this.roads.get(tile);
      if (current) this.inventory[current]++;
      if (next) {
        this.inventory[next]--;
        this.roads.set(tile, next);
      } else {
        this.roads.delete(tile);
      }
      this.updateRoutes();
    }

    endStroke() {
      if (!this.stroke) return;
      const changes = [...this.stroke].filter(([tile, previous]) => this.roads.get(tile) !== previous);
      if (changes.length) this.history.push(changes);
      this.stroke = null;
    }

    undo() {
      this.endStroke();
      const changes = this.history.pop();
      if (!changes) return;
      for (const [tile, previous] of changes.reverse()) this.replace(tile, previous);
    }

    route(supplier, factory) {
      const parent = new Map([[supplier, -1]]);
      const queue = [supplier];
      for (let offset = 0; offset < queue.length; offset++) {
        const tile = queue[offset];
        if (tile === factory) {
          const result = [];
          for (let cursor = factory; cursor !== -1; cursor = parent.get(cursor)) result.push(cursor);
          return result.reverse();
        }
        for (const next of neighbors(tile)) {
          if (parent.has(next) || (next !== factory && !this.roads.has(next))) continue;
          parent.set(next, tile);
          queue.push(next);
        }
      }
      return null;
    }

    updateRoutes() {
      for (const lane of this.lanes) {
        if (!lane.active) continue;
        lane.route = this.route(lane.supplier, lane.factory);
        lane.trucks = lane.trucks.filter(truck => (
          truck.route.slice(truck.segment, -1).every(tile => tile === lane.supplier || this.roads.has(tile))
        ));
      }
    }

    step(seconds) {
      if (this.fault) return;
      this.time += seconds;
      const shift = 1 + Math.floor(this.time / 38);
      if (shift !== this.shift) {
        this.shift = shift;
        this.inventory.road += 10;
        this.inventory.bridge += 2;
        if (shift === 2) this.lanes[2].active = true;
        if (shift === 3) this.lanes[3].active = true;
        this.updateRoutes();
      }

      const traffic = new Map();
      for (const lane of this.lanes) {
        for (const truck of lane.trucks) {
          const tile = truck.route[truck.segment];
          traffic.set(tile, (traffic.get(tile) || 0) + 1);
        }
      }

      for (const lane of this.lanes) {
        if (!lane.active) continue;
        lane.demand += seconds;
        lane.cooldown = Math.max(0, lane.cooldown - seconds);
        const interval = Math.max(1.9, 5.5 - (shift - 1) * .5);
        if (lane.demand >= interval) {
          lane.demand -= interval;
          lane.backlog++;
        }
        const fleet = Math.min(8, 4 + Math.floor((shift - 1) / 2));
        if (lane.route && lane.backlog > lane.trucks.length && lane.trucks.length < fleet && lane.cooldown === 0) {
          lane.trucks.push({ route: lane.route, segment: 0, progress: 0 });
          lane.cooldown = Math.min(2, interval * .63);
        }
        for (const truck of lane.trucks) {
          const tile = truck.route[truck.segment];
          const crowd = Math.max(0, (traffic.get(tile) || 1) - 1);
          const surface = this.roads.get(tile) === "bridge" ? .78 : 1;
          truck.progress += seconds * 2.7 * surface / (1 + crowd * .45);
          if (truck.progress >= 1) {
            truck.progress -= 1;
            truck.segment++;
          }
        }
        lane.trucks = lane.trucks.filter(truck => {
          if (truck.segment < truck.route.length - 1) return true;
          lane.backlog--;
          this.score++;
          return false;
        });
        if (lane.backlog >= 12) this.fault = lane.key;
      }
    }
  }

  globalThis.FactorySim = { Run, districts, colors, columns, rows, index, point, neighbors };
})();
