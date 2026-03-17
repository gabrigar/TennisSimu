const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESILIENCE_PATH = path.join(ROOT, 'js', 'player_game_resilience.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const BASKET_PATH = path.join(ROOT, 'tools', 'calibration_basket_game_resilience.json');

const MATCHES_PER_REAL_MATCH = 160;
const GRID = [0, 0.006, 0.010, 0.014, 0.018, 0.022, 0.026, 0.030];

const SURFACE_CODE = { hard: 'H', clay: 'C', grass: 'G' };

function loadExpression(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function buildContext(gameResilienceCoef) {
  const context = {
    console,
    window: {},
    document: {},
    Math,
    setTimeout,
    clearTimeout
  };
  context.globalThis = context;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8') + '\n;globalThis.PLAYERS = PLAYERS;';
  const resilienceCode = fs.readFileSync(RESILIENCE_PATH, 'utf8');
  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8')
    .replace(/const GAME_RESILIENCE_COEF = [0-9.]+;/, `const GAME_RESILIENCE_COEF = ${gameResilienceCoef};`)
    + '\n;globalThis.__SIM_MATCH__ = simMatch;';

  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(resilienceCode, context, { filename: 'player_game_resilience.js' });
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

function evaluateGrid(resultsDb) {
  const basket = collectHistoricalBasket(resultsDb);
  const rows = [];

  for (const coef of GRID) {
    const context = buildContext(coef);
    const perEntry = basket.map((entry) => {
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

    const weightedError = perEntry.reduce((sum, row) => sum + (row.absError * row.actualMatches), 0)
      / perEntry.reduce((sum, row) => sum + row.actualMatches, 0);
    const meanError = perEntry.reduce((sum, row) => sum + row.absError, 0) / perEntry.length;

    rows.push({
      coef,
      weightedError,
      meanError,
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

  console.log('Game resilience coefficient calibration');
  console.log(`Basket size: ${evaluation.basket.length} matchups`);
  console.log('Basket:');
  for (const entry of evaluation.basket) {
    console.log(
      `  ${entry.a} vs ${entry.b} on ${entry.surface}: ${entry.actualMatches} real matches, actual ${formatPct(entry.actualPct)}`
    );
  }

  console.log('\nGrid results (sorted by weighted error):');
  for (const row of evaluation.rows) {
    console.log(
      `  coef=${row.coef.toFixed(3)} | weighted error=${formatPct(row.weightedError)} | mean error=${formatPct(row.meanError)}`
    );
  }

  console.log('\nBest coefficient details:');
  console.log(`  coef=${best.coef.toFixed(3)}`);
  for (const row of best.perEntry) {
    console.log(
      `  ${row.pair} | actual ${formatPct(row.actualPct)} | sim ${formatPct(row.simPct)} | abs err ${formatPct(row.absError)}`
    );
  }
}

main();
