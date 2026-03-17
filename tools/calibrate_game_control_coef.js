const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESILIENCE_PATH = path.join(ROOT, 'js', 'player_game_resilience.js');
const CONTROL_PATH = path.join(ROOT, 'js', 'player_game_control.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const BASKET_PATH = path.join(ROOT, 'tools', 'calibration_basket_game_control.json');

const MATCHES_PER_REAL_MATCH = 180;
const RESILIENCE_COEF_FIXED = 0.010;
const GRID = [0, 0.003, 0.006, 0.009, 0.012, 0.015, 0.018];
const SEEDS = [11, 29, 47];

const SURFACE_CODE = { hard: 'H', clay: 'C', grass: 'G' };

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

function buildContext(gameControlCoef, seed) {
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
  const resilienceCode = fs.readFileSync(RESILIENCE_PATH, 'utf8');
  const controlCode = fs.readFileSync(CONTROL_PATH, 'utf8');
  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8')
    .replace(/const GAME_RESILIENCE_COEF = [0-9.]+;/, `const GAME_RESILIENCE_COEF = ${RESILIENCE_COEF_FIXED};`)
    .replace(/const GAME_CONTROL_COEF = [0-9.]+;/, `const GAME_CONTROL_COEF = ${gameControlCoef};`)
    + '\n;globalThis.__SIM_MATCH__ = simMatch;';

  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(resilienceCode, context, { filename: 'player_game_resilience.js' });
  vm.runInNewContext(controlCode, context, { filename: 'player_game_control.js' });
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });

  return context;
}

function bestOfFromLevel(level) {
  return level === 'Grand Slam' || level === 'Davis Cup' ? 5 : 3;
}

function collectHistoricalBasket(resultsDb) {
  const basketConfig = JSON.parse(fs.readFileSync(BASKET_PATH, 'utf8'));
  return basketConfig.matchups.map((entry) => {
    const surfaceCode = SURFACE_CODE[entry.surface];
    const matches = resultsDb.matches
      .filter((match) => {
        const [winnerId, loserId, surfCode] = match;
        const samePair =
          (winnerId === entry.a && loserId === entry.b)
          || (winnerId === entry.b && loserId === entry.a);
        return samePair && surfCode === surfaceCode;
      })
      .map((match) => {
        const [winnerId, loserId, surfCode, level] = match;
        return {
          winnerId,
          loserId,
          surface: entry.surface,
          bestOf: bestOfFromLevel(level)
        };
      });

    const aWins = matches.filter((match) => match.winnerId === entry.a).length;
    return {
      ...entry,
      matches,
      actualMatches: matches.length,
      actualPct: matches.length ? aWins / matches.length : null
    };
  }).filter((entry) => entry.actualMatches > 0);
}

function simulateEntry(context, entry) {
  const players = new Map(context.PLAYERS.map((player) => [player.id, player]));
  let aWins = 0;
  let sims = 0;

  for (const match of entry.matches) {
    for (let i = 0; i < MATCHES_PER_REAL_MATCH; i += 1) {
      const result = context.__SIM_MATCH__(
        players.get(entry.a),
        players.get(entry.b),
        match.surface,
        match.bestOf,
        true
      );
      if (result.winner.id === entry.a) aWins += 1;
      sims += 1;
    }
  }

  return sims ? aWins / sims : null;
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

function evaluateGrid(resultsDb) {
  const basket = collectHistoricalBasket(resultsDb);
  const rows = [];

  for (const coef of GRID) {
    const perSeed = SEEDS.map((seed) => {
      const context = buildContext(coef, seed);
      return basket.map((entry) => {
        const simPct = simulateEntry(context, entry);
        const err = simPct == null || entry.actualPct == null ? null : Math.abs(simPct - entry.actualPct);
        return {
          pair: `${entry.a} vs ${entry.b} on ${entry.surface}`,
          actualMatches: entry.actualMatches,
          actualPct: entry.actualPct,
          simPct,
          absError: err
        };
      });
    });

    const perEntry = basket.map((entry, index) => {
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

    const weightedError = perEntry.reduce((sum, row) => sum + (row.absError * row.actualMatches), 0)
      / perEntry.reduce((sum, row) => sum + row.actualMatches, 0);
    const meanError = perEntry.reduce((sum, row) => sum + row.absError, 0) / perEntry.length;
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
      seeds: SEEDS.length,
      perEntry
    });
  }

  rows.sort((a, b) => a.weightedError - b.weightedError || a.meanError - b.meanError);
  return { basket, rows };
}

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function main() {
  const resultsDb = loadExpression(RESULTS_PATH, 'RESULTS_DB');
  const evaluation = evaluateGrid(resultsDb);
  const best = evaluation.rows[0];

  console.log('Game control coefficient calibration');
  console.log(`Basket size: ${evaluation.basket.length} matchups`);
  console.log(`Fixed GAME_RESILIENCE_COEF: ${RESILIENCE_COEF_FIXED.toFixed(3)}`);
  console.log(`Seeds: ${SEEDS.join(', ')}`);
  console.log(`Matches per real match: ${MATCHES_PER_REAL_MATCH}`);
  console.log('Basket:');
  for (const entry of evaluation.basket) {
    console.log(
      `  ${entry.a} vs ${entry.b} on ${entry.surface}: ${entry.actualMatches} real matches, actual ${formatPct(entry.actualPct)}`
    );
  }

  console.log('\nGrid results (sorted by weighted error):');
  for (const row of evaluation.rows) {
    console.log(
      `  coef=${row.coef.toFixed(3)} | weighted error=${formatPct(row.weightedError)} +/- ${formatPct(row.weightedErrorStd)} | mean error=${formatPct(row.meanError)}`
    );
  }

  console.log('\nBest coefficient details:');
  console.log(`  coef=${best.coef.toFixed(3)}`);
  for (const row of best.perEntry) {
    console.log(
      `  ${row.pair} | actual ${formatPct(row.actualPct)} | sim ${formatPct(row.simPct)} +/- ${formatPct(row.simPctStd)} | abs err ${formatPct(row.absError)}`
    );
  }
}

main();
