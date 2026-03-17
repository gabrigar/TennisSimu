const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_V1_PATH = path.join(ROOT, 'js', 'players.js');
const PLAYERS_V2_PATH = path.join(ROOT, 'js', 'players_v2.js');

const CORE_STATS = [
  'serve1pct',
  'win1st',
  'win2nd',
  'returnWin',
  'breakConvert',
  'breakSave',
  'serve_kmh',
  'fh_kmh',
  'bh_kmh',
  'rest_kmh',
  'winners',
  'errors',
  'rally_short',
  'rally_mid',
  'rally_long'
];

function loadVar(filePath, varName) {
  const ctx = { console, Math, window: {} };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__=${varName};`;
  vm.runInNewContext(code, ctx, { filename: path.basename(filePath) });
  return ctx.__OUT__;
}

function get(obj, pathStr) {
  return pathStr.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function formatDelta(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(3)}`;
}

function comparePlayers(v1, v2) {
  const v1ById = new Map(v1.map((player) => [player.id, player]));
  const v2ById = new Map(v2.map((player) => [player.id, player]));
  const allIds = Array.from(new Set([...v1ById.keys(), ...v2ById.keys()])).sort();

  const rows = [];
  for (const id of allIds) {
    const p1 = v1ById.get(id);
    const p2 = v2ById.get(id);
    rows.push({
      id,
      name: p2?.name || p1?.name || id,
      inV1: !!p1,
      inV2: !!p2,
      v1: p1,
      v2: p2
    });
  }

  return rows;
}

function summarizeStatDiffs(rows) {
  const summaries = [];

  for (const stat of CORE_STATS) {
    let changed = 0;
    let absSum = 0;
    let max = null;

    for (const row of rows) {
      if (!row.v1 || !row.v2) continue;
      const a = get(row.v1, `stats.${stat}`);
      const b = get(row.v2, `stats.${stat}`);
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      const diff = b - a;
      if (diff === 0) continue;
      changed += 1;
      absSum += Math.abs(diff);
      if (!max || Math.abs(diff) > Math.abs(max.diff)) {
        max = { name: row.name, id: row.id, before: a, after: b, diff };
      }
    }

    summaries.push({
      stat,
      changed,
      avgAbsDiff: changed ? absSum / changed : 0,
      max
    });
  }

  summaries.sort((a, b) => b.avgAbsDiff - a.avgAbsDiff || b.changed - a.changed);
  return summaries;
}

function topChangedPlayers(rows) {
  const scored = [];
  for (const row of rows) {
    if (!row.v1 || !row.v2) continue;
    let score = 0;
    const diffs = [];
    for (const stat of CORE_STATS) {
      const a = get(row.v1, `stats.${stat}`);
      const b = get(row.v2, `stats.${stat}`);
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      const diff = b - a;
      if (diff === 0) continue;
      score += Math.abs(diff);
      diffs.push({ stat, before: a, after: b, diff });
    }
    const netWinDiff = (row.v2.net_win ?? 0) - (row.v1.net_win ?? 0);
    const tbDiff = (row.v2.tb_win ?? 0) - (row.v1.tb_win ?? 0);
    const decDiff = (row.v2.dec_win ?? 0) - (row.v1.dec_win ?? 0);
    if (netWinDiff) {
      score += Math.abs(netWinDiff);
      diffs.push({ stat: 'net_win', before: row.v1.net_win, after: row.v2.net_win, diff: netWinDiff });
    }
    if (tbDiff) {
      score += Math.abs(tbDiff);
      diffs.push({ stat: 'tb_win', before: row.v1.tb_win, after: row.v2.tb_win, diff: tbDiff });
    }
    if (decDiff) {
      score += Math.abs(decDiff);
      diffs.push({ stat: 'dec_win', before: row.v1.dec_win, after: row.v2.dec_win, diff: decDiff });
    }

    if (diffs.length) {
      diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
      scored.push({
        id: row.id,
        name: row.name,
        score,
        diffs: diffs.slice(0, 8),
        source: row.v2.model?.source || 'unknown'
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored;
}

function surfaceDiffs(rows) {
  const stats = ['hard', 'clay', 'grass'];
  const out = [];
  for (const surf of stats) {
    let changed = 0;
    let absSum = 0;
    let max = null;
    for (const row of rows) {
      if (!row.v1 || !row.v2) continue;
      const a = get(row.v1, `stats.surface.${surf}`);
      const b = get(row.v2, `stats.surface.${surf}`);
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      const diff = b - a;
      if (diff === 0) continue;
      changed += 1;
      absSum += Math.abs(diff);
      if (!max || Math.abs(diff) > Math.abs(max.diff)) {
        max = { name: row.name, id: row.id, before: a, after: b, diff };
      }
    }
    out.push({
      surface: surf,
      changed,
      avgAbsDiff: changed ? absSum / changed : 0,
      max
    });
  }
  return out;
}

function main() {
  const v1 = loadVar(PLAYERS_V1_PATH, 'PLAYERS');
  const v2 = loadVar(PLAYERS_V2_PATH, 'PLAYERS_V2');
  const rows = comparePlayers(v1, v2);

  const onlyV1 = rows.filter((row) => row.inV1 && !row.inV2);
  const onlyV2 = rows.filter((row) => !row.inV1 && row.inV2);
  const statSummaries = summarizeStatDiffs(rows);
  const topPlayers = topChangedPlayers(rows);
  const surfSummaries = surfaceDiffs(rows);

  console.log('=== COVERAGE ===');
  console.log(`players.js: ${v1.length}`);
  console.log(`players_v2.js: ${v2.length}`);
  console.log(`Only in v1: ${onlyV1.length}`);
  console.log(`Only in v2: ${onlyV2.length}`);
  console.log('');

  console.log('=== TOP STAT SHIFTS ===');
  for (const item of statSummaries.slice(0, 10)) {
    const max = item.max;
    console.log(`${item.stat}: changed=${item.changed} avgAbsDiff=${item.avgAbsDiff.toFixed(3)} max=${max ? `${max.name} ${formatDelta(max.diff)} (${max.before} -> ${max.after})` : 'n/a'}`);
  }
  console.log('');

  console.log('=== SURFACE SHIFTS ===');
  for (const item of surfSummaries) {
    const max = item.max;
    console.log(`${item.surface}: changed=${item.changed} avgAbsDiff=${item.avgAbsDiff.toFixed(3)} max=${max ? `${max.name} ${formatDelta(max.diff)} (${max.before} -> ${max.after})` : 'n/a'}`);
  }
  console.log('');

  console.log('=== MOST CHANGED PLAYERS ===');
  for (const item of topPlayers.slice(0, 15)) {
    console.log(`${item.name} [${item.id}] score=${item.score.toFixed(3)} source=${item.source}`);
    for (const diff of item.diffs.slice(0, 6)) {
      console.log(`  ${diff.stat}: ${diff.before} -> ${diff.after} (${formatDelta(diff.diff)})`);
    }
  }
  console.log('');

  const csvV2 = v2.filter((player) => player.model?.source === 'csv_v2').length;
  const legacy = v2.filter((player) => player.model?.source === 'legacy_players_js').length;
  console.log('=== V2 STRUCTURE ===');
  console.log(`csv_v2 rows: ${csvV2}`);
  console.log(`legacy carry-over rows: ${legacy}`);
  console.log(`new fields present: model=${v2.filter((p) => !!p.model).length}, context=${v2.filter((p) => !!p.context).length}, style_bucket=${v2.filter((p) => !!p.style_bucket).length}`);
}

main();
