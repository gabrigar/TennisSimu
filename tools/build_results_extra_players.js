const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RESULTS_EXTRA_PATH = path.join(ROOT, 'js', 'results_extra.js');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'results_extra_players.js');

function loadVar(filePath, varName) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${varName};`;
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
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pct(part, total, digits = 4) {
  if (!total) return null;
  return round(part / total, digits);
}

function createAccumulator() {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    minutes: 0,
    timedMatches: 0,
    sets: 0,
    serviceGames: 0,
    holds: 0,
    breaks: 0,
    servePoints: 0,
    servePointsWon: 0,
    returnPoints: 0,
    returnPointsWon: 0,
    aces: 0,
    doubleFaults: 0,
    breakPointsFaced: 0,
    breakPointsSaved: 0,
    breakPointsEarned: 0,
    breakPointsConverted: 0,
    tiebreakPointsWon: 0,
    tiebreakServePoints: 0,
    tiebreakServePointsWon: 0,
    tiebreakMatches: 0,
    maxWinStreakSum: 0,
    maxLossStreakSum: 0,
    matchWinStreak2: 0,
    matchWinStreak3: 0,
    matchLossStreak2: 0,
    matchLossStreak3: 0,
    afterTwoWinsCases: 0,
    afterTwoWinsHits: 0,
    afterTwoLossesCases: 0,
    afterTwoLossesRecovered: 0
  };
}

function hasRun(sequence, value, runLength) {
  let streak = 0;
  for (const item of sequence) {
    streak = item === value ? streak + 1 : 0;
    if (streak >= runLength) return true;
  }
  return false;
}

function longestRun(sequence, value) {
  let best = 0;
  let streak = 0;
  for (const item of sequence) {
    streak = item === value ? streak + 1 : 0;
    if (streak > best) best = streak;
  }
  return best;
}

function analyzeGameSequence(gameSequence, playerMarker) {
  const own = String(playerMarker);
  const opp = own === '1' ? '2' : '1';
  const sequence = String(gameSequence || '').split('').filter((char) => char === '1' || char === '2');

  const out = {
    maxWinStreak: longestRun(sequence, own),
    maxLossStreak: longestRun(sequence, opp),
    hasWinStreak2: hasRun(sequence, own, 2),
    hasWinStreak3: hasRun(sequence, own, 3),
    hasLossStreak2: hasRun(sequence, opp, 2),
    hasLossStreak3: hasRun(sequence, opp, 3),
    afterTwoWinsCases: 0,
    afterTwoWinsHits: 0,
    afterTwoLossesCases: 0,
    afterTwoLossesRecovered: 0
  };

  for (let i = 0; i < sequence.length - 2; i += 1) {
    if (sequence[i] === own && sequence[i + 1] === own) {
      out.afterTwoWinsCases += 1;
      if (sequence[i + 2] === own) out.afterTwoWinsHits += 1;
    }
    if (sequence[i] === opp && sequence[i + 1] === opp) {
      out.afterTwoLossesCases += 1;
      if (sequence[i + 2] === own) out.afterTwoLossesRecovered += 1;
    }
  }

  return out;
}

function ensureBucket(map, key) {
  if (!map.has(key)) map.set(key, createAccumulator());
  return map.get(key);
}

function addToAccumulator(acc, row, prefix, opponentPrefix, wonMatch, hasTiebreak, streaks) {
  acc.matches += 1;
  acc.wins += wonMatch ? 1 : 0;
  acc.losses += wonMatch ? 0 : 1;
  if (Number.isFinite(row.minutes) && row.minutes > 0) {
    acc.minutes += row.minutes;
    acc.timedMatches += 1;
  }
  acc.sets += row.total_sets || 0;
  acc.serviceGames += row[`${prefix}_service_games`] || 0;
  acc.holds += row[`${prefix}_holds`] || 0;
  acc.breaks += row[`${prefix}_breaks`] || 0;
  acc.servePoints += row[`${prefix}_serve_points`] || 0;
  acc.servePointsWon += row[`${prefix}_serve_points_won`] || 0;
  acc.returnPoints += row[`${opponentPrefix}_serve_points`] || 0;
  acc.returnPointsWon += row[`${prefix}_return_points_won`] || 0;
  acc.aces += row[`${prefix}_aces`] || 0;
  acc.doubleFaults += row[`${prefix}_double_faults`] || 0;
  acc.breakPointsFaced += row[`${prefix}_break_points_faced`] || 0;
  acc.breakPointsSaved += row[`${prefix}_break_points_saved`] || 0;
  acc.breakPointsEarned += row[`${prefix}_break_points_earned`] || 0;
  acc.breakPointsConverted += row[`${prefix}_break_points_converted`] || 0;
  acc.tiebreakPointsWon += row[`${prefix}_tiebreak_points_won`] || 0;
  acc.tiebreakServePoints += row[`${prefix}_tiebreak_serve_points`] || 0;
  acc.tiebreakServePointsWon += row[`${prefix}_tiebreak_serve_points_won`] || 0;
  acc.tiebreakMatches += hasTiebreak ? 1 : 0;
  acc.maxWinStreakSum += streaks.maxWinStreak;
  acc.maxLossStreakSum += streaks.maxLossStreak;
  acc.matchWinStreak2 += streaks.hasWinStreak2 ? 1 : 0;
  acc.matchWinStreak3 += streaks.hasWinStreak3 ? 1 : 0;
  acc.matchLossStreak2 += streaks.hasLossStreak2 ? 1 : 0;
  acc.matchLossStreak3 += streaks.hasLossStreak3 ? 1 : 0;
  acc.afterTwoWinsCases += streaks.afterTwoWinsCases;
  acc.afterTwoWinsHits += streaks.afterTwoWinsHits;
  acc.afterTwoLossesCases += streaks.afterTwoLossesCases;
  acc.afterTwoLossesRecovered += streaks.afterTwoLossesRecovered;
}

function finalizeAccumulator(acc) {
  const losses = acc.losses;
  const continueAfterTwoWinsPct = pct(acc.afterTwoWinsHits, acc.afterTwoWinsCases);
  const recoverAfterTwoLossesPct = pct(acc.afterTwoLossesRecovered, acc.afterTwoLossesCases);
  const matchWinStreak3Pct = pct(acc.matchWinStreak3, acc.matches);
  const matchLossStreak3Pct = pct(acc.matchLossStreak3, acc.matches);
  const controlIndex100 = round(100 * (
    0.35 * (continueAfterTwoWinsPct ?? 0.5)
    + 0.25 * (recoverAfterTwoLossesPct ?? 0.5)
    + 0.25 * (matchWinStreak3Pct ?? 0)
    + 0.15 * (1 - (matchLossStreak3Pct ?? 0))
  ), 1);

  return {
    matches: acc.matches,
    wins: acc.wins,
    losses,
    winPct: pct(acc.wins, acc.matches),
    ratio: losses ? round(acc.wins / losses, 4) : (acc.wins ? acc.wins : null),
    avgMinutes: pct(acc.minutes, acc.timedMatches, 1),
    timedMatches: acc.timedMatches,
    avgSets: pct(acc.sets, acc.matches, 2),
    servePoints: acc.servePoints,
    servePointsWon: acc.servePointsWon,
    servePointsWonPct: pct(acc.servePointsWon, acc.servePoints),
    returnPoints: acc.returnPoints,
    returnPointsWon: acc.returnPointsWon,
    returnPointsWonPct: pct(acc.returnPointsWon, acc.returnPoints),
    aces: acc.aces,
    doubleFaults: acc.doubleFaults,
    acesPerMatch: pct(acc.aces, acc.matches, 2),
    dfsPerMatch: pct(acc.doubleFaults, acc.matches, 2),
    serviceGames: acc.serviceGames,
    holds: acc.holds,
    holdPct: pct(acc.holds, acc.serviceGames),
    breaks: acc.breaks,
    breaksPerMatch: pct(acc.breaks, acc.matches, 2),
    breakPointsFaced: acc.breakPointsFaced,
    breakPointsSaved: acc.breakPointsSaved,
    breakPointsSavedPct: pct(acc.breakPointsSaved, acc.breakPointsFaced),
    breakPointsEarned: acc.breakPointsEarned,
    breakPointsConverted: acc.breakPointsConverted,
    breakPointsConvertedPct: pct(acc.breakPointsConverted, acc.breakPointsEarned),
    tiebreakMatches: acc.tiebreakMatches,
    tiebreakMatchPct: pct(acc.tiebreakMatches, acc.matches),
    tiebreakPointsWon: acc.tiebreakPointsWon,
    tiebreakServePoints: acc.tiebreakServePoints,
    tiebreakServePointsWon: acc.tiebreakServePointsWon,
    tiebreakServePct: pct(acc.tiebreakServePointsWon, acc.tiebreakServePoints),
    avgMaxWinStreak: pct(acc.maxWinStreakSum, acc.matches, 2),
    avgMaxLossStreak: pct(acc.maxLossStreakSum, acc.matches, 2),
    matchWinStreak2Pct: pct(acc.matchWinStreak2, acc.matches),
    matchWinStreak3Pct,
    matchLossStreak2Pct: pct(acc.matchLossStreak2, acc.matches),
    matchLossStreak3Pct,
    afterTwoWinsCases: acc.afterTwoWinsCases,
    afterTwoWinsHits: acc.afterTwoWinsHits,
    continueAfterTwoWinsPct,
    afterTwoLossesCases: acc.afterTwoLossesCases,
    afterTwoLossesRecovered: acc.afterTwoLossesRecovered,
    recoverAfterTwoLossesPct,
    controlIndex100
  };
}

function finalizeSplitMap(map, minMatches = 1) {
  return Array.from(map.entries())
    .map(([key, acc]) => ({ key, ...finalizeAccumulator(acc) }))
    .filter((row) => row.matches >= minMatches)
    .sort((a, b) => b.matches - a.matches || (b.winPct || -1) - (a.winPct || -1) || a.key.localeCompare(b.key));
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
        prime: player.prime || '',
        style: player.style || ''
      });
    }
  }
  return byKey;
}

function createBaseRecords(players) {
  const records = new Map();
  for (const player of players) {
    records.set(
      player.id,
      createPlayerRecord(player.id, player.name, {
        id: player.id,
        name: player.name,
        country: player.country || '',
        flag: player.countryFlag || '',
        era: player.era || '',
        prime: player.prime || '',
        style: player.style || ''
      })
    );
  }
  return records;
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

function createPlayerRecord(key, name, meta) {
  return {
    key,
    id: meta?.id || null,
    name: meta?.name || name,
    sourceName: name,
    country: meta?.country || '',
    flag: meta?.flag || '',
    era: meta?.era || '',
    prime: meta?.prime || '',
    style: meta?.style || '',
    overall: createAccumulator(),
    tours: new Map(),
    draws: new Map(),
    years: new Map()
  };
}

function buildAggregates(resultsExtra, players) {
  const index = fieldsIndex(resultsExtra.fields);
  const playerMeta = buildPlayerMeta(players);
  const records = createBaseRecords(players);

  for (const matchRaw of resultsExtra.matches) {
    const row = rowObject(matchRaw, index);
    const hasTiebreak = (row.tiebreaks || 0) > 0;
    const sides = [
      {
        key: row.server1_key,
        name: row.server1,
        prefix: 'p1',
        opponentPrefix: 'p2',
        marker: '1',
        wonMatch: row.winner === 1
      },
      {
        key: row.server2_key,
        name: row.server2,
        prefix: 'p2',
        opponentPrefix: 'p1',
        marker: '2',
        wonMatch: row.winner === 2
      }
    ];

    for (const side of sides) {
      const canonicalKey = side.key || normalizeName(side.name);
      const meta = playerMeta.get(canonicalKey) || playerMeta.get(normalizeName(side.name));
      if (!meta?.id) continue;

      const record = records.get(meta.id);
      const streaks = analyzeGameSequence(row.game_sequence, side.marker);
      addToAccumulator(record.overall, row, side.prefix, side.opponentPrefix, side.wonMatch, hasTiebreak, streaks);
      addToAccumulator(ensureBucket(record.tours, row.tour || 'Unknown'), row, side.prefix, side.opponentPrefix, side.wonMatch, hasTiebreak, streaks);
      addToAccumulator(ensureBucket(record.draws, row.draw || 'Unknown'), row, side.prefix, side.opponentPrefix, side.wonMatch, hasTiebreak, streaks);
      addToAccumulator(ensureBucket(record.years, String(row.year || 'Unknown')), row, side.prefix, side.opponentPrefix, side.wonMatch, hasTiebreak, streaks);
    }
  }

  const outputPlayers = Array.from(records.values())
    .map((record) => ({
      key: record.key,
      id: record.id,
      name: record.name,
      sourceName: record.sourceName,
      country: record.country,
      flag: record.flag,
      era: record.era,
      prime: record.prime,
      style: record.style,
      overall: finalizeAccumulator(record.overall),
      tours: finalizeSplitMap(record.tours),
      draws: finalizeSplitMap(record.draws),
      years: finalizeSplitMap(record.years)
    }))
    .sort((a, b) => b.overall.matches - a.overall.matches || (b.overall.winPct || -1) - (a.overall.winPct || -1) || a.name.localeCompare(b.name));

  outputPlayers.forEach((player, index) => {
    player.rankByMatches = index + 1;
  });

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'results_extra.js',
    totalPlayers: outputPlayers.length,
    totalMatches: resultsExtra.total,
    players: outputPlayers
  };
}

function writeOutput(data) {
  const banner = [
    '// Auto-generated by tools/build_results_extra_players.js',
    `// Source: ${data.source}`,
    `// Players: ${data.totalPlayers}`
  ].join('\n');

  const body = `window.RESULTS_EXTRA_PLAYERS = ${JSON.stringify(data)};\n`;
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const resultsExtra = loadVar(RESULTS_EXTRA_PATH, 'RESULTS_EXTRA');
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const data = buildAggregates(resultsExtra, players);
  writeOutput(data);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Players aggregated: ${data.totalPlayers}`);
}

main();
