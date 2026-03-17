const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players.js');
const RANKING_DATA_PATH = path.join(ROOT, 'js', 'goat_ranking_v2_data.js');

function loadJsVar(filePath, varName) {
  const ctx = { console, Math };
  ctx.globalThis = ctx;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__=${varName};`;
  vm.runInNewContext(code, ctx, { filename: path.basename(filePath) });
  return ctx.__OUT__;
}

function loadJsonFromWindowAssignment(filePath, prefixVar) {
  const text = fs.readFileSync(filePath, 'utf8');
  const prefix = `window.${prefixVar} = `;
  if (!text.startsWith(prefix)) {
    throw new Error(`Unexpected format in ${filePath}`);
  }
  return JSON.parse(text.slice(prefix.length).replace(/;\s*$/, ''));
}

function eraBucket(player) {
  const start = parseInt(String(player.era).split('-')[0], 10);
  if (start >= 2010) return '2010s';
  if (start >= 2000) return '2000s';
  if (start >= 1990) return '90s';
  if (start >= 1980) return '80s';
  return '70s';
}

function isBigServer(player) {
  const s = player.stats;
  return (
    (s.serve_kmh || 0) >= 220 ||
    (s.win1st || 0) >= 0.79 ||
    (s.rally_short || 0) >= 43 ||
    (s.winners || 0) >= 42 ||
    /Serve/.test(player.style)
  );
}

function fmtPct(v) {
  return (v * 100).toFixed(1) + '%';
}

function fmtDelta(v) {
  return (v > 0 ? '+' : '') + v.toFixed(1) + ' pp';
}

function main() {
  const players = loadJsVar(PLAYERS_PATH, 'PLAYERS');
  const ranking = loadJsonFromWindowAssignment(RANKING_DATA_PATH, 'GOAT_RANKING_V2_DATA');

  const byId = new Map(players.map((p) => [p.id, p]));
  const rows = [];

  for (const era of ranking.eras) {
    for (const row of era.overall) {
      const player = byId.get(row.id);
      if (!player || !isBigServer(player)) continue;
      if (row.realMatches < 20) continue;
      if (row.deltaPctPoints <= 10) continue;

      rows.push({
        id: row.id,
        name: row.name,
        era: era.key,
        simRank: row.rank,
        realRank: row.realRank,
        simPct: row.winPct,
        realPct: row.realWinPct,
        delta: row.deltaPctPoints,
        realMatches: row.realMatches,
        style: player.style,
        serve_kmh: player.stats.serve_kmh,
        serve1pct: player.stats.serve1pct,
        win1st: player.stats.win1st,
        win2nd: player.stats.win2nd,
        returnWin: player.stats.returnWin,
        winners: player.stats.winners,
        errors: player.stats.errors,
        rally_short: player.stats.rally_short,
        rally_mid: player.stats.rally_mid,
        rally_long: player.stats.rally_long,
        net_win: player.net_win,
        hard: player.stats.surface.hard,
        clay: player.stats.surface.clay,
        grass: player.stats.surface.grass
      });
    }
  }

  rows.sort((a, b) => b.delta - a.delta || b.realMatches - a.realMatches);

  console.log('AUDITORIA DE SACADORES ESPECIALISTAS INFLADOS (> +10 pp, muestra suficiente)\n');
  for (const r of rows) {
    console.log(`${r.name} [${r.era}]`);
    console.log(`  sim ${fmtPct(r.simPct)} | real ${fmtPct(r.realPct)} | delta ${fmtDelta(r.delta)} | n=${r.realMatches}`);
    console.log(`  ranks sim/real: ${r.simRank}/${r.realRank} | style: ${r.style}`);
    console.log(`  serve_kmh=${r.serve_kmh} serve1pct=${r.serve1pct} win1st=${r.win1st} win2nd=${r.win2nd} returnWin=${r.returnWin}`);
    console.log(`  winners=${r.winners} errors=${r.errors} rally=${r.rally_short}/${r.rally_mid}/${r.rally_long} net_win=${r.net_win}`);
    console.log(`  surface H/C/G=${r.hard}/${r.clay}/${r.grass}`);
    console.log('');
  }

  console.log(`Total encontrados: ${rows.length}`);
}

main();
