const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESILIENCE_PATH = path.join(ROOT, 'js', 'player_game_resilience.js');
const CONTROL_PATH = path.join(ROOT, 'js', 'player_game_control.js');
const SET_CONTROL_PATH = path.join(ROOT, 'js', 'player_set_control_surface.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const RANKINGS_PATH = path.join(ROOT, 'js', 'rankings_hub_data.js');

const MIN_H2H_MATCHES = 5;
const MATCHES_PER_PAIRING = 140;
const SURFACE = 'hard';
const SURFACE_CODE = 'H';
const SEEDS = [11, 29, 47];
const GRID = [0, 0.004, 0.007, 0.010, 0.013, 0.016, 0.020];

function loadExpression(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function createSeededMath(seed) {
  let state = seed >>> 0;
  const seededMath = Object.create(Math);
  seededMath.random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return seededMath;
}

function buildContext(setCloseCoef, seed) {
  const context = {
    console,
    window: {},
    document: {},
    Math: createSeededMath(seed),
    setTimeout,
    clearTimeout
  };
  context.globalThis = context;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8') + '\n;globalThis.PLAYERS = PLAYERS;';
  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(fs.readFileSync(RESILIENCE_PATH, 'utf8'), context, { filename: 'player_game_resilience.js' });
  vm.runInNewContext(fs.readFileSync(CONTROL_PATH, 'utf8'), context, { filename: 'player_game_control.js' });
  vm.runInNewContext(fs.readFileSync(SET_CONTROL_PATH, 'utf8'), context, { filename: 'player_set_control_surface.js' });

  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8')
    .replace(/const SET_CLOSE_HARD_COEF = [0-9.]+;/, `const SET_CLOSE_HARD_COEF = ${setCloseCoef};`)
    + '\n;globalThis.__SIM_MATCH__ = simMatch;';
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });

  return context;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function collectUniverse(resultsDb, top10) {
  const topSet = new Set(top10);
  const groups = new Map();

  for (const match of resultsDb.matches) {
    const [winnerId, loserId, surfaceCode] = match;
    if (surfaceCode !== SURFACE_CODE) continue;
    if (!topSet.has(winnerId) || !topSet.has(loserId)) continue;
    const pair = [winnerId, loserId].sort();
    const key = `${pair[0]}|${pair[1]}`;
    const row = groups.get(key) || { a: pair[0], b: pair[1], matches: 0, aWins: 0 };
    row.matches += 1;
    if (winnerId === pair[0]) row.aWins += 1;
    groups.set(key, row);
  }

  return [...groups.values()]
    .filter((row) => row.matches >= MIN_H2H_MATCHES)
    .map((row) => ({
      ...row,
      surface: SURFACE,
      actualPct: row.aWins / row.matches
    }))
    .sort((a, b) => b.matches - a.matches || a.a.localeCompare(b.a) || a.b.localeCompare(b.b));
}

function simulateEntry(context, entry) {
  const players = new Map(context.PLAYERS.map((player) => [player.id, player]));
  let aWins = 0;
  for (let i = 0; i < MATCHES_PER_PAIRING; i += 1) {
    const result = context.__SIM_MATCH__(
      players.get(entry.a),
      players.get(entry.b),
      SURFACE,
      3,
      true
    );
    if (result.winner.id === entry.a) aWins += 1;
  }
  return aWins / MATCHES_PER_PAIRING;
}

function evaluateGrid(universe) {
  const rows = [];

  for (const coef of GRID) {
    const perSeed = SEEDS.map((seed) => {
      const context = buildContext(coef, seed);
      return universe.map((entry) => {
        const simPct = simulateEntry(context, entry);
        return {
          pair: `${entry.a} vs ${entry.b}`,
          actualMatches: entry.matches,
          actualPct: entry.actualPct,
          simPct,
          absError: Math.abs(simPct - entry.actualPct)
        };
      });
    });

    const perEntry = universe.map((entry, index) => {
      const seedRows = perSeed.map((rowsForSeed) => rowsForSeed[index]);
      const simPcts = seedRows.map((row) => row.simPct);
      const errors = seedRows.map((row) => row.absError);
      return {
        pair: seedRows[0].pair,
        actualMatches: seedRows[0].actualMatches,
        actualPct: seedRows[0].actualPct,
        simPct: average(simPcts),
        simPctStd: stdev(simPcts),
        absError: average(errors)
      };
    });

    const totalMatches = perEntry.reduce((sum, row) => sum + row.actualMatches, 0);
    const weightedError = perEntry.reduce((sum, row) => sum + (row.absError * row.actualMatches), 0) / totalMatches;
    const meanError = average(perEntry.map((row) => row.absError));
    const weightedErrorStd = stdev(
      perSeed.map((seedRows) => {
        return seedRows.reduce((sum, row) => sum + (row.absError * row.actualMatches), 0)
          / seedRows.reduce((sum, row) => sum + row.actualMatches, 0);
      })
    );

    rows.push({
      coef,
      weightedError,
      weightedErrorStd,
      meanError,
      perEntry
    });
  }

  rows.sort((a, b) => a.weightedError - b.weightedError || a.meanError - b.meanError);
  return rows;
}

function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function main() {
  const rankings = loadExpression(RANKINGS_PATH, 'window.RANKINGS_HUB_DATA');
  const resultsDb = loadExpression(RESULTS_PATH, 'RESULTS_DB');
  const top10 = rankings.goat.overall.slice(0, 10).map((row) => row.id);
  const universe = collectUniverse(resultsDb, top10);
  const rows = evaluateGrid(universe);
  const best = rows[0];

  console.log('Set-close hard pilot calibration');
  console.log(`Top10 GOAT: ${top10.join(', ')}`);
  console.log(`Surface: ${SURFACE}`);
  console.log(`Minimum H2H sample: ${MIN_H2H_MATCHES}`);
  console.log(`Eligible matchups: ${universe.length}`);
  console.log(`Seeds: ${SEEDS.join(', ')}`);
  console.log(`Matches per pairing: ${MATCHES_PER_PAIRING}`);

  console.log('\nGrid results (sorted by weighted error):');
  for (const row of rows) {
    console.log(
      `  coef=${row.coef.toFixed(3)} | weighted error=${formatPct(row.weightedError)} +/- ${formatPct(row.weightedErrorStd)} | mean error=${formatPct(row.meanError)}`
    );
  }

  console.log('\nBest coefficient details:');
  console.log(`  coef=${best.coef.toFixed(3)}`);
  for (const row of best.perEntry) {
    console.log(
      `  ${row.pair} | n=${row.actualMatches} | actual ${formatPct(row.actualPct)} | sim ${formatPct(row.simPct)} +/- ${formatPct(row.simPctStd)} | abs err ${formatPct(row.absError)}`
    );
  }
}

main();
