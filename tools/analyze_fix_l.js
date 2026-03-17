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

  const helperCode = `
const FIX_L_K = ${config.k};

function shortRallyPenalty(server, returner, rallyProf, bucket) {
  if (!FIX_L_K) return 0;
  if (bucket === 'short') return 0;

  const s = server.stats || server;
  const r = returner.stats || returner;

  const naturalLong = (s.rally_long || 26) / 100;
  const actualLong = rallyProf.long || 0;
  const actualMid = rallyProf.mid || 0;

  const shortDependence = Math.max(0, ((s.rally_short || 40) - 42) / 8);
  const longDiscomfort = Math.max(0, (actualLong - naturalLong) / 0.08);
  const midDrag = Math.max(0, (actualMid - ((s.rally_mid || 34) / 100)) / 0.10);

  const returnerDrag =
    Math.max(0, ((r.returnWin || 0.42) - 0.45) / 0.07) +
    Math.max(0, ((r.rally_long || 26) - 27) / 7) +
    Math.max(0, ((r.rest_kmh || 148) - 152) / 16);

  const bucketWeight = bucket === 'mid' ? 0.75 : 1.15;

  return FIX_L_K * shortDependence * (0.7 * longDiscomfort + 0.3 * midDrag) * returnerDrag * bucketWeight;
}
`;

  engineCode = engineCode.replace(
    'function simGame(pWin, rallyProf, server, returner, isFinal) {',
    helperCode + '\nfunction simGame(pWin, rallyProf, server, returner, isFinal) {'
  );

  engineCode = engineCode.replace(
    `    if (r < rallyProf.short) {
      // Rally corto: el saque domina, la velocidad de devolución lo modera
      const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
      pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);

    } else if (r < rallyProf.short + rallyProf.mid) {
      // Rally medio: ventaja del saque se desvanece
      pw = clamp(pWin - 0.01, 0.38, 0.75);

    } else {
      // Rally largo: el returner toma el control
      // longRallySkill: habilidad del RETURNER en intercambios largos
      const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
      // groundAdv: ventaja de potencia del returner en el fondo
      const groundAdv      = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;
      // Fix D: vulnerabilidad del servidor cuando el partido se alarga más de lo natural
      const vuln = serverVulnerability(server, rallyProf.long);

      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv - vuln, 0.28, 0.70);
    }`,
    `    if (r < rallyProf.short) {
      // Rally corto: el saque domina, la velocidad de devolución lo modera
      const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
      const fixL = shortRallyPenalty(server, returner, rallyProf, 'short');
      pw = clamp(pWin + 0.04 - returnSpeedAdj - fixL, 0.38, 0.80);

    } else if (r < rallyProf.short + rallyProf.mid) {
      // Rally medio: ventaja del saque se desvanece
      const fixL = shortRallyPenalty(server, returner, rallyProf, 'mid');
      pw = clamp(pWin - 0.01 - fixL, 0.38, 0.75);

    } else {
      // Rally largo: el returner toma el control
      // longRallySkill: habilidad del RETURNER en intercambios largos
      const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
      // groundAdv: ventaja de potencia del returner en el fondo
      const groundAdv      = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;
      // Fix D: vulnerabilidad del servidor cuando el partido se alarga más de lo natural
      const vuln = serverVulnerability(server, rallyProf.long);
      const fixL = shortRallyPenalty(server, returner, rallyProf, 'long');

      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv - vuln - fixL, 0.28, 0.70);
    }`
  );

  engineCode += '\n;globalThis.simMatch=simMatch;';
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });
  return { simMatch: context.simMatch, players: context.PLAYERS };
}

function realRates(resultsDb, ids) {
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
    ['kyrgios', 'djokovic', 'Kyrgios vs Djokovic'],
    ['kyrgios', 'nadal', 'Kyrgios vs Nadal'],
    ['federer', 'roddick', 'Guardrail Federer vs Roddick'],
    ['federer', 'wawrinka', 'Guardrail Federer vs Wawrinka'],
    ['sampras', 'agassi', 'Guardrail Sampras vs Agassi'],
    ['murray', 'ferrer', 'Guardrail Murray vs Ferrer']
  ];

  const real = realRates(resultsDb, pairs.map(([a, b]) => [a, b]));
  const configs = [
    { label: 'baseline', k: 0.0 },
    { label: 'L1', k: 0.020 },
    { label: 'L2', k: 0.035 },
    { label: 'L3', k: 0.050 },
    { label: 'L4', k: 0.070 }
  ];

  for (const config of configs) {
    const engine = buildEngine(config);
    const sims = simulateSeries(engine, pairs, TRIALS);
    let totalAbsError = 0;

    console.log(`\n=== FIX ${config.label} k=${config.k} ===`);
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
