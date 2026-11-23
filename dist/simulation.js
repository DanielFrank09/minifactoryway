"use strict";

(() => {
  const columns = 22;
  const rows = 14;

  const colors = {
    copper: {
      label: "Red",
      symbol: "●",
      fill: "#e85458",
      light: "#f8a1a4",
      dark: "#a62b30",
      roof: "#f26b6f",
      glow: "rgba(232, 84, 88, 0.35)",
    },
    mint: {
      label: "Cyan",
      symbol: "◆",
      fill: "#4bc2eb",
      light: "#a8e6fa",
      dark: "#207da3",
      roof: "#6dd1f2",
      glow: "rgba(75, 194, 235, 0.35)",
    },
    amber: {
      label: "Amber",
      symbol: "▲",
      fill: "#f5b841",
      light: "#fce09c",
      dark: "#b57c14",
      roof: "#f7c760",
      glow: "rgba(245, 184, 65, 0.35)",
    },
    violet: {
      label: "Indigo",
      symbol: "■",
      fill: "#6f77c7",
      light: "#b5baf0",
      dark: "#42498a",
      roof: "#858dd6",
      glow: "rgba(111, 119, 199, 0.35)",
    },
    emerald: {
      label: "Emerald",
      symbol: "✚",
      fill: "#4ec48b",
      light: "#a2e8c5",
      dark: "#218052",
      roof: "#68d49f",
      glow: "rgba(78, 196, 139, 0.35)",
    },
  };

  const colorKeys = Object.keys(colors);

  // 5 Authentic Real-Life World Cities + Interactive Tutorial Map
  const districts = {
    manila: {
      name: "Manila",
      region: "Philippines · Bay & Pasig",
      riverName: "ILOG PASIG",
      bayName: "LOOK NG MAYNILA",
      seed: 41,
      riverRadius: 0.72,
      palette: {
        land: "#54a6c2",
        landEdge: "#4998b5",
        water: "#a2d6e0",
        waterDeep: "#92cbd8",
        waterGrid: "rgba(42, 112, 132, 0.14)",
        shore: "#ebe3cf",
        hill: "#3c8ca8",
        hillCrest: "#317a94",
        road: "#f6f2e8",
        curb: "#ded7c6",
        roadGuide: "rgba(65, 82, 95, 0.16)",
        motorwayOuter: "#e0586c",
        motorwayInner: "#f57687",
        shadow: "rgba(22, 64, 82, 0.22)",
        isDark: false,
      },
      // West coast Manila Bay polygon (unbuildable gridded water)
      bay: [
        [-6, -4], [4.2, -4], [3.6, 1.8], [1.8, 4.2], [4.8, 5.2], [2.4, 7.6], [1.6, 10.6], [4.4, 14.5], [4.8, 18], [-6, 18],
      ],
      rivers: [
        [
          [3.6, 4.8],
          [8.2, 4.8],
          [11.6, 2.2],
          [17.5, 2.2],
          [19.2, 4.6],
          [19.2, 8.6],
          [15.4, 9.2],
          [15.4, 15.5],
        ],
      ],
      hills: [
        { cx: 7.4, cy: 1.5, rx: 1.6, ry: 1.0, angle: -0.1 },
        { cx: 16.4, cy: 4.5, rx: 1.5, ry: 1.0, angle: 0.2 },
      ],
      initialFactories: [
        { key: "copper", x: 5, y: 6, circular: false, entranceOffset: [1, 0] },
        { key: "mint", x: 10, y: 9, circular: false, entranceOffset: [0, 0] },
        { key: "amber", x: 12, y: 5, circular: true, entranceOffset: [0, 1] },
        { key: "violet", x: 7, y: 2, circular: false, entranceOffset: [0, 1] },
      ],
      initialHouses: [
        { key: "copper", x: 14, y: 4 },
        { key: "copper", x: 15, y: 5 },
        { key: "copper", x: 15, y: 6 },
        { key: "mint", x: 4, y: 1 },
        { key: "mint", x: 5, y: 1 },
        { key: "amber", x: 5, y: 11 },
        { key: "amber", x: 6, y: 11 },
        { key: "violet", x: 8, y: 11 },
      ],
      starterPaths: [
        // Cyan NW neighborhood across bridge into central intersection & Cyan destination (10,9)
        [[4, 1], [4, 2], [5, 2], [6, 3], [7, 4], [8, 5], [8, 6], [8, 7], [9, 8], [10, 9]],
        [[5, 1], [5, 2]],
        // Red East neighborhood feeds directly into Motorway 1 at (14,5) -> lands at (7,7) -> Red destination (5,6)..(6,7)
        [[14, 4], [14, 5]],
        [[15, 5], [14, 5]],
        [[15, 6], [14, 5]],
        [[7, 7], [6, 7]],
        // Amber South neighborhood through central roundabout (10,7) into circular Amber destination (12,5)..(13,6)
        [[5, 11], [6, 10], [7, 9], [8, 8], [9, 7], [10, 7], [11, 7], [12, 6]],
        [[6, 11], [6, 10]],
      ],
      starterRoundabouts: [[10, 7]],
      starterMotorways: [{ from: [14, 5], to: [7, 7], id: 1 }],
      starterBoosts: [[8, 6], [6, 10]],
      starterHubs: [[8, 8]],
    },

    la: {
      name: "Los Angeles",
      region: "USA · Pacific Harbor",
      riverName: "LA HARBOR",
      bayName: "PACIFIC OCEAN",
      seed: 83,
      riverRadius: 0.78,
      palette: {
        land: "#fbf2dc",
        landEdge: "#f3e6c8",
        water: "#8be0cd",
        waterDeep: "#7cd5c2",
        waterGrid: "rgba(32, 125, 105, 0.14)",
        shore: "#ffffff",
        hill: "#d6e588",
        hillCrest: "#c3d66d",
        road: "#ffffff",
        curb: "#dfd8c6",
        roadGuide: "rgba(95, 90, 78, 0.14)",
        motorwayOuter: "#e88854",
        motorwayInner: "#f7a474",
        shadow: "rgba(92, 78, 50, 0.14)",
        isDark: false,
      },
      bay: [
        [-6, 7.5], [1.6, 8.8], [3.5, 11.4], [7.8, 12.2], [12.5, 11.8], [18.5, 12.6], [28, 11.2], [28, 18], [-6, 18],
      ],
      rivers: [
        [
          [9.5, 13.5],
          [9.5, 6.2],
        ],
        [
          [16.2, 13.5],
          [17.5, 8.2],
          [20.2, 6.2],
        ],
      ],
      hills: [
        { cx: 19.2, cy: 3.2, rx: 2.1, ry: 1.3, angle: -0.2 },
        { cx: 10.2, cy: 1.2, rx: 1.8, ry: 1.0, angle: 0.1 },
      ],
      initialFactories: [
        { key: "copper", x: 4, y: 4, circular: false, entranceOffset: [0, 0] },
        { key: "mint", x: 12, y: 4, circular: true, entranceOffset: [0, 0] },
        { key: "amber", x: 13, y: 8, circular: false, entranceOffset: [0, 1] },
      ],
      initialHouses: [
        { key: "copper", x: 2, y: 2 },
        { key: "copper", x: 3, y: 2 },
        { key: "mint", x: 7, y: 3 },
        { key: "mint", x: 7, y: 4 },
        { key: "amber", x: 18, y: 9 },
        { key: "amber", x: 19, y: 9 },
      ],
      starterPaths: [
        [[2, 2], [3, 3], [4, 4]],
        [[3, 2], [3, 3]],
        [[7, 3], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4]],
        [[7, 4], [8, 4]],
      ],
      starterRoundabouts: [],
      starterMotorways: [],
    },

    munich: {
      name: "Munich",
      region: "Germany · Isar Valley",
      riverName: "ISAR",
      bayName: "",
      seed: 19,
      riverRadius: 0.78,
      palette: {
        land: "#edd080",
        landEdge: "#e4c26c",
        water: "#87ced9",
        waterDeep: "#74bfd0",
        waterGrid: "rgba(36, 102, 118, 0.15)",
        shore: "#fbf5e6",
        hill: "#df9a54",
        hillCrest: "#d2833c",
        road: "#3b424f",
        curb: "#2a303a",
        roadGuide: "rgba(255, 255, 255, 0.18)",
        motorwayOuter: "#d9852b",
        motorwayInner: "#f5ac4c",
        shadow: "rgba(55, 40, 14, 0.16)",
        isDark: false,
      },
      bay: null,
      rivers: [
        [
          [17.5, -1.5],
          [15.2, 3.0],
          [12.8, 7.0],
          [10.2, 11.0],
          [8.0, 15.5],
        ],
      ],
      hills: [
        { cx: 2.2, cy: 1.8, rx: 2.3, ry: 1.6, angle: 0.18 },
        { cx: 19.5, cy: 12.2, rx: 2.6, ry: 1.8, angle: -0.24 },
      ],
      initialFactories: [
        { key: "amber", x: 6, y: 3, circular: false, entranceOffset: [0, 1] },
        { key: "copper", x: 5, y: 8, circular: false, entranceOffset: [1, 1] },
        { key: "mint", x: 16, y: 6, circular: true, entranceOffset: [0, 1] },
      ],
      initialHouses: [
        { key: "amber", x: 2, y: 4 },
        { key: "amber", x: 2, y: 6 },
        { key: "copper", x: 14, y: 9 },
        { key: "copper", x: 15, y: 10 },
        { key: "mint", x: 19, y: 6 },
        { key: "mint", x: 19, y: 8 },
      ],
      starterPaths: [
        [[2, 5], [3, 5], [4, 5], [5, 5], [6, 4]],
        [[2, 4], [2, 5]],
        [[2, 6], [2, 5]],
        [[14, 10], [13, 10], [12, 10], [11, 10], [10, 10], [9, 10], [8, 9], [7, 9], [6, 9]],
        [[14, 9], [14, 10]],
        [[15, 10], [14, 10]],
      ],
      starterRoundabouts: [],
      starterMotorways: [{ from: [4, 5], to: [15, 7], id: 1 }],
    },

    tokyo: {
      name: "Tokyo",
      region: "Japan · Sumida & Bay",
      riverName: "SUMIDA",
      bayName: "TOKYO BAY",
      seed: 107,
      riverRadius: 0.78,
      palette: {
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
      },
      bay: [
        [17.8, -4], [28, -4], [28, 18], [15.2, 18], [16.8, 13.5], [18.5, 9.5], [19.4, 4.5], [17.8, -4],
      ],
      rivers: [
        [
          [11.2, -1.5],
          [11.2, 4.5],
          [13.4, 7.8],
          [17.5, 10.5],
        ],
      ],
      hills: [
        { cx: 3.0, cy: 11.8, rx: 2.2, ry: 1.5, angle: 0.15 },
      ],
      initialFactories: [
        { key: "copper", x: 5, y: 3, circular: false },
        { key: "mint", x: 13, y: 2, circular: true },
        { key: "amber", x: 8, y: 8, circular: false },
      ],
      initialHouses: [
        { key: "copper", x: 2, y: 4 },
        { key: "copper", x: 2, y: 5 },
        { key: "mint", x: 15, y: 6 },
        { key: "mint", x: 16, y: 6 },
        { key: "amber", x: 4, y: 8 },
        { key: "amber", x: 4, y: 9 },
      ],
      starterPaths: [
        [[2, 4], [3, 4], [4, 4], [5, 4]],
        [[2, 5], [3, 4]],
        [[4, 8], [5, 8], [6, 8], [7, 8], [8, 9]],
        [[4, 9], [5, 8]],
        [[12, 3], [13, 3]],
      ],
      starterRoundabouts: [],
      starterMotorways: [{ from: [3, 4], to: [12, 3], id: 1 }],
    },

    london: {
      name: "London",
      region: "UK · River Thames",
      riverName: "RIVER THAMES",
      bayName: "",
      seed: 163,
      riverRadius: 0.84,
      palette: {
        land: "#e6e9dc",
        landEdge: "#dadfd0",
        water: "#89c8d6",
        waterDeep: "#76bac9",
        waterGrid: "rgba(38, 104, 120, 0.15)",
        shore: "#f9f7ef",
        hill: "#b8ce9e",
        hillCrest: "#a2bc85",
        road: "#3c434f",
        curb: "#2a303a",
        roadGuide: "rgba(255, 255, 255, 0.18)",
        motorwayOuter: "#cc3e4a",
        motorwayInner: "#eb5b67",
        shadow: "rgba(38, 46, 36, 0.16)",
        isDark: false,
      },
      bay: null,
      rivers: [
        [
          [-1.5, 7.2],
          [4.5, 7.6],
          [8.6, 5.8],
          [13.0, 8.2],
          [17.5, 6.4],
          [23.5, 7.2],
        ],
      ],
      hills: [
        { cx: 4.5, cy: 2.2, rx: 2.2, ry: 1.3, angle: -0.1 },
        { cx: 17.5, cy: 11.8, rx: 2.3, ry: 1.4, angle: 0.15 },
      ],
      initialFactories: [
        { key: "copper", x: 10, y: 2, circular: false },
        { key: "mint", x: 5, y: 10, circular: true },
        { key: "amber", x: 15, y: 2, circular: false },
      ],
      initialHouses: [
        { key: "copper", x: 12, y: 10 },
        { key: "copper", x: 13, y: 10 },
        { key: "mint", x: 2, y: 10 },
        { key: "mint", x: 2, y: 11 },
        { key: "amber", x: 19, y: 4 },
        { key: "amber", x: 19, y: 5 },
      ],
      starterPaths: [
        [[2, 10], [3, 10], [4, 10], [5, 11]],
        [[2, 11], [3, 10]],
      ],
      starterRoundabouts: [],
      starterMotorways: [],
    },

    tutorial: {
      name: "Tutorial",
      region: "Guided Practice",
      riverName: "CLEAR RIVER",
      bayName: "",
      seed: 7,
      riverRadius: 0.72,
      palette: {
        land: "#54a6c2",
        landEdge: "#4998b5",
        water: "#a2d6e0",
        waterDeep: "#92cbd8",
        waterGrid: "rgba(42, 112, 132, 0.14)",
        shore: "#ebe3cf",
        hill: "#3c8ca8",
        hillCrest: "#317a94",
        road: "#f6f2e8",
        curb: "#ded7c6",
        roadGuide: "rgba(65, 82, 95, 0.16)",
        motorwayOuter: "#e0586c",
        motorwayInner: "#f57687",
        shadow: "rgba(22, 64, 82, 0.22)",
        isDark: false,
      },
      bay: null,
      rivers: [
        [
          [11.4, -1.5],
          [11.0, 4.5],
          [11.6, 9.5],
          [11.2, 15.5],
        ],
      ],
      hills: [],
      initialFactories: [
        { key: "amber", x: 7, y: 5, circular: false },
        { key: "copper", x: 15, y: 5, circular: true },
      ],
      initialHouses: [
        { key: "amber", x: 3, y: 6 },
        { key: "amber", x: 3, y: 8 },
        { key: "copper", x: 7, y: 9 },
      ],
      starterPaths: [],
      starterRoundabouts: [],
      starterMotorways: [],
      isTutorial: true,
    },
  };

  function index(x, y) { return y * columns + x; }
  function point(tile) { return { x: tile % columns, y: Math.floor(tile / columns) }; }

  function neighbors8(tile) {
    const { x, y } = point(tile);
    const result = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
          result.push(index(nx, ny));
        }
      }
    }
    return result;
  }

  function neighbors(tile) { return neighbors8(tile); }
  function edgeKey(a, b) { return a < b ? a + ":" + b : b + ":" + a; }

  function sampleSpline(pts, samplesPerSeg = 28) {
    if (pts.length < 2) return pts;
    const out = [];
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[Math.min(n, i + 1)];
      const p3 = pts[Math.min(n, i + 2)];
      const t0x = 0.5 * (p2[0] - p0[0]);
      const t0y = 0.5 * (p2[1] - p0[1]);
      const t1x = 0.5 * (p3[0] - p1[0]);
      const t1y = 0.5 * (p3[1] - p1[1]);
      for (let s = 0; s < samplesPerSeg; s++) {
        const u = s / samplesPerSeg;
        const u2 = u * u;
        const u3 = u2 * u;
        const h00 = 2 * u3 - 3 * u2 + 1;
        const h10 = u3 - 2 * u2 + u;
        const h01 = -2 * u3 + 3 * u2;
        const h11 = u3 - u2;
        out.push([
          h00 * p1[0] + h10 * t0x + h01 * p2[0] + h11 * t1x,
          h00 * p1[1] + h10 * t0y + h01 * p2[1] + h11 * t1y,
        ]);
      }
    }
    out.push(pts[n]);
    return out;
  }

  function pointInPolygon(px, py, poly) {
    if (!poly || poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function distToSegmentSq(px, py, ax, ay, bx, by) {
    const l2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
    if (l2 === 0) return (px - ax) * (px - ax) + (py - ay) * (py - ay);
    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * (bx - ax);
    const qy = ay + t * (by - ay);
    return (px - qx) * (px - qx) + (py - qy) * (py - qy);
  }

  function buildRiverSamples(district) {
    return (district.rivers || []).map(polyline => sampleSpline(polyline, 32));
  }

  function isWaterPoint(samplesList, radius, bay, gx, gy) {
    if (bay && pointInPolygon(gx, gy, bay)) return true;
    const rSq = radius * radius;
    for (const samples of samplesList) {
      for (let i = 0; i < samples.length - 1; i++) {
        const [ax, ay] = samples[i];
        const [bx, by] = samples[i + 1];
        if (distToSegmentSq(gx, gy, ax, ay, bx, by) <= rSq) return true;
      }
    }
    return false;
  }

  function isHillPoint(hills, gx, gy, margin = 0) {
    for (const h of hills || []) {
      const dx = gx - h.cx;
      const dy = gy - h.cy;
      const cos = Math.cos(-(h.angle || 0));
      const sin = Math.sin(-(h.angle || 0));
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      const rx = Math.max(0.5, h.rx + margin);
      const ry = Math.max(0.5, h.ry + margin);
      if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) return true;
    }
    return false;
  }

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  class Run {
    constructor(key = "manila", mode = "endless") {
      this.districtKey = key in districts ? key : "manila";
      this.district = districts[this.districtKey];
      this.mode = mode; // "endless" | "classic"
      this.riverSamples = buildRiverSamples(this.district);
      this.inventory = { road: 60, bridge: 6, motorway: 3, roundabout: 2, light: 2, boost: 6, hub: 2 };
      this.roads = new Map();
      this.edges = new Set();
      this.edgeStamps = new Map();
      this.activeStrokeEdges = new Set();
      this.curedEdges = new Map();
      this.strokePath = [];
      this.decommissioning = [];
      this.roundabouts = new Map(); // tile -> { born }
      this.trafficLights = new Map(); // tile -> { born, phase }
      this.boosts = new Map(); // tile -> { born }
      this.hubs = new Map(); // tile -> { born }
      this.tileTraffic = new Map(); // tile -> smoothed traffic density
      this.motorways = [];
      this.nextMotorwayId = 1;
      this.tileStamps = new Map();
      this.pulses = [];
      this.popups = [];
      this.graphVersion = 1;
      this.dispatchTimer = 0;
      this.history = [];
      this.stroke = null;
      this.time = 0;
      this.shift = 1;
      this.dayIndex = 0;
      this.dayName = "MON";
      this.shiftProgress = 0;
      this.score = 0;
      this.flowStreak = 0;
      this.flowMultiplier = 1;
      this.surgeTimer = 0;
      this.surgeWave = null;
      this.justSurged = false;
      this.justBoosted = false;
      this.justCharged = false;
      this.fault = null;
      this.pendingUpgrade = null;
      this.spawnTimer = 0;
      this.rngState = this.district.seed * 9176 + 13;

      this.terrain = Array.from({ length: columns * rows }, (_, tile) => {
        const { x, y } = point(tile);
        if (isWaterPoint(this.riverSamples, this.district.riverRadius + 0.25, this.district.bay, x + 0.5, y + 0.5)) {
          return "water";
        }
        if (isHillPoint(this.district.hills, x + 0.5, y + 0.5, -0.1)) return "hill";
        return "open";
      });

      this.factories = [];
      this.houses = [];
      this.buildingTiles = new Map();

      for (const f of this.district.initialFactories) {
        this.addFactory(f.key, f.x, f.y, f.circular, false, f.entranceOffset || [0, 1]);
      }
      for (const h of this.district.initialHouses) {
        this.addHouse(h.key, h.x, h.y, false);
      }

      for (const path of this.district.starterPaths || []) {
        for (let i = 0; i < path.length - 1; i++) {
          const a = index(path[i][0], path[i][1]);
          const b = index(path[i + 1][0], path[i + 1][1]);
          this.connectTiles(a, b, "road", false);
        }
      }
      for (const [rx, ry] of this.district.starterRoundabouts || []) {
        this.roundabouts.set(index(rx, ry), { born: -1000 });
      }
      for (const [bx, by] of this.district.starterBoosts || []) {
        this.boosts.set(index(bx, by), { born: -1000 });
      }
      for (const [hx, hy] of this.district.starterHubs || []) {
        this.hubs.set(index(hx, hy), { born: -1000 });
      }
      for (const mw of this.district.starterMotorways || []) {
        const fromTile = index(mw.from[0], mw.from[1]);
        const toTile = index(mw.to[0], mw.to[1]);
        this.motorways.push({
          id: mw.id || this.nextMotorwayId++,
          from: fromTile,
          to: toTile,
          born: -1000,
        });
        this.nextMotorwayId = Math.max(this.nextMotorwayId, (mw.id || 1) + 1);
      }

      this.inventory = this.district.isTutorial
        ? { road: 45, bridge: 6, motorway: 2, roundabout: 2, light: 2, boost: 4, hub: 1 }
        : { road: 60, bridge: 6, motorway: 3, roundabout: 2, light: 2, boost: 6, hub: 2 };

      this.syncLanesSummary();
    }

    rand() {
      this.rngState = (Math.imul(this.rngState, 1664525) + 1013904223) >>> 0;
      return this.rngState / 4294967296;
    }

    isNearRiver(x, y, margin = 1.15) {
      const r = this.district.riverRadius + margin;
      return (
        isWaterPoint(this.riverSamples, r, this.district.bay, x + 0.5, y + 0.5) ||
        isWaterPoint(this.riverSamples, r, this.district.bay, x + 0.1, y + 0.1) ||
        isWaterPoint(this.riverSamples, r, this.district.bay, x + 0.9, y + 0.9)
      );
    }

    isNearHill(x, y, margin = 0.25) {
      return isHillPoint(this.district.hills, x + 0.5, y + 0.5, margin);
    }

    addFactory(key, x, y, circular = false, animate = true, entranceOffset = [0, 1]) {
      let fx = x;
      let fy = y;
      if (
        !this.district.isTutorial &&
        (this.isNearRiver(fx, fy) ||
          this.isNearRiver(fx + 1, fy) ||
          this.isNearRiver(fx, fy + 1) ||
          this.isNearRiver(fx + 1, fy + 1) ||
          this.isNearHill(fx, fy) ||
          this.isNearHill(fx + 1, fy + 1))
      ) {
        for (let r = 1; r <= 7; r++) {
          let found = false;
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (this.canSpawnFactoryAt(nx, ny)) {
                fx = nx;
                fy = ny;
                found = true;
              }
            }
          }
          if (found) break;
        }
      }

      const tiles = [
        index(fx, fy),
        index(fx + 1, fy),
        index(fx, fy + 1),
        index(fx + 1, fy + 1),
      ];
      const [edx, edy] = entranceOffset || [0, 1];
      const entrance = index(fx + edx, fy + edy);

      const factory = {
        id: "F" + (this.factories.length + 1),
        kind: "factory",
        key,
        x: fx,
        y: fy,
        tiles,
        entrance,
        entranceOffset: [edx, edy],
        portTarget: null,
        circular,
        pins: 2,
        pinItems: [
          { slot: 0, scale: animate ? 0 : 1, vel: 0, lift: 0, state: "live" },
          { slot: 1, scale: animate ? 0 : 1, vel: 0, lift: 0, state: "live" },
        ],
        maxPins: 8,
        overloadTimer: 0,
        demandTimer: this.rand() * 2.5,
        demandProgress: 0,
        bounce: 0,
        bounceVel: 0,
        born: animate ? performance.now() : -1000,
      };
      this.factories.push(factory);
      for (const t of tiles) {
        this.buildingTiles.set(t, factory);
        this.roads.set(t, "compound");
      }

      if (animate) {
        this.pulses.push({ tile: entrance, key, born: performance.now(), duration: 680 });
      }
      return factory;
    }

    addHouse(key, x, y, animate = true) {
      let hx = x;
      let hy = y;
      if (!this.district.isTutorial && (this.isNearRiver(hx, hy) || this.isNearHill(hx, hy))) {
        for (let r = 1; r <= 7; r++) {
          let found = false;
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (this.canSpawnHouseAt(nx, ny)) {
                hx = nx;
                hy = ny;
                found = true;
              }
            }
          }
          if (found) break;
        }
      }

      const tile = index(hx, hy);
      const house = {
        id: "H" + (this.houses.length + 1),
        kind: "house",
        key,
        x: hx,
        y: hy,
        tile,
        drivewayTarget: null,
        doorAngle: Math.PI / 2,
        doorExtend: 0,
        cooldown: 0,
        born: animate ? performance.now() : -1000,
        cars: [
          { id: 0, state: "home", route: null, u: 0, speed: 0, targetFactory: null, trail: [] },
          { id: 1, state: "home", route: null, u: 0, speed: 0, targetFactory: null, trail: [] },
        ],
      };
      this.houses.push(house);
      this.buildingTiles.set(tile, house);
      this.roads.set(tile, "driveway");
      if (animate) {
        this.pulses.push({ tile, key, born: performance.now(), duration: 560 });
      }
      return house;
    }

    canSpawnFactoryAt(x, y) {
      if (x < 2 || x > columns - 4 || y < 2 || y > rows - 4) return false;
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          if (this.isNearRiver(x + dx, y + dy, 1.2)) return false;
          if (this.isNearHill(x + dx, y + dy, 0.3)) return false;
        }
      }
      for (let dy = -1; dy <= 2; dy++) {
        for (let dx = -1; dx <= 2; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx < 0 || tx >= columns || ty < 0 || ty >= rows) return false;
          const t = index(tx, ty);
          if (this.terrain[t] !== "open") return false;
          if (this.buildingTiles.has(t)) return false;
          if (this.roads.has(t)) return false;
        }
      }
      return true;
    }

    canSpawnHouseAt(x, y) {
      if (x < 1 || x > columns - 2 || y < 1 || y > rows - 2) return false;
      if (this.isNearRiver(x, y, 1.1) || this.isNearHill(x, y, 0.2)) return false;
      const t = index(x, y);
      if (this.terrain[t] !== "open" || this.buildingTiles.has(t) || this.roads.has(t)) return false;
      for (const n of neighbors8(t)) {
        const b = this.buildingTiles.get(n);
        if (b?.kind === "factory") return false;
      }
      return true;
    }

    spawnOrganicBuilding() {
      if (this.district.isTutorial) return;
      const activeKeys = [...new Set(this.factories.map(f => f.key))];
      const wantFactory = this.houses.length >= this.factories.length * 2.5 && this.factories.length < 8;
      if (wantFactory) {
        const unlockNewColor = activeKeys.length < colorKeys.length && this.rand() < 0.5;
        const key = unlockNewColor
          ? colorKeys[activeKeys.length]
          : activeKeys[Math.floor(this.rand() * activeKeys.length)];

        for (let attempt = 0; attempt < 90; attempt++) {
          const x = 2 + Math.floor(this.rand() * (columns - 5));
          const y = 2 + Math.floor(this.rand() * (rows - 5));
          if (this.canSpawnFactoryAt(x, y)) {
            this.addFactory(key, x, y, this.rand() < 0.4, true);
            if (unlockNewColor) this.spawnHouseForColor(key);
            this.syncLanesSummary();
            return;
          }
        }
      }

      const key = activeKeys[Math.floor(this.rand() * activeKeys.length)];
      this.spawnHouseForColor(key);
      this.syncLanesSummary();
    }

    spawnHouseForColor(key) {
      if (this.houses.length >= 26) return;
      const sameHouses = this.houses.filter(h => h.key === key);
      for (let attempt = 0; attempt < 100; attempt++) {
        let x, y;
        if (sameHouses.length && attempt < 65) {
          const anchor = sameHouses[Math.floor(this.rand() * sameHouses.length)];
          x = anchor.x + Math.floor(this.rand() * 5) - 2;
          y = anchor.y + Math.floor(this.rand() * 5) - 2;
        } else {
          x = 1 + Math.floor(this.rand() * (columns - 2));
          y = 1 + Math.floor(this.rand() * (rows - 2));
        }
        if (this.canSpawnHouseAt(x, y)) {
          const newHouse = this.addHouse(key, x, y, true);
          for (const n of neighbors8(newHouse.tile)) {
            if (this.roads.get(n) === "road") {
              this.connectTiles(newHouse.tile, n, "road", true);
              break;
            }
          }
          return;
        }
      }
    }

    generateWeeklyUpgrade() {
      const pool = [
        { title: "Roundabout Pack", desc: "+20 Roads & +1 Roundabout", grant: { road: 20, roundabout: 1 } },
        { title: "Motorway Pack", desc: "+20 Roads & +1 Motorway", grant: { road: 20, motorway: 1 } },
        { title: "Bridge Pack", desc: "+20 Roads & +2 Bridges", grant: { road: 20, bridge: 2 } },
        { title: "Traffic Signal Pack", desc: "+25 Roads & +2 Signals", grant: { road: 25, light: 2 } },
        { title: "Boost Strip Pack", desc: "+20 Roads & +3 Boost Strips", grant: { road: 20, boost: 3 } },
        { title: "Overcharge Hub Pack", desc: "+20 Roads & +1 Overcharge Hub", grant: { road: 20, hub: 1 } },
      ];
      const idxA = Math.floor(this.rand() * pool.length);
      const idxB = (idxA + 1 + Math.floor(this.rand() * (pool.length - 1))) % pool.length;
      return { week: this.shift, choices: [pool[idxA], pool[idxB]] };
    }

    applyUpgrade(choiceIndex) {
      if (!this.pendingUpgrade) return;
      const choice = this.pendingUpgrade.choices[choiceIndex];
      if (choice?.grant) {
        for (const [k, amt] of Object.entries(choice.grant)) {
          this.inventory[k] = (this.inventory[k] || 0) + amt;
        }
      }
      this.pendingUpgrade = null;
    }

    syncBuildingPorts() {
      for (const f of this.factories) {
        f.portTarget = null;
        for (const n of neighbors8(f.entrance)) {
          if (this.edges.has(edgeKey(f.entrance, n))) {
            f.portTarget = n;
            break;
          }
        }
      }
      for (const h of this.houses) {
        h.drivewayTarget = null;
        for (const n of neighbors8(h.tile)) {
          if (this.edges.has(edgeKey(h.tile, n))) {
            h.drivewayTarget = n;
            break;
          }
        }
      }
    }

    syncLanesSummary() {
      this.syncBuildingPorts();
      this.graphVersion = (this.graphVersion || 0) + 1;
      const grouped = new Map();
      for (const f of this.factories) {
        if (!grouped.has(f.key)) {
          grouped.set(f.key, {
            key: f.key,
            supplier: this.houses.find(h => h.key === f.key)?.tile ?? f.entrance,
            factory: f.entrance,
            backlog: 0,
            displayBacklog: 0,
            route: null,
            trucks: [],
            active: true,
          });
        }
        const entry = grouped.get(f.key);
        entry.backlog += f.pins;
        entry.displayBacklog = entry.backlog;
      }
      for (const [key, entry] of grouped) {
        const houses = this.houses.filter(h => h.key === key);
        const facts = this.factories.filter(f => f.key === key);
        for (const h of houses) {
          for (const f of facts) {
            const r = this.route(h.tile, f.entrance, f);
            if (r) {
              entry.route = r;
              break;
            }
          }
          if (entry.route) break;
        }
      }
      this.lanes = [...grouped.values()];
    }

    beginStroke() {
      if (!this.stroke) {
        this.stroke = { roads: new Map(), edges: new Map() };
        this.activeStrokeEdges.clear();
        this.strokePath = [];
      }
    }

    tryRetractTo(tile) {
      if (!this.stroke || this.strokePath.length < 2) return false;
      const prevTile = this.strokePath[this.strokePath.length - 2];
      if (tile !== prevTile) return false;
      const tipTile = this.strokePath.pop();
      const k = edgeKey(prevTile, tipTile);
      if (this.activeStrokeEdges.has(k)) {
        this.activeStrokeEdges.delete(k);
        this.edges.delete(k);
        this.edgeStamps.delete(k);
        this.decommissioning.push({
          from: tipTile,
          to: prevTile,
          born: performance.now(),
          duration: 180,
          retract: true,
        });
        const hasOtherEdge = neighbors8(tipTile).some(n => this.edges.has(edgeKey(tipTile, n)));
        const tipKind = this.roads.get(tipTile);
        if (!hasOtherEdge && (tipKind === "road" || tipKind === "bridge")) {
          this.inventory[tipKind]++;
          this.roads.delete(tipTile);
          this.tileStamps.delete(tipTile);
        }
        this.syncLanesSummary();
        return true;
      }
      return false;
    }

    connectTiles(fromTile, toTile, tool, animate = true) {
      if (tool === "erase" || fromTile === toTile) return "";
      if (animate && this.tryRetractTo(toTile)) return "retract";

      const { x: x1, y: y1 } = point(fromTile);
      const { x: x2, y: y2 } = point(toTile);
      if (Math.abs(x1 - x2) > 1 || Math.abs(y1 - y2) > 1) return "";
      if (this.terrain[fromTile] === "hill" || this.terrain[toTile] === "hill") return "";

      const b1 = this.buildingTiles.get(fromTile);
      const b2 = this.buildingTiles.get(toTile);
      if (b1?.kind === "factory" && b1 === b2) return "";

      // Enforce ONE entrance, ONE port per station (factory):
      // Only the single designated entrance tile can accept a road, and at most ONE road can connect to it.
      if (b1?.kind === "factory") {
        if (fromTile !== b1.entrance || b2) return "";
        if (b1.portTarget !== null && b1.portTarget !== toTile) {
          if (animate) this.pulses.push({ tile: b1.entrance, key: "copper", born: performance.now(), duration: 300 });
          return "";
        }
      }
      if (b2?.kind === "factory") {
        if (toTile !== b2.entrance || b1) return "";
        if (b2.portTarget !== null && b2.portTarget !== fromTile) {
          if (animate) this.pulses.push({ tile: b2.entrance, key: "copper", born: performance.now(), duration: 300 });
          return "";
        }
      }

      if (b1?.kind === "house" && b1.drivewayTarget !== null && b1.drivewayTarget !== toTile) {
        this.edges.delete(edgeKey(fromTile, b1.drivewayTarget));
      }
      if (b2?.kind === "house" && b2.drivewayTarget !== null && b2.drivewayTarget !== fromTile) {
        this.edges.delete(edgeKey(toTile, b2.drivewayTarget));
      }

      const now = animate ? performance.now() : -1000;
      for (const t of [fromTile, toTile]) {
        if (!this.roads.has(t)) {
          const isWater = this.terrain[t] === "water";
          const tileKind = isWater ? "bridge" : "road";
          if (this.inventory[tileKind] <= 0) {
            if (this.mode === "endless" || this.district.isTutorial) {
              this.inventory[tileKind] = 15;
            } else {
              return "";
            }
          }
          if (this.stroke && !this.stroke.roads.has(t)) this.stroke.roads.set(t, undefined);
          this.inventory[tileKind]--;
          this.roads.set(t, tileKind);
          if (animate) this.tileStamps.set(t, now);
        }
      }

      if (animate) {
        if (!this.strokePath.length) this.strokePath.push(fromTile);
        if (this.strokePath[this.strokePath.length - 1] !== toTile) {
          this.strokePath.push(toTile);
        }
      }

      const k = edgeKey(fromTile, toTile);
      let eventSignal = "";
      if (!this.edges.has(k)) {
        if (this.stroke && !this.stroke.edges.has(k)) this.stroke.edges.set(k, false);
        this.edges.add(k);
        const isBridgeEdge = this.terrain[fromTile] === "water" || this.terrain[toTile] === "water";
        eventSignal = isBridgeEdge ? "bridge-lock" : "extend";
        if (animate) {
          this.activeStrokeEdges.add(k);
          this.edgeStamps.set(k, {
            born: now,
            from: fromTile,
            to: toTile,
            isBridge: isBridgeEdge,
            prog: 0,
            vel: 0,
          });
          this.tileStamps.set(toTile, now);
          if (isBridgeEdge) {
            this.pulses.push({ tile: toTile, key: "mint", born: now, duration: 720, waterWake: true });
          }
        }
        if (b1?.kind === "house") b1.drivewayTarget = toTile;
        if (b2?.kind === "house") b2.drivewayTarget = fromTile;
        if (b1?.kind === "factory") b1.portTarget = toTile;
        if (b2?.kind === "factory") b2.portTarget = fromTile;
      }

      this.syncLanesSummary();
      return eventSignal;
    }

    placeRoundabout(tile) {
      if (this.buildingTiles.has(tile) || this.terrain[tile] !== "open") return "";
      if (this.roundabouts.has(tile)) return "";
      if (this.inventory.roundabout <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory.roundabout = 1;
        else return "";
      }
      this.inventory.roundabout--;
      if (!this.roads.has(tile)) this.roads.set(tile, "road");
      this.roundabouts.set(tile, { born: performance.now() });
      this.trafficLights.delete(tile);
      // Auto-link orthogonal adjacent non-building road tiles into the roundabout smoothly
      for (const n of neighbors8(tile)) {
        if (this.buildingTiles.has(n)) continue;
        const { x: x1, y: y1 } = point(tile);
        const { x: x2, y: y2 } = point(n);
        if (Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1 && this.roads.has(n)) {
          this.edges.add(edgeKey(tile, n));
        }
      }
      this.pulses.push({ tile, key: "violet", born: performance.now(), duration: 540 });
      this.syncLanesSummary();
      return "bridge-lock";
    }

    placeTrafficLight(tile) {
      if (this.buildingTiles.has(tile) || !this.roads.has(tile)) return "";
      if (this.trafficLights.has(tile) || this.roundabouts.has(tile)) return "";
      if (this.inventory.light <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory.light = 1;
        else return "";
      }
      this.inventory.light--;
      this.trafficLights.set(tile, { born: performance.now(), phase: 0 });
      this.pulses.push({ tile, key: "emerald", born: performance.now(), duration: 480 });
      return "extend";
    }

    placeBoost(tile) {
      if (this.buildingTiles.has(tile) || !this.roads.has(tile)) return "";
      if (this.boosts.has(tile) || this.hubs.has(tile) || this.roundabouts.has(tile)) return "";
      if (this.inventory.boost <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory.boost = 2;
        else return "";
      }
      this.inventory.boost--;
      this.boosts.set(tile, { born: performance.now() });
      this.pulses.push({ tile, key: "mint", born: performance.now(), duration: 520 });
      return "boost-place";
    }

    placeHub(tile) {
      if (this.buildingTiles.has(tile) || !this.roads.has(tile)) return "";
      if (this.hubs.has(tile) || this.boosts.has(tile) || this.roundabouts.has(tile)) return "";
      if (this.inventory.hub <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory.hub = 1;
        else return "";
      }
      this.inventory.hub--;
      this.hubs.set(tile, { born: performance.now() });
      this.pulses.push({ tile, key: "amber", born: performance.now(), duration: 580 });
      return "hub-place";
    }

    addMotorway(fromTile, toTile) {
      if (fromTile === toTile || fromTile === null || toTile === null) return "";
      if (this.terrain[fromTile] === "hill" || this.terrain[toTile] === "hill") return "";
      if (this.buildingTiles.get(fromTile)?.kind === "factory" || this.buildingTiles.get(toTile)?.kind === "factory") {
        return "";
      }
      const { x: x1, y: y1 } = point(fromTile);
      const { x: x2, y: y2 } = point(toTile);
      if (Math.hypot(x2 - x1, y2 - y1) < 2.2) return "";
      if (this.inventory.motorway <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory.motorway = 1;
        else return "";
      }

      for (const t of [fromTile, toTile]) {
        if (!this.roads.has(t)) {
          this.roads.set(t, this.terrain[t] === "water" ? "bridge" : "road");
        }
      }
      const mw = {
        id: this.nextMotorwayId++,
        from: fromTile,
        to: toTile,
        born: performance.now(),
      };
      this.motorways.push(mw);
      this.inventory.motorway--;
      this.pulses.push({ tile: fromTile, key: "copper", born: performance.now(), duration: 600 });
      this.pulses.push({ tile: toTile, key: "copper", born: performance.now(), duration: 600 });
      this.syncLanesSummary();
      return "Motorway " + mw.id + " linked.";
    }

    edit(tile, tool) {
      if (!this.stroke || !Number.isInteger(tile) || tile < 0 || tile >= this.terrain.length) return "";
      if (tool === "roundabout") return this.placeRoundabout(tile);
      if (tool === "light") return this.placeTrafficLight(tile);
      if (tool === "boost") return this.placeBoost(tile);
      if (tool === "hub") return this.placeHub(tile);

      if (tool === "erase") {
        if (this.boosts.has(tile)) {
          this.boosts.delete(tile);
          this.inventory.boost++;
          this.pulses.push({ tile, key: "erase", born: performance.now(), duration: 260 });
          return "erase";
        }
        if (this.hubs.has(tile)) {
          this.hubs.delete(tile);
          this.inventory.hub++;
          this.pulses.push({ tile, key: "erase", born: performance.now(), duration: 260 });
          return "erase";
        }
        if (this.roundabouts.has(tile)) {
          this.roundabouts.delete(tile);
          this.inventory.roundabout++;
          this.pulses.push({ tile, key: "erase", born: performance.now(), duration: 260 });
          return "erase";
        }
        if (this.trafficLights.has(tile)) {
          this.trafficLights.delete(tile);
          this.inventory.light++;
          this.pulses.push({ tile, key: "erase", born: performance.now(), duration: 260 });
          return "erase";
        }
        const mwIdx = this.motorways.findIndex(m => m.from === tile || m.to === tile);
        if (mwIdx !== -1) {
          this.motorways.splice(mwIdx, 1);
          this.inventory.motorway++;
          this.pulses.push({ tile, key: "erase", born: performance.now(), duration: 260 });
          this.syncLanesSummary();
          return "erase";
        }
        const current = this.roads.get(tile);
        if (!current) return "";
        const now = performance.now();
        if (current === "compound" || current === "driveway") {
          let removedAny = false;
          for (const n of neighbors8(tile)) {
            const k = edgeKey(tile, n);
            if (this.edges.has(k)) {
              if (!this.stroke.edges.has(k)) this.stroke.edges.set(k, true);
              this.edges.delete(k);
              this.decommissioning.push({ from: tile, to: n, born: now, duration: 420 });
              removedAny = true;
            }
          }
          const b = this.buildingTiles.get(tile);
          if (b?.kind === "house") b.drivewayTarget = null;
          this.syncLanesSummary();
          return removedAny ? "erase" : "";
        }
        if (!this.stroke.roads.has(tile)) this.stroke.roads.set(tile, current);
        this.inventory[current] = (this.inventory[current] || 0) + 1;
        this.roads.delete(tile);
        this.tileStamps.delete(tile);
        for (const n of neighbors8(tile)) {
          const k = edgeKey(tile, n);
          if (this.edges.has(k)) {
            if (!this.stroke.edges.has(k)) this.stroke.edges.set(k, true);
            this.edges.delete(k);
            this.decommissioning.push({ from: tile, to: n, born: now, duration: 440 });
          }
          const nb = this.buildingTiles.get(n);
          if (nb?.kind === "house" && nb.drivewayTarget === tile) nb.drivewayTarget = null;
        }
        this.pulses.push({ tile, key: "erase", born: now, duration: 260 });
        this.syncLanesSummary();
        return "erase";
      }

      if (this.buildingTiles.has(tile) || this.terrain[tile] === "hill") {
        if (!this.strokePath.length && this.buildingTiles.has(tile)) this.strokePath.push(tile);
        return "";
      }
      const current = this.roads.get(tile);
      if (current) {
        if (!this.strokePath.length) this.strokePath.push(tile);
        return "";
      }
      const isWater = this.terrain[tile] === "water";
      const kind = isWater ? "bridge" : "road";
      if (this.inventory[kind] <= 0) {
        if (this.mode === "endless" || this.district.isTutorial) this.inventory[kind] = 15;
        else return "";
      }
      if (!this.stroke.roads.has(tile)) this.stroke.roads.set(tile, undefined);
      this.inventory[kind]--;
      this.roads.set(tile, kind);
      this.tileStamps.set(tile, performance.now());
      if (!this.strokePath.length) this.strokePath.push(tile);
      this.syncLanesSummary();
      return "extend";
    }

    endStroke() {
      if (!this.stroke) return false;
      const now = performance.now();
      let curedAny = false;
      for (const k of this.activeStrokeEdges) {
        this.curedEdges.set(k, now);
        curedAny = true;
      }
      this.activeStrokeEdges.clear();
      this.strokePath = [];
      const roadChanges = [...this.stroke.roads].filter(([t, prev]) => this.roads.get(t) !== prev);
      const edgeChanges = [...this.stroke.edges].filter(([k, prev]) => this.edges.has(k) !== prev);
      if (roadChanges.length || edgeChanges.length) {
        this.history.push({ roadChanges, edgeChanges });
      }
      this.stroke = null;
      return curedAny;
    }

    undo() {
      this.endStroke();
      const entry = this.history.pop();
      if (!entry) return;
      for (const [k, hadEdge] of entry.edgeChanges) {
        if (hadEdge) this.edges.add(k);
        else this.edges.delete(k);
      }
      for (const [tile, prev] of entry.roadChanges) {
        const curr = this.roads.get(tile);
        if (curr === "road" || curr === "bridge") this.inventory[curr]++;
        if (prev) {
          if (prev === "road" || prev === "bridge") this.inventory[prev] = Math.max(0, this.inventory[prev] - 1);
          this.roads.set(tile, prev);
        } else {
          this.roads.delete(tile);
        }
      }
      this.syncLanesSummary();
    }

    connectedNeighbors(tile) {
      const result = [];
      for (const n of neighbors8(tile)) {
        if (this.edges.has(edgeKey(tile, n))) result.push(n);
      }
      for (const mw of this.motorways) {
        if (mw.from === tile) result.push(mw.to);
        else if (mw.to === tile) result.push(mw.from);
      }
      return result;
    }

    route(startTile, goalTile, targetFactory = null) {
      const factoryObj = targetFactory || this.buildingTiles.get(goalTile);
      const goals = new Set(factoryObj?.kind === "factory" ? [factoryObj.entrance] : [goalTile]);
      const parent = new Map([[startTile, -1]]);
      const queue = [startTile];

      for (let offset = 0; offset < queue.length; offset++) {
        const tile = queue[offset];
        if (goals.has(tile)) {
          const result = [];
          for (let cur = tile; cur !== -1; cur = parent.get(cur)) result.push(cur);
          result.reverse();
          if (factoryObj?.kind === "factory" && result[result.length - 1] !== factoryObj.entrance) {
            result.push(factoryObj.entrance);
          }
          return result;
        }
        for (const next of this.connectedNeighbors(tile)) {
          if (parent.has(next)) continue;
          const b = this.buildingTiles.get(next);
          if (b && b.kind === "house" && next !== startTile) continue;
          if (b && b.kind === "factory" && !goals.has(next)) continue;
          parent.set(next, tile);
          queue.push(next);
        }
      }
      return null;
    }

    step(seconds) {
      if (this.fault || this.pendingUpgrade) return;
      this.time += seconds;
      const dayLength = 14;
      const totalDays = Math.floor(this.time / dayLength);
      this.dayIndex = totalDays % 7;
      this.dayName = dayNames[this.dayIndex];
      this.shiftProgress = (this.time % dayLength) / dayLength;

      // Cycle traffic lights smoothly
      for (const tl of this.trafficLights.values()) {
        tl.phase = (tl.phase + seconds * 0.45) % 2;
      }

      // Decay live traffic flow density & surge timer
      const trafficDecay = Math.exp(-0.55 * seconds);
      for (const [t, val] of this.tileTraffic) {
        const nextVal = val * trafficDecay;
        if (nextVal < 0.02) this.tileTraffic.delete(t);
        else this.tileTraffic.set(t, nextVal);
      }
      this.surgeTimer = Math.max(0, this.surgeTimer - seconds);

      // Weekly Sunday budget upgrade
      const week = 1 + Math.floor(totalDays / 7);
      if (week !== this.shift) {
        this.shift = week;
        if (!this.district.isTutorial) {
          this.pendingUpgrade = this.generateWeeklyUpgrade();
        }
      }

      if (this.mode === "endless" && this.inventory.road < 18) this.inventory.road += 20;

      this.spawnTimer += seconds;
      if (this.spawnTimer >= 16) {
        this.spawnTimer = 0;
        this.spawnOrganicBuilding();
      }

      for (const factory of this.factories) {
        // Spring-damped arrival micro-bounce on destination building
        const bForce = -180 * factory.bounce - 16 * factory.bounceVel;
        factory.bounceVel += bForce * seconds;
        factory.bounce += factory.bounceVel * seconds;

        // Animate individual pins (elastic spawn + smooth collect pop)
        for (const pin of factory.pinItems) {
          if (pin.state === "live") {
            const f = 260 * (1 - pin.scale) - 18 * pin.vel;
            pin.vel += f * seconds;
            pin.scale = Math.max(0, pin.scale + pin.vel * seconds);
          } else {
            pin.lift += 26 * seconds;
            pin.scale = Math.max(0, pin.scale - 4.2 * seconds);
          }
        }
        factory.pinItems = factory.pinItems.filter(p => p.state === "live" || p.scale > 0.02);

        factory.demandTimer += seconds;
        const interval = factory.circular ? 3.4 : 4.6;
        factory.demandProgress = Math.min(1, factory.demandTimer / interval);
        if (factory.demandTimer >= interval) {
          factory.demandTimer -= interval;
          factory.demandProgress = 0;
          if (factory.pins < factory.maxPins) {
            factory.pins++;
            const usedSlots = new Set(factory.pinItems.filter(p => p.state === "live").map(p => p.slot));
            let nextSlot = 0;
            while (usedSlots.has(nextSlot) && nextSlot < factory.maxPins) nextSlot++;
            factory.pinItems.push({ slot: nextSlot, scale: 0.01, vel: 4.5, lift: 0, state: "live" });
          }
        }
        // Classic mode overload countdown
        if (this.mode === "classic" && !this.district.isTutorial) {
          if (factory.pins >= factory.maxPins) {
            factory.overloadTimer += seconds;
            if (factory.overloadTimer >= 12) this.fault = factory.key;
          } else {
            factory.overloadTimer = Math.max(0, factory.overloadTimer - seconds * 2);
          }
        }
      }

      // Dispatch cars (cadenced every 0.16s to keep 120fps silky smooth without per-frame BFS spam)
      this.dispatchTimer = (this.dispatchTimer || 0) + seconds;
      if (this.dispatchTimer >= 0.16) {
        this.dispatchTimer = 0;
        for (const factory of this.factories) {
          let inboundCars = 0;
          for (const h of this.houses) {
            if (h.key !== factory.key) continue;
            for (const c of h.cars) {
              if (c.state === "outbound" && c.targetFactory === factory) inboundCars++;
            }
          }
          const needed = Math.max(1, factory.pins) - inboundCars;
          if (needed <= 0) continue;

          const candidates = [];
          for (const h of this.houses) {
            if (h.key !== factory.key || h.cooldown > 0) continue;
            const freeCar = h.cars.find(c => c.state === "home");
            if (!freeCar) continue;
            const r = this.route(h.tile, factory.entrance, factory);
            if (r && r.length >= 2) {
              candidates.push({ house: h, car: freeCar, route: r });
            }
          }
          candidates.sort((a, b) => a.route.length - b.route.length);
          if (candidates.length > 0) {
            const { house, car, route } = candidates[0];
            car.state = "outbound";
            car.route = route;
            car.u = 0;
            car.speed = 0.16;
            car.targetFactory = factory;
            car.pathDirty = true;
            car.trail = [];
            house.cooldown = 0.9;
          }
        }
      }

      for (const h of this.houses) {
        h.cooldown = Math.max(0, h.cooldown - seconds);

        // True dt-independent exponential smoothing for house driveway ("door") angle & extension
        const wantExtend = h.drivewayTarget !== null ? 1 : 0;
        const doorAlpha = 1 - Math.exp(-16 * seconds);
        h.doorExtend += (wantExtend - h.doorExtend) * doorAlpha;
        if (h.drivewayTarget !== null) {
          const { x: tx, y: ty } = point(h.drivewayTarget);
          const targetAngle = Math.atan2(ty - h.y, tx - h.x);
          let diff = targetAngle - h.doorAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          h.doorAngle += diff * (1 - Math.exp(-18 * seconds));
        }

        for (const car of h.cars) {
          if (car.state === "home" || !car.route) continue;

          // Smooth circular U-turn loop inside the destination parking lot (zero 180-degree snap!)
          if (car.state === "turning") {
            car.turnU = (car.turnU || 0) + seconds * 2.4;
            if (car.turnU >= 1) {
              car.state = "inbound";
              car.route = [...car.route].reverse();
              car.u = 0;
              car.speed = 0.25;
              car.targetFactory = null;
              car.pathDirty = true;
            }
            continue;
          }

          const routeTiles = Math.max(1, car.route.length - 1);
          const curIdx = Math.min(car.route.length - 1, Math.max(0, Math.floor(car.u * routeTiles)));
          const curTile = car.route[curIdx];
          this.tileTraffic.set(curTile, Math.min(4.5, (this.tileTraffic.get(curTile) || 0) + seconds * 2.1));

          car.boostTimer = Math.max(0, (car.boostTimer || 0) - seconds);
          if (this.boosts.has(curTile) && car.boostTimer < 0.85) {
            car.boostTimer = 1.65;
            this.justBoosted = true;
            this.pulses.push({ tile: curTile, key: "mint", born: performance.now(), duration: 380 });
          }
          if (this.hubs.has(curTile) && !car.overcharged) {
            car.overcharged = true;
            this.justCharged = true;
            this.pulses.push({ tile: curTile, key: "amber", born: performance.now(), duration: 420 });
          }

          const cruiseRate = 3.5 / routeTiles;
          const turnBrake = car.turningFactor || 1;
          const edgeSlowdown = Math.min(
            1,
            Math.min(car.u * routeTiles * 2.0 + 0.32, (1 - car.u) * routeTiles * 2.0 + 0.32)
          );
          const boostMult = car.boostTimer > 0 ? 1.85 : 1;
          const hubMult = car.overcharged ? 1.32 : 1;
          const surgeMult = this.surgeTimer > 0 ? 1.42 : 1;
          const targetRate = cruiseRate * edgeSlowdown * turnBrake * boostMult * hubMult * surgeMult;
          car.speed += (targetRate - car.speed) * (1 - Math.exp(-12 * seconds));
          car.u += seconds * car.speed;

          if (car.u >= 1) {
            if (car.state === "outbound") {
              const fac = car.targetFactory;
              const clearCount = car.overcharged ? 2 : 1;
              if (fac && fac.pins > 0) {
                const toClear = Math.min(fac.pins, clearCount);
                for (let c = 0; c < toClear; c++) {
                  fac.pins--;
                  const livePin = fac.pinItems?.findLast?.(p => p.state === "live") || fac.pinItems?.find(p => p.state === "live");
                  if (livePin) {
                    livePin.state = "popping";
                    livePin.scale = 1.25;
                  }
                }
              }
              if (fac) fac.bounceVel += car.overcharged ? 2.25 : 1.65;
              this.flowStreak++;
              this.flowMultiplier =
                this.flowStreak >= 30 ? 4 : this.flowStreak >= 18 ? 3 : this.flowStreak >= 8 ? 2 : 1;
              const pts = clearCount * this.flowMultiplier;
              this.score += pts;
              const deliverTile = fac ? fac.entrance : car.route[car.route.length - 1];
              const nowMs = performance.now();
              this.popups.push({
                tile: deliverTile,
                text: (car.overcharged ? "⚡+" : "+") + pts,
                key: car.overcharged ? "amber" : h.key,
                born: nowMs,
                duration: 860,
                gold: Boolean(car.overcharged),
              });
              if (this.flowStreak > 0 && this.flowStreak % 12 === 0) {
                this.surgeTimer = 3.5;
                this.surgeWave = { born: nowMs, tile: deliverTile };
                this.justSurged = true;
                this.popups.push({
                  tile: deliverTile,
                  text: "FLOW SURGE",
                  key: "mint",
                  born: nowMs,
                  duration: 1200,
                  surge: true,
                });
              }
              this.pulses.push({
                tile: deliverTile,
                key: car.overcharged ? "amber" : h.key,
                born: nowMs,
                duration: 460,
                deliver: true,
              });
              car.state = "turning";
              car.turnU = 0;
              car.u = 1;
            } else {
              car.state = "home";
              car.route = null;
              car.u = 0;
              car.speed = 0;
              car.boostTimer = 0;
              car.overcharged = false;
              car.trail = [];
              car.renderAngle = undefined;
            }
          }
        }
      }

      // Keep lane summary updated without running expensive BFS every frame
      for (const lane of this.lanes || []) {
        let totalPins = 0;
        for (const f of this.factories) {
          if (f.key === lane.key) totalPins += f.pins;
        }
        lane.backlog = totalPins;
        lane.displayBacklog = totalPins;
      }
    }
  }

  globalThis.FactorySim = {
    Run,
    districts,
    colors,
    columns,
    rows,
    index,
    point,
    neighbors,
    neighbors8,
    edgeKey,
    sampleSpline,
  };
})();
