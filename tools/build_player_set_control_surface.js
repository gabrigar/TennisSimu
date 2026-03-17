const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { inferSurface } = require('./pbp_surface');

const ROOT = path.join(__dirname, '..');
const RESULTS_EXTRA_PATH = path.join(ROOT, 'js', 'results_extra.js');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'player_set_control_surface.js');
const SURFACES = ['hard', 'clay', 'grass'];

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

function pct(part, total, digits = 4) {
  if (!total) return null;
  return round(part / total, digits);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function createAccumulator() {
  return {
    matches: 0,
    sets: 0,
    setWins: 0,
    breakLeadSets: 0,
    breakLeadSetWins: 0,
    breakLeadSetLosses: 0,
    twoGameLeadSets: 0,
    twoGameLeadSetWins: 0,
    twoGameLeadSetLosses: 0
  };
}

function createSurfaceBuckets() {
  return Object.fromEntries(SURFACES.map((surface) => [surface, createAccumulator()]));
}

function buildPlayerMeta(players) {
  const byKey = new Map();
  for (const player of players) {
    const keys = new Set([player.id, normalizeName(player.name)]);
    for (const key of keys) {
      if (!key) continue;
      byKey.set(key, {
        id: player.id,
        name: player.name,
        country: player.country || '',
        flag: player.countryFlag || '',
        era: player.era || '',
        style: player.style || '',
        stats: player.stats || {},
        tb_win: player.tb_win || 0.62,
        comeback_surface: player.comeback_surface || {}
      });
    }
  }
  return byKey;
}

function ensureRecord(records, meta) {
  if (!records.has(meta.id)) {
    records.set(meta.id, {
      id: meta.id,
      name: meta.name,
      country: meta.country,
      flag: meta.flag,
      era: meta.era,
      style: meta.style,
      stats: meta.stats,
      tb_win: meta.tb_win,
      comeback_surface: meta.comeback_surface,
      surfaces: createSurfaceBuckets()
    });
  }
  return records.get(meta.id);
}

function analyzeSet(setData, startServerIndex) {
  let serverIndex = startServerIndex;
  let p1Games = 0;
  let p2Games = 0;
  let p1BreakDiff = 0;
  let p2BreakDiff = 0;
  let p1BreakLead = false;
  let p2BreakLead = false;
  let p1TwoGameLead = false;
  let p2TwoGameLead = false;

  for (let gameIndex = 0; gameIndex < setData.sequence.length; gameIndex += 1) {
    const winner = Number(setData.sequence[gameIndex]);
    const isTiebreak = setData.p1 === 7 && setData.p2 === 6 && gameIndex === setData.sequence.length - 1;

    if (winner === 1) p1Games += 1;
    else p2Games += 1;

    if (!isTiebreak && winner !== serverIndex) {
      if (winner === 1) {
        p1BreakDiff += 1;
        p2BreakDiff -= 1;
      } else {
        p2BreakDiff += 1;
        p1BreakDiff -= 1;
      }
    }

    if (p1BreakDiff > 0) p1BreakLead = true;
    if (p2BreakDiff > 0) p2BreakLead = true;
    if (p1Games - p2Games >= 2) p1TwoGameLead = true;
    if (p2Games - p1Games >= 2) p2TwoGameLead = true;

    serverIndex = serverIndex === 1 ? 2 : 1;
  }

  return {
    nextServerIndex: serverIndex,
    winner: setData.p1 > setData.p2 ? 1 : 2,
    p1BreakLead,
    p2BreakLead,
    p1TwoGameLead,
    p2TwoGameLead
  };
}

function addSetOutcome(acc, wonSet, hadBreakLead, hadTwoGameLead) {
  acc.sets += 1;
  acc.setWins += wonSet ? 1 : 0;
  if (hadBreakLead) {
    acc.breakLeadSets += 1;
    if (wonSet) acc.breakLeadSetWins += 1;
    else acc.breakLeadSetLosses += 1;
  }
  if (hadTwoGameLead) {
    acc.twoGameLeadSets += 1;
    if (wonSet) acc.twoGameLeadSetWins += 1;
    else acc.twoGameLeadSetLosses += 1;
  }
}

function percentileScale(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function weightForCases(cases) {
  if (cases >= 80) return 1;
  if (cases >= 35) return 0.75;
  if (cases >= 15) return 0.5;
  if (cases >= 5) return 0.25;
  return 0;
}

function baseServe(stats = {}) {
  const serve1pct = stats.serve1pct || 0.61;
  const win1st = stats.win1st || 0.74;
  const win2nd = stats.win2nd || 0.54;
  return serve1pct * win1st + (1 - serve1pct) * win2nd;
}

function getPressureIndex(stats = {}, tbWin = 0.62) {
  return (stats.returnWin || 0.42) * 60
    + (stats.breakConvert || 0.42) * 40
    + (stats.rally_long || 26) / 2.5
    + (tbWin - 0.62) * 25;
}

function computeProxy(record, surface) {
  const stats = record.stats || {};
  const surfaceMod = stats.surface?.[surface] || 1;
  const serveBase = baseServe(stats);
  const pressure = getPressureIndex(stats, record.tb_win);
  const comeback = record.comeback_surface?.[surface] || 0.25;

  const closeBreak = clamp(
    82
      + (surfaceMod - 1) * 18
      + (serveBase - 0.645) * 65
      + (pressure - 50) * 0.22
      + (comeback - 0.25) * 18,
    65,
    96
  );

  const holdLead = clamp(
    84
      + (surfaceMod - 1) * 20
      + (serveBase - 0.645) * 80
      + (pressure - 50) * 0.16
      + (record.tb_win - 0.62) * 18,
    68,
    97
  );

  return {
    setCloseBreak100: round(closeBreak, 1),
    setHoldLead100: round(holdLead, 1)
  };
}

function finalizeEmpirical(acc) {
  return {
    matches: acc.matches,
    sets: acc.sets,
    setWins: acc.setWins,
    setWinPct: pct(acc.setWins, acc.sets),
    breakLeadSets: acc.breakLeadSets,
    breakLeadSetWins: acc.breakLeadSetWins,
    breakLeadSetLosses: acc.breakLeadSetLosses,
    closeSetWithBreakLeadPct: pct(acc.breakLeadSetWins, acc.breakLeadSets),
    loseSetAfterBreakLeadPct: pct(acc.breakLeadSetLosses, acc.breakLeadSets),
    twoGameLeadSets: acc.twoGameLeadSets,
    twoGameLeadSetWins: acc.twoGameLeadSetWins,
    twoGameLeadSetLosses: acc.twoGameLeadSetLosses,
    holdTwoGameLeadPct: pct(acc.twoGameLeadSetWins, acc.twoGameLeadSets),
    loseSetAfterTwoGameLeadPct: pct(acc.twoGameLeadSetLosses, acc.twoGameLeadSets)
  };
}

function buildDataset(resultsExtra, players) {
  const index = fieldsIndex(resultsExtra.fields);
  const playerMeta = buildPlayerMeta(players);
  const records = new Map();

  for (const matchRaw of resultsExtra.matches) {
    const row = rowObject(matchRaw, index);
    const surface = row.surface || inferSurface(row.tournament, row.tour, row.draw);
    if (!SURFACES.includes(surface)) continue;

    const p1Meta = playerMeta.get(row.server1_key) || playerMeta.get(normalizeName(row.server1));
    const p2Meta = playerMeta.get(row.server2_key) || playerMeta.get(normalizeName(row.server2));
    if (!p1Meta?.id || !p2Meta?.id) continue;

    const setScores = parseSetScores(row.score, row.winner);
    const sets = splitSequenceBySets(row.game_sequence, setScores);
    if (!sets || !sets.length) continue;

    const p1Record = ensureRecord(records, p1Meta);
    const p2Record = ensureRecord(records, p2Meta);
    p1Record.surfaces[surface].matches += 1;
    p2Record.surfaces[surface].matches += 1;

    let nextServerIndex = 1;
    for (const setData of sets) {
      const analysis = analyzeSet(setData, nextServerIndex);
      nextServerIndex = analysis.nextServerIndex;
      addSetOutcome(p1Record.surfaces[surface], analysis.winner === 1, analysis.p1BreakLead, analysis.p1TwoGameLead);
      addSetOutcome(p2Record.surfaces[surface], analysis.winner === 2, analysis.p2BreakLead, analysis.p2TwoGameLead);
    }
  }

  const mins = {};
  const maxs = {};
  for (const surface of SURFACES) {
    const eligible = Array.from(records.values())
      .map((record) => finalizeEmpirical(record.surfaces[surface]))
      .filter((row) => row.breakLeadSets >= 15 && row.twoGameLeadSets >= 15 && row.closeSetWithBreakLeadPct != null && row.holdTwoGameLeadPct != null);

    mins[surface] = {
      close: eligible.length ? Math.min(...eligible.map((row) => row.closeSetWithBreakLeadPct)) : 0.75,
      hold: eligible.length ? Math.min(...eligible.map((row) => row.holdTwoGameLeadPct)) : 0.78
    };
    maxs[surface] = {
      close: eligible.length ? Math.max(...eligible.map((row) => row.closeSetWithBreakLeadPct)) : 0.96,
      hold: eligible.length ? Math.max(...eligible.map((row) => row.holdTwoGameLeadPct)) : 0.97
    };
  }

  const rows = players.map((player) => {
    const meta = playerMeta.get(player.id);
    const record = records.get(player.id) || ensureRecord(new Map(), meta);
    const surfaces = {};

    for (const surface of SURFACES) {
      const empiricalBase = finalizeEmpirical(record.surfaces[surface]);
      const proxy = computeProxy(record, surface);
      const closeCases = empiricalBase.breakLeadSets || 0;
      const holdCases = empiricalBase.twoGameLeadSets || 0;
      const closeEmpirical = empiricalBase.closeSetWithBreakLeadPct == null
        ? null
        : round(100 * percentileScale(empiricalBase.closeSetWithBreakLeadPct, mins[surface].close, maxs[surface].close), 1);
      const holdEmpirical = empiricalBase.holdTwoGameLeadPct == null
        ? null
        : round(100 * percentileScale(empiricalBase.holdTwoGameLeadPct, mins[surface].hold, maxs[surface].hold), 1);

      const closeWeight = weightForCases(closeCases);
      const holdWeight = weightForCases(holdCases);
      const setCloseBreak100 = closeEmpirical == null
        ? proxy.setCloseBreak100
        : round(proxy.setCloseBreak100 * (1 - closeWeight) + closeEmpirical * closeWeight, 1);
      const setHoldLead100 = holdEmpirical == null
        ? proxy.setHoldLead100
        : round(proxy.setHoldLead100 * (1 - holdWeight) + holdEmpirical * holdWeight, 1);

      surfaces[surface] = {
        ...empiricalBase,
        empiricalSetCloseBreak100: closeEmpirical,
        empiricalSetHoldLead100: holdEmpirical,
        proxySetCloseBreak100: proxy.setCloseBreak100,
        proxySetHoldLead100: proxy.setHoldLead100,
        setCloseBreak100,
        setHoldLead100,
        setControlSurface100: round((setCloseBreak100 + setHoldLead100) / 2, 1)
      };
    }

    return {
      id: player.id,
      name: player.name,
      country: meta?.country || '',
      flag: meta?.flag || '',
      era: meta?.era || '',
      style: meta?.style || '',
      surfaces
    };
  });

  const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

  const leaderboards = Object.fromEntries(SURFACES.map((surface) => [
    surface,
    rows
      .filter((row) => row.surfaces[surface].setControlSurface100 != null)
      .sort((a, b) => b.surfaces[surface].setControlSurface100 - a.surfaces[surface].setControlSurface100 || a.name.localeCompare(b.name))
      .slice(0, 15)
      .map((row, index) => ({
        rank: index + 1,
        id: row.id,
        name: row.name,
        setControlSurface100: row.surfaces[surface].setControlSurface100,
        setCloseBreak100: row.surfaces[surface].setCloseBreak100,
        setHoldLead100: row.surfaces[surface].setHoldLead100,
        breakLeadSets: row.surfaces[surface].breakLeadSets,
        twoGameLeadSets: row.surfaces[surface].twoGameLeadSets
      }))
  ]));

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'results_extra.js + players_v3.js',
    description: 'Surface-specific set control signals blended across point-by-point evidence and surface-aware proxy. Tracks closing sets after a break lead and holding sets after opening a 2-game lead.',
    surfaces: SURFACES,
    totalPlayers: rows.length,
    leaderboards,
    byId,
    players: rows
  };
}

function writeOutput(data) {
  const banner = [
    '// Auto-generated by tools/build_player_set_control_surface.js',
    `// Source: ${data.source}`,
    `// Players: ${data.totalPlayers}`
  ].join('\n');

  const body = `window.PLAYER_SET_CONTROL_SURFACE = ${JSON.stringify(data)};\nwindow.PLAYER_SET_CONTROL_SURFACE_BY_ID = window.PLAYER_SET_CONTROL_SURFACE.byId;\n`;
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const resultsExtra = loadVar(RESULTS_EXTRA_PATH, 'RESULTS_EXTRA');
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const data = buildDataset(resultsExtra, players);
  writeOutput(data);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Players: ${data.totalPlayers}`);
}

main();
