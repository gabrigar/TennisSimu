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
  ['federer', 'martin_del_potro', 'hard'],
  ['nadal', 'roddick', 'clay'],
  ['nadal', 'federer', 'clay'],
  ['djokovic', 'cilic', 'hard'],
  ['djokovic', 'raonic', 'hard'],
  ['djokovic', 'martin_del_potro', 'hard'],
  ['murray', 'martin_del_potro', 'hard'],
  ['medvedev', 'berrettini', 'hard']
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
      const M2_CFG = ${JSON.stringify(config)};

      function getPressure(player) {
        const model = player.model || {};
        const stats = player.stats || {};
        if (typeof model.pressure_index_100 === 'number') return model.pressure_index_100;
        return ((stats.returnWin || 0.42) * 60) + ((stats.breakConvert || 0.42) * 40) + ((stats.rally_long || 26) / 2.5);
      }

      simGame = function simGame_M2(pWin, rallyProf, server, returner, isFinal) {
        const sS = server.stats || server;
        const rS = returner.stats || returner;
        const serverPressure = getPressure(server);
        const returnerPressure = getPressure(returner);
        const pressureEdgeRaw = (returnerPressure - serverPressure) / 20;
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
            const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
            const groundAdv      = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;
            const vuln = serverVulnerability(server, rallyProf.long);
            pw = clamp(pWin - 0.06 - longRallySkill - groundAdv - vuln, 0.28, 0.70);
          }

          let pressureAdj = 0;
          const deuceLike = pts[0] >= 3 && pts[1] >= 3;
          const serverPressurePoint = pts[1] >= 3 && pts[1] - pts[0] >= 0;
          const returnerPressurePoint = pts[0] >= 3 && pts[0] - pts[1] >= 0;
          const neutralBigPoint = (pts[0] === 2 && pts[1] === 2);

          if (deuceLike) {
            pressureAdj -= pressureEdgeRaw * M2_CFG.deuceCoef;
          } else if (serverPressurePoint) {
            pressureAdj -= pressureEdgeRaw * M2_CFG.breakCoef;
          } else if (returnerPressurePoint) {
            pressureAdj -= pressureEdgeRaw * M2_CFG.holdCoef;
          } else if (neutralBigPoint) {
            pressureAdj -= pressureEdgeRaw * M2_CFG.neutralCoef;
          }

          pw = clamp(pw + pressureAdj, 0.28, 0.80);

          if (simPoint(pw)) pts[0]++; else pts[1]++;
          if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
          if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
        }
      };

      globalThis.__SIM_MATCH__ = simMatch;
    `;
    vm.runInNewContext(patchCode, ctx, { filename: 'fix_m2_patch.js' });
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
    { name: 'M2_light', cfg: { deuceCoef: 0.010, breakCoef: 0.014, holdCoef: 0.006, neutralCoef: 0.004 } },
    { name: 'M2_medium', cfg: { deuceCoef: 0.014, breakCoef: 0.020, holdCoef: 0.008, neutralCoef: 0.006 } },
    { name: 'M2_strong', cfg: { deuceCoef: 0.018, breakCoef: 0.026, holdCoef: 0.010, neutralCoef: 0.008 } }
  ];

  const sims = variants.map((variant, index) => ({
    ...variant,
    ...loadSimulator(20260317 + index, variant.cfg)
  }));

  const byVariant = new Map();
  for (const variant of sims) {
    byVariant.set(variant.name, new Map(variant.players.map((p) => [p.id, p])));
  }

  const totals = Object.fromEntries(variants.map((v) => [v.name, 0]));
  const rows = [];

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

  console.log('FIX M2 — pressure_index en puntos de presion\n');
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
