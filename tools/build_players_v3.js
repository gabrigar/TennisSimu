const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_V1_PATH = path.join(ROOT, 'js', 'players.js');
const PLAYERS_V2_PATH = path.join(ROOT, 'js', 'players_v2.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'players_v3.js');
const ERA_MAP_PATH = 'C:/Users/gabri/Downloads/tennis_era_map.csv';
const TACTICAL_MAP_PATH = 'C:/Users/gabri/Downloads/tennis_tactical_map.csv';

const MANUAL_V3_ENRICHMENT = {
  davidovich: {
    hand: 'R',
    height: 180,
    style_code: 2,
    style_bucket: 'Baseliner defensivo',
    w_set: 10,
    ue_set: 11,
    ratio_set_est: 0.91,
    fh_dom_100: 72.5,
    bh_stab_100: 77.5,
    pressure_index_100: 72.0,
    rally_short: 35,
    rally_mid: 34,
    rally_long: 31,
    comeback_proxy: 0.66
  },
  mensik: {
    hand: 'R',
    height: 196,
    style_code: 1,
    style_bucket: 'Servicio dominante',
    w_set: 11,
    ue_set: 10,
    ratio_set_est: 1.10,
    fh_dom_100: 81.0,
    bh_stab_100: 70.0,
    pressure_index_100: 63.0,
    rally_short: 42,
    rally_mid: 33,
    rally_long: 25,
    comeback_proxy: 0.60
  },
  cerundolo: {
    hand: 'R',
    height: 185,
    style_code: 5,
    style_bucket: 'Baseliner ofensivo',
    w_set: 12,
    ue_set: 10,
    ratio_set_est: 1.20,
    fh_dom_100: 86.0,
    bh_stab_100: 67.5,
    pressure_index_100: 68.0,
    rally_short: 40,
    rally_mid: 34,
    rally_long: 26,
    comeback_proxy: 0.64
  },
  cobolli: {
    hand: 'R',
    height: 183,
    style_code: 2,
    style_bucket: 'Baseliner defensivo',
    w_set: 10,
    ue_set: 10,
    ratio_set_est: 1.00,
    fh_dom_100: 75.0,
    bh_stab_100: 74.0,
    pressure_index_100: 69.0,
    rally_short: 37,
    rally_mid: 34,
    rally_long: 29,
    comeback_proxy: 0.65
  },
  bublik: {
    hand: 'R',
    height: 196,
    style_code: 5,
    style_bucket: 'Servicio dominante',
    w_set: 12,
    ue_set: 13,
    ratio_set_est: 0.92,
    fh_dom_100: 89.0,
    bh_stab_100: 56.0,
    pressure_index_100: 54.0,
    rally_short: 46,
    rally_mid: 31,
    rally_long: 23,
    comeback_proxy: 0.55
  }
};

function loadVar(filePath, varName) {
  const ctx = { console, Math, window: {} };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__=${varName};`;
  vm.runInNewContext(code, ctx, { filename: path.basename(filePath) });
  return ctx.__OUT__;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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

function mapBy(rows, key) {
  const out = new Map();
  for (const row of rows) out.set(row[key], row);
  return out;
}

function normalizeEraBucket(value) {
  if (value === '70s/prev') return '70s';
  return value;
}

function inferEraBucket(player) {
  const start = parseInt(String(player.era).split('-')[0], 10);
  if (start >= 2010) return '2010s+';
  if (start >= 2000) return '2000s';
  if (start >= 1990) return '90s';
  if (start >= 1980) return '80s';
  return '70s';
}

function inferStyleBucket(player) {
  const style = player.style || '';
  const s = player.stats || {};

  if (/Serve & Volley/i.test(style)) return 'Serve & Volley';
  if (/Serve & Baseline/i.test(style)) return 'Servicio dominante';
  if (/All-court/i.test(style)) {
    if ((s.net_win || player.net_win || 0) >= 0.68 && (s.rally_short || 0) >= 40) return 'Atacante de red';
    return 'All-court / cambios de ritmo';
  }
  if (/Baseliner/i.test(style)) {
    if ((s.returnWin || 0) >= 0.42 || (s.rally_long || 0) >= 28) return 'Baseliner defensivo';
    return 'All-court / cambios de ritmo';
  }
  return 'All-court / cambios de ritmo';
}

function refineStyleBucket(player, baseBucket, manualBucket) {
  if (manualBucket) return manualBucket;

  const style = player.style || '';
  const s = player.stats || {};
  const winners = s.winners || 0;
  const fh = s.fh_kmh || 145;
  const short = s.rally_short || 40;
  const long = s.rally_long || 26;
  const ret = s.returnWin || 0.42;
  const net = player.net_win || 0.65;

  const offensiveBaseliner =
    (/Baseliner/i.test(style) || /All-court/i.test(style))
    && winners >= 38
    && fh >= 150
    && short >= 38
    && long <= 28
    && ret >= 0.39
    && ret <= 0.47
    && net <= 0.70;

  if (offensiveBaseliner) return 'Baseliner ofensivo';
  return baseBucket;
}

function tacticalBucketForRefined(refinedBucket) {
  if (refinedBucket === 'Baseliner ofensivo') return 'All-court / cambios de ritmo';
  return refinedBucket;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function blend(playerValue, styleValue, eraValue, weights) {
  let total = 0;
  let sum = 0;
  if (typeof playerValue === 'number') {
    sum += playerValue * weights.player;
    total += weights.player;
  }
  if (typeof styleValue === 'number') {
    sum += styleValue * weights.style;
    total += weights.style;
  }
  if (typeof eraValue === 'number') {
    sum += eraValue * weights.era;
    total += weights.era;
  }
  return total ? sum / total : null;
}

function buildImputedModel(player, eraRow, tacticalRow) {
  const manual = MANUAL_V3_ENRICHMENT[player.id];
  if (manual) {
    return {
      source: 'manual_v3',
      point_dominance_index: round((((manual.fh_dom_100 / 50) - 1) * 10) + ((manual.ratio_set_est - 1) * 20), 1),
      fh_dom_100: manual.fh_dom_100,
      bh_stab_100: manual.bh_stab_100,
      pressure_index_100: manual.pressure_index_100,
      long_rally_penalty_100: round(clamp(62 - manual.rally_long - Math.max(0, (manual.ratio_set_est - 1) * 18), 10, 70), 1),
      hold_strength_100: round(clamp(((player.stats.win1st || 0.74) * 55) + ((player.stats.win2nd || 0.53) * 45), 55, 85), 1),
      break_prob_model: round(clamp(player.stats.breakConvert || 0.42, 0.32, 0.55), 3),
      break2_consecutive_model: round(clamp((manual.pressure_index_100 / 100) * 0.32 + (player.stats.breakConvert || 0.42) * 0.09, 0.14, 0.30), 3),
      break3_consecutive_model: round(clamp((manual.pressure_index_100 / 100) * 0.14 + (manual.comeback_proxy || 0.6) * 0.03, 0.05, 0.16), 3),
      pressure_proxy: manual.pressure_index_100,
      long_rally_break_penalty_proxy: round(clamp(60 - manual.rally_long, 12, 65), 1)
    };
  }

  const s = player.stats || {};
  const avgServe = blend(s.serve_kmh, maybeNumber(tacticalRow?.avg_serve), maybeNumber(eraRow?.avg_serve), { player: 0.65, style: 0.2, era: 0.15 });
  const avgReturn = blend(s.returnWin, maybeNumber(tacticalRow?.avg_return), maybeNumber(eraRow?.avg_return), { player: 0.65, style: 0.2, era: 0.15 });
  const avgBreakConv = blend(s.breakConvert, maybeNumber(tacticalRow?.avg_break_conv), maybeNumber(eraRow?.avg_break_conv), { player: 0.7, style: 0.15, era: 0.15 });
  const avgRallyShort = blend(s.rally_short, maybeNumber(tacticalRow?.avg_rally_short), maybeNumber(eraRow?.avg_rally_short), { player: 0.7, style: 0.2, era: 0.1 });
  const avgRallyLong = blend(s.rally_long, maybeNumber(tacticalRow?.avg_rally_long), maybeNumber(eraRow?.avg_rally_long), { player: 0.7, style: 0.2, era: 0.1 });
  const avgPressure = blend(
    ((s.breakSave || 0) * 100) - ((s.errors || 0) * 0.8) + ((s.winners || 0) * 0.3),
    maybeNumber(tacticalRow?.avg_pressure),
    maybeNumber(eraRow?.avg_pressure),
    { player: 0.55, style: 0.25, era: 0.2 }
  );
  const avgBreak2 = blend(
    ((s.breakConvert || 0) * (1 - (s.breakSave || 0) * 0.3)),
    maybeNumber(tacticalRow?.avg_break2),
    maybeNumber(eraRow?.avg_break2),
    { player: 0.55, style: 0.25, era: 0.2 }
  );
  const avgBreak3 = blend(
    (avgBreak2 != null ? avgBreak2 * 0.46 : null),
    maybeNumber(tacticalRow?.avg_break3),
    (maybeNumber(eraRow?.avg_break2) != null ? maybeNumber(eraRow.avg_break2) * 0.43 : null),
    { player: 0.5, style: 0.3, era: 0.2 }
  );

  const fhDom = clamp((((s.fh_kmh || 145) - 120) / 55) * 100, 55, 98);
  const bhStab = clamp(
    100 - (((s.errors || 24) - 18) * 2.2) + (((s.rally_long || 26) - 25) * 1.8) + (((s.returnWin || 0.42) - 0.42) * 100),
    60,
    96
  );
  const pointDom = clamp(
    (((s.win1st || 0.74) - 0.70) * 100)
      + (((s.win2nd || 0.53) - 0.50) * 80)
      + (((s.returnWin || 0.42) - 0.40) * 100)
      + (((s.breakConvert || 0.40) - 0.40) * 100)
      - (((s.errors || 26) - 24) * 1.6),
    -15,
    25
  );

  return {
    source: 'imputed_v3',
    point_dominance_index: round(pointDom, 1),
    fh_dom_100: round(fhDom, 1),
    bh_stab_100: round(bhStab, 1),
    pressure_index_100: round(clamp(avgPressure, 25, 60), 1),
    long_rally_penalty_100: round(clamp(55 - (s.rally_long || 26) + Math.max(0, (s.errors || 26) - 24) * 1.4, 8, 70), 1),
    hold_strength_100: round(clamp(((s.win1st || 0.74) * 55) + ((s.win2nd || 0.53) * 45), 55, 85), 1),
    break_prob_model: round(clamp((s.breakConvert || avgBreakConv || 0.42), 0.32, 0.55), 3),
    break2_consecutive_model: round(clamp(avgBreak2, 0.14, 0.30), 3),
    break3_consecutive_model: round(clamp(avgBreak3, 0.05, 0.16), 3),
    pressure_proxy: round(clamp(avgPressure, 25, 60), 1),
    long_rally_break_penalty_proxy: round(clamp(55 - (avgRallyLong || 26) + Math.max(0, (s.errors || 26) - 24), 8, 70), 1)
  };
}

function buildImputedContext(player, eraRow, tacticalRow, eraBucket, styleBucket) {
  return {
    era_bucket: eraBucket,
    style_bucket: styleBucket,
    style_bucket_refined: styleBucket,
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
}

function main() {
  const v1 = loadVar(PLAYERS_V1_PATH, 'PLAYERS');
  const v2 = loadVar(PLAYERS_V2_PATH, 'PLAYERS_V2');
  const v2ById = new Map(v2.map((player) => [player.id, player]));
  const eraRows = mapBy(parseCsv(fs.readFileSync(ERA_MAP_PATH, 'utf8')).map((row) => ({ ...row, era_bucket: normalizeEraBucket(row.era_bucket) })), 'era_bucket');
  const tacticalRows = mapBy(parseCsv(fs.readFileSync(TACTICAL_MAP_PATH, 'utf8')), 'style_bucket');

  const playersV3 = v1.map((player) => {
    const base = deepClone(player);
    const enriched = v2ById.get(player.id);
    const needsImputation = !enriched || enriched.model?.source === 'legacy_players_js' || !enriched.style_bucket;
    if (needsImputation) {
      const manual = MANUAL_V3_ENRICHMENT[base.id];
      const eraBucket = inferEraBucket(base);
      const styleBucket = manual?.style_bucket || inferStyleBucket(base);
      const eraRow = eraRows.get(eraBucket);
      const tacticalRow = tacticalRows.get(tacticalBucketForRefined(styleBucket));

      base.hand = manual?.hand || base.hand || '';
      if (manual?.height) base.height = manual.height;
      base.style_bucket = styleBucket;
      base.style_bucket_refined = styleBucket;
      base.style_code = manual?.style_code ?? base.style_code ?? null;
      base.data_type = base.data_type || base.stats?.data_type || '';
      if (manual?.comeback_proxy != null) {
        base.dec_win = manual.comeback_proxy;
      }
      if (manual?.rally_short != null && base.stats) {
        base.stats.rally_short = manual.rally_short;
        base.stats.rally_mid = manual.rally_mid;
        base.stats.rally_long = manual.rally_long;
      }
      base.model = buildImputedModel(base, eraRow, tacticalRow);
      base.context = buildImputedContext(base, eraRow, tacticalRow, eraBucket, styleBucket);
      base.v3_source = manual ? 'manual_v3' : 'imputed_v3';
      return base;
    }

    base.hand = enriched.hand || base.hand || '';
    base.style_bucket = enriched.style_bucket || base.style_bucket || '';
    base.style_bucket_refined = refineStyleBucket(base, base.style_bucket, null);
    base.style_code = enriched.style_code ?? base.style_code ?? null;
    base.data_type = enriched.data_type || base.data_type || base.stats?.data_type || '';
    base.model = deepClone(enriched.model || {});
    base.context = deepClone(enriched.context || {});
    if (base.context) {
      base.context.style_bucket_refined = base.style_bucket_refined;
    }
    base.v3_source = enriched.model?.source || 'players_v2';

    if (base.stats) {
      base.stats.data_type = base.stats.data_type || enriched.stats?.data_type || base.data_type || '';
    }

    return base;
  });

  const header = [
    '// Auto-generated conservative merge:',
    '// Base: js/players.js',
    '// Enrichment: js/players_v2.js',
    '// Rule: preserve all legacy player stats/metadata; add only new fields from v2',
    `// Generated at: ${new Date().toISOString()}`,
    ''
  ].join('\n');

  const body = 'const PLAYERS_V3 = ' + JSON.stringify(playersV3, null, 2) + ';\n'
    + '\nif (typeof window !== "undefined") window.PLAYERS_V3 = PLAYERS_V3;\n';

  fs.writeFileSync(OUTPUT_PATH, header + body, 'utf8');

  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Players merged: ${playersV3.length}`);
}

main();
