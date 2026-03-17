const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'goat_ranking_v2_data.js');

const MATCHES_PER_PAIRING = 100;
const SURFACES = ['hard', 'clay', 'grass'];
const SURFACE_LABELS = { hard: 'Hard', clay: 'Clay', grass: 'Grass' };
const BEST_OF = 3;
const USE_TIEBREAK = true;
const ERA_ORDER = ['70s', '80s', '90s', '2000s', '2010s'];

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
    prime: player.prime,
    style: player.style,
    gs: player.gs || 0
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

function initSurfaceTable(players) {
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

function buildRealStats(resultsDb, players, eraKey) {
  const playerIds = new Set(players.map((player) => player.id));
  const tables = {
    overall: initRealTable(players),
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

    const overallWinner = tables.overall.get(winnerId);
    const overallLoser = tables.overall.get(loserId);
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

  const ranked = {};
  for (const key of Object.keys(tables)) {
    const rows = Array.from(tables[key].values()).map((row) => {
      if (row.matches > 0) {
        row.winPct = row.wins / row.matches;
        row.ratio = row.losses ? row.wins / row.losses : row.wins;
      }
      row.confidence = getConfidence(row.matches);
      return row;
    });

    rows.sort((a, b) => {
      const aVal = a.winPct === null ? -1 : a.winPct;
      const bVal = b.winPct === null ? -1 : b.winPct;
      return bVal - aVal || b.matches - a.matches || a.name.localeCompare(b.name);
    });
    rows.forEach((row, index) => { row.rank = index + 1; });
    ranked[key] = rows;
  }

  return ranked;
}

function attachRealStats(simRows, realRows) {
  const realById = new Map(realRows.map((row) => [row.id, row]));
  return simRows.map((row) => {
    const real = realById.get(row.id);
    const deltaPctPoints = real && real.winPct !== null
      ? (row.winPct - real.winPct) * 100
      : null;
    return {
      ...row,
      realWins: real.wins,
      realLosses: real.losses,
      realMatches: real.matches,
      realWinPct: real.winPct,
      realRatio: real.ratio,
      realRank: real.rank,
      confidence: real.confidence,
      deltaPctPoints
    };
  });
}

function simulateSurface(players, simMatch, surface) {
  const table = initSurfaceTable(players);

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

function generate() {
  const { players, simMatch } = loadSimulator();
  const resultsDb = loadResultsDb();
  const eraBuckets = buildPlayerBuckets(players);
  const eras = [];

  for (const eraKey of ERA_ORDER) {
    if (!eraBuckets.has(eraKey)) continue;
    const eraPlayersRaw = eraBuckets.get(eraKey);
    const eraPlayers = [...eraPlayersRaw].sort((a, b) => a.name.localeCompare(b.name));
    const surfaceRows = {};

    for (const surface of SURFACES) {
      surfaceRows[surface] = simulateSurface(eraPlayers, simMatch, surface);
    }

    const realRows = buildRealStats(resultsDb, eraPlayers, eraKey);
    const overall = attachRealStats(mergeOverall(eraPlayers, surfaceRows), realRows.overall);
    for (const surface of SURFACES) {
      surfaceRows[surface] = attachRealStats(surfaceRows[surface], realRows[surface]);
    }
    const playerCount = eraPlayers.length;
    const pairingsPerSurface = (playerCount * (playerCount - 1)) / 2;
    const totalMatchesSimulated = pairingsPerSurface * MATCHES_PER_PAIRING * SURFACES.length;

    eras.push({
      key: eraKey,
      label: getEraLabel(eraKey),
      playerCount,
      pairingsPerSurface,
      totalMatchesSimulated,
      overall,
      surfaces: surfaceRows,
      real: realRows
    });
  }

  const totalMatchesSimulated = eras.reduce((sum, era) => sum + era.totalMatchesSimulated, 0);
  const output = {
    meta: {
      title: 'GOAT Ranking v2',
      engine: 'v6',
      fixes: ['A', 'C', 'D', 'F', 'G'],
      matchesPerPairing: MATCHES_PER_PAIRING,
      bestOf: BEST_OF,
      tiebreakFinalSet: USE_TIEBREAK,
      surfaces: SURFACE_LABELS,
      totalPlayers: players.length,
      totalMatchesSimulated,
      generatedAt: new Date().toISOString()
    },
    eras
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    'window.GOAT_RANKING_V2_DATA = ' + JSON.stringify(output) + ';\n',
    'utf8'
  );

  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Players: ${players.length}`);
  console.log(`Matches simulated: ${totalMatchesSimulated.toLocaleString('en-US')}`);
}

generate();
