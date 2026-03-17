const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const ENGINE_PATH = path.join(ROOT, 'js', 'engine.js');
const RESULTS_PATH = path.join(ROOT, 'js', 'results_db.js');

const MATCHES = 900;
const BEST_OF = 3;
const USE_TB = true;

const MATCHUPS = [
  ['federer', 'roddick', 'grass'],
  ['federer', 'roddick', 'hard'],
  ['federer', 'wawrinka', 'hard'],
  ['federer', 'wawrinka', 'clay'],
  ['federer', 'martin_del_potro', 'hard'],
  ['djokovic', 'martin_del_potro', 'hard'],
  ['murray', 'martin_del_potro', 'hard'],
  ['medvedev', 'berrettini', 'hard'],
  ['djokovic', 'cilic', 'hard'],
  ['djokovic', 'raonic', 'hard']
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMath(seed) {
  const math = Object.create(Math);
  math.random = mulberry32(seed);
  return math;
}

function loadResultsDb() {
  const ctx = { console };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(RESULTS_PATH, 'utf8') + '\n;globalThis.__OUT__ = RESULTS_DB;';
  vm.runInNewContext(code, ctx, { filename: 'results_db.js' });
  return ctx.__OUT__;
}

function loadSimulator(seed, config) {
  const ctx = {
    console,
    Math: makeMath(seed),
    setTimeout,
    clearTimeout,
    window: {},
    document: {}
  };
  ctx.globalThis = ctx;

  const playersCode = fs.readFileSync(PLAYERS_PATH, 'utf8')
    + '\n;globalThis.PLAYERS = PLAYERS_V3; globalThis.__PLAYERS__ = PLAYERS_V3;';
  const engineCode = fs.readFileSync(ENGINE_PATH, 'utf8')
    + '\n;globalThis.__SIM_MATCH__ = simMatch;';

  vm.runInNewContext(playersCode, ctx, { filename: 'players_v3.js' });
  vm.runInNewContext(engineCode, ctx, { filename: 'engine.js' });

  if (config) {
    const patchCode = `
      const M1_CFG = ${JSON.stringify(config)};
      function m1Model(player) {
        const model = player.model || {};
        const stats = player.stats || {};
        const ratioAgg = (stats.errors || 24) > 0 ? (stats.winners || 34) / (stats.errors || 24) : 1.0;
        return {
          fhDom: (typeof model.fh_dom_100 === 'number' ? model.fh_dom_100 : 78),
          bhStab: (typeof model.bh_stab_100 === 'number' ? model.bh_stab_100 : 84),
          longPenalty100: (typeof model.long_rally_penalty_100 === 'number' ? model.long_rally_penalty_100 : 35),
          ratioAgg
        };
      }

      simGame = function simGame_M1(pWin, rallyProf, server, returner, isFinal) {
        const sS = server.stats || server;
        const rS = returner.stats || returner;
        const sM = m1Model(server);
        const rM = m1Model(returner);
        let pts = [0, 0];

        while (true) {
          const r = Math.random();
          let pw;

          if (r < rallyProf.short) {
            const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
            pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);
          } else if (r < rallyProf.short + rallyProf.mid) {
            pw = clamp(pWin - 0.01, 0.38, 0.75);
          } else {
            const naturalLong = (sS.rally_long || 26) / 100;
            const dispLong = Math.max(0, rallyProf.long - naturalLong);
            const ratioAdj = 1 / clamp(sM.ratioAgg, 0.85, 1.45);
            const netEscape = clamp(((server.net_win || 0.65) - 0.65) * 3.5, 0, 0.35);
            const rallyImpact = Math.pow(Math.max(0.01, dispLong / 0.12), 1.35);
            const longPenaltyBase = M1_CFG.basePenalty + ((sM.longPenalty100 - 30) / 100) * M1_CFG.penaltySpread;
            const longPenalty = rallyImpact * longPenaltyBase * ratioAdj * (1 - netEscape);

            const bhEdge = ((rM.bhStab - sM.bhStab) / 20) * M1_CFG.bhCoef;
            const fhEdge = ((sM.fhDom - rM.fhDom) / 20) * M1_CFG.fhCoef;

            pw = clamp(pWin - M1_CFG.baseLongShift - bhEdge + fhEdge - longPenalty, 0.28, 0.70);
          }

          if (simPoint(pw)) pts[0]++; else pts[1]++;
          if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
          if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
        }
      };

      globalThis.__SIM_MATCH__ = simMatch;
    `;

    vm.runInNewContext(patchCode, ctx, { filename: 'fix_m1_patch.js' });
  }

  return {
    players: ctx.__PLAYERS__,
    simMatch: ctx.__SIM_MATCH__
  };
}

function surfaceCode(surface) {
  return surface === 'hard' ? 'H' : surface === 'clay' ? 'C' : 'G';
}

function actualWinPct(resultsDb, idA, idB, surface) {
  const code = surfaceCode(surface);
  let winsA = 0;
  let winsB = 0;
  for (const match of resultsDb.matches) {
    const [winner, loser, surf] = match;
    if (surf !== code) continue;
    if (winner === idA && loser === idB) winsA += 1;
    if (winner === idB && loser === idA) winsB += 1;
  }
  const total = winsA + winsB;
  return total ? { winPctA: winsA / total, n: total } : null;
}

function simulatePct(simMatch, a, b, surface, matches) {
  let winsA = 0;
  for (let i = 0; i < matches; i++) {
    const result = simMatch(a, b, surface, BEST_OF, USE_TB);
    if (result.winner.id === a.id) winsA += 1;
  }
  return winsA / matches;
}

function fmtPct(v) {
  return (v * 100).toFixed(1) + '%';
}

function fmtDelta(v) {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)} pp`;
}

function main() {
  const resultsDb = loadResultsDb();
  const variants = [
    { name: 'baseline', cfg: null },
    { name: 'M1_light', cfg: { baseLongShift: 0.048, bhCoef: 0.012, fhCoef: 0.004, basePenalty: 0.006, penaltySpread: 0.010 } },
    { name: 'M1_medium', cfg: { baseLongShift: 0.050, bhCoef: 0.016, fhCoef: 0.006, basePenalty: 0.008, penaltySpread: 0.015 } },
    { name: 'M1_strong', cfg: { baseLongShift: 0.050, bhCoef: 0.020, fhCoef: 0.008, basePenalty: 0.010, penaltySpread: 0.020 } }
  ];

  const sims = variants.map((variant, index) => ({
    ...variant,
    ...loadSimulator(20260316 + index, variant.cfg)
  }));

  const byVariant = new Map();
  for (const variant of sims) {
    byVariant.set(variant.name, new Map(variant.players.map((p) => [p.id, p])));
  }

  const rows = [];
  const totals = Object.fromEntries(variants.map((v) => [v.name, 0]));

  for (const [idA, idB, surface] of MATCHUPS) {
    const real = actualWinPct(resultsDb, idA, idB, surface);
    if (!real) continue;
    const row = {
      label: `${idA} vs ${idB} ${surface}`,
      realPct: real.winPctA,
      n: real.n,
      variants: {}
    };

    for (const variant of sims) {
      const map = byVariant.get(variant.name);
      const a = map.get(idA);
      const b = map.get(idB);
      if (!a || !b) continue;
      const simPct = simulatePct(variant.simMatch, a, b, surface, MATCHES);
      const delta = (simPct - real.winPctA) * 100;
      row.label = `${a.name} vs ${b.name} ${surface}`;
      row.variants[variant.name] = { simPct, delta };
      totals[variant.name] += Math.abs(delta);
    }
    rows.push(row);
  }

  const baselineName = 'baseline';
  const ranking = variants
    .filter((v) => v.name !== baselineName)
    .map((v) => ({
      name: v.name,
      absError: totals[v.name],
      gain: totals[baselineName] - totals[v.name]
    }))
    .sort((a, b) => b.gain - a.gain);

  const bestName = ranking[0].name;

  console.log('FIX M1 — BH_stab + longPenalty en rallies largos\n');
  console.log('Variant summary:');
  for (const item of [{ name: baselineName, absError: totals[baselineName], gain: 0 }, ...ranking]) {
    console.log(`  ${item.name}: abs error ${item.absError.toFixed(1)} pp | gain ${item.gain.toFixed(1)} pp`);
  }

  console.log(`\nBest variant: ${bestName}\n`);
  for (const row of rows) {
    const base = row.variants[baselineName];
    const best = row.variants[bestName];
    const gain = Math.abs(base.delta) - Math.abs(best.delta);
    console.log(row.label);
    console.log(`  real ${fmtPct(row.realPct)} | baseline ${fmtPct(base.simPct)} (${fmtDelta(base.delta)}) | ${bestName} ${fmtPct(best.simPct)} (${fmtDelta(best.delta)}) | gain ${fmtDelta(gain)}`);
    console.log(`  n=${row.n}`);
  }
}

main();
