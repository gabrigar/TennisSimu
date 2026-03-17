const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'rankings_hub_data.js');

const MATCHES_PER_PAIRING = 100;
const SURFACES = ['hard', 'clay', 'grass'];
const SURFACE_LABELS = { all: 'All surfaces', hard: 'Hard', clay: 'Clay', grass: 'Grass' };
const BEST_OF = 3;
const USE_TIEBREAK = true;
const ERA_ORDER = ['70s', '80s', '90s', '2000s', '2010s'];
const REAL_WEIGHTS = { gs: 20, masters: 6, m500: 2, win: 1 };
const REAL_SURFACE_WEIGHTS = { slam: 20, win: 1 };

function loadSimulator() {
  const context = {
    console,
    Math,
    setTimeout,
    clearTimeout,
    window: {},
    document: {}
  };
  context.globalThis = context;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8')
    + '\n;globalThis.__PLAYERS__ = PLAYERS;';
  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8')
    + '\n;globalThis.__SIM_MATCH__ = simMatch;';

  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });

  return {
    players: context.__PLAYERS__,
    simMatch: context.__SIM_MATCH__
  };
}

function loadResultsDb() {
  const context = { console };
  context.globalThis = context;
  const code = fs.readFileSync(RESULTS_PATH, 'utf8') + '\n;globalThis.__RESULTS_DB__ = RESULTS_DB;';
  vm.runInNewContext(code, context, { filename: 'results_db.js' });
  return context.__RESULTS_DB__;
}

function getEraKey(player) {
  const start = parseInt(String(player.era).split('-')[0], 10);
  if (start >= 2010) return '2010s';
  if (start >= 2000) return '2000s';
  if (start >= 1990) return '90s';
  if (start >= 1980) return '80s';
  return '70s';
}

function getEraLabel(key) {
  return {
    '70s': '1970s',
    '80s': '1980s',
    '90s': '1990s',
    '2000s': '2000s',
    '2010s': '2010s+'
  }[key] || key;
}

function clonePlayerMeta(player) {
  return {
    id: player.id,
    name: player.name,
    flag: player.countryFlag || '',
    country: player.country,
    era: player.era,
    eraKey: getEraKey(player),
    prime: player.prime,
    style: player.style,
    gs: player.gs || 0,
    masters: player.masters || 0,
    m500: player.m500 || 0,
    gs_ro: player.gs_ro || 0,
    gs_wi: player.gs_wi || 0,
    gs_us: player.gs_us || 0,
    gs_au: player.gs_au || 0
  };
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

function initSimTable(players) {
  const table = new Map();
  for (const player of players) {
    table.set(player.id, {
      ...clonePlayerMeta(player),
      wins: 0,
      losses: 0,
      matches: 0,
      winPct: 0,
      ratio: 0
    });
  }
  return table;
}

function simulateSurface(players, simMatch, surface) {
  const table = initSimTable(players);

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      for (let m = 0; m < MATCHES_PER_PAIRING; m++) {
        const result = simMatch(p1, p2, surface, BEST_OF, USE_TIEBREAK);
        const winner = table.get(result.winner.id);
        const loser = table.get(result.loser.id);
        winner.wins += 1;
        winner.matches += 1;
        loser.losses += 1;
        loser.matches += 1;
      }
    }
  }

  const rows = Array.from(table.values()).map((row) => {
    row.winPct = row.matches ? row.wins / row.matches : 0;
    row.ratio = row.losses ? row.wins / row.losses : row.wins;
    return row;
  });

  rows.sort((a, b) => b.winPct - a.winPct || b.ratio - a.ratio || a.name.localeCompare(b.name));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

function mergeOverall(players, surfaceRows) {
  const byId = new Map();

  for (const player of players) {
    byId.set(player.id, {
      ...clonePlayerMeta(player),
      wins: 0,
      losses: 0,
      matches: 0,
      hardPct: 0,
      clayPct: 0,
      grassPct: 0,
      winPct: 0,
      ratio: 0
    });
  }

  for (const surface of SURFACES) {
    for (const row of surfaceRows[surface]) {
      const item = byId.get(row.id);
      item.wins += row.wins;
      item.losses += row.losses;
      item.matches += row.matches;
      item[`${surface}Pct`] = row.winPct;
    }
  }

  const rows = Array.from(byId.values()).map((row) => {
    row.winPct = row.matches ? row.wins / row.matches : 0;
    row.ratio = row.losses ? row.wins / row.losses : row.wins;
    return row;
  });

  rows.sort((a, b) => b.winPct - a.winPct || b.ratio - a.ratio || a.name.localeCompare(b.name));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

function initRealTable(players) {
  const table = new Map();
  for (const player of players) {
    table.set(player.id, {
      ...clonePlayerMeta(player),
      wins: 0,
      losses: 0,
      matches: 0,
      winPct: null,
      ratio: null,
      titleScore: 0,
      realScore: 0,
      confidence: 'none'
    });
  }
  return table;
}

function getConfidence(matches) {
  if (matches >= 20) return 'high';
  if (matches >= 8) return 'medium';
  if (matches >= 1) return 'low';
  return 'none';
}

function getSurfaceSlamCount(player, surface) {
  if (surface === 'hard') return (player.gs_au || 0) + (player.gs_us || 0);
  if (surface === 'clay') return player.gs_ro || 0;
  if (surface === 'grass') return player.gs_wi || 0;
  return player.gs || 0;
}

function finalizeRealRows(rows, surface) {
  return rows.map((row) => {
    if (row.matches > 0) {
      row.winPct = row.wins / row.matches;
      row.ratio = row.losses ? row.wins / row.losses : row.wins;
    }

    if (surface === 'all') {
      row.titleScore = row.gs * REAL_WEIGHTS.gs + row.masters * REAL_WEIGHTS.masters + row.m500 * REAL_WEIGHTS.m500;
      row.realScore = row.wins * REAL_WEIGHTS.win + row.titleScore;
    } else {
      row.surfaceSlams = getSurfaceSlamCount(row, surface);
      row.titleScore = row.surfaceSlams * REAL_SURFACE_WEIGHTS.slam;
      row.realScore = row.wins * REAL_SURFACE_WEIGHTS.win + row.titleScore;
    }

    row.confidence = getConfidence(row.matches);
    return row;
  }).sort((a, b) => {
    return b.realScore - a.realScore
      || (b.winPct ?? -1) - (a.winPct ?? -1)
      || b.wins - a.wins
      || a.name.localeCompare(b.name);
  }).map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildRealRankings(resultsDb, players) {
  const playerIds = new Set(players.map((player) => player.id));
  const tables = {
    all: initRealTable(players),
    hard: initRealTable(players),
    clay: initRealTable(players),
    grass: initRealTable(players)
  };
  const surfaceMap = { H: 'hard', C: 'clay', G: 'grass' };

  for (const match of resultsDb.matches) {
    const [winnerId, loserId, surfaceCode] = match;
    if (!playerIds.has(winnerId) || !playerIds.has(loserId)) continue;
    const surface = surfaceMap[surfaceCode];
    if (!surface) continue;

    const overallWinner = tables.all.get(winnerId);
    const overallLoser = tables.all.get(loserId);
    overallWinner.wins += 1;
    overallWinner.matches += 1;
    overallLoser.losses += 1;
    overallLoser.matches += 1;

    const surfaceWinner = tables[surface].get(winnerId);
    const surfaceLoser = tables[surface].get(loserId);
    surfaceWinner.wins += 1;
    surfaceWinner.matches += 1;
    surfaceLoser.losses += 1;
    surfaceLoser.matches += 1;
  }

  return {
    overall: finalizeRealRows(Array.from(tables.all.values()), 'all'),
    surfaces: {
      hard: finalizeRealRows(Array.from(tables.hard.values()), 'hard'),
      clay: finalizeRealRows(Array.from(tables.clay.values()), 'clay'),
      grass: finalizeRealRows(Array.from(tables.grass.values()), 'grass')
    }
  };
}

function generate() {
  const { players, simMatch } = loadSimulator();
  const resultsDb = loadResultsDb();
  const eraBuckets = buildPlayerBuckets(players);

  const allPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  const goatSurfaces = {};
  for (const surface of SURFACES) {
    goatSurfaces[surface] = simulateSurface(allPlayers, simMatch, surface);
  }
  const goatOverall = mergeOverall(allPlayers, goatSurfaces);
  const goatPairingsPerSurface = (allPlayers.length * (allPlayers.length - 1)) / 2;
  const goatMatches = goatPairingsPerSurface * MATCHES_PER_PAIRING * SURFACES.length;

  const eras = [];
  for (const eraKey of ERA_ORDER) {
    if (!eraBuckets.has(eraKey)) continue;
    const eraPlayers = [...eraBuckets.get(eraKey)].sort((a, b) => a.name.localeCompare(b.name));
    const surfaceRows = {};
    for (const surface of SURFACES) {
      surfaceRows[surface] = simulateSurface(eraPlayers, simMatch, surface);
    }
    const overall = mergeOverall(eraPlayers, surfaceRows);
    const real = buildRealRankings(resultsDb, eraPlayers);
    const pairingsPerSurface = (eraPlayers.length * (eraPlayers.length - 1)) / 2;
    eras.push({
      key: eraKey,
      label: getEraLabel(eraKey),
      playerCount: eraPlayers.length,
      pairingsPerSurface,
      totalMatchesSimulated: pairingsPerSurface * MATCHES_PER_PAIRING * SURFACES.length,
      simulated: {
        overall,
        surfaces: surfaceRows
      },
      real
    });
  }

  const output = {
    meta: {
      title: 'Rankings Hub',
      engine: 'v7',
      matchesPerPairing: MATCHES_PER_PAIRING,
      bestOf: BEST_OF,
      tiebreakFinalSet: USE_TIEBREAK,
      surfaces: SURFACE_LABELS,
      totalPlayers: players.length,
      goatMatchesSimulated: goatMatches,
      eraMatchesSimulated: eras.reduce((sum, era) => sum + era.totalMatchesSimulated, 0),
      generatedAt: new Date().toISOString(),
      realWeights: REAL_WEIGHTS,
      realSurfaceWeights: REAL_SURFACE_WEIGHTS
    },
    goat: {
      playerCount: allPlayers.length,
      pairingsPerSurface: goatPairingsPerSurface,
      totalMatchesSimulated: goatMatches,
      overall: goatOverall,
      surfaces: goatSurfaces
    },
    real: buildRealRankings(resultsDb, allPlayers),
    eras
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    'window.RANKINGS_HUB_DATA = ' + JSON.stringify(output) + ';\n',
    'utf8'
  );

  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`GOAT matches simulated: ${goatMatches.toLocaleString('en-US')}`);
  console.log(`Era matches simulated: ${output.meta.eraMatchesSimulated.toLocaleString('en-US')}`);
}

generate();
