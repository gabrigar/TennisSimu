const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RESULTS_EXTRA_PATH = path.join(ROOT, 'js', 'results_extra.js');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'player_structural_serve_return.js');

const SURFACES = ['hard', 'clay', 'grass'];
const MIN_MATCHES = 5;
const STRICT_RESIDUAL_THRESHOLD = 0.04;
const RELAXED_RESIDUAL_THRESHOLD = 0.06;
const DOUBLE_BREAK_THRESHOLD = 0.25;
const COMEBACK_SET_THRESHOLD = 0.40;
const COLLAPSE_AFTER_BREAK_THRESHOLD = 0.30;
const MIN_BASELINE_GAMES = 24;

function loadVar(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(part, total, digits = 4) {
  if (!total) return null;
  return round(part / total, digits);
}

function fieldsIndex(fields) {
  const out = {};
  fields.forEach((field, index) => {
    out[field] = index;
  });
  return out;
}

function rowObject(raw, index) {
  const out = {};
  for (const [field, idx] of Object.entries(index)) out[field] = raw[idx];
  return out;
}

function parseSetScores(score, winnerIndex) {
  const tokens = String(score || '').trim().split(/\s+/).filter(Boolean);
  const sets = [];

  for (const token of tokens) {
    const match = token.match(/(\d+)-(\d+)/);
    if (!match) continue;
    const winnerGames = Number(match[1]);
    const loserGames = Number(match[2]);
    if (!Number.isInteger(winnerGames) || !Number.isInteger(loserGames)) continue;

    if (winnerIndex === 1) sets.push({ p1: winnerGames, p2: loserGames });
    else if (winnerIndex === 2) sets.push({ p1: loserGames, p2: winnerGames });
  }

  return sets;
}

function splitSequenceBySets(gameSequence, setScores) {
  const sequence = String(gameSequence || '').split('').filter((char) => char === '1' || char === '2');
  const sets = [];
  let cursor = 0;

  for (const setScore of setScores) {
    const setLength = setScore.p1 + setScore.p2;
    const setSequence = sequence.slice(cursor, cursor + setLength);
    if (setSequence.length !== setLength) return null;
    sets.push({ ...setScore, sequence: setSequence });
    cursor += setLength;
  }

  if (cursor !== sequence.length) return null;
  return sets;
}

function createSideStats() {
  return {
    matches: 0,
    serviceGames: 0,
    holds: 0,
    returnGames: 0,
    breaks: 0,
    sets: 0
  };
}

function createPlayerSurfaceTotals() {
  return Object.fromEntries(SURFACES.map((surface) => [surface, createSideStats()]));
}

function createMatchupSideStats(id) {
  return {
    id,
    matches: 0,
    serviceGames: 0,
    holds: 0,
    returnGames: 0,
    breaks: 0,
    sets: 0
  };
}

function createMatchup(a, b, surface) {
  return {
    key: `${a}|${b}|${surface}`,
    a,
    b,
    surface,
    matches: 0,
    sets: 0,
    sides: {
      [a]: createMatchupSideStats(a),
      [b]: createMatchupSideStats(b)
    },
    dynamics: {
      doubleBreakSets: 0,
      comebackSets: 0,
      collapseAfterBreakSets: 0,
      parseableSets: 0
    }
  };
}

function baseServe(stats = {}) {
  const serve1pct = stats.serve1pct || 0.61;
  const win1st = stats.win1st || 0.74;
  const win2nd = stats.win2nd || 0.54;
  return serve1pct * win1st + (1 - serve1pct) * win2nd;
}

function serveHoldProxy(player, surface) {
  const stats = player.stats || {};
  const surfaceMod = stats.surface?.[surface] || 1;
  const breakSave = stats.breakSave || 0.63;
  return clamp(
    0.74
      + (baseServe(stats) - 0.645) * 1.05
      + (surfaceMod - 1) * 0.10
      + (breakSave - 0.63) * 0.22,
    0.58,
    0.93
  );
}

function returnBreakProxy(player, surface) {
  const stats = player.stats || {};
  const surfaceMod = stats.surface?.[surface] || 1;
  const returnWin = stats.returnWin || 0.42;
  const breakConvert = stats.breakConvert || 0.42;
  return clamp(
    0.20
      + (returnWin - 0.42) * 0.85
      + (breakConvert - 0.42) * 0.24
      + (surfaceMod - 1) * 0.06,
    0.08,
    0.36
  );
}

function weightForGames(games) {
  if (games >= 140) return 1;
  if (games >= 80) return 0.8;
  if (games >= 40) return 0.55;
  if (games >= 20) return 0.3;
  return 0;
}

function buildPlayerMeta(players) {
  const byKey = new Map();
  for (const player of players) {
    const keys = new Set([player.id, normalizeName(player.name)]);
    for (const key of keys) {
      if (!key) continue;
      byKey.set(key, player);
    }
  }
  return byKey;
}

function analyzeSetDetailed(setData, startServerIndex) {
  let serverIndex = startServerIndex;
  let p1Games = 0;
  let p2Games = 0;
  let p1BreakDiff = 0;
  let p1BreakLead = false;
  let p2BreakLead = false;
  let p1TrailedByBreak = false;
  let p2TrailedByBreak = false;
  let p1DoubleBreak = false;
  let p2DoubleBreak = false;

  for (let gameIndex = 0; gameIndex < setData.sequence.length; gameIndex += 1) {
    const winner = Number(setData.sequence[gameIndex]);
    const isTiebreak = (
      ((setData.p1 === 7 && setData.p2 === 6) || (setData.p1 === 6 && setData.p2 === 7))
      && gameIndex === setData.sequence.length - 1
    );

    if (winner === 1) p1Games += 1;
    else p2Games += 1;

    if (!isTiebreak && winner !== serverIndex) {
      if (winner === 1) p1BreakDiff += 1;
      else p1BreakDiff -= 1;
    }

    if (p1BreakDiff > 0) p1BreakLead = true;
    if (p1BreakDiff < 0) p2BreakLead = true;
    if (p1BreakDiff < 0) p1TrailedByBreak = true;
    if (p1BreakDiff > 0) p2TrailedByBreak = true;
    if (p1BreakDiff >= 2) p1DoubleBreak = true;
    if (p1BreakDiff <= -2) p2DoubleBreak = true;

    serverIndex = serverIndex === 1 ? 2 : 1;
  }

  return {
    nextServerIndex: serverIndex,
    winner: setData.p1 > setData.p2 ? 1 : 2,
    p1BreakLead,
    p2BreakLead,
    p1TrailedByBreak,
    p2TrailedByBreak,
    p1DoubleBreak,
    p2DoubleBreak
  };
}

function subtractTotals(total, subtract) {
  const serviceGames = total.serviceGames - subtract.serviceGames;
  const holds = total.holds - subtract.holds;
  const returnGames = total.returnGames - subtract.returnGames;
  const breaks = total.breaks - subtract.breaks;

  if (serviceGames >= MIN_BASELINE_GAMES && returnGames >= MIN_BASELINE_GAMES) {
    return {
      serviceGames,
      holds,
      returnGames,
      breaks,
      mode: 'exclusive'
    };
  }

  return {
    serviceGames: total.serviceGames,
    holds: total.holds,
    returnGames: total.returnGames,
    breaks: total.breaks,
    mode: 'inclusive'
  };
}

function expectedBreakPct(returnBreakPct, opponentHoldPct) {
  if (returnBreakPct == null || opponentHoldPct == null) return null;
  return round((returnBreakPct + (1 - opponentHoldPct)) / 2, 4);
}

function structuralResidual(observedBreakPct, expectedPct) {
  if (observedBreakPct == null || expectedPct == null) return null;
  return round(observedBreakPct - expectedPct, 4);
}

function mean(values) {
  const nums = values.filter((value) => Number.isFinite(value));
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function main() {
  const resultsExtra = loadVar(RESULTS_EXTRA_PATH, 'RESULTS_EXTRA');
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const metaByKey = buildPlayerMeta(players);
  const fieldIndex = fieldsIndex(resultsExtra.fields);

  const playerTotals = new Map();
  const matchups = new Map();

  for (const player of players) {
    playerTotals.set(player.id, createPlayerSurfaceTotals());
  }

  for (const raw of resultsExtra.matches) {
    const row = rowObject(raw, fieldIndex);
    if (!SURFACES.includes(row.surface)) continue;

    const p1 = metaByKey.get(row.server1_key);
    const p2 = metaByKey.get(row.server2_key);
    if (!p1 || !p2) continue;

    const p1Totals = playerTotals.get(p1.id)[row.surface];
    const p2Totals = playerTotals.get(p2.id)[row.surface];

    p1Totals.matches += 1;
    p1Totals.serviceGames += row.p1_service_games;
    p1Totals.holds += row.p1_holds;
    p1Totals.returnGames += row.p2_service_games;
    p1Totals.breaks += row.p1_breaks;

    p2Totals.matches += 1;
    p2Totals.serviceGames += row.p2_service_games;
    p2Totals.holds += row.p2_holds;
    p2Totals.returnGames += row.p1_service_games;
    p2Totals.breaks += row.p2_breaks;

    const pair = [p1.id, p2.id].sort();
    const key = `${pair[0]}|${pair[1]}|${row.surface}`;
    if (!matchups.has(key)) {
      matchups.set(key, createMatchup(pair[0], pair[1], row.surface));
    }
    const matchup = matchups.get(key);
    const side1 = matchup.sides[p1.id];
    const side2 = matchup.sides[p2.id];

    matchup.matches += 1;

    side1.matches += 1;
    side1.serviceGames += row.p1_service_games;
    side1.holds += row.p1_holds;
    side1.returnGames += row.p2_service_games;
    side1.breaks += row.p1_breaks;

    side2.matches += 1;
    side2.serviceGames += row.p2_service_games;
    side2.holds += row.p2_holds;
    side2.returnGames += row.p1_service_games;
    side2.breaks += row.p2_breaks;

    const setScores = parseSetScores(row.score, row.winner);
    const sets = splitSequenceBySets(row.game_sequence, setScores);
    if (!sets) continue;

    let nextServerIndex = 1;
    for (const setData of sets) {
      const detail = analyzeSetDetailed(setData, nextServerIndex);
      nextServerIndex = detail.nextServerIndex;

      matchup.sets += 1;
      side1.sets += 1;
      side2.sets += 1;
      matchup.dynamics.parseableSets += 1;

      if (detail.p1DoubleBreak || detail.p2DoubleBreak) matchup.dynamics.doubleBreakSets += 1;
      if ((detail.winner === 1 && detail.p1TrailedByBreak) || (detail.winner === 2 && detail.p2TrailedByBreak)) {
        matchup.dynamics.comebackSets += 1;
      }
      if ((detail.winner === 1 && detail.p2BreakLead) || (detail.winner === 2 && detail.p1BreakLead)) {
        matchup.dynamics.collapseAfterBreakSets += 1;
      }
    }
  }

  const strictAcceptedMatchups = [];
  const relaxedAcceptedMatchups = [];
  const rejectedMatchups = [];
  const relaxedAcceptedKeys = new Set();

  for (const matchup of matchups.values()) {
    if (matchup.matches < MIN_MATCHES) continue;

    const aTotal = subtractTotals(playerTotals.get(matchup.a)[matchup.surface], matchup.sides[matchup.a]);
    const bTotal = subtractTotals(playerTotals.get(matchup.b)[matchup.surface], matchup.sides[matchup.b]);

    const aHoldBase = pct(aTotal.holds, aTotal.serviceGames);
    const aBreakBase = pct(aTotal.breaks, aTotal.returnGames);
    const bHoldBase = pct(bTotal.holds, bTotal.serviceGames);
    const bBreakBase = pct(bTotal.breaks, bTotal.returnGames);

    const aObservedBreak = pct(matchup.sides[matchup.a].breaks, matchup.sides[matchup.a].returnGames);
    const bObservedBreak = pct(matchup.sides[matchup.b].breaks, matchup.sides[matchup.b].returnGames);
    const aExpectedBreak = expectedBreakPct(aBreakBase, bHoldBase);
    const bExpectedBreak = expectedBreakPct(bBreakBase, aHoldBase);
    const aResidual = structuralResidual(aObservedBreak, aExpectedBreak);
    const bResidual = structuralResidual(bObservedBreak, bExpectedBreak);

    const parseableSets = matchup.dynamics.parseableSets;
    const doubleBreakRate = pct(matchup.dynamics.doubleBreakSets, parseableSets);
    const comebackSetRate = pct(matchup.dynamics.comebackSets, parseableSets);
    const collapseAfterBreakRate = pct(matchup.dynamics.collapseAfterBreakSets, parseableSets);

    const strictResidualPass = (
      aResidual != null
      && bResidual != null
      && Math.abs(aResidual) <= STRICT_RESIDUAL_THRESHOLD
      && Math.abs(bResidual) <= STRICT_RESIDUAL_THRESHOLD
    );
    const relaxedResidualPass = (
      aResidual != null
      && bResidual != null
      && Math.abs(aResidual) <= RELAXED_RESIDUAL_THRESHOLD
      && Math.abs(bResidual) <= RELAXED_RESIDUAL_THRESHOLD
    );
    const dynamicPass = (
      (doubleBreakRate ?? 0) <= DOUBLE_BREAK_THRESHOLD
      && (comebackSetRate ?? 0) <= COMEBACK_SET_THRESHOLD
      && (collapseAfterBreakRate ?? 0) <= COLLAPSE_AFTER_BREAK_THRESHOLD
    );

    const record = {
      key: matchup.key,
      a: matchup.a,
      b: matchup.b,
      surface: matchup.surface,
      matches: matchup.matches,
      parseableSets,
      sideA: {
        id: matchup.a,
        observedBreakPct: aObservedBreak,
        expectedBreakPct: aExpectedBreak,
        residualBreak: aResidual,
        baselineHoldPct: aHoldBase,
        baselineBreakPct: aBreakBase,
        baselineMode: aTotal.mode
      },
      sideB: {
        id: matchup.b,
        observedBreakPct: bObservedBreak,
        expectedBreakPct: bExpectedBreak,
        residualBreak: bResidual,
        baselineHoldPct: bHoldBase,
        baselineBreakPct: bBreakBase,
        baselineMode: bTotal.mode
      },
      doubleBreakRunRate: doubleBreakRate,
      comebackSetRate,
      collapseAfterBreakRate
    };

    if (strictResidualPass && dynamicPass) {
      strictAcceptedMatchups.push(record);
    }

    if (relaxedResidualPass && dynamicPass) {
      relaxedAcceptedMatchups.push(record);
      relaxedAcceptedKeys.add(matchup.key);
    } else {
      const reasons = [];
      if (!relaxedResidualPass) reasons.push('residual');
      if (!dynamicPass) reasons.push('dynamic');
      rejectedMatchups.push({ ...record, rejectedBy: reasons });
    }
  }

  const acceptedByPlayerSurface = new Map();
  for (const player of players) {
    acceptedByPlayerSurface.set(player.id, createPlayerSurfaceTotals());
  }

  for (const matchup of matchups.values()) {
    if (!relaxedAcceptedKeys.has(matchup.key)) continue;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].matches += matchup.sides[matchup.a].matches;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].serviceGames += matchup.sides[matchup.a].serviceGames;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].holds += matchup.sides[matchup.a].holds;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].returnGames += matchup.sides[matchup.a].returnGames;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].breaks += matchup.sides[matchup.a].breaks;
    acceptedByPlayerSurface.get(matchup.a)[matchup.surface].sets += matchup.sides[matchup.a].sets;

    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].matches += matchup.sides[matchup.b].matches;
    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].serviceGames += matchup.sides[matchup.b].serviceGames;
    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].holds += matchup.sides[matchup.b].holds;
    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].returnGames += matchup.sides[matchup.b].returnGames;
    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].breaks += matchup.sides[matchup.b].breaks;
    acceptedByPlayerSurface.get(matchup.b)[matchup.surface].sets += matchup.sides[matchup.b].sets;
  }

  const playersOut = players.map((player) => {
    const acceptedTotals = acceptedByPlayerSurface.get(player.id);
    const surfaces = {};

    for (const surface of SURFACES) {
      const totals = acceptedTotals[surface];
      const empiricalHoldPct = pct(totals.holds, totals.serviceGames);
      const empiricalBreakPct = pct(totals.breaks, totals.returnGames);
      const serveWeight = weightForGames(totals.serviceGames);
      const returnWeight = weightForGames(totals.returnGames);
      const proxyHoldPct = round(serveHoldProxy(player, surface), 4);
      const proxyBreakPct = round(returnBreakProxy(player, surface), 4);
      const pureHoldPct = round(
        (empiricalHoldPct ?? proxyHoldPct) * serveWeight + proxyHoldPct * (1 - serveWeight),
        4
      );
      const pureBreakPct = round(
        (empiricalBreakPct ?? proxyBreakPct) * returnWeight + proxyBreakPct * (1 - returnWeight),
        4
      );

      surfaces[surface] = {
        matches: totals.matches,
        sets: totals.sets,
        serviceGames: totals.serviceGames,
        returnGames: totals.returnGames,
        empiricalHoldPct,
        empiricalBreakPct,
        proxyHoldPct,
        proxyBreakPct,
        serveEmpiricalWeight: round(serveWeight, 2),
        returnEmpiricalWeight: round(returnWeight, 2),
        pureHoldPct,
        pureBreakPct,
        pureServeRating100: round(clamp(50 + (pureHoldPct - 0.78) * 250, 0, 100), 1),
        pureReturnRating100: round(clamp(50 + (pureBreakPct - 0.20) * 300, 0, 100), 1)
      };
    }

    return {
      id: player.id,
      name: player.name,
      era: player.era || '',
      style: player.style || '',
      surfaces
    };
  });

  strictAcceptedMatchups.sort((x, y) => y.matches - x.matches || x.key.localeCompare(y.key));
  relaxedAcceptedMatchups.sort((x, y) => y.matches - x.matches || x.key.localeCompare(y.key));
  rejectedMatchups.sort((x, y) => y.matches - x.matches || x.key.localeCompare(y.key));

  const summary = {
    meta: {
      source: 'results_extra.js + players_v3.js',
      generatedAt: new Date().toISOString(),
      methodology: {
        surfaces: SURFACES,
        minMatches: MIN_MATCHES,
        baselineModel: 'expected_break_pct = mean(player_break_pct_ex_matchup, opponent_break_allowed_pct_ex_matchup)',
        strictResidualThreshold: STRICT_RESIDUAL_THRESHOLD,
        relaxedResidualThreshold: RELAXED_RESIDUAL_THRESHOLD,
        doubleBreakRunThreshold: DOUBLE_BREAK_THRESHOLD,
        comebackSetThreshold: COMEBACK_SET_THRESHOLD,
        collapseAfterBreakThreshold: COLLAPSE_AFTER_BREAK_THRESHOLD,
        minBaselineGames: MIN_BASELINE_GAMES
      },
      coverage: {
        strictAcceptedMatchups: strictAcceptedMatchups.length,
        relaxedAcceptedMatchups: relaxedAcceptedMatchups.length,
        rejectedMatchups: rejectedMatchups.length,
        knownSurfaceMatchups: relaxedAcceptedMatchups.length + rejectedMatchups.length
      },
      averages: {
        strictAcceptedResidualAbs: round(mean(
          strictAcceptedMatchups.flatMap((row) => [Math.abs(row.sideA.residualBreak), Math.abs(row.sideB.residualBreak)])
        ), 4),
        relaxedAcceptedResidualAbs: round(mean(
          relaxedAcceptedMatchups.flatMap((row) => [Math.abs(row.sideA.residualBreak), Math.abs(row.sideB.residualBreak)])
        ), 4),
        rejectedResidualAbs: round(mean(
          rejectedMatchups.flatMap((row) => [Math.abs(row.sideA.residualBreak), Math.abs(row.sideB.residualBreak)])
        ), 4),
        strictAcceptedDoubleBreakRate: round(mean(strictAcceptedMatchups.map((row) => row.doubleBreakRunRate)), 4),
        relaxedAcceptedDoubleBreakRate: round(mean(relaxedAcceptedMatchups.map((row) => row.doubleBreakRunRate)), 4),
        rejectedDoubleBreakRate: round(mean(rejectedMatchups.map((row) => row.doubleBreakRunRate)), 4),
        strictAcceptedComebackSetRate: round(mean(strictAcceptedMatchups.map((row) => row.comebackSetRate)), 4),
        relaxedAcceptedComebackSetRate: round(mean(relaxedAcceptedMatchups.map((row) => row.comebackSetRate)), 4),
        rejectedComebackSetRate: round(mean(rejectedMatchups.map((row) => row.comebackSetRate)), 4),
        strictAcceptedCollapseAfterBreakRate: round(mean(strictAcceptedMatchups.map((row) => row.collapseAfterBreakRate)), 4),
        relaxedAcceptedCollapseAfterBreakRate: round(mean(relaxedAcceptedMatchups.map((row) => row.collapseAfterBreakRate)), 4),
        rejectedCollapseAfterBreakRate: round(mean(rejectedMatchups.map((row) => row.collapseAfterBreakRate)), 4)
      },
      playerRatingsBuiltFrom: 'relaxed'
    },
    strictAcceptedMatchups,
    relaxedAcceptedMatchups,
    rejectedMatchups,
    players: playersOut
  };

  const output = [
    '// Auto-generated by tools/build_player_structural_serve_return.js',
    `window.PLAYER_STRUCTURAL_SERVE_RETURN = ${JSON.stringify(summary)};`,
    ''
  ].join('\n');

  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

  console.log(`Structural serve/return file written to ${OUTPUT_PATH}`);
  console.log(`Strict accepted matchups: ${strictAcceptedMatchups.length}`);
  console.log(`Relaxed accepted matchups: ${relaxedAcceptedMatchups.length}`);
  console.log(`Rejected matchups: ${rejectedMatchups.length}`);
  console.log(`Strict accepted avg |residual|: ${((summary.meta.averages.strictAcceptedResidualAbs || 0) * 100).toFixed(2)}%`);
  console.log(`Relaxed accepted avg |residual|: ${((summary.meta.averages.relaxedAcceptedResidualAbs || 0) * 100).toFixed(2)}%`);
  console.log(`Rejected avg |residual|: ${(summary.meta.averages.rejectedResidualAbs * 100).toFixed(2)}%`);
}

main();
