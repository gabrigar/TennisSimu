const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');

const TRIALS = 700;
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

  const helperCode = `
const FIX_K_MATCH_SIGMA = ${config.matchSigma};
const FIX_K_SET_SIGMA   = ${config.setSigma};
const FIX_K_VOL_SCALE   = ${config.volScale};

function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function getServeVolatility(player) {
  const s = player.stats || player;
  const pace = Math.max(0, ((s.serve_kmh || 205) - 215) / 30);
  const errors = Math.max(0, ((s.errors || 22) - 23) / 10);
  const shortBias = Math.max(0, ((s.rally_short || 38) - 40) / 10);
  const lowReturn = Math.max(0, (0.42 - (s.returnWin || 0.42)) / 0.08);
  const netStability = Math.max(0, ((player.net_win || 0.65) - 0.68) / 0.08);
  const raw = 0.55 * pace + 0.65 * errors + 0.45 * shortBias + 0.35 * lowReturn - 0.30 * netStability;
  return Math.max(0, raw) * FIX_K_VOL_SCALE;
}

function getMatchServeShock(player) {
  if (!globalThis.__FIXK_MATCH__) globalThis.__FIXK_MATCH__ = Object.create(null);
  const bag = globalThis.__FIXK_MATCH__;
  if (bag[player.id] === undefined) {
    bag[player.id] = randomNormal() * FIX_K_MATCH_SIGMA * getServeVolatility(player);
  }
  return bag[player.id];
}

function getSetServeShock(player) {
  if (!globalThis.__FIXK_SET__) globalThis.__FIXK_SET__ = Object.create(null);
  const bag = globalThis.__FIXK_SET__;
  const key = player.id + '|' + (globalThis.__FIXK_SET_INDEX__ || 0);
  if (bag[key] === undefined) {
    bag[key] = randomNormal() * FIX_K_SET_SIGMA * getServeVolatility(player);
  }
  return bag[key];
}

function resetFixKMatch() {
  globalThis.__FIXK_MATCH__ = Object.create(null);
  globalThis.__FIXK_SET__ = Object.create(null);
  globalThis.__FIXK_SET_INDEX__ = 0;
}
`;

  engineCode = engineCode.replace(
    'function calcWinProbServe(server, returner, surface) {',
    helperCode + '\nfunction calcWinProbServe(server, returner, surface) {'
  );

  engineCode = engineCode.replace(
    `  // Efectividad real al saque (datos ATP)
  const baseServe = sS.serve1pct * sS.win1st + (1 - sS.serve1pct) * sS.win2nd;`,
    `  // Efectividad real al saque (datos ATP)
  const matchShock = getMatchServeShock(server);
  const setShock = getSetServeShock(server);
  const effServe1pct = clamp(sS.serve1pct + 0.35 * matchShock + 0.20 * setShock, 0.50, 0.72);
  const effWin1st = clamp(sS.win1st + 1.00 * matchShock + 0.55 * setShock, 0.64, 0.90);
  const effWin2nd = clamp(sS.win2nd + 0.70 * matchShock + 0.40 * setShock, 0.44, 0.68);
  const baseServe = effServe1pct * effWin1st + (1 - effServe1pct) * effWin2nd;`
  );

  engineCode = engineCode.replace(
    `function simMatch(p1, p2, surface, bestOf, useTb) {
  const setsNeeded = Math.ceil(bestOf / 2);`,
    `function simMatch(p1, p2, surface, bestOf, useTb) {
  resetFixKMatch();
  const setsNeeded = Math.ceil(bestOf / 2);`
  );

  engineCode = engineCode.replace(
    `  while (sets[0] < setsNeeded && sets[1] < setsNeeded) {
    const setNum  = sets[0] + sets[1];
    const isFinal = setNum === bestOf - 1;`,
    `  while (sets[0] < setsNeeded && sets[1] < setsNeeded) {
    const setNum  = sets[0] + sets[1];
    globalThis.__FIXK_SET_INDEX__ = setNum;
    const isFinal = setNum === bestOf - 1;`
  );

  engineCode += '\n;globalThis.simMatch=simMatch;';
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });
  return { context, simMatch: context.simMatch, players: context.PLAYERS };
}

function realRates(resultsDb, ids) {
  const surfaceMap = { H: 'hard', C: 'clay', G: 'grass' };
  const out = {};
  for (const pair of ids) out[pair.join('|')] = { overall: { w: 0, l: 0 }, hard: { w: 0, l: 0 }, clay: { w: 0, l: 0 }, grass: { w: 0, l: 0 } };

  for (const match of resultsDb.matches) {
    const [winner, loser, surfCode] = match;
    const surface = surfaceMap[surfCode];
    for (const [a, b] of ids) {
      if ((winner === a && loser === b) || (winner === b && loser === a)) {
        const key = `${a}|${b}`;
        const won = winner === a;
        out[key].overall[won ? 'w' : 'l'] += 1;
        out[key][surface][won ? 'w' : 'l'] += 1;
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
    out.push({ a, b, label, hard, clay, grass, overall: (hard + clay + grass) / 3 });
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
    ['kyrgios', 'djokovic', 'Kyrgios vs Djokovic'],
    ['kyrgios', 'nadal', 'Kyrgios vs Nadal'],
    ['federer', 'roddick', 'Guardrail Federer vs Roddick'],
    ['federer', 'wawrinka', 'Guardrail Federer vs Wawrinka'],
    ['sampras', 'agassi', 'Guardrail Sampras vs Agassi'],
    ['murray', 'ferrer', 'Guardrail Murray vs Ferrer']
  ];

  const real = realRates(resultsDb, pairs.map(([a, b]) => [a, b]));
  const candidates = [
    { matchSigma: 0.000, setSigma: 0.000, volScale: 1.0, label: 'baseline' },
    { matchSigma: 0.010, setSigma: 0.006, volScale: 1.0, label: 'k1' },
    { matchSigma: 0.014, setSigma: 0.008, volScale: 1.0, label: 'k2' },
    { matchSigma: 0.018, setSigma: 0.010, volScale: 1.0, label: 'k3' },
    { matchSigma: 0.020, setSigma: 0.012, volScale: 1.2, label: 'k4' }
  ];

  for (const config of candidates) {
    const engine = buildEngine(config);
    const sims = simulateSeries(engine, pairs, TRIALS);
    let totalAbsError = 0;

    console.log(`\n=== FIX K ${config.label} match=${config.matchSigma} set=${config.setSigma} vol=${config.volScale} ===`);
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
