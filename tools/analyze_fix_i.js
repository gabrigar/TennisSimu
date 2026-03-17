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

function buildEngine(penaltyStrength) {
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
const FIX_I_K = ${penaltyStrength};
function selectiveAggressionPenalty(server, surface) {
  if (!FIX_I_K) return 0;
  const s = server.stats || server;
  const winnersTerm = Math.max(0, ((s.winners || 36) - 40) / 12);
  const errorsTerm = Math.max(0, ((s.errors || 22) - 24) / 10);
  const shortTerm = Math.max(0, ((s.rally_short || 38) - 39) / 8);
  const returnTerm = Math.max(0, (0.43 - (s.returnWin || 0.43)) / 0.08);
  const surfaceTerm = surface === 'grass' ? 1.10 : surface === 'hard' ? 1.00 : 0.55;
  return FIX_I_K * winnersTerm * errorsTerm * (0.7 + shortTerm) * (0.7 + returnTerm) * surfaceTerm;
}
`;

  engineCode = engineCode.replace(
    'function calcWinProbServe(server, returner, surface) {',
    helperCode + '\nfunction calcWinProbServe(server, returner, surface) {'
  );

  engineCode = engineCode.replace(
    /const prob = \(baseServe \* sMod\) \+ serveSpeedBonus \+ serverPower \* 0\.5\s+               \+ serverShortRallyBonus \+ netBonus - returnPressure;/,
    'const fixIPenalty = selectiveAggressionPenalty(server, surface);\n' +
    '  const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.5\n' +
    '               + serverShortRallyBonus + netBonus - returnPressure - fixIPenalty;'
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
    out.push({
      a,
      b,
      label,
      hard,
      clay,
      grass,
      overall: (hard + clay + grass) / 3
    });
  }
  return out;
}

function eraAverageAgainstField(engine, eraFilter, targetIds, trialsPerOpponent) {
  const players = engine.players.filter(eraFilter);
  const byId = new Map(players.map((p) => [p.id, p]));
  const targets = targetIds.map((id) => byId.get(id)).filter(Boolean);
  const rows = [];
  for (const target of targets) {
    let total = 0;
    let count = 0;
    for (const opp of players) {
      if (opp.id === target.id) continue;
      for (const surface of ['hard', 'clay', 'grass']) {
        total += simulatePair(engine, target, opp, surface, trialsPerOpponent);
        count += 1;
      }
    }
    rows.push({ id: target.id, avg: total / count });
  }
  return rows;
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
    ['federer', 'roddick', 'Guardrail Federer vs Roddick'],
    ['federer', 'wawrinka', 'Guardrail Federer vs Wawrinka'],
    ['murray', 'ferrer', 'Guardrail Murray vs Ferrer']
  ];

  const real = realRates(resultsDb, pairs.map(([a, b]) => [a, b]));
  const candidates = [0, 0.006, 0.010, 0.020, 0.030, 0.040];

  for (const k of candidates) {
    const engine = buildEngine(k);
    const sims = simulateSeries(engine, pairs, TRIALS);
    let totalAbsError = 0;

    console.log(`\n=== FIX I K=${k.toFixed(3)} ===`);
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

    const avg2000s = eraAverageAgainstField(
      engine,
      (p) => {
        const year = parseInt(String(p.era).split('-')[0], 10);
        return year >= 2000 && year < 2010;
      },
      ['federer', 'martin_del_potro', 'ferrer', 'murray', 'cilic'],
      120
    );
    const avg2010s = eraAverageAgainstField(
      engine,
      (p) => {
        const year = parseInt(String(p.era).split('-')[0], 10);
        return year >= 2010;
      },
      ['berrettini', 'medvedev', 'rublev', 'alcaraz'],
      120
    );

    console.log('2000s field average:');
    avg2000s.forEach((row) => console.log(`  ${row.id}: ${formatPct(row.avg)}`));
    console.log('2010s+ field average:');
    avg2010s.forEach((row) => console.log(`  ${row.id}: ${formatPct(row.avg)}`));
  }
}

main();
