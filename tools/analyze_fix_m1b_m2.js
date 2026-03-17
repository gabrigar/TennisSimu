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
  ['nadal', 'federer', 'clay'],
  ['nadal', 'roddick', 'clay'],
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

function loadSimulator(seed, patchKind) {
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

  if (patchKind === 'M2_LIGHT' || patchKind === 'M1B_M2') {
    const patchCode = `
      function getPressure(player) {
        const model = player.model || {};
        const stats = player.stats || {};
        if (typeof model.pressure_index_100 === 'number') return model.pressure_index_100;
        return ((stats.returnWin || 0.42) * 60) + ((stats.breakConvert || 0.42) * 40) + ((stats.rally_long || 26) / 2.5);
      }

      if (${JSON.stringify(patchKind)} === 'M1B_M2') {
        serverVulnerability = function serverVulnerability_M1B(server, actualLongPct) {
          const sS = server.stats || server;
          const netWin = server.net_win || AVG_NET_WIN;
          const model = server.model || {};
          const ratioAgg = (sS.errors || 24) > 0 ? (sS.winners || 34) / (sS.errors || 24) : 1.0;
          const ratioAdj = 1 / clamp(ratioAgg, 0.90, 1.45);
          const penalty100 = typeof model.long_rally_penalty_100 === 'number' ? model.long_rally_penalty_100 : 35;
          const penaltyFactor = 0.75 + clamp((penalty100 - 30) / 35, -0.20, 0.70);
          const netAttenuation = Math.min(0.60, Math.max(0, netWin - AVG_NET_WIN) * FACTOR_N);
          const naturalLong = sS.rally_long / 100;
          const dispRaw = Math.max(0, actualLongPct - naturalLong);
          const dispEff = dispRaw * (1 - netAttenuation);
          const effectiveErrors = sS.errors * (1 + dispEff * K_DISPLACEMENT * ratioAdj * penaltyFactor);
          return (effectiveErrors - AVG_ERRORS_PER_SET) / AVG_ERRORS_PER_SET * FACTOR_V;
        };
      }

      simGame = function simGame_M2orM1B(pWin, rallyProf, server, returner, isFinal) {
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
            pressureAdj -= pressureEdgeRaw * 0.010;
          } else if (serverPressurePoint) {
            pressureAdj -= pressureEdgeRaw * 0.014;
          } else if (returnerPressurePoint) {
            pressureAdj -= pressureEdgeRaw * 0.006;
          } else if (neutralBigPoint) {
            pressureAdj -= pressureEdgeRaw * 0.004;
          }

          pw = clamp(pw + pressureAdj, 0.28, 0.80);

          if (simPoint(pw)) pts[0]++; else pts[1]++;
          if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
          if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
        }
      };

      globalThis.__SIM_MATCH__ = simMatch;
    `;
    vm.runInNewContext(patchCode, ctx, { filename: 'fix_m1b_m2_patch.js' });
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
    { name: 'baseline', patchKind: null },
    { name: 'M2_light', patchKind: 'M2_LIGHT' },
    { name: 'M1b_M2', patchKind: 'M1B_M2' }
  ];

  const sims = variants.map((variant, index) => ({
    ...variant,
    ...loadSimulator(20260320 + index, variant.patchKind)
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

  console.log('FIX M1b + M2 comparison\n');
  for (const variant of variants) {
    console.log(`  ${variant.name}: abs error ${totals[variant.name].toFixed(1)} pp`);
  }

  console.log('');
  for (const row of rows) {
    const base = row.variants.baseline;
    const m2 = row.variants.M2_light;
    const combo = row.variants.M1b_M2;
    const gainVsBase = Math.abs(base.delta) - Math.abs(combo.delta);
    const gainVsM2 = Math.abs(m2.delta) - Math.abs(combo.delta);
    console.log(row.label);
    console.log(`  real ${fmtPct(row.realPct)} | baseline ${fmtPct(base.simPct)} (${fmtDelta(base.delta)}) | M2 ${fmtPct(m2.simPct)} (${fmtDelta(m2.delta)}) | M1b+M2 ${fmtPct(combo.simPct)} (${fmtDelta(combo.delta)})`);
    console.log(`  gain vs baseline ${fmtDelta(gainVsBase)} | gain vs M2 ${fmtDelta(gainVsM2)} | n=${row.n}`);
  }
}

main();
