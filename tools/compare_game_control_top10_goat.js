const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESILIENCE_PATH = path.join(ROOT, 'js', 'player_game_resilience.js');
const CONTROL_PATH = path.join(ROOT, 'js', 'player_game_control.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');
const RANKINGS_PATH = path.join(ROOT, 'js', 'rankings_hub_data.js');

const MIN_H2H_MATCHES = 5;
const SIMS_PER_PAIR_SURFACE = 100;
const RESILIENCE_COEF_FIXED = 0.010;
const TEST_COEFS = [0.000, 0.006];
const SEEDS = [11, 29, 47];
const SURFACES = ['hard', 'clay', 'grass'];
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

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function getTop10Goat(rankingsData) {
  return rankingsData.goat.overall.slice(0, 10).map((row) => row.id);
}

function bestOfFromLevel(level) {
  return level === 'Grand Slam' || level === 'Davis Cup' ? 5 : 3;
}

function collectUniverse(resultsDb, top10) {
  const topSet = new Set(top10);
  const groups = new Map();

  for (const match of resultsDb.matches) {
    const [winnerId, loserId, surfaceCode, level] = match;
    if (!topSet.has(winnerId) || !topSet.has(loserId)) continue;
    const surface = Object.keys(SURFACE_CODE).find((key) => SURFACE_CODE[key] === surfaceCode);
    if (!surface) continue;

    const pair = [winnerId, loserId].sort();
    const key = `${pair[0]}|${pair[1]}|${surface}`;
    const row = groups.get(key) || {
      a: pair[0],
      b: pair[1],
      surface,
      matches: []
    };
    row.matches.push({
      winnerId,
      loserId,
      bestOf: bestOfFromLevel(level),
      surface
    });
    groups.set(key, row);
  }

  return [...groups.values()]
    .filter((entry) => entry.matches.length >= MIN_H2H_MATCHES)
    .map((entry) => {
      const aWins = entry.matches.filter((match) => match.winnerId === entry.a).length;
      return {
        ...entry,
        actualMatches: entry.matches.length,
        actualPct: aWins / entry.matches.length
      };
    })
    .sort((a, b) => b.actualMatches - a.actualMatches || a.a.localeCompare(b.a) || a.b.localeCompare(b.b));
}

function collectMissing(top10, eligibleUniverse) {
  const eligibleKeys = new Set(eligibleUniverse.map((entry) => `${entry.a}|${entry.b}|${entry.surface}`));
  const missing = [];
  for (let i = 0; i < top10.length; i += 1) {
    for (let j = i + 1; j < top10.length; j += 1) {
      for (const surface of SURFACES) {
        const pair = [top10[i], top10[j]].sort();
        const key = `${pair[0]}|${pair[1]}|${surface}`;
        if (!eligibleKeys.has(key)) {
          missing.push({ a: pair[0], b: pair[1], surface });
        }
      }
    }
  }
  return missing;
}

function simulateEntry(context, entry) {
  const players = new Map(context.PLAYERS.map((player) => [player.id, player]));
  let aWins = 0;
  for (let i = 0; i < SIMS_PER_PAIR_SURFACE; i += 1) {
    const result = context.__SIM_MATCH__(
      players.get(entry.a),
      players.get(entry.b),
      entry.surface,
      3,
      true
    );
    if (result.winner.id === entry.a) aWins += 1;
  }
  return aWins / SIMS_PER_PAIR_SURFACE;
}

function evaluateCoef(universe, coef) {
  const perSeed = SEEDS.map((seed) => {
    const context = buildContext(coef, seed);
    return universe.map((entry) => {
      const simPct = simulateEntry(context, entry);
      return {
        pair: `${entry.a} vs ${entry.b} on ${entry.surface}`,
        actualMatches: entry.actualMatches,
        actualPct: entry.actualPct,
        simPct,
        absError: Math.abs(simPct - entry.actualPct)
      };
    });
  });

  const perEntry = universe.map((entry, index) => {
    const rows = perSeed.map((seedRows) => seedRows[index]);
    const simPcts = rows.map((row) => row.simPct);
    const errors = rows.map((row) => row.absError);
    return {
      pair: rows[0].pair,
      actualMatches: rows[0].actualMatches,
      actualPct: rows[0].actualPct,
      simPct: average(simPcts),
      simPctStd: stdev(simPcts),
      absError: average(errors)
    };
  });

  const totalMatches = perEntry.reduce((sum, row) => sum + row.actualMatches, 0);
  const weightedError = perEntry.reduce((sum, row) => sum + (row.absError * row.actualMatches), 0) / totalMatches;
  const meanError = average(perEntry.map((row) => row.absError));

  return { coef, weightedError, meanError, perEntry };
}

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function main() {
  const rankingsData = loadExpression(RANKINGS_PATH, 'window.RANKINGS_HUB_DATA');
  const resultsDb = loadExpression(RESULTS_PATH, 'RESULTS_DB');
  const top10 = getTop10Goat(rankingsData);
  const universe = collectUniverse(resultsDb, top10);
  const missing = collectMissing(top10, universe);
  const evaluations = TEST_COEFS.map((coef) => evaluateCoef(universe, coef));
  const base = evaluations.find((row) => row.coef === 0.000);
  const trial = evaluations.find((row) => row.coef === 0.006);

  const deltas = base.perEntry.map((row, index) => {
    const other = trial.perEntry[index];
    return {
      pair: row.pair,
      actualMatches: row.actualMatches,
      actualPct: row.actualPct,
      sim0: row.simPct,
      err0: row.absError,
      sim6: other.simPct,
      err6: other.absError,
      deltaErr: other.absError - row.absError
    };
  });

  const improved = deltas.filter((row) => row.deltaErr < 0).sort((a, b) => a.deltaErr - b.deltaErr);
  const worsened = deltas.filter((row) => row.deltaErr > 0).sort((a, b) => b.deltaErr - a.deltaErr);

  console.log('Top 10 GOAT game-control test');
  console.log(`Top 10: ${top10.join(', ')}`);
  console.log(`Minimum real H2H sample: ${MIN_H2H_MATCHES}`);
  console.log(`Eligible top10 pair-surfaces: ${universe.length}`);
  console.log(`Missing top10 pair-surfaces: ${missing.length}`);
  console.log(`Simulation format: ${SIMS_PER_PAIR_SURFACE} sims per pair-surface, best-of-3, final-set tiebreak`);

  console.log('\nAggregate comparison:');
  for (const row of evaluations) {
    console.log(
      `  coef=${row.coef.toFixed(3)} | weighted error=${formatPct(row.weightedError)} | mean error=${formatPct(row.meanError)}`
    );
  }

  console.log('\nEligible pair-surfaces:');
  for (const entry of universe) {
    console.log(`  ${entry.a} vs ${entry.b} on ${entry.surface}: n=${entry.actualMatches}, actual ${formatPct(entry.actualPct)}`);
  }

  console.log('\nMost improved with coef=0.006:');
  for (const row of improved.slice(0, 10)) {
    console.log(
      `  ${row.pair} | n=${row.actualMatches} | err0=${formatPct(row.err0)} | err6=${formatPct(row.err6)} | delta=${formatPct(row.deltaErr)}`
    );
  }

  console.log('\nMost worsened with coef=0.006:');
  for (const row of worsened.slice(0, 10)) {
    console.log(
      `  ${row.pair} | n=${row.actualMatches} | err0=${formatPct(row.err0)} | err6=${formatPct(row.err6)} | delta=${formatPct(row.deltaErr)}`
    );
  }

  console.log('\nMissing pair-surfaces under min sample:');
  for (const row of missing) {
    console.log(`  ${row.a} vs ${row.b} on ${row.surface}`);
  }
}

main();
