const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');

const TRIALS = 800;
const BEST_OF = 3;
const USE_TB = true;

function loadJsVar(filePath, varName) {
  const ctx = { console, Math };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__=${varName};`;
  vm.runInNewContext(code, ctx, { filename: path.basename(filePath) });
  return ctx.__OUT__;
}

function buildEngine(config) {
  const context = {
    console,
    Math,
    setTimeout,
    clearTimeout,
    window: {},
    document: {}
  };
  context.globalThis = context;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8') + '\n;globalThis.PLAYERS=PLAYERS;';
  vm.runInNewContext(playersCode, context, { filename: 'players.js' });

  let engineCode = fs.readFileSync(ENGINE_PATH, 'utf8');

  engineCode = engineCode.replace(
    'const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.5\n               + serverShortRallyBonus + netBonus - returnPressure;',
    `const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * ${config.powerWeight}
               + serverShortRallyBonus * ${config.shortWeight} + netBonus - returnPressure;`
  );

  engineCode += '\n;globalThis.simMatch=simMatch;';
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });
  return { simMatch: context.simMatch, players: context.PLAYERS };
}

function realRates(resultsDb, ids) {
  const surfaceMap = { H: 'hard', C: 'clay', G: 'grass' };
  const out = {};
  for (const pair of ids) out[pair.join('|')] = { overall: { w: 0, l: 0 } };

  for (const match of resultsDb.matches) {
    const [winner, loser] = match;
    for (const [a, b] of ids) {
      if ((winner === a && loser === b) || (winner === b && loser === a)) {
        const key = `${a}|${b}`;
        const won = winner === a;
        out[key].overall[won ? 'w' : 'l'] += 1;
      }
    }
  }
  return out;
}

function pct(w, l) {
  const n = w + l;
  return n ? w / n : null;
}

function simulatePair(engine, p1, p2, surface, trials) {
  let wins = 0;
  for (let i = 0; i < trials; i++) {
    const result = engine.simMatch(p1, p2, surface, BEST_OF, USE_TB);
    if (result.winner.id === p1.id) wins += 1;
  }
  return wins / trials;
}

function simulateSeries(engine, pairIds, trials) {
  const players = new Map(engine.players.map((player) => [player.id, player]));
  const out = [];
  for (const [a, b, label] of pairIds) {
    const p1 = players.get(a);
    const p2 = players.get(b);
    const hard = simulatePair(engine, p1, p2, 'hard', trials);
    const clay = simulatePair(engine, p1, p2, 'clay', trials);
    const grass = simulatePair(engine, p1, p2, 'grass', trials);
    out.push({ a, b, label, overall: (hard + clay + grass) / 3 });
  }
  return out;
}

function formatPct(value) {
  return value === null ? '--' : (value * 100).toFixed(1) + '%';
}

function main() {
  const resultsDb = loadJsVar(RESULTS_PATH, 'RESULTS_DB');

  const pairs = [
    ['martin_del_potro', 'federer', 'Del Potro vs Federer'],
    ['martin_del_potro', 'djokovic', 'Del Potro vs Djokovic'],
    ['martin_del_potro', 'nadal', 'Del Potro vs Nadal'],
    ['martin_del_potro', 'murray', 'Del Potro vs Murray'],
    ['martin_del_potro', 'ferrer', 'Del Potro vs Ferrer'],
    ['berrettini', 'alcaraz', 'Berrettini vs Alcaraz'],
    ['berrettini', 'medvedev', 'Berrettini vs Medvedev'],
    ['berrettini', 'rublev', 'Berrettini vs Rublev'],
    ['cilic', 'djokovic', 'Cilic vs Djokovic'],
    ['cilic', 'nadal', 'Cilic vs Nadal'],
    ['cilic', 'murray', 'Cilic vs Murray'],
    ['raonic', 'djokovic', 'Raonic vs Djokovic'],
    ['tsonga', 'djokovic', 'Tsonga vs Djokovic'],
    ['federer', 'roddick', 'Guardrail Federer vs Roddick'],
    ['federer', 'wawrinka', 'Guardrail Federer vs Wawrinka'],
    ['sampras', 'agassi', 'Guardrail Sampras vs Agassi'],
    ['murray', 'ferrer', 'Guardrail Murray vs Ferrer']
  ];

  const real = realRates(resultsDb, pairs.map(([a, b]) => [a, b]));
  const configs = [
    { label: 'baseline', powerWeight: 0.5, shortWeight: 1.0 },
    { label: 'J1', powerWeight: 0.25, shortWeight: 1.0 },
    { label: 'J2', powerWeight: 0.5, shortWeight: 0.35 },
    { label: 'J3', powerWeight: 0.25, shortWeight: 0.35 }
  ];

  for (const config of configs) {
    const engine = buildEngine(config);
    const sims = simulateSeries(engine, pairs, TRIALS);
    let totalAbsError = 0;

    console.log(`\n=== FIX ${config.label} power=${config.powerWeight} short=${config.shortWeight} ===`);
    for (const row of sims) {
      const actual = real[`${row.a}|${row.b}`];
      const realOverall = pct(actual.overall.w, actual.overall.l);
      const delta = realOverall === null ? null : (row.overall - realOverall) * 100;
      if (delta !== null) totalAbsError += Math.abs(delta);
      console.log(
        `${row.label}: real ${formatPct(realOverall)} | sim ${formatPct(row.overall)} | delta ${delta === null ? '--' : (delta > 0 ? '+' : '') + delta.toFixed(1) + 'pp'}`
      );
    }
    console.log(`Total abs error on basket: ${totalAbsError.toFixed(1)} pp`);
  }
}

main();
