const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CURRENT_PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'players_v2.js');

const CSV_PATHS = {
  breakModel: 'C:/Users/gabri/Downloads/tennis_break_model.csv',
  eraMap: 'C:/Users/gabri/Downloads/tennis_era_map.csv',
  playerMatrix: 'C:/Users/gabri/Downloads/tennis_player_matrix_99.csv',
  tacticalMap: 'C:/Users/gabri/Downloads/tennis_tactical_map.csv'
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
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

  const headers = rows.shift();
  return rows.map((values) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });
    return obj;
  });
}

function maybeNumber(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadCurrentPlayers() {
  const ctx = { console, Math };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(CURRENT_PLAYERS_PATH, 'utf8') + '\n;globalThis.__PLAYERS__ = PLAYERS;';
  vm.runInNewContext(code, ctx, { filename: 'players.js' });
  return ctx.__PLAYERS__;
}

function csvMapBy(rows, key) {
  const map = new Map();
  for (const row of rows) map.set(row[key], row);
  return map;
}

function normalizeEraBucket(value) {
  if (value === '70s/prev') return '70s';
  return value;
}

function inferCountryFlag(countryCode, existingPlayer) {
  if (existingPlayer && existingPlayer.countryFlag) return existingPlayer.countryFlag;
  return '';
}

function mergePlayer(currentPlayer, matrixRow, breakRow, eraRow, tacticalRow) {
  const merged = deepClone(currentPlayer || {});
  const stats = merged.stats ? deepClone(merged.stats) : {};

  const styleText = matrixRow.style_text || merged.style || '';
  const dataType = matrixRow.data_type || stats.data_type || 'estimated';

  merged.id = matrixRow.id;
  merged.name = matrixRow.player || merged.name;
  merged.country = matrixRow.country || merged.country || '';
  merged.countryFlag = inferCountryFlag(merged.country, currentPlayer);
  merged.era = matrixRow.era || merged.era || '';
  merged.style = styleText;
  merged.net_win = maybeNumber(matrixRow.net_win) ?? merged.net_win ?? 0.6;
  merged.tb_win = maybeNumber(matrixRow.tb_win) ?? merged.tb_win ?? 0.6;
  merged.dec_win = maybeNumber(matrixRow.dec_win_comeback_proxy) ?? merged.dec_win ?? 0.6;
  merged.comeback = maybeNumber(matrixRow.dec_win_comeback_proxy) ?? merged.comeback ?? merged.dec_win ?? 0.6;
  merged.height = maybeNumber(matrixRow.height_cm) ?? merged.height ?? 185;

  stats.serve1pct = maybeNumber(matrixRow.serve1pct) ?? stats.serve1pct;
  stats.win1st = maybeNumber(matrixRow.win1st) ?? stats.win1st;
  stats.win2nd = maybeNumber(matrixRow.win2nd) ?? stats.win2nd;
  stats.returnWin = maybeNumber(matrixRow.returnWin) ?? stats.returnWin;
  stats.winners = maybeNumber(matrixRow.winners_raw) ?? stats.winners;
  stats.errors = maybeNumber(matrixRow.errors_raw) ?? stats.errors;
  stats.breakConvert = maybeNumber(matrixRow.breakConvert) ?? stats.breakConvert;
  stats.breakSave = maybeNumber(matrixRow.breakSave) ?? stats.breakSave;
  stats.serve_kmh = maybeNumber(matrixRow.serve_kmh) ?? stats.serve_kmh;
  stats.fh_kmh = maybeNumber(matrixRow.fh_kmh) ?? stats.fh_kmh;
  stats.bh_kmh = maybeNumber(matrixRow.bh_kmh) ?? stats.bh_kmh;
  stats.rest_kmh = maybeNumber(matrixRow.rest_kmh) ?? stats.rest_kmh;
  stats.rally_short = maybeNumber(matrixRow.rally_short) ?? stats.rally_short;
  stats.rally_mid = maybeNumber(matrixRow.rally_mid) ?? stats.rally_mid;
  stats.rally_long = maybeNumber(matrixRow.rally_long) ?? stats.rally_long;
  stats.data_type = dataType;
  stats.surface = deepClone(stats.surface || {});
  if (currentPlayer && currentPlayer.stats && currentPlayer.stats.surface) {
    stats.surface = deepClone(currentPlayer.stats.surface);
  }

  merged.stats = stats;
  merged.hand = matrixRow.hand || merged.hand || '';
  merged.style_bucket = matrixRow.style_bucket || breakRow?.style_bucket || merged.style_bucket || '';
  merged.style_code = maybeNumber(matrixRow.style_code) ?? merged.style_code ?? null;
  merged.data_type = dataType;

  merged.model = {
    source: 'csv_v2',
    point_dominance_index: maybeNumber(matrixRow.point_dominance_index),
    fh_dom_100: maybeNumber(matrixRow.fh_dom_100),
    bh_stab_100: maybeNumber(matrixRow.bh_stab_100),
    pressure_index_100: maybeNumber(matrixRow.pressure_index_100),
    long_rally_penalty_100: maybeNumber(matrixRow.long_rally_penalty_100),
    hold_strength_100: maybeNumber(matrixRow.hold_strength_100),
    break_prob_model: maybeNumber(matrixRow.break_prob_model) ?? maybeNumber(breakRow?.break_prob_model),
    break2_consecutive_model: maybeNumber(matrixRow.break2_consecutive_model) ?? maybeNumber(breakRow?.break2_consecutive_model),
    break3_consecutive_model: maybeNumber(matrixRow.break3_consecutive_model) ?? maybeNumber(breakRow?.break3_consecutive_model),
    pressure_proxy: maybeNumber(breakRow?.pressure_index_100),
    long_rally_break_penalty_proxy: maybeNumber(breakRow?.long_rally_penalty_100)
  };

  merged.context = {
    era_bucket: normalizeEraBucket(matrixRow.era_bucket || breakRow?.era_bucket || ''),
    style_bucket: matrixRow.style_bucket || breakRow?.style_bucket || '',
    era_profile: eraRow ? {
      players: maybeNumber(eraRow.players),
      avg_serve: maybeNumber(eraRow.avg_serve),
      avg_return: maybeNumber(eraRow.avg_return),
      avg_break_conv: maybeNumber(eraRow.avg_break_conv),
      avg_rally_short: maybeNumber(eraRow.avg_rally_short),
      avg_rally_long: maybeNumber(eraRow.avg_rally_long),
      avg_pressure: maybeNumber(eraRow.avg_pressure),
      avg_break2: maybeNumber(eraRow.avg_break2),
      avg_long_penalty: maybeNumber(eraRow.avg_long_penalty)
    } : null,
    tactical_profile: tacticalRow ? {
      players: maybeNumber(tacticalRow.players),
      avg_serve: maybeNumber(tacticalRow.avg_serve),
      avg_return: maybeNumber(tacticalRow.avg_return),
      avg_break_conv: maybeNumber(tacticalRow.avg_break_conv),
      avg_rally_short: maybeNumber(tacticalRow.avg_rally_short),
      avg_rally_long: maybeNumber(tacticalRow.avg_rally_long),
      avg_fh_dom: maybeNumber(tacticalRow.avg_fh_dom),
      avg_bh_stab: maybeNumber(tacticalRow.avg_bh_stab),
      avg_pressure: maybeNumber(tacticalRow.avg_pressure),
      avg_break2: maybeNumber(tacticalRow.avg_break2),
      avg_break3: maybeNumber(tacticalRow.avg_break3)
    } : null
  };

  if (!merged.comeback_surface && currentPlayer && currentPlayer.comeback_surface) {
    merged.comeback_surface = deepClone(currentPlayer.comeback_surface);
  }

  if (!merged.prime && currentPlayer && currentPlayer.prime) merged.prime = currentPlayer.prime;
  if (!merged.peak && currentPlayer && currentPlayer.peak) merged.peak = currentPlayer.peak;
  if (!merged.bio && currentPlayer && currentPlayer.bio) merged.bio = currentPlayer.bio;
  if (!merged.bio_en && currentPlayer && currentPlayer.bio_en) merged.bio_en = currentPlayer.bio_en;

  return merged;
}

function buildFallbackPlayer(currentPlayer, eraRow, tacticalRow) {
  const player = deepClone(currentPlayer);
  player.model = player.model || {};
  player.model.source = 'legacy_players_js';
  player.context = {
    era_bucket: normalizeEraBucket(
      currentPlayer.era && parseInt(String(currentPlayer.era).split('-')[0], 10) >= 2010 ? '2010s+' :
      currentPlayer.era && parseInt(String(currentPlayer.era).split('-')[0], 10) >= 2000 ? '2000s' :
      currentPlayer.era && parseInt(String(currentPlayer.era).split('-')[0], 10) >= 1990 ? '90s' :
      currentPlayer.era && parseInt(String(currentPlayer.era).split('-')[0], 10) >= 1980 ? '80s' : '70s'
    ),
    style_bucket: player.style,
    era_profile: eraRow ? {
      players: maybeNumber(eraRow.players),
      avg_serve: maybeNumber(eraRow.avg_serve),
      avg_return: maybeNumber(eraRow.avg_return),
      avg_break_conv: maybeNumber(eraRow.avg_break_conv),
      avg_rally_short: maybeNumber(eraRow.avg_rally_short),
      avg_rally_long: maybeNumber(eraRow.avg_rally_long),
      avg_pressure: maybeNumber(eraRow.avg_pressure),
      avg_break2: maybeNumber(eraRow.avg_break2),
      avg_long_penalty: maybeNumber(eraRow.avg_long_penalty)
    } : null,
    tactical_profile: tacticalRow ? {
      players: maybeNumber(tacticalRow.players),
      avg_serve: maybeNumber(tacticalRow.avg_serve),
      avg_return: maybeNumber(tacticalRow.avg_return),
      avg_break_conv: maybeNumber(tacticalRow.avg_break_conv),
      avg_rally_short: maybeNumber(tacticalRow.avg_rally_short),
      avg_rally_long: maybeNumber(tacticalRow.avg_rally_long),
      avg_fh_dom: maybeNumber(tacticalRow.avg_fh_dom),
      avg_bh_stab: maybeNumber(tacticalRow.avg_bh_stab),
      avg_pressure: maybeNumber(tacticalRow.avg_pressure),
      avg_break2: maybeNumber(tacticalRow.avg_break2),
      avg_break3: maybeNumber(tacticalRow.avg_break3)
    } : null
  };
  return player;
}

function main() {
  const currentPlayers = loadCurrentPlayers();
  const currentById = new Map(currentPlayers.map((player) => [player.id, player]));

  const breakRows = parseCsv(fs.readFileSync(CSV_PATHS.breakModel, 'utf8'));
  const eraRows = parseCsv(fs.readFileSync(CSV_PATHS.eraMap, 'utf8'));
  const matrixRows = parseCsv(fs.readFileSync(CSV_PATHS.playerMatrix, 'utf8'));
  const tacticalRows = parseCsv(fs.readFileSync(CSV_PATHS.tacticalMap, 'utf8'));

  const breakByName = csvMapBy(breakRows, 'player');
  const eraByBucket = csvMapBy(eraRows.map((row) => ({ ...row, era_bucket: normalizeEraBucket(row.era_bucket) })), 'era_bucket');
  const tacticalByBucket = csvMapBy(tacticalRows, 'style_bucket');

  const playersV2 = [];
  const seen = new Set();

  for (const row of matrixRows) {
    const currentPlayer = currentById.get(row.id);
    const breakRow = breakByName.get(row.player);
    const eraRow = eraByBucket.get(normalizeEraBucket(row.era_bucket));
    const tacticalRow = tacticalByBucket.get(row.style_bucket);
    playersV2.push(mergePlayer(currentPlayer, row, breakRow, eraRow, tacticalRow));
    seen.add(row.id);
  }

  const carryOver = currentPlayers
    .filter((player) => !seen.has(player.id))
    .map((player) => {
      const start = parseInt(String(player.era).split('-')[0], 10);
      const eraBucket = start >= 2010 ? '2010s+' : start >= 2000 ? '2000s' : start >= 1990 ? '90s' : start >= 1980 ? '80s' : '70s';
      const eraRow = eraByBucket.get(normalizeEraBucket(eraBucket));
      const tacticalRow = tacticalByBucket.get(player.style);
      return buildFallbackPlayer(player, eraRow, tacticalRow);
    });

  playersV2.push(...carryOver);
  playersV2.sort((a, b) => a.name.localeCompare(b.name));

  const header = [
    '// Auto-generated from tennis_player_matrix_99.csv + tennis_break_model.csv + tennis_era_map.csv + tennis_tactical_map.csv',
    '// Build script: tools/build_players_v2_from_csv.js',
    `// Generated at: ${new Date().toISOString()}`,
    '// Missing in matrix, carried over from legacy players.js: ' + carryOver.map((player) => player.id).join(', '),
    ''
  ].join('\n');

  const body = 'const PLAYERS_V2 = ' + JSON.stringify(playersV2, null, 2) + ';\n'
    + '\nif (typeof window !== "undefined") window.PLAYERS_V2 = PLAYERS_V2;\n';

  fs.writeFileSync(OUTPUT_PATH, header + body, 'utf8');

  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`CSV players merged: ${matrixRows.length}`);
  console.log(`Legacy players carried over: ${carryOver.length}`);
}

main();
