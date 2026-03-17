const fs = require('fs');
const path = require('path');
const { inferSurfaceDetailed } = require('./pbp_surface');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SOURCE_DIR = 'C:/Users/gabri/Documents/Webtenis/02 JeffSackmanntennis/tennis_pointbypoint-master';
const OUTPUT_PATH = path.join(ROOT, 'js', 'results_extra.js');

const MONTHS = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      value = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows.map((values) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });
    return obj;
  });
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseDate(raw) {
  const parts = String(raw || '').trim().split(/\s+/);
  if (parts.length !== 3) return { iso: '', year: null };

  const day = Number(parts[0]);
  const month = MONTHS[parts[1]];
  const year = 2000 + Number(parts[2]);

  if (!Number.isInteger(day) || !month || !Number.isInteger(year)) {
    return { iso: '', year: null };
  }

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { iso, year };
}

function createPlayerStats() {
  return {
    servePoints: 0,
    servePointsWon: 0,
    returnPointsWon: 0,
    aces: 0,
    doubleFaults: 0,
    serviceGames: 0,
    holds: 0,
    breaks: 0,
    breakPointsFaced: 0,
    breakPointsSaved: 0,
    breakPointsEarned: 0,
    breakPointsConverted: 0,
    tiebreakPointsWon: 0,
    tiebreakServePoints: 0,
    tiebreakServePointsWon: 0
  };
}

function createMatchState(server1, server2) {
  return {
    totalSets: 0,
    totalGames: 0,
    totalPoints: 0,
    totalAces: 0,
    totalDoubleFaults: 0,
    tiebreaks: 0,
    gameWinners: [],
    players: {
      1: { name: server1, key: normalizeName(server1), stats: createPlayerStats() },
      2: { name: server2, key: normalizeName(server2), stats: createPlayerStats() }
    }
  };
}

function isBreakPoint(serverPoints, receiverPoints) {
  return receiverPoints >= 3 && receiverPoints > serverPoints;
}

function isGameOver(serverPoints, receiverPoints) {
  return (serverPoints >= 4 || receiverPoints >= 4) && Math.abs(serverPoints - receiverPoints) >= 2;
}

function registerServePoint(playerStats, pointChar, isTiebreak, matchState) {
  playerStats.servePoints += 1;
  matchState.totalPoints += 1;

  if (isTiebreak) {
    playerStats.tiebreakServePoints += 1;
  }

  if (pointChar === 'S' || pointChar === 'A') {
    playerStats.servePointsWon += 1;
    if (isTiebreak) {
      playerStats.tiebreakServePointsWon += 1;
      playerStats.tiebreakPointsWon += 1;
    }
  } else {
    if (isTiebreak) {
      // Tiebreak return points won are counted when the opponent serves.
    }
  }

  if (pointChar === 'A') {
    playerStats.aces += 1;
    matchState.totalAces += 1;
  }

  if (pointChar === 'D') {
    playerStats.doubleFaults += 1;
    matchState.totalDoubleFaults += 1;
  }
}

function registerReturnPoint(returnerStats, pointChar, isTiebreak) {
  if (pointChar === 'R' || pointChar === 'D') {
    returnerStats.returnPointsWon += 1;
    if (isTiebreak) {
      returnerStats.tiebreakPointsWon += 1;
    }
  }
}

function processRegularGame(game, serverIndex, matchState) {
  const serverStats = matchState.players[serverIndex].stats;
  const receiverIndex = serverIndex === 1 ? 2 : 1;
  const receiverStats = matchState.players[receiverIndex].stats;
  let serverPoints = 0;
  let receiverPoints = 0;

  serverStats.serviceGames += 1;
  matchState.totalGames += 1;

  for (const pointChar of game) {
    if (!/[SRAD]/.test(pointChar)) continue;

    const breakPoint = isBreakPoint(serverPoints, receiverPoints);
    if (breakPoint) {
      serverStats.breakPointsFaced += 1;
      receiverStats.breakPointsEarned += 1;
    }

    registerServePoint(serverStats, pointChar, false, matchState);
    registerReturnPoint(receiverStats, pointChar, false);

    if (pointChar === 'S' || pointChar === 'A') {
      serverPoints += 1;
      if (breakPoint) {
        serverStats.breakPointsSaved += 1;
      }
    } else if (pointChar === 'R' || pointChar === 'D') {
      receiverPoints += 1;
    }

    if (isGameOver(serverPoints, receiverPoints)) {
      if (serverPoints > receiverPoints) {
        serverStats.holds += 1;
        matchState.gameWinners.push(serverIndex);
      } else {
        receiverStats.breaks += 1;
        if (breakPoint) {
          receiverStats.breakPointsConverted += 1;
        }
        matchState.gameWinners.push(receiverIndex);
      }
      return;
    }
  }
}

function processTiebreakGame(game, firstServerIndex, matchState) {
  let serverIndex = firstServerIndex;
  let p1Points = 0;
  let p2Points = 0;

  matchState.tiebreaks += 1;
  matchState.totalGames += 1;

  for (const pointChar of game) {
    if (pointChar === '/') {
      serverIndex = serverIndex === 1 ? 2 : 1;
      continue;
    }

    if (!/[SRAD]/.test(pointChar)) continue;

    const serverStats = matchState.players[serverIndex].stats;
    const receiverIndex = serverIndex === 1 ? 2 : 1;
    const receiverStats = matchState.players[receiverIndex].stats;

    registerServePoint(serverStats, pointChar, true, matchState);
    registerReturnPoint(receiverStats, pointChar, true);

    if (pointChar === 'S' || pointChar === 'A') {
      if (serverIndex === 1) p1Points += 1;
      else p2Points += 1;
    } else if (pointChar === 'R' || pointChar === 'D') {
      if (receiverIndex === 1) p1Points += 1;
      else p2Points += 1;
    }
  }

  matchState.gameWinners.push(p1Points > p2Points ? 1 : 2);
}

function summarizePbp(row) {
  const matchState = createMatchState(row.server1, row.server2);
  const sets = String(row.pbp || '').split('.').filter(Boolean);
  let nextServerIndex = 1;

  for (const setText of sets) {
    const games = setText.split(';').filter(Boolean);
    if (!games.length) continue;

    matchState.totalSets += 1;

    for (const game of games) {
      if (game.includes('/')) {
        processTiebreakGame(game, nextServerIndex, matchState);
      } else {
        processRegularGame(game, nextServerIndex, matchState);
      }
      nextServerIndex = nextServerIndex === 1 ? 2 : 1;
    }
  }

  return matchState;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildRow(row, fileName) {
  const { iso, year } = parseDate(row.date);
  const summary = summarizePbp(row);
  const surfaceInfo = inferSurfaceDetailed(row.tny_name, row.tour, row.draw);
  const player1 = summary.players[1];
  const player2 = summary.players[2];
  const winnerIndex = toNumber(row.winner);
  const loserIndex = winnerIndex === 1 ? 2 : 1;
  const winnerName = winnerIndex === 1 ? row.server1 : row.server2;
  const loserName = loserIndex === 1 ? row.server1 : row.server2;

  return [
    toNumber(row.pbp_id),
    iso,
    year,
    surfaceInfo.surface,
    surfaceInfo.rule,
    surfaceInfo.confidence,
    row.tour || '',
    row.draw || '',
    row.tny_name || '',
    row.server1 || '',
    row.server2 || '',
    player1.key,
    player2.key,
    winnerIndex,
    winnerName,
    loserName,
    row.score || '',
    toNumber(row.wh_minutes),
    toNumber(row.adf_flag),
    fileName,
    summary.gameWinners.join(''),
    summary.totalSets,
    summary.totalGames,
    summary.tiebreaks,
    summary.totalPoints,
    summary.totalAces,
    summary.totalDoubleFaults,
    player1.stats.servePoints,
    player1.stats.servePointsWon,
    player1.stats.returnPointsWon,
    player1.stats.aces,
    player1.stats.doubleFaults,
    player1.stats.serviceGames,
    player1.stats.holds,
    player1.stats.breaks,
    player1.stats.breakPointsFaced,
    player1.stats.breakPointsSaved,
    player1.stats.breakPointsEarned,
    player1.stats.breakPointsConverted,
    player1.stats.tiebreakPointsWon,
    player1.stats.tiebreakServePoints,
    player1.stats.tiebreakServePointsWon,
    player2.stats.servePoints,
    player2.stats.servePointsWon,
    player2.stats.returnPointsWon,
    player2.stats.aces,
    player2.stats.doubleFaults,
    player2.stats.serviceGames,
    player2.stats.holds,
    player2.stats.breaks,
    player2.stats.breakPointsFaced,
    player2.stats.breakPointsSaved,
    player2.stats.breakPointsEarned,
    player2.stats.breakPointsConverted,
    player2.stats.tiebreakPointsWon,
    player2.stats.tiebreakServePoints,
    player2.stats.tiebreakServePointsWon
  ];
}

function getSourceFiles(sourceDir) {
  return fs
    .readdirSync(sourceDir)
    .filter((fileName) => /^pbp_matches_(atp|ch|fu|itf|wta)_(main|qual)_(archive|current)\.csv$/i.test(fileName))
    .sort();
}

function buildResultsExtra(sourceDir) {
  const fileNames = getSourceFiles(sourceDir);
  const matches = [];

  for (const fileName of fileNames) {
    const filePath = path.join(sourceDir, fileName);
    const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));

    for (const row of rows) {
      matches.push(buildRow(row, fileName));
    }

    console.log(`Processed ${fileName}: ${rows.length} matches`);
  }

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'Jeff Sackmann tennis_pointbypoint',
    sourceDir,
    files: fileNames,
    total: matches.length,
    fields: [
      'pbp_id',
      'date',
      'year',
      'surface',
      'surface_rule',
      'surface_confidence',
      'tour',
      'draw',
      'tournament',
      'server1',
      'server2',
      'server1_key',
      'server2_key',
      'winner',
      'winner_name',
      'loser_name',
      'score',
      'minutes',
      'adf_flag',
      'source_file',
      'game_sequence',
      'total_sets',
      'total_service_games',
      'tiebreaks',
      'total_points',
      'total_aces',
      'total_double_faults',
      'p1_serve_points',
      'p1_serve_points_won',
      'p1_return_points_won',
      'p1_aces',
      'p1_double_faults',
      'p1_service_games',
      'p1_holds',
      'p1_breaks',
      'p1_break_points_faced',
      'p1_break_points_saved',
      'p1_break_points_earned',
      'p1_break_points_converted',
      'p1_tiebreak_points_won',
      'p1_tiebreak_serve_points',
      'p1_tiebreak_serve_points_won',
      'p2_serve_points',
      'p2_serve_points_won',
      'p2_return_points_won',
      'p2_aces',
      'p2_double_faults',
      'p2_service_games',
      'p2_holds',
      'p2_breaks',
      'p2_break_points_faced',
      'p2_break_points_saved',
      'p2_break_points_earned',
      'p2_break_points_converted',
      'p2_tiebreak_points_won',
      'p2_tiebreak_serve_points',
      'p2_tiebreak_serve_points_won'
    ],
    matches
  };
}

function writeOutput(resultsExtra) {
  const banner = [
    '// Auto-generated by tools/build_results_extra.js',
    `// Source: ${resultsExtra.source}`,
    `// Matches: ${resultsExtra.total}`
  ].join('\n');

  const body = `const RESULTS_EXTRA = ${JSON.stringify(resultsExtra)};\n\nif (typeof window !== "undefined") window.RESULTS_EXTRA = RESULTS_EXTRA;\n`;
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE_DIR;
  const resultsExtra = buildResultsExtra(sourceDir);
  writeOutput(resultsExtra);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
