const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RESULTS_EXTRA_PATH = path.join(ROOT, 'js', 'results_extra.js');
const SET_CONTROL_PATH = path.join(ROOT, 'js', 'player_set_control_surface.js');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');

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

function buildPlayerMeta(players) {
  const byKey = new Map();
  for (const player of players) {
    const keys = new Set([player.id, normalizeName(player.name)]);
    for (const key of keys) {
      byKey.set(key, player.id);
    }
  }
  return byKey;
}

function createBucket() {
  return {
    matches: 0,
    correct: 0,
    skippedTies: 0,
    totalAbsDiff: 0
  };
}

function updateBucket(bucket, diff, correct) {
  bucket.matches += 1;
  bucket.correct += correct ? 1 : 0;
  bucket.totalAbsDiff += Math.abs(diff);
}

function summarize(bucket) {
  return {
    matches: bucket.matches,
    accuracy: bucket.matches ? +(bucket.correct / bucket.matches).toFixed(4) : null,
    avgAbsDiff: bucket.matches ? +(bucket.totalAbsDiff / bucket.matches).toFixed(2) : null,
    skippedTies: bucket.skippedTies
  };
}

function empiricalLevel(row, surface) {
  const breakSets = row.surfaces[surface].breakLeadSets || 0;
  const twoLeadSets = row.surfaces[surface].twoGameLeadSets || 0;
  const minCases = Math.min(breakSets, twoLeadSets);
  if (minCases >= 25) return 'strong';
  if (minCases >= 10) return 'medium';
  if (minCases >= 1) return 'light';
  return 'proxy';
}

function bestMetricWinner(p1, p2, surface, metric) {
  const p1Value = p1.surfaces[surface][metric];
  const p2Value = p2.surfaces[surface][metric];
  if (!Number.isFinite(p1Value) || !Number.isFinite(p2Value)) return null;
  if (p1Value === p2Value) return null;
  return {
    winnerId: p1Value > p2Value ? p1.id : p2.id,
    diff: p1Value - p2Value
  };
}

function main() {
  const resultsExtra = loadVar(RESULTS_EXTRA_PATH, 'RESULTS_EXTRA');
  const setControl = loadVar(SET_CONTROL_PATH, 'window.PLAYER_SET_CONTROL_SURFACE');
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const index = fieldsIndex(resultsExtra.fields);
  const playerIdsByKey = buildPlayerMeta(players);
  const setControlById = setControl.byId;

  const summary = {
    all: createBucket(),
    bySurface: Object.fromEntries(SURFACES.map((surface) => [surface, createBucket()])),
    byLevel: {
      strong: createBucket(),
      medium: createBucket(),
      light: createBucket(),
      proxy: createBucket()
    },
    closeBreak: createBucket(),
    holdLead: createBucket()
  };

  for (const matchRaw of resultsExtra.matches) {
    const row = rowObject(matchRaw, index);
    if (!SURFACES.includes(row.surface)) continue;

    const p1Id = playerIdsByKey.get(row.server1_key) || playerIdsByKey.get(normalizeName(row.server1));
    const p2Id = playerIdsByKey.get(row.server2_key) || playerIdsByKey.get(normalizeName(row.server2));
    if (!p1Id || !p2Id) continue;

    const p1 = setControlById[p1Id];
    const p2 = setControlById[p2Id];
    if (!p1 || !p2) continue;

    const overallPick = bestMetricWinner(p1, p2, row.surface, 'setControlSurface100');
    if (!overallPick) {
      summary.all.skippedTies += 1;
      summary.bySurface[row.surface].skippedTies += 1;
      continue;
    }

    const actualWinnerId = row.winner === 1 ? p1Id : p2Id;
    const correct = overallPick.winnerId === actualWinnerId;
    updateBucket(summary.all, overallPick.diff, correct);
    updateBucket(summary.bySurface[row.surface], overallPick.diff, correct);

    const level1 = empiricalLevel(p1, row.surface);
    const level2 = empiricalLevel(p2, row.surface);
    const levelOrder = { strong: 3, medium: 2, light: 1, proxy: 0 };
    const pairLevel = levelOrder[level1] <= levelOrder[level2] ? level1 : level2;
    updateBucket(summary.byLevel[pairLevel], overallPick.diff, correct);

    const closeBreakPick = bestMetricWinner(p1, p2, row.surface, 'setCloseBreak100');
    if (closeBreakPick) {
      updateBucket(summary.closeBreak, closeBreakPick.diff, closeBreakPick.winnerId === actualWinnerId);
    } else {
      summary.closeBreak.skippedTies += 1;
    }

    const holdLeadPick = bestMetricWinner(p1, p2, row.surface, 'setHoldLead100');
    if (holdLeadPick) {
      updateBucket(summary.holdLead, holdLeadPick.diff, holdLeadPick.winnerId === actualWinnerId);
    } else {
      summary.holdLead.skippedTies += 1;
    }
  }

  console.log('Set control surface signal evaluation on known-surface PBP matches');
  console.log('\nOverall setControlSurface100:');
  console.log(summarize(summary.all));

  console.log('\nBy surface:');
  for (const surface of SURFACES) {
    console.log(surface, summarize(summary.bySurface[surface]));
  }

  console.log('\nBy minimum empirical strength of the pair:');
  for (const level of ['strong', 'medium', 'light', 'proxy']) {
    console.log(level, summarize(summary.byLevel[level]));
  }

  console.log('\nComponent metrics alone:');
  console.log('setCloseBreak100', summarize(summary.closeBreak));
  console.log('setHoldLead100', summarize(summary.holdLead));
}

main();
