const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');

const SURFACES = ['hard', 'clay', 'grass'];
const ERA_ORDER = ['70s', '80s', '90s', '2000s', '2010s'];
const MATCHES_PER_PAIRING_FAST = 35;
const MATCHES_PER_PAIRING_FINAL = 100;
const BEST_OF = 3;
const USE_TIEBREAK = true;
const MIN_REAL_MATCHES = 20;
const SEED = 123456789;

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMath(seed) {
  const math = Object.create(Math);
  math.random = mulberry32(seed);
  return math;
}

function loadResultsDb() {
  const context = { console };
  context.globalThis = context;
  const code = fs.readFileSync(RESULTS_PATH, 'utf8') + '\n;globalThis.__RESULTS_DB__ = RESULTS_DB;';
  vm.runInNewContext(code, context, { filename: 'results_db.js' });
  return context.__RESULTS_DB__;
}

function loadSimulator(seed) {
  const context = {
    console,
    Math: makeMath(seed),
    setTimeout,
    clearTimeout,
    window: {},
    document: {}
  };
  context.globalThis = context;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8') + '\n;globalThis.__PLAYERS__ = PLAYERS;';
  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8') + '\n;globalThis.__SIM_MATCH__ = simMatch;';

  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });

  return {
    players: context.__PLAYERS__,
    simMatch: context.__SIM_MATCH__
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getEraKey(player) {
  const start = parseInt(String(player.era).split('-')[0], 10);
  if (start >= 2010) return '2010s';
  if (start >= 2000) return '2000s';
  if (start >= 1990) return '90s';
  if (start >= 1980) return '80s';
  return '70s';
}

function buildPlayerBuckets(players) {
  const eras = new Map();
  for (const player of players) {
    const eraKey = getEraKey(player);
    if (!eras.has(eraKey)) eras.set(eraKey, []);
    eras.get(eraKey).push(player);
  }
  return eras;
}

function initRealTable(players) {
  const table = new Map();
  for (const player of players) {
    table.set(player.id, {
      id: player.id,
      name: player.name,
      wins: 0,
      losses: 0,
      matches: 0,
      winPct: null
    });
  }
  return table;
}

function buildRealStats(resultsDb, players) {
  const playerIds = new Set(players.map((player) => player.id));
  const table = initRealTable(players);

  for (const match of resultsDb.matches) {
    const [winnerId, loserId, surfaceCode] = match;
    if (!surfaceCode) continue;
    if (!playerIds.has(winnerId) || !playerIds.has(loserId)) continue;
    table.get(winnerId).wins += 1;
    table.get(winnerId).matches += 1;
    table.get(loserId).losses += 1;
    table.get(loserId).matches += 1;
  }

  return Array.from(table.values()).map((row) => ({
    ...row,
    winPct: row.matches ? row.wins / row.matches : null
  }));
}

function simulateEra(players, simMatch, matchesPerPairing) {
  const rows = new Map();
  for (const player of players) {
    rows.set(player.id, {
      id: player.id,
      name: player.name,
      wins: 0,
      losses: 0,
      matches: 0
    });
  }

  for (const surface of SURFACES) {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        for (let m = 0; m < matchesPerPairing; m++) {
          const result = simMatch(p1, p2, surface, BEST_OF, USE_TIEBREAK);
          rows.get(result.winner.id).wins += 1;
          rows.get(result.winner.id).matches += 1;
          rows.get(result.loser.id).losses += 1;
          rows.get(result.loser.id).matches += 1;
        }
      }
    }
  }

  return Array.from(rows.values()).map((row) => ({
    ...row,
    winPct: row.matches ? row.wins / row.matches : 0
  }));
}

function collectActualDeltas(players, simMatch, resultsDb, matchesPerPairing) {
  const eraBuckets = buildPlayerBuckets(players);
  const deltas = [];

  for (const eraKey of ERA_ORDER) {
    if (!eraBuckets.has(eraKey)) continue;
    const eraPlayers = eraBuckets.get(eraKey);
    const simRows = simulateEra(eraPlayers, simMatch, matchesPerPairing);
    const realRows = buildRealStats(resultsDb, eraPlayers);
    const realById = new Map(realRows.map((row) => [row.id, row]));

    for (const simRow of simRows) {
      const realRow = realById.get(simRow.id);
      deltas.push({
        id: simRow.id,
        name: simRow.name,
        era: eraKey,
        simPct: simRow.winPct,
        realPct: realRow.winPct,
        realMatches: realRow.matches,
        deltaPctPoints: realRow.winPct === null ? null : (simRow.winPct - realRow.winPct) * 100
      });
    }
  }

  return deltas;
}

function isInflatedSpecialist(player, baselineDelta) {
  const s = player.stats;
  return (
    baselineDelta &&
    baselineDelta.realMatches >= MIN_REAL_MATCHES &&
    baselineDelta.deltaPctPoints > 10 &&
    (
      (s.serve1pct || 0) >= 0.625 ||
      (s.win1st || 0) >= 0.78 ||
      (s.rally_short || 0) >= 43 ||
      (s.winners || 0) >= 42 ||
      /Serve/.test(player.style)
    )
  );
}

function summarize(proposalName, players, baselineMap, deltas, adjustedIds) {
  const byId = new Map(deltas.map((row) => [row.id, row]));
  let count = 0;
  let mae = 0;
  let bias = 0;
  let over10 = 0;
  let improved = 0;
  let worsened = 0;
  const movements = [];
  const specialists = [];

  for (const player of players) {
    const current = byId.get(player.id);
    const baseline = baselineMap.get(player.id);
    if (!current || !baseline) continue;
    if (current.realMatches < MIN_REAL_MATCHES || baseline.realMatches < MIN_REAL_MATCHES) continue;

    const absBase = Math.abs(baseline.deltaPctPoints);
    const absCur = Math.abs(current.deltaPctPoints);
    count += 1;
    mae += absCur;
    bias += current.deltaPctPoints;
    if (absCur > 10) over10 += 1;
    if (absCur < absBase) improved += 1;
    if (absCur > absBase) worsened += 1;

    movements.push({
      id: player.id,
      name: player.name,
      era: current.era,
      adjusted: adjustedIds.has(player.id),
      baseline: baseline.deltaPctPoints,
      current: current.deltaPctPoints,
      gain: absBase - absCur,
      realMatches: current.realMatches
    });

    if (isInflatedSpecialist(player, baseline)) {
      specialists.push({
        name: player.name,
        baseline: baseline.deltaPctPoints,
        current: current.deltaPctPoints,
        gain: absBase - absCur,
        realMatches: current.realMatches
      });
    }
  }

  movements.sort((a, b) => b.gain - a.gain || b.realMatches - a.realMatches);
  specialists.sort((a, b) => b.gain - a.gain || b.realMatches - a.realMatches);

  const worst = movements.slice().sort((a, b) => a.gain - b.gain || b.realMatches - a.realMatches).slice(0, 8);

  return {
    proposalName,
    adjustedCount: adjustedIds.size,
    sampleCount: count,
    mae: mae / count,
    bias: bias / count,
    over10,
    improved,
    worsened,
    topImprovements: movements.slice(0, 10),
    topWorsenings: worst,
    specialists: specialists.slice(0, 12)
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rebalanceRally(stats, shortDelta, longDelta) {
  stats.rally_short = clamp(stats.rally_short + shortDelta, 25, 60);
  stats.rally_long = clamp(stats.rally_long + longDelta, 10, 45);
  const total = stats.rally_short + stats.rally_mid + stats.rally_long;
  const desiredMid = 100 - stats.rally_short - stats.rally_long;
  if (desiredMid > 0) {
    stats.rally_mid = desiredMid;
  } else {
    stats.rally_mid = clamp(stats.rally_mid, 15, 55);
    const sum = stats.rally_short + stats.rally_mid + stats.rally_long;
    const scale = 100 / sum;
    stats.rally_short = +(stats.rally_short * scale).toFixed(1);
    stats.rally_mid = +(stats.rally_mid * scale).toFixed(1);
    stats.rally_long = +(stats.rally_long * scale).toFixed(1);
  }
}

const PROPOSALS = [
  {
    name: 'P1_core_first_strike',
    description: 'Recorta base de saque y sesgo de grass en first-strike specialists claros.',
    matchesPerPairing: MATCHES_PER_PAIRING_FAST,
    predicate(player) {
      const s = player.stats;
      return (
        (s.serve1pct || 0) >= 0.63 &&
        (s.win1st || 0) >= 0.78 &&
        (s.rally_short || 0) >= 43 &&
        (s.returnWin || 0) <= 0.41
      );
    },
    apply(player) {
      const s = player.stats;
      s.win1st = clamp(s.win1st - 0.01, 0.65, 0.90);
      s.win2nd = clamp(s.win2nd - 0.01, 0.42, 0.70);
      s.surface.grass = clamp(s.surface.grass - 0.03, 0.85, 1.20);
      rebalanceRally(s, -2, +2);
    }
  },
  {
    name: 'P2_serve_core_only',
    description: 'Baja solo win1st/win2nd en perfiles de saque dominante y return flojo.',
    matchesPerPairing: MATCHES_PER_PAIRING_FAST,
    predicate(player) {
      const s = player.stats;
      return (
        (s.serve1pct || 0) >= 0.625 &&
        (s.win1st || 0) >= 0.775 &&
        (s.win2nd || 0) >= 0.555 &&
        (s.returnWin || 0) <= 0.415
      );
    },
    apply(player) {
      const s = player.stats;
      s.win1st = clamp(s.win1st - 0.012, 0.65, 0.90);
      s.win2nd = clamp(s.win2nd - 0.012, 0.42, 0.70);
    }
  },
  {
    name: 'P3_short_rally_rebalance',
    description: 'Reequilibra short-rally y superficies rápidas en pegadores dependientes de puntos cortos.',
    matchesPerPairing: MATCHES_PER_PAIRING_FAST,
    predicate(player) {
      const s = player.stats;
      return (
        (s.rally_short || 0) >= 43 &&
        (s.rally_long || 0) <= 25 &&
        (s.returnWin || 0) <= 0.415 &&
        (s.winners || 0) >= 40
      );
    },
    apply(player) {
      const s = player.stats;
      rebalanceRally(s, -3, +2);
      s.surface.grass = clamp(s.surface.grass - 0.02, 0.85, 1.20);
      s.surface.hard = clamp(s.surface.hard - 0.01, 0.85, 1.20);
    }
  },
  {
    name: 'P4_balanced_combo',
    description: 'Ajuste mixto moderado para perfiles muy claros de saque + first strike.',
    matchesPerPairing: MATCHES_PER_PAIRING_FAST,
    predicate(player) {
      const s = player.stats;
      return (
        (s.serve1pct || 0) >= 0.625 &&
        (s.win1st || 0) >= 0.78 &&
        (s.rally_short || 0) >= 43 &&
        (s.returnWin || 0) <= 0.42 &&
        ((s.winners || 0) >= 41 || /Serve/.test(player.style))
      );
    },
    apply(player) {
      const s = player.stats;
      s.win1st = clamp(s.win1st - 0.008, 0.65, 0.90);
      s.win2nd = clamp(s.win2nd - 0.008, 0.42, 0.70);
      rebalanceRally(s, -2, +1);
      s.surface.grass = clamp(s.surface.grass - 0.02, 0.85, 1.20);
    }
  },
  {
    name: 'P5_modern_first_strike',
    description: 'Ajuste mixto centrado en perfiles de saque + primer golpe, evitando S&V clasico.',
    matchesPerPairing: MATCHES_PER_PAIRING_FAST,
    predicate(player) {
      const s = player.stats;
      const style = player.style || '';
      const styleFit = /Serve & Baseline/.test(style) || (/All-court/.test(style) && (s.winners || 0) >= 44);
      return (
        styleFit &&
        (s.serve1pct || 0) >= 0.625 &&
        (s.win1st || 0) >= 0.78 &&
        (s.rally_short || 0) >= 43 &&
        (s.returnWin || 0) <= 0.42
      );
    },
    apply(player) {
      const s = player.stats;
      s.win1st = clamp(s.win1st - 0.009, 0.65, 0.90);
      s.win2nd = clamp(s.win2nd - 0.008, 0.42, 0.70);
      rebalanceRally(s, -2, +1);
      s.surface.grass = clamp(s.surface.grass - 0.02, 0.85, 1.20);
    }
  }
];

function applyProposal(basePlayers, proposal) {
  const players = deepClone(basePlayers);
  const adjustedIds = new Set();
  for (const player of players) {
    if (!proposal.predicate(player)) continue;
    proposal.apply(player);
    adjustedIds.add(player.id);
  }
  return { players, adjustedIds };
}

function evaluateProposal(basePlayers, resultsDb, baselineMap, proposal, seed) {
  const { players, adjustedIds } = applyProposal(basePlayers, proposal);
  const { simMatch } = loadSimulator(seed);
  const deltas = collectActualDeltas(players, simMatch, resultsDb, proposal.matchesPerPairing);
  return summarize(proposal.name, players, baselineMap, deltas, adjustedIds);
}

function makeBaseline(basePlayers, resultsDb) {
  const { simMatch } = loadSimulator(SEED);
  const baselineDeltas = collectActualDeltas(basePlayers, simMatch, resultsDb, MATCHES_PER_PAIRING_FAST);
  return new Map(baselineDeltas.map((row) => [row.id, row]));
}

function rerunFinal(basePlayers, resultsDb, baselineMap, proposalName) {
  const proposal = PROPOSALS.find((item) => item.name === proposalName);
  const finalProposal = { ...proposal, matchesPerPairing: MATCHES_PER_PAIRING_FINAL };
  return evaluateProposal(basePlayers, resultsDb, baselineMap, finalProposal, SEED);
}

function fmt(num) {
  return (num > 0 ? '+' : '') + num.toFixed(2);
}

function printSummary(summary) {
  console.log(`\n=== ${summary.proposalName} ===`);
  console.log(`Adjusted players: ${summary.adjustedCount}`);
  console.log(`Sample players (n>=${MIN_REAL_MATCHES}): ${summary.sampleCount}`);
  console.log(`MAE: ${summary.mae.toFixed(2)} pp`);
  console.log(`Bias medio: ${fmt(summary.bias)} pp`);
  console.log(`|delta| > 10 pp: ${summary.over10}`);
  console.log(`Improved: ${summary.improved} | Worsened: ${summary.worsened}`);
  console.log('Top improvements:');
  for (const row of summary.topImprovements.slice(0, 6)) {
    console.log(`  ${row.name} [${row.era}] ${fmt(row.baseline)} -> ${fmt(row.current)} | gain ${fmt(row.gain)} | adjusted=${row.adjusted}`);
  }
  console.log('Specialists watched:');
  for (const row of summary.specialists.slice(0, 6)) {
    console.log(`  ${row.name} ${fmt(row.baseline)} -> ${fmt(row.current)} | gain ${fmt(row.gain)} | n=${row.realMatches}`);
  }
  console.log('Top worsenings:');
  for (const row of summary.topWorsenings.slice(0, 6)) {
    console.log(`  ${row.name} [${row.era}] ${fmt(row.baseline)} -> ${fmt(row.current)} | gain ${fmt(row.gain)} | adjusted=${row.adjusted}`);
  }
}

function main() {
  const resultsDb = loadResultsDb();
  const { players } = loadSimulator(SEED);
  const basePlayers = deepClone(players);
  const baselineMap = makeBaseline(basePlayers, resultsDb);
  const fastResults = [];

  console.log('Evaluating stat proposals with seeded simulations...');
  for (let i = 0; i < PROPOSALS.length; i++) {
    const proposal = PROPOSALS[i];
    const summary = evaluateProposal(basePlayers, resultsDb, baselineMap, proposal, SEED + i + 1);
    fastResults.push(summary);
    printSummary(summary);
  }

  fastResults.sort((a, b) => a.mae - b.mae || a.over10 - b.over10);
  const best = fastResults[0];
  console.log(`\nBest fast proposal: ${best.proposalName} (MAE ${best.mae.toFixed(2)} pp)`);

  const finalSummary = rerunFinal(basePlayers, resultsDb, baselineMap, best.proposalName);
  console.log('\n=== FINAL RERUN (100 matches per pairing) ===');
  printSummary(finalSummary);
}

main();
