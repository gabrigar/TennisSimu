const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const RESULTS_PLAYERS_PATH = path.join(ROOT, 'js', 'results_extra_players.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'player_game_control.js');

function loadVar(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentileScale(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function weightForMatches(matches) {
  if (matches >= 20) return 1;
  if (matches >= 8) return 0.6;
  if (matches >= 1) return 0.3;
  return 0;
}

function getPressureIndex(player) {
  const model = player.model || {};
  const stats = player.stats || {};
  if (typeof model.pressure_index_100 === 'number') return model.pressure_index_100;
  return (stats.returnWin || 0.42) * 60
    + (stats.breakConvert || 0.42) * 40
    + (stats.rally_long || 26) / 2.5;
}

function getBaseServe(player) {
  const stats = player.stats || {};
  return (stats.serve1pct || 0.61) * (stats.win1st || 0.74)
    + (1 - (stats.serve1pct || 0.61)) * (stats.win2nd || 0.54);
}

function computeProxy(player) {
  const stats = player.stats || {};
  const pressure = getPressureIndex(player);
  const baseServe = getBaseServe(player);
  const tbWin = player.tb_win || 0.62;
  const breakSave = stats.breakSave || 0.64;
  const proxy = 50
    + (tbWin - 0.62) * 110
    + (baseServe - 0.645) * 180
    + (breakSave - 0.64) * 40
    + (pressure - 50) * 0.12;
  return clamp(proxy, 25, 80);
}

function buildDataset(players, resultsPlayers) {
  const resultsById = new Map(resultsPlayers.players.map((player) => [player.id, player]));
  const eligible = players
    .map((player) => {
      const row = resultsById.get(player.id);
      return row ? {
        id: player.id,
        matches: row.overall.matches,
        continuePct: row.overall.continueAfterTwoWinsPct,
        streak3Pct: row.overall.matchWinStreak3Pct,
        avgWin: row.overall.avgMaxWinStreak
      } : null;
    })
    .filter((row) => row && row.matches >= 20 && row.continuePct != null && row.streak3Pct != null && row.avgWin != null);

  const mins = {
    continuePct: Math.min(...eligible.map((row) => row.continuePct)),
    streak3Pct: Math.min(...eligible.map((row) => row.streak3Pct)),
    avgWin: Math.min(...eligible.map((row) => row.avgWin))
  };
  const maxs = {
    continuePct: Math.max(...eligible.map((row) => row.continuePct)),
    streak3Pct: Math.max(...eligible.map((row) => row.streak3Pct)),
    avgWin: Math.max(...eligible.map((row) => row.avgWin))
  };

  const rows = players.map((player) => {
    const res = resultsById.get(player.id);
    const matches = res?.overall.matches || 0;
    const continuePct = res?.overall.continueAfterTwoWinsPct ?? null;
    const streak3Pct = res?.overall.matchWinStreak3Pct ?? null;
    const avgWin = res?.overall.avgMaxWinStreak ?? null;
    const empirical = (continuePct != null && streak3Pct != null && avgWin != null)
      ? 100 * (
        0.45 * percentileScale(continuePct, mins.continuePct, maxs.continuePct)
        + 0.35 * percentileScale(streak3Pct, mins.streak3Pct, maxs.streak3Pct)
        + 0.20 * percentileScale(avgWin, mins.avgWin, maxs.avgWin)
      )
      : null;
    const proxy = computeProxy(player);
    const empiricalWeight = weightForMatches(matches);
    const finalValue = empirical == null
      ? proxy
      : proxy * (1 - empiricalWeight) + empirical * empiricalWeight;

    return {
      id: player.id,
      name: player.name,
      matches,
      empirical_game_control_100: empirical == null ? null : round(empirical, 1),
      proxy_game_control_100: round(proxy, 1),
      game_control_100: round(finalValue, 1),
      continueAfterTwoWinsPct: continuePct == null ? null : round(continuePct, 4),
      matchWinStreak3Pct: streak3Pct == null ? null : round(streak3Pct, 4),
      avgMaxWinStreak: avgWin == null ? null : round(avgWin, 2),
      holdPct: res?.overall.holdPct == null ? null : round(res.overall.holdPct, 4)
    };
  }).sort((a, b) => b.game_control_100 - a.game_control_100 || b.matches - a.matches || a.name.localeCompare(b.name));

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
  const values = rows.map((row) => row.game_control_100).filter(Number.isFinite);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'results_extra_players.js + players_v3.js',
    description: 'Game-level control derived from positive game-streak patterns, blended with serve/tiebreak/pressure proxy when PBP sample is small.',
    average_game_control_100: round(average, 2),
    top10: rows.slice(0, 10),
    byId
  };
}

function writeOutput(data) {
  const banner = [
    '// Auto-generated by tools/build_player_game_control.js',
    `// Source: ${data.source}`,
    `// Average: ${data.average_game_control_100}`
  ].join('\n');

  const body = 'window.PLAYER_GAME_CONTROL = '
    + JSON.stringify(data)
    + ';\nwindow.PLAYER_GAME_CONTROL_BY_ID = window.PLAYER_GAME_CONTROL.byId;\n';
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const resultsPlayers = loadVar(RESULTS_PLAYERS_PATH, 'window.RESULTS_EXTRA_PLAYERS');
  const data = buildDataset(players, resultsPlayers);
  writeOutput(data);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
