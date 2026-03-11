// =====================================================
// i18n — EN / ES
// =====================================================
const LANG = {
  en: {
    // Nav
    nav_simulator:   '⚡ Simulator',
    nav_stats:       '📊 Stats',
    nav_compare:     '🔄 Compare',
    nav_history:     '🔥 History',
    // Simulator
    player1:         'Player 1',
    player2:         'Player 2',
    search_player:   'Search player...',
    search_mob:      '🔍 Search player...',
    settings:        'Settings',
    sel_p1:          '— Select P1 —',
    sel_p2:          '— Select P2 —',
    surface:         'Surface',
    surf_hard:       'Hard',
    surf_clay:       'Clay',
    surf_grass:      'Grass',
    sets:            'Sets',
    final_tb:        'Final tiebreak',
    yes:             'Yes',
    no:              'No',
    simulate:        'SIMULATE MATCH',
    match_winner:    '🏆 Match winner',
    player_col:      'Player',
    games_col:       'Games',
    match_stats:     'Match stats',
    repeat:          '↩ REPEAT MATCH',
    change_p2:       '🔄 CHANGE PLAYER 2',
    reset_all:       '✕ RESET ALL',
    x100:            '× 100 MATCHES',
    x100_header:     '100 MATCHES',
    new_match:       '↩ New match',
    pick_p1:         'PICK PLAYER 1',
    pick_p2:         'PICK PLAYER 2',
    // Match stat rows
    stat_aces:       'Aces',
    stat_df:         'Double faults',
    stat_winners:    'Winners',
    stat_ue:         'Unforced errors',
    stat_breaks:     'Breaks converted',
    stat_games:      'Games won',
    stat_short:      'Points 0–4 shots',
    stat_mid:        'Points 5–8 shots',
    stat_long:       'Points 9+ shots',
    // Stats page
    database:        'Database',
    players_lbl:     'players',
    search_name:     'Search name...',
    all:             'All',
    sel_player:      'Select a player to view their stats',
    sel_two:         'Select two players to compare them',
    stroke_speeds:   'Stroke speeds',
    sim_stats:       'Simulation stats',
    tb_won:          'Tiebreaks won',
    surf_advantage:  'Surface advantage',
    surf_modifiers:  'Surface modifiers',
    return_pct:      'Return %',
    when_chance:     'When has chance',
    max_pressure:    'Max pressure',
    rally_dist:      'Rally distribution',
    rally_mid_lbl:   'medium rallies, point building',
    rally_long_lbl:  'long rallies, endurance, fitness',
    stat_col:        'Stat',
    val_col:         'Value',
    pct_col:         'Percentile',
    serve_speed:     'Max serve',
    fh_speed:        'FH speed',
    bh_speed:        'BH speed',
    return_speed:    'Return speed',
    return_row:      'Return',
    // Comparador
    titles:          'TITLES',
    total_titles:    'TOTAL TITLES',
    clear_sel:       '↩ Clear selection',
    // History page
    hist_title:      'HISTORICAL RESULTS',
    hist_sub:        '9,489 real matches · 1985–2024 · 99 players',
    lbl_p1:          'PLAYER 1',
    lbl_p2:          'PLAYER 2',
    lbl_surface:     'SURFACE',
    lbl_level:       'LEVEL',
    lbl_year_from:   'YEAR FROM',
    lbl_year_to:     'YEAR TO',
    all_surf:        'All',
    filter_btn:      'FILTER',
    reset_btn:       'RESET',
    th_year:         'YEAR',
    th_tournament:   'TOURNAMENT',
    th_level:        'LEVEL',
    th_round:        'ROUND',
    th_surface:      'SURFACE',
    th_winner:       'WINNER',
    th_loser:        'LOSER',
    th_result:       'RESULT',
    matches_found:   'matches found',
    players_loaded:  'players loaded',
  },
  es: {
    // Nav
    nav_simulator:   '⚡ Simulador',
    nav_stats:       '📊 Estadísticas',
    nav_compare:     '🔄 Comparador',
    nav_history:     '🔥 Histórico',
    // Simulator
    player1:         'Jugador 1',
    player2:         'Jugador 2',
    search_player:   'Buscar jugador...',
    search_mob:      '🔍 Buscar jugador...',
    settings:        'Configuración',
    sel_p1:          '— Selecciona P1 —',
    sel_p2:          '— Selecciona P2 —',
    surface:         'Superficie',
    surf_hard:       'Dura',
    surf_clay:       'Tierra',
    surf_grass:      'Hierba',
    sets:            'Sets',
    final_tb:        'Tiebreak final',
    yes:             'Sí',
    no:              'No',
    simulate:        'SIMULAR PARTIDO',
    match_winner:    '🏆 Ganador del partido',
    player_col:      'Jugador',
    games_col:       'Juegos',
    match_stats:     'Estadísticas del partido',
    repeat:          '↩ REPETIR PARTIDO',
    change_p2:       '🔄 CAMBIAR JUGADOR 2',
    reset_all:       '✕ CAMBIAR TODO',
    x100:            '× 100 PARTIDOS',
    x100_header:     '100 PARTIDOS',
    new_match:       '↩ Nuevo partido',
    pick_p1:         'ELIGE JUGADOR 1',
    pick_p2:         'ELIGE JUGADOR 2',
    // Match stat rows
    stat_aces:       'Aces',
    stat_df:         'Dobles faltas',
    stat_winners:    'Winners',
    stat_ue:         'Errores no forzados',
    stat_breaks:     'Breaks convertidos',
    stat_games:      'Juegos ganados',
    stat_short:      'Puntos 0–4 golpes',
    stat_mid:        'Puntos 5–8 golpes',
    stat_long:       'Puntos 9+ golpes',
    // Stats page
    database:        'Base de datos',
    players_lbl:     'jugadores',
    search_name:     'Buscar nombre...',
    all:             'Todos',
    sel_player:      'Selecciona un jugador para ver sus estadísticas',
    sel_two:         'Selecciona dos jugadores para compararlos',
    stroke_speeds:   'Velocidades de golpeo',
    sim_stats:       'Estadísticas de simulación',
    tb_won:          'Tiebreaks ganados',
    surf_advantage:  'Ventaja por superficie',
    surf_modifiers:  'Modificadores por superficie',
    return_pct:      '% Devolución',
    when_chance:     'Cuando tiene opción',
    max_pressure:    'Presión máxima',
    rally_dist:      'Distribución de rallies',
    rally_mid_lbl:   'rallies medios, construcción del punto',
    rally_long_lbl:  'rallies largos, resistencia, físico',
    stat_col:        'Estadística',
    val_col:         'Valor',
    pct_col:         'Percentil',
    serve_speed:     'Saque máx.',
    fh_speed:        'Derecha',
    bh_speed:        'Revés',
    return_speed:    'Resto punta',
    return_row:      'Devolución',
    // Comparador
    titles:          'PALMARÉS',
    total_titles:    'TOTAL TÍTULOS',
    clear_sel:       '↩ Limpiar selección',
    // History page
    hist_title:      'RESULTADOS HISTÓRICOS',
    hist_sub:        '9.489 partidos reales · 1985–2024 · 99 jugadores',
    lbl_p1:          'JUGADOR 1',
    lbl_p2:          'JUGADOR 2',
    lbl_surface:     'SUPERFICIE',
    lbl_level:       'NIVEL',
    lbl_year_from:   'AÑO DESDE',
    lbl_year_to:     'AÑO HASTA',
    all_surf:        'Todas',
    filter_btn:      'FILTRAR',
    reset_btn:       'RESET',
    th_year:         'AÑO',
    th_tournament:   'TORNEO',
    th_level:        'NIVEL',
    th_round:        'RONDA',
    th_surface:      'SUPERFICIE',
    th_winner:       'GANADOR',
    th_loser:        'PERDEDOR',
    th_result:       'RESULTADO',
    matches_found:   'partidos encontrados',
    players_loaded:  'jugadores cargados',
  }
};

let currentLang = localStorage.getItem('lang') || 'en';
function t(key) { return LANG[currentLang][key] || LANG.en[key] || key; }

function applyLang() {
  const L = currentLang;
  // Nav tabs
  const tabs = document.querySelectorAll('.nav-tab');
  const tabKeys = ['nav_simulator','nav_stats','nav_compare','nav_history'];
  tabs.forEach((tab, i) => { if (tabKeys[i]) tab.textContent = t(tabKeys[i]); });

  // Toggle button
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = L === 'en' ? 'ES' : 'EN';

  // Simulator - section labels
  setText('section-label-p1', t('player1'));
  setText('section-label-p2', t('player2'));
  setPlaceholder('search-p1', t('search_player'));
  setPlaceholder('search-p2', t('search_player'));
  setPlaceholder('mob-search', t('search_mob'));
  setText('section-label-config', t('settings'));
  setText('sel-p1', sel.p1 ? null : t('sel_p1'));
  setText('sel-p2', sel.p2 ? null : t('sel_p2'));

  // Config labels
  setText('label-surface', t('surface'));
  setText('label-sets', t('sets'));
  setText('label-tb', t('final_tb'));

  // Surface buttons
  setOptBtn('surface-opts', 'hard',  t('surf_hard'));
  setOptBtn('surface-opts', 'clay',  t('surf_clay'));
  setOptBtn('surface-opts', 'grass', t('surf_grass'));

  // TB buttons
  setOptBtn('tb-opts', 'yes', t('yes'));
  setOptBtn('tb-opts', 'no',  t('no'));

  // Simulate button
  setText('sim-btn', t('simulate'));

  // Winner label
  setText('winner-label-text', t('match_winner'));

  // Scoreboard headers
  setText('sb-header-player', t('player_col'));
  setText('sb-header-games',  t('games_col'));

  // Match stats section label
  setText('match-stats-label', t('match_stats'));

  // Post-sim mobile buttons
  setText('mob-btn-repeat', t('repeat'));
  setText('mob-btn-p2',     t('change_p2'));
  setText('mob-btn-reset',  t('reset_all'));
  setText('mob-btn-x100',   t('x100'));

  // 100 matches header
  setText('sim1000-header', t('x100_header'));

  // New match btn
  setText('again-btn', t('new_match'));

  // Stats page
  setText('detail-empty-text', t('sel_player'));
  setPlaceholder('sidebar-search', t('search_name'));

  // Comparador empty
  setText('comp-empty-text', t('sel_two'));
  setPlaceholder('comp-sidebar-search', t('search_name'));

  // History page
  setText('hist-title',  t('hist_title'));
  setText('hist-sub',    t('hist_sub'));
  setText('rf-label-p1',       t('lbl_p1'));
  setText('rf-label-p2',       t('lbl_p2'));
  setText('rf-label-surface',  t('lbl_surface'));
  setText('rf-label-level',    t('lbl_level'));
  setText('rf-label-year-from',t('lbl_year_from'));
  setText('rf-label-year-to',  t('lbl_year_to'));
  setText('rf-btn-filter', t('filter_btn'));
  setText('rf-btn-reset',  t('reset_btn'));
  // Table headers
  setText('th-year',       t('th_year'));
  setText('th-tournament', t('th_tournament'));
  setText('th-level',      t('th_level'));
  setText('th-round',      t('th_round'));
  setText('th-surface',    t('th_surface'));
  setText('th-winner',     t('th_winner'));
  setText('th-loser',      t('th_loser'));
  setText('th-result',     t('th_result'));

  // Surface filter options
  setSelectOption('rf-surf', '',  t('all_surf'));
  setSelectOption('rf-surf', 'H', t('surf_hard'));
  setSelectOption('rf-surf', 'C', t('surf_clay'));
  setSelectOption('rf-surf', 'G', t('surf_grass'));

  // Era filter "All" buttons
  document.querySelectorAll('.era-btn[data-era="all"]').forEach(b => b.textContent = t('all'));

  // Database labels
  document.querySelectorAll('.sidebar-title').forEach(el => {
    const count = el.querySelector('span');
    if (count) el.innerHTML = `${t('database')} · <span>${count.textContent}</span> ${t('players_lbl')}`;
  });

  // Re-render dynamic parts if already initialized
  if (typeof renderMobileUI === 'function') updateMobileUI();
}

function setText(id, val) {
  if (val === null) return;
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setPlaceholder(id, val) {
  const el = document.getElementById(id);
  if (el) el.placeholder = val;
}
function setOptBtn(groupId, dataVal, label) {
  const el = document.querySelector(`#${groupId} [data-val="${dataVal}"]`);
  if (el) el.textContent = label;
}
function setSelectOption(selectId, val, label) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const opt = sel.querySelector(`option[value="${val}"]`);
  if (opt) opt.textContent = label;
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'es' : 'en';
  localStorage.setItem('lang', currentLang);
  applyLang();
  // Re-render grids so player cards use updated strings if needed
  if (isMobile()) renderMobileGrid(document.getElementById('mob-search')?.value || '');
}

// =====================================================
// TENNIS LEGENDS SIMULATOR — app.js
// Motor Markov completo · 4 páginas
// =====================================================

// ===== PAGE NAVIGATION =====
let resultsInitialized = false;

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.dataset.page === page) t.classList.add('active');
  });
  if (page === 'stats') initStats();
  if (page === 'comparador') initComparador();
  if (page === 'historico' && !resultsInitialized) {
    initResultsPage();
    resultsInitialized = true;
  }
}

// =====================================================
// SIMULADOR
// =====================================================
let sel = { p1: null, p2: null };
let config = { surface: 'hard', sets: 5, tb: true };

function renderGrid(gridId, playerKey, filter) {
  const grid = document.getElementById(gridId);
  if (!grid || typeof PLAYERS === 'undefined') return;

  const q = (filter || '').toLowerCase();
  const list = q
    ? PLAYERS.filter(p => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q))
    : PLAYERS;

  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card';
    if (sel[playerKey]?.id === p.id) card.classList.add('selected-' + playerKey);

    card.innerHTML = `
      <div class="card-info">
        <div class="player-name">${flagHTML(p)} ${p.name}</div>
        <div class="player-meta">
          <span>${p.country}</span>
          <span>${p.era}</span>
        </div>
        <div class="player-stat-mini">
          <div class="stat-pill">1st srv <span>${Math.round(p.stats.serve1pct * 100)}%</span></div>
          <div class="stat-pill">W <span>${p.stats.winners}</span></div>
          ${(p.gs || 0) > 0 ? `<div class="stat-pill">GS <span>${p.gs}</span></div>` : ''}
        </div>
      </div>
      <img src="img/${p.id}.png" class="card-photo"
        onerror="this.style.display='none'">`;
    card.onclick = () => selectPlayer(p, playerKey);
    grid.appendChild(card);
  });
}

function filterGrid(key, val) {
  renderGrid('grid-' + key, key, val);
}

function selectPlayer(p, key) {
  sel[key] = p;
  renderGrid('grid-p1', 'p1', document.getElementById('search-p1').value);
  renderGrid('grid-p2', 'p2', document.getElementById('search-p2').value);

  const label = document.getElementById('sel-' + key);
  if (label) {
    label.innerHTML = `${flagHTML(p)} ${p.name}`;
    label.style.color = key === 'p1' ? 'var(--accent)' : 'var(--accent2)';
  }

  const simBtn = document.getElementById('sim-btn');
  if (simBtn) simBtn.disabled = !(sel.p1 && sel.p2 && sel.p1.id !== sel.p2.id);
  const s1000 = document.getElementById('sim-btn-1000');
  if (s1000) s1000.disabled = !(sel.p1 && sel.p2 && sel.p1.id !== sel.p2.id);

  const color = key === 'p1' ? '#c8f000' : '#00e5ff';
  const card = document.querySelector(`#grid-${key} .selected-${key}`);
  if (card) spawnParticles(card, color);
}

// =====================================================
// MOTOR DE SIMULACIÓN MARKOV
// =====================================================

function calibratedSurf(player, surface) {
  const raw = player.stats.surface[surface] || 1.0;
  return 1.0 + (raw - 1.0) * 0.55;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function calcWinProbServe(server, returner, surface) {
  const sS = server.stats;
  const rS = returner.stats;
  const sMod = calibratedSurf(server, surface);
  const rMod = calibratedSurf(returner, surface);

  const baseServe = sS.serve1pct * sS.win1st + (1 - sS.serve1pct) * sS.win2nd;
  const serveSpeedBonus  = ((sS.serve_kmh || 205) - 175) / 75 * 0.03;
  const serverPower      = (((sS.fh_kmh || 148) + (sS.bh_kmh || 138)) / 2 - 120) / 55 * 0.02;
  const serverShortBonus = ((sS.rally_short || 40) - 38) / 100 * 0.015;
  const returnSpeedFact  = ((rS.rest_kmh || 148) - 125) / 40 * 0.02;
  const returnPressure   = rS.returnWin * rMod * (1 - serverPower * 0.3) + returnSpeedFact * 0.5;
  const netBonus         = ((server.net_win || 0.65) - 0.65) * 0.04;

  const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.5
               + serverShortBonus + netBonus - (returnPressure * 0.15);
  return clamp(prob, 0.40, 0.75);
}

function getRallyProfile(p1, p2, surface) {
  const s1 = p1.stats, s2 = p2.stats;
  let short = (s1.rally_short + s2.rally_short) / 2;
  let mid   = (s1.rally_mid   + s2.rally_mid)   / 2;
  let long  = (s1.rally_long  + s2.rally_long)  / 2;

  const surfMod = surface === 'clay' ? 1.10 : surface === 'grass' ? 0.90 : 1.0;
  const adjLong  = long  * surfMod;
  const adjShort = short / surfMod;
  const total    = adjShort + mid + adjLong;
  return { short: adjShort / total, mid: mid / total, long: adjLong / total };
}

function simPoint(pWin) {
  return Math.random() < pWin;
}

function simGame(pWin, rallyProf, sS, rS) {
  let pts = [0, 0];
  while (true) {
    const r = Math.random();
    let pw;
    if (r < rallyProf.short) {
      const returnSpeedAdj = ((rS.rest_kmh || 148) - 148) / 40 * 0.04;
      pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);
    } else if (r < rallyProf.short + rallyProf.mid) {
      pw = clamp(pWin - 0.01, 0.38, 0.75);
    } else {
      const longRallySkill = ((rS.rally_long || 26) - 26) / 34 * 0.06;
      const groundAdv      = (((rS.fh_kmh || 148) + (rS.bh_kmh || 138)) / 2 - 143) / 35 * 0.03;
      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv, 0.30, 0.70);
    }
    if (simPoint(pw)) pts[0]++; else pts[1]++;
    if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
    if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
  }
}

function simTiebreak(pWin, server, returner) {
  let pts = [0, 0];
  while (true) {
    const srvTB = ((server.tb_win   || 0.62) - 0.62) * 0.08;
    const retTB = ((returner.tb_win || 0.62) - 0.62) * 0.08;
    const tbPW  = clamp(pWin + 0.02 + srvTB - retTB, 0.38, 0.80);
    if (simPoint(tbPW)) pts[0]++; else pts[1]++;
    if (pts[0] >= 7 && pts[0] - pts[1] >= 2) return 0;
    if (pts[1] >= 7 && pts[1] - pts[0] >= 2) return 1;
  }
}

function simSet(p1, p2, surface, isFinal, useTb, firstServer) {
  let games = [0, 0], gameCount = 0;
  const rallyProf = getRallyProfile(p1, p2, surface);
  const p1DecBonus = isFinal ? ((p1.dec_win || 0.64) - 0.64) * 0.03 : 0;
  const p2DecBonus = isFinal ? ((p2.dec_win || 0.64) - 0.64) * 0.03 : 0;
  const gameLog = [];

  while (true) {
    const serving  = (firstServer + gameCount) % 2;
    const server   = serving === 0 ? p1 : p2;
    const returner = serving === 0 ? p2 : p1;
    const basePSrv = calcWinProbServe(server, returner, surface);
    const decBonus = serving === 0 ? p1DecBonus - p2DecBonus : p2DecBonus - p1DecBonus;
    const pSrv     = clamp(basePSrv + (isFinal ? decBonus : 0), 0.38, 0.78);
    let isTb = false;

    if (games[0] === 6 && games[1] === 6) {
      if (useTb) {
        const tbW = simTiebreak(pSrv, server, returner);
        const gw  = tbW === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++; isTb = true;
        gameLog.push({ winner: gw, score: [games[0], games[1]], tb: true });
        break;
      } else {
        const gwGame = simGame(pSrv, rallyProf, server.stats, returner.stats);
        const gw     = gwGame === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ winner: gw, score: [games[0], games[1]], tb: false });
        if (Math.abs(games[0] - games[1]) >= 2) break;
      }
    } else {
      const gwGame = simGame(pSrv, rallyProf, server.stats, returner.stats);
      const gw     = gwGame === 0 ? serving : 1 - serving;
      games[gw]++; gameCount++;
      gameLog.push({ winner: gw, score: [games[0], games[1]], tb: false, break: gw !== serving });
      if ((games[0] >= 6 || games[1] >= 6) && Math.abs(games[0] - games[1]) >= 2) break;
      if (games[0] === 7 || games[1] === 7) break;
    }
  }

  return { games, gameCount, winner: games[0] > games[1] ? 0 : 1, gameLog };
}

// ===== PARTÍCULAS =====
function spawnParticles(el, color) {
  /* DESACTIVADO
  if (!el) return;
  const rect = el.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const p     = document.createElement('div');
    const angle = (i / 12) * Math.PI * 2;
    const dist  = 30 + Math.random() * 40;
    p.style.cssText = `
      position:fixed; width:6px; height:6px; border-radius:50%;
      left:${rect.left + rect.width / 2}px; top:${rect.top + rect.height / 2}px;
      background:${color}; pointer-events:none; z-index:9999;
      --tx:${Math.cos(angle) * dist}px; --ty:${Math.sin(angle) * dist}px;
      animation:particle-fly 0.6s ease-out forwards;
      animation-delay:${Math.random() * 0.1}s;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
  */
}

// ===== FLAG HELPER — CSS en desktop, emoji en móvil =====
function flagHTML(p) {
  if (window.innerWidth <= 768) return p.countryFlag;
  return `<span class="flag flag-${p.country}"></span>`;
}

// ===== SIMULATE =====
function simulate() {
  if (!sel.p1 || !sel.p2) return;

  const p1 = sel.p1, p2 = sel.p2;
  const surface = config.surface;
  const maxSets = config.sets;
  const toWin   = Math.ceil(maxSets / 2);

  const setsP1 = [], setsP2 = [];
  let winsP1 = 0, winsP2 = 0;
  let totalGamesPlayed = 0;
  const firstServerOfMatch = Math.floor(Math.random() * 2);
  const matchLog = [];

  const stats = {
    aces:           [0, 0],
    doubleFaults:   [0, 0],
    winners:        [0, 0],
    errors:         [0, 0],
    breakPoints:    [0, 0],
    breakConverted: [0, 0],
    totalGames:     [0, 0],
    rallyShort:     [0, 0],
    rallyMid:       [0, 0],
    rallyLong:      [0, 0],
  };

  while (winsP1 < toWin && winsP2 < toWin) {
    const setNum  = setsP1.length + 1;
    const isFinal = (setNum === maxSets);
    const setFS   = (firstServerOfMatch + totalGamesPlayed) % 2;
    const set     = simSet(p1, p2, surface, isFinal, config.tb, setFS);

    totalGamesPlayed += set.gameCount || (set.games[0] + set.games[1]);
    setsP1.push(set.games[0]);
    setsP2.push(set.games[1]);
    stats.totalGames[0] += set.games[0];
    stats.totalGames[1] += set.games[1];

    // Log de juegos del set
    if (set.gameLog) {
      set.gameLog.forEach((g, idx) => {
        const winnerName = g.winner === 0 ? p1.name : p2.name;
        const wType      = g.winner === 0 ? 'p1' : 'p2';
        const isBreak    = g.break === true;
        const isTb       = g.tb === true;
        const suffix     = isTb ? ' 🎯 TB' : (isBreak ? ' 💥 Break' : '');
        matchLog.push({
          text: `  ${g.score[0]}-${g.score[1]}  ${winnerName}${suffix}`,
          type: wType,
          isGame: true
        });
      });
    }

    if (set.winner === 0) {
      winsP1++;
      matchLog.push({ text: `📗 SET ${setNum} · ${p1.name} ${set.games[0]}-${set.games[1]}`, type: 'p1', isSet: true });
    } else {
      winsP2++;
      matchLog.push({ text: `📘 SET ${setNum} · ${p2.name} ${set.games[0]}-${set.games[1]}`, type: 'p2', isSet: true });
    }

    // Rally stats — variables locales por set para evitar negativos acumulados
    const prof      = getRallyProfile(p1, p2, surface);
    const estPts    = (set.games[0] + set.games[1]) * 6;
    const shortPts  = Math.round(estPts * prof.short);
    const midPts    = Math.round(estPts * prof.mid);
    const longPts   = Math.round(estPts * prof.long);
    const p1ShRatio = p1.stats.rally_short / (p1.stats.rally_short + p2.stats.rally_short + 0.001);
    const p1LgRatio = p1.stats.rally_long  / (p1.stats.rally_long  + p2.stats.rally_long  + 0.001);

    const setShort0 = Math.max(0, Math.round(shortPts * (p1ShRatio * 0.6 + 0.2)));
    const setShort1 = Math.max(0, shortPts - setShort0);
    const setLong1  = Math.max(0, Math.round(longPts  * (p1LgRatio * 0.4 + 0.3)));
    const setLong0  = Math.max(0, longPts  - setLong1);
    const setMid0   = Math.max(0, Math.round(midPts * 0.5));
    const setMid1   = Math.max(0, midPts - setMid0);

    stats.rallyShort[0] += setShort0;
    stats.rallyShort[1] += setShort1;
    stats.rallyLong[0]  += setLong0;
    stats.rallyLong[1]  += setLong1;
    stats.rallyMid[0]   += setMid0;
    stats.rallyMid[1]   += setMid1;

    // Match stats estimates
    const s1 = p1.stats, s2 = p2.stats;
    stats.aces[0]         += Math.round(4 + Math.random() * 8 * s1.serve1pct * calibratedSurf(p1, surface));
    stats.aces[1]         += Math.round(4 + Math.random() * 8 * s2.serve1pct * calibratedSurf(p2, surface));
    stats.doubleFaults[0] += Math.round(1 + Math.random() * 4);
    stats.doubleFaults[1] += Math.round(1 + Math.random() * 4);
    stats.winners[0]      += Math.round(s1.winners * (0.8 + Math.random() * 0.4) * calibratedSurf(p1, surface));
    stats.winners[1]      += Math.round(s2.winners * (0.8 + Math.random() * 0.4) * calibratedSurf(p2, surface));
    stats.errors[0]       += Math.round(s1.errors  * (0.8 + Math.random() * 0.4));
    stats.errors[1]       += Math.round(s2.errors  * (0.8 + Math.random() * 0.4));

    const bp1 = Math.round(Math.random() * 6 + 2);
    const bp2 = Math.round(Math.random() * 6 + 2);
    stats.breakPoints[0]    += bp1;
    stats.breakPoints[1]    += bp2;
    stats.breakConverted[0] += Math.round(bp1 * s1.breakConvert * (0.7 + Math.random() * 0.6));
    stats.breakConverted[1] += Math.round(bp2 * s2.breakConvert * (0.7 + Math.random() * 0.6));
  }

  const winner   = winsP1 >= toWin ? p1 : p2;
  const scoreStr = setsP1.map((g, i) => `${g}-${setsP2[i]}`).join('  ');
  renderResult(p1, p2, setsP1, setsP2, winner, scoreStr, stats, matchLog, maxSets);
}

// ===== RENDER RESULT =====
function renderResult(p1, p2, setsP1, setsP2, winner, scoreStr, stats, matchLog, maxSets) {
  // Scoreboard
  document.getElementById('sb-name-p1').textContent = p1.name;
  document.getElementById('sb-name-p2').textContent = p2.name;

  for (let i = 1; i <= 5; i++) {
    const e1 = document.getElementById(`s${i}p1`);
    const e2 = document.getElementById(`s${i}p2`);
    if (i <= setsP1.length) {
      e1.textContent = setsP1[i - 1];
      e2.textContent = setsP2[i - 1];
      e1.className = 'set-score';
      e2.className = 'set-score';
      if (setsP1[i - 1] > setsP2[i - 1]) e1.classList.add('winner');
      else e2.classList.add('p2-win');
    } else {
      e1.textContent = '-'; e1.className = 'set-score inactive';
      e2.textContent = '-'; e2.className = 'set-score inactive';
    }
  }

  document.getElementById('tot-p1').textContent = setsP1.reduce((a, b) => a + b, 0);
  document.getElementById('tot-p2').textContent = setsP2.reduce((a, b) => a + b, 0);

  // Winner banner
  const wNameEl = document.getElementById('winner-name');
  wNameEl.textContent = winner.name;
  wNameEl.style.color = winner.id === p1.id ? 'var(--accent)' : 'var(--accent2)';
  document.getElementById('winner-score').textContent = scoreStr;

  // Winner banner background photos
  const banner = document.getElementById('winner-banner');
  const testImg = new Image();
  testImg.onload = () => {
    banner.classList.add('has-winner-img');
    let dynStyle = document.getElementById('winner-bg-style');
    if (!dynStyle) {
      dynStyle = document.createElement('style');
      dynStyle.id = 'winner-bg-style';
      document.head.appendChild(dynStyle);
    }
    const url = `url(img/${winner.id}.png)`;
    dynStyle.textContent = `
      #winner-banner.has-winner-img::before { background-image: ${url}; }
      #winner-banner.has-winner-img::after  { background-image: ${url}; }
    `;
  };
  testImg.onerror = () => banner.classList.remove('has-winner-img');
  testImg.src = `img/${winner.id}.png`;

  // Stats two columns
  const col1 = document.getElementById('stats-col-p1');
  const col2 = document.getElementById('stats-col-p2');

  const rows = [
    [t('stat_aces'),    stats.aces[0],            stats.aces[1]],
    [t('stat_df'),      stats.doubleFaults[0],    stats.doubleFaults[1]],
    [t('stat_winners'), stats.winners[0],         stats.winners[1]],
    [t('stat_ue'),      stats.errors[0],          stats.errors[1]],
    [t('stat_breaks'),  `${stats.breakConverted[0]}/${stats.breakPoints[0]}`, `${stats.breakConverted[1]}/${stats.breakPoints[1]}`],
    [t('stat_games'),   stats.totalGames[0],      stats.totalGames[1]],
    [t('stat_short'),   stats.rallyShort[0],      stats.rallyShort[1]],
    [t('stat_mid'),     stats.rallyMid[0],        stats.rallyMid[1]],
    [t('stat_long'),    stats.rallyLong[0],       stats.rallyLong[1]],
  ];

  col1.innerHTML = `<div class="stats-col-header p1-header">${flagHTML(p1)} ${p1.name}</div>`;
  col2.innerHTML = `<div class="stats-col-header p2-header">${flagHTML(p2)} ${p2.name}</div>`;

  rows.forEach(([name, v1, v2]) => {
    const n1 = parseFloat(v1) || 0;
    const n2 = parseFloat(v2) || 0;
    const total = n1 + n2 || 1;
    const pct1 = Math.round(n1 / total * 100);
    const pct2 = Math.round(n2 / total * 100);

    col1.innerHTML += `
      <div class="stat-half-row">
        <div class="stat-half-label">${name}</div>
        <div class="stat-half-value p1-val">${v1}</div>
        <div class="stat-half-bar">
          <div class="bar-wrap"><div class="bar-fill" style="width:${pct1}%;background:var(--accent)"></div></div>
        </div>
      </div>`;

    col2.innerHTML += `
      <div class="stat-half-row">
        <div class="stat-half-label">${name}</div>
        <div class="stat-half-value p2-val">${v2}</div>
        <div class="stat-half-bar">
          <div class="bar-wrap"><div class="bar-fill" style="width:${pct2}%;background:var(--accent2)"></div></div>
        </div>
      </div>`;
  });

  // Point log
  const logEl = document.getElementById('point-log');
  if (logEl) {
    logEl.innerHTML = matchLog.map(e => {
      let cls;
      if (e.isSet)       cls = e.type === 'p1' ? 'log-set-p1' : 'log-set-p2';
      else if (e.isGame) cls = e.type === 'p1' ? 'log-game-p1' : 'log-game-p2';
      else               cls = e.type === 'p1' ? 'important' : 'p2w';
      return `<div class="log-entry ${cls}">${e.text}</div>`;
    }).join('');
    logEl.scrollTop = 0;
  }

  // Show panels
  ['scoreboard', 'match-stats', 'point-log', 'winner-banner', 'again-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'block'; }
  });

  setTimeout(() => {
    document.getElementById('winner-banner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function resetSim() {
  ['scoreboard', 'match-stats', 'point-log', 'winner-banner', 'again-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('winner-banner')?.classList.remove('has-winner-img');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =====================================================
// MÓVIL — flujo de selección en una columna
// =====================================================
let mobileStep = 0; // 0=eligeP1, 1=eligeP2, 2=listos

function isMobile() { return window.innerWidth <= 768; }

function mobileSelectPlayer(p) {
  if (mobileStep === 0) {
    sel.p1 = p;
    mobileStep = 1;
  } else if (mobileStep === 1) {
    if (sel.p1 && p.id === sel.p1.id) return; // same player
    sel.p2 = p;
    mobileStep = 2;
  }
  updateMobileUI();
}

function mobileReset() {
  sel.p1 = null; sel.p2 = null;
  mobileStep = 0;
  document.getElementById('mob-search').value = '';
  ['scoreboard','match-stats','point-log','winner-banner','again-wrap','mob-post-sim'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('winner-banner')?.classList.remove('has-winner-img');
  updateMobileUI();
}

function mobileChangeP2() {
  sel.p2 = null;
  mobileStep = 1;
  document.getElementById('mob-search').value = '';
  ['scoreboard','match-stats','point-log','winner-banner','again-wrap','mob-post-sim'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('winner-banner')?.classList.remove('has-winner-img');
  updateMobileUI();
}

function updateMobileUI() {
  if (!isMobile()) return;
  const header   = document.getElementById('mob-sel-header');
  const vsBar    = document.getElementById('mob-vs-bar');
  const simBtn   = document.getElementById('sim-btn');
  const s1000    = document.getElementById('sim-btn-1000');
  const search   = document.getElementById('mob-search');

  // Header de estado
  if (mobileStep === 0) {
    header.innerHTML = `<span class="mob-step-label p1">${t('pick_p1')}</span>`;
    vsBar.style.display = 'none';
  } else if (mobileStep === 1) {
    const gs  = sel.p1.gs || 0;
    const m1k = sel.p1.masters || 0;
    header.innerHTML = `
      <span class="mob-chip p1">${flagHTML(sel.p1)} ${sel.p1.name} ${gs?'🏆'+gs:''} ${m1k?'💎'+m1k:''}</span>
      <span class="mob-step-label p2">${t('pick_p2')}</span>`;
    vsBar.style.display = 'none';
  } else {
    header.innerHTML = '';
    vsBar.style.display = 'flex';
    // Imágenes de fondo del VS bar
    const vb = document.getElementById('mob-vs-bar');
    vb.style.setProperty('--p1img', `url(img/${sel.p1.id}.png)`);
    vb.style.setProperty('--p2img', `url(img/${sel.p2.id}.png)`);
    document.getElementById('mob-vs-p1').innerHTML = `${flagHTML(sel.p1)} ${sel.p1.name}`;
    document.getElementById('mob-vs-p2').innerHTML = `${flagHTML(sel.p2)} ${sel.p2.name}`;
  }

  // Botones simular
  const ready = (mobileStep === 2);
  if (simBtn) { simBtn.disabled = !ready; simBtn.classList.toggle('sim-used', false); }
  if (s1000)  { s1000.disabled = !ready; }

  // Re-renderizar grid móvil
  renderMobileGrid(search ? search.value : '');
}

function renderMobileGrid(filter) {
  const grid = document.getElementById('mob-grid');
  if (!grid) return;
  const q = (filter || '').toLowerCase();
  const exclude = mobileStep === 1 && sel.p1 ? sel.p1.id : null;
  const players = PLAYERS.filter(p =>
    p.id !== exclude &&
    (!q || p.name.toLowerCase().includes(q) || (p.country||'').toLowerCase().includes(q))
  );
  grid.innerHTML = '';
  players.forEach(p => {
    const card = document.createElement('div');
    const isSelP1 = sel.p1 && sel.p1.id === p.id;
    const isSelP2 = sel.p2 && sel.p2.id === p.id;
    card.className = 'mob-card' + (isSelP1 ? ' mob-sel-p1' : '') + (isSelP2 ? ' mob-sel-p2' : '');
    const gs  = p.gs     || 0;
    const m1k = p.masters|| 0;
    card.innerHTML = `
      <span class="mob-flag">${flagHTML(p)}</span>
      <span class="mob-name">${p.name}</span>
      <span class="mob-era">${(p.era||'').split('-')[0]}</span>
      ${gs  ? `<span class="mob-gs">🏆${gs}</span>`   : ''}
      ${m1k ? `<span class="mob-m1k">💎${m1k}</span>` : ''}`;
    card.onclick = () => mobileSelectPlayer(p);
    grid.appendChild(card);
  });
}

// Animación random + simular
function randomFlashAndSim() {
  const overlay = document.createElement('div');
  overlay.id = 'random-flash-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none;overflow:hidden;';
  document.body.appendChild(overlay);
  let count = 0;
  const interval = setInterval(() => {
    const span = document.createElement('span');
    span.textContent = 'RANDOM';
    const size = (1.4 + Math.random() * 3.2).toFixed(2);
    const color = Math.random() > 0.5 ? '#c8f000' : '#00e5ff';
    const tx = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 100);
    const ty = -30 - Math.random() * 80;
    const rot1 = (-20 + Math.random() * 40).toFixed(1);
    const rot2 = (-30 + Math.random() * 60).toFixed(1);
    const left = (5 + Math.random() * 65).toFixed(1);
    const top  = (10 + Math.random() * 65).toFixed(1);
    span.style.cssText = `position:absolute;font-family:Anton,sans-serif;font-size:${size}rem;` +
      `color:${color};opacity:0.9;left:${left}%;top:${top}%;` +
      `transform:translate(0,0) rotate(${rot1}deg);` +
      `letter-spacing:0.06em;text-shadow:0 0 14px ${color}99;` +
      `transition:transform 0.6s ease-out,opacity 0.6s ease-out;will-change:transform,opacity;`;
    overlay.appendChild(span);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      span.style.transform = `translate(${tx.toFixed(0)}px,${ty.toFixed(0)}px) rotate(${rot2}deg)`;
      span.style.opacity = '0';
    }));
    count++;
    if (count > 10) {
      clearInterval(interval);
      setTimeout(() => {
        overlay.remove();
        // Pick 2 random distinct players
        const pool = [...PLAYERS];
        const i1 = Math.floor(Math.random()*pool.length);
        let i2;
        do { i2 = Math.floor(Math.random()*pool.length); } while (i2===i1);
        sel.p1 = pool[i1]; sel.p2 = pool[i2];
        mobileStep = 2;
        updateMobileUI();
        setTimeout(() => {
          simulate();
          document.getElementById('mob-post-sim').style.display = 'flex';
          const wb = document.getElementById('again-wrap');
          if (wb) wb.style.display = 'none';
          document.getElementById('winner-banner')?.scrollIntoView({behavior:'smooth'});
        }, 200);
      }, 500);
    }
  }, 80);
}

function initMobileSimulator() {
  if (!isMobile()) return;

  // Hide desktop grids, mostrar móvil
  const desktopSel = document.getElementById('desktop-selector');
  if (desktopSel) desktopSel.style.display = 'none';
  const mobileSel = document.getElementById('mobile-selector');
  if (mobileSel) mobileSel.style.display = 'block';

  // Search
  const search = document.getElementById('mob-search');
  if (search) search.addEventListener('input', e => renderMobileGrid(e.target.value));

  // Botón simular (ya existe, solo añadimos lógica post-sim)
  const simBtn = document.getElementById('sim-btn');
  if (simBtn) {
    simBtn.onclick = () => {
      if (!sel.p1 || !sel.p2) { randomFlashAndSim(); return; }
      simulate();
      const wb = document.getElementById('again-wrap');
      if (wb) wb.style.display = 'none';
      document.getElementById('mob-post-sim').style.display = 'flex';
      document.getElementById('winner-banner')?.scrollIntoView({behavior:'smooth'});
    };
  }

  // Post-sim buttons
  document.getElementById('mob-btn-repeat')?.addEventListener('click', () => {
    simulate();
    document.getElementById('winner-banner')?.scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('mob-btn-p2')?.addEventListener('click', mobileChangeP2);
  document.getElementById('mob-btn-reset')?.addEventListener('click', mobileReset);
  document.getElementById('mob-btn-x100')?.addEventListener('click', () => {
    simulate1000();
    document.getElementById('winner-banner')?.scrollIntoView({behavior:'smooth'});
  });

  updateMobileUI();
}

// =====================================================
// ESTADÍSTICAS
// =====================================================
let statsInitialized = false;
let currentEraFilter = 'all';
let currentSearchFilter = '';

function getEra(player) {
  const start = parseInt(player.era.split('-')[0]);
  if (start >= 2010) return '2010s';
  if (start >= 2000) return '2000s';
  if (start >= 1990) return '90s';
  if (start >= 1980) return '80s';
  return '70s';
}

function initStats() {
  if (statsInitialized) return;
  statsInitialized = true;
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = PLAYERS.length;

  document.querySelectorAll('#era-filter .era-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#era-filter .era-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEraFilter = btn.dataset.era;
      renderSidebar();
    };
  });
  renderSidebar();
}

function renderSidebar() {
  const list = document.getElementById('players-list');
  if (!list) return;

  const filtered = PLAYERS.filter(p => {
    const matchSearch = !currentSearchFilter
      || p.name.toLowerCase().includes(currentSearchFilter.toLowerCase())
      || p.country.toLowerCase().includes(currentSearchFilter.toLowerCase());
    const matchEra = currentEraFilter === 'all' || getEra(p) === currentEraFilter;
    return matchSearch && matchEra;
  }).sort((a, b) => (b.gs || 0) - (a.gs || 0) || a.name.localeCompare(b.name));

  list.innerHTML = filtered.map(p => `
    <div class="player-list-item" id="pli-${p.id}" onclick="showPlayerDetail('${p.id}')">
      <span class="pli-flag">${flagHTML(p)}</span>
      <div class="pli-info">
        <div class="pli-name">${p.name}</div>
        <div class="pli-sub">${p.country} · ${p.prime} · ${p.style}</div>
      </div>
      <div class="pli-titles">
        ${(p.gs || 0) > 0 ? `<div class="pli-gs">🏆${p.gs}</div>` : ''}
        ${(p.masters || 0) > 0 ? `<div class="pli-masters">💎${p.masters}</div>` : ''}
      </div>
    </div>`).join('');
}

function filterSidebar(val) {
  currentSearchFilter = val;
  renderSidebar();
}

function showPlayerDetail(playerId) {
  const p = PLAYERS.find(x => x.id === playerId);
  if (!p) return;

  document.querySelectorAll('.player-list-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('pli-' + playerId);
  if (item) { item.classList.add('active'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  document.getElementById('detail-empty').style.display = 'none';
  document.getElementById('detail-content').style.display = 'block';

  const s = p.stats;
  const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const surfaceToBar = val => Math.round(((val - 0.82) / (1.20 - 0.82)) * 100);
  const surfaceClass = val => val >= 1.08 ? 'good' : val >= 0.96 ? 'avg' : 'weak';
  const surfaceLabel = val => (val >= 1.0 ? '+' : '') + ((val - 1) * 100).toFixed(0) + '%';
  const barW = (val, min, max) => Math.round(((val - min) / (max - min)) * 100);
  const svgAvatar = `<img src="img/${p.id}.png" class="detail-player-img" alt="${p.name}"
    onerror="this.style.display='none';this.nextElementSibling.style.display=''">
    <div class="detail-player-fallback" style="display:none">${
      (typeof PLAYER_SVGS !== 'undefined' && PLAYER_SVGS[p.id])
        ? PLAYER_SVGS[p.id]
        : `<div class="player-avatar-initial">${initials}</div>`
    }</div>`;

  document.getElementById('detail-content').innerHTML = `
    <div class="player-hero">
      <div class="player-avatar" id="detail-avatar">
        ${svgAvatar}
        <div class="player-flag-bg">${flagHTML(p)}</div>
        <div class="player-avatar-accent"></div>
      </div>
      <div class="player-hero-info">
        <div class="player-hero-name">${p.name}</div>
        <div class="player-hero-country">${flagHTML(p)} ${p.country} · ${p.era}${p.height ? ' · ' + p.height + 'cm' : ''}</div>
        <div class="player-hero-badges">
          <span class="badge highlight">Prime: ${p.prime}</span>
          <span class="badge">${p.style}</span>
          <span class="badge">${p.peak}</span>
        </div>

        <div class="gs-trophy-section">
          <div class="gs-trophy-row">
            ${[
              ['🟠', 'Roland Garros', p.gs_ro || 0, 14],
              ['🟢', 'Wimbledon',     p.gs_wi || 0, 8],
              ['🔵', 'US Open',       p.gs_us || 0, 5],
              ['🟡', 'AO',            p.gs_au || 0, 11],
            ].map(([icon, name, count, maxDots]) => `
              <div class="gs-trophy-item ${count > 0 ? 'gs-won' : 'gs-zero'}">
                <div class="gs-icon">${icon}</div>
                <div class="gs-name">${name}</div>
                <div class="gs-count">${count}</div>
                ${count > 0
                  ? `<div class="gs-dots">${'●'.repeat(Math.min(count, maxDots))}</div>`
                  : `<div class="gs-dots-empty">○</div>`}
              </div>`).join('')}
          </div>
          <div class="gs-totals-row">
            <div class="gs-total-item">
              <span class="gs-total-label">🏆 Grand Slams</span>
              <span class="gs-total-val">${p.gs || 0}</span>
            </div>
            <div class="gs-total-item">
              <span class="gs-total-label">💎 Masters 1000</span>
              <span class="gs-total-val masters-val">${p.masters || 0}</span>
            </div>
          </div>
        </div>

        <div class="player-bio">${p.bio || ''}</div>
        <div class="peak-stat">
          <div class="peak-item"><div class="peak-label">1er Servicio</div><div class="peak-value">${Math.round(s.serve1pct * 100)}%</div></div>
          <div class="peak-item"><div class="peak-label">Winners/partido</div><div class="peak-value">${s.winners}</div></div>
          <div class="peak-item"><div class="peak-label">% Dev. ganada</div><div class="peak-value">${Math.round(s.returnWin * 100)}%</div></div>
          <div class="peak-item"><div class="peak-label">Conv. Breaks</div><div class="peak-value">${Math.round(s.breakConvert * 100)}%</div></div>
        </div>
      </div>
    </div>

    <div class="sim-stats-section">
      <div class="section-label">${t('stroke_speeds')}</div>
      <div class="speed-cards">
        <div class="speed-card">
          <div class="speed-icon">🎯</div><div class="speed-label">${t('serve_speed')}</div>
          <div class="speed-value">${s.serve_kmh || '—'}</div><div class="speed-unit">km/h</div>
          <div class="speed-bar-track"><div class="speed-bar" style="width:${Math.round(((s.serve_kmh||200)-170)/80*100)}%;background:#c8f000"></div></div>
        </div>
        <div class="speed-card">
          <div class="speed-icon">👊</div><div class="speed-label">${t('fh_speed')}</div>
          <div class="speed-value">${s.fh_kmh || '—'}</div><div class="speed-unit">km/h</div>
          <div class="speed-bar-track"><div class="speed-bar" style="width:${Math.round(((s.fh_kmh||145)-118)/60*100)}%;background:#00e5ff"></div></div>
        </div>
        <div class="speed-card">
          <div class="speed-icon">🔄</div><div class="speed-label">${t('bh_speed')}</div>
          <div class="speed-value">${s.bh_kmh || '—'}</div><div class="speed-unit">km/h</div>
          <div class="speed-bar-track"><div class="speed-bar" style="width:${Math.round(((s.bh_kmh||138)-115)/55*100)}%;background:#ff9800"></div></div>
        </div>
        <div class="speed-card">
          <div class="speed-icon">🏓</div><div class="speed-label">${t('return_speed')}</div>
          <div class="speed-value">${s.rest_kmh || '—'}</div><div class="speed-unit">km/h</div>
          <div class="speed-bar-track"><div class="speed-bar" style="width:${Math.round(((s.rest_kmh||148)-125)/45*100)}%;background:#a855f7"></div></div>
        </div>
        <div class="speed-card combo">
          <div class="speed-icon">⚡</div><div class="speed-label">Potencia total</div>
          <div class="speed-value">${Math.round(((s.serve_kmh||200)+(s.fh_kmh||145)+(s.bh_kmh||138)+(s.rest_kmh||148))/4)}</div>
          <div class="speed-unit">km/h media</div>
          <div class="speed-bar-track"><div class="speed-bar" style="width:${Math.round((((s.serve_kmh||200)+(s.fh_kmh||145)+(s.bh_kmh||138)+(s.rest_kmh||148))/4-138)/50*100)}%;background:linear-gradient(90deg,#c8f000,#a855f7)"></div></div>
        </div>
      </div>

      <div class="section-label" style="margin-top:2rem">${t('sim_stats')}</div>
      <div class="stat-cards">
        <div class="stat-card highlight">
          <div class="stat-card-label">% 1er Servicio</div>
          <div class="stat-card-value" style="color:var(--accent)">${Math.round(s.serve1pct * 100)}%</div>
          <div class="stat-card-sub">Entran en zona</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Pts 1st srv in</div>
          <div class="stat-card-value">${Math.round(s.win1st * 100)}%</div>
          <div class="stat-card-sub">Cuando entra</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Pts con 2do srv</div>
          <div class="stat-card-value">${Math.round(s.win2nd * 100)}%</div>
          <div class="stat-card-sub">Cuando falla el 1ro</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">${t('return_pct')}</div>
          <div class="stat-card-value">${Math.round(s.returnWin * 100)}%</div>
          <div class="stat-card-sub">Return pts won</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Winners/partido</div>
          <div class="stat-card-value">${s.winners}</div>
          <div class="stat-card-sub">Media en su prime</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Errores no forz.</div>
          <div class="stat-card-value">${s.errors}</div>
          <div class="stat-card-sub">Media por partido</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Conv. Break pts</div>
          <div class="stat-card-value">${Math.round(s.breakConvert * 100)}%</div>
          <div class="stat-card-sub">${t('when_chance')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Break pts salvados</div>
          <div class="stat-card-value">${Math.round(s.breakSave * 100)}%</div>
          <div class="stat-card-sub">Cuando le atacan</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-card-label">${t('tb_won')}</div>
          <div class="stat-card-value" style="color:var(--accent2)">${Math.round((p.tb_win || 0.62) * 100)}%</div>
          <div class="stat-card-sub">${t('max_pressure')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Set decisivo</div>
          <div class="stat-card-value">${Math.round((p.dec_win || 0.64) * 100)}%</div>
          <div class="stat-card-sub">Cuando se juega todo</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Pts en red</div>
          <div class="stat-card-value">${Math.round((p.net_win || 0.65) * 100)}%</div>
          <div class="stat-card-sub">Eficacia en volea</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Altura</div>
          <div class="stat-card-value">${p.height || '—'}<span style="font-size:1rem;color:var(--muted)">cm</span></div>
          <div class="stat-card-sub">Ventaja saque/reach</div>
        </div>
      </div>

      <div class="surface-section">
        <div class="surface-title">${t('surf_modifiers')}</div>
        <div class="surface-row">
          <div class="surface-label">🔵 Hard</div>
          <div class="surface-bar-track"><div class="surface-bar-fill hard" style="width:${surfaceToBar(s.surface.hard)}%"></div></div>
          <div class="surface-val ${surfaceClass(s.surface.hard)}">${surfaceLabel(s.surface.hard)}</div>
        </div>
        <div class="surface-row">
          <div class="surface-label">🟠 Clay</div>
          <div class="surface-bar-track"><div class="surface-bar-fill clay" style="width:${surfaceToBar(s.surface.clay)}%"></div></div>
          <div class="surface-val ${surfaceClass(s.surface.clay)}">${surfaceLabel(s.surface.clay)}</div>
        </div>
        <div class="surface-row">
          <div class="surface-label">🟢 Grass</div>
          <div class="surface-bar-track"><div class="surface-bar-fill grass" style="width:${surfaceToBar(s.surface.grass)}%"></div></div>
          <div class="surface-val ${surfaceClass(s.surface.grass)}">${surfaceLabel(s.surface.grass)}</div>
        </div>
      </div>

      <div class="surface-section">
        <div class="surface-title">
          Rally distribution
          <span class="data-badge ${s.data_type === 'real' ? 'badge-real' : 'badge-est'}">
            ${s.data_type === 'real' ? '✓ Dato real' : '~ Estimado'}
          </span>
        </div>
        <div class="rally-distribution">
          <div class="rally-bar-row">
            <div class="rally-bar-label">⚡ 0–4 golpes</div>
            <div class="rally-bar-outer"><div class="rally-bar-fill rally-short" style="width:${s.rally_short || 40}%"><span class="rally-pct">${s.rally_short || 40}%</span></div></div>
            <div class="rally-desc">Aces, winners directos, errores inmediatos</div>
          </div>
          <div class="rally-bar-row">
            <div class="rally-bar-label">🔄 5–8 golpes</div>
            <div class="rally-bar-outer"><div class="rally-bar-fill rally-mid" style="width:${s.rally_mid || 34}%"><span class="rally-pct">${s.rally_mid || 34}%</span></div></div>
            <div class="rally-desc">Intercambiomedium rallies, point building</div>
          </div>
          <div class="rally-bar-row">
            <div class="rally-bar-label">💪 9+ golpes</div>
            <div class="rally-bar-outer"><div class="rally-bar-fill rally-long" style="width:${s.rally_long || 26}%"><span class="rally-pct">${s.rally_long || 26}%</span></div></div>
            <div class="rally-desc">Rallies lalong rallies, endurance</div>
          </div>
        </div>
      </div>

      <div class="stat-table">
        <div class="stat-table-header"><div>${t('stat_col')}</div><div>${t('val_col')}</div><div>${t('pct_col')}</div></div>
        ${[
          ['🎯 Vel. saque',        (s.serve_kmh||'—')+' km/h',        barW(s.serve_kmh||200, 170, 250)],
          ['👊 Vel. derecha',      (s.fh_kmh||'—')+' km/h',           barW(s.fh_kmh||145, 118, 178)],
          ['🔄 ' + t('bh_speed'),        (s.bh_kmh||'—')+' km/h',           barW(s.bh_kmh||138, 115, 162)],
          ['1er Srv %',            Math.round(s.serve1pct*100)+'%',    barW(s.serve1pct, 0.56, 0.70)],
          ['Efic. 1er srv',        Math.round(s.win1st*100)+'%',       barW(s.win1st, 0.68, 0.86)],
          ['Efic. 2do srv',        Math.round(s.win2nd*100)+'%',       barW(s.win2nd, 0.50, 0.62)],
          [t('return_row'),           Math.round(s.returnWin*100)+'%',    barW(s.returnWin, 0.28, 0.52)],
          ['Winners',              s.winners+'/partido',               barW(s.winners, 24, 52)],
          ['Control',              s.errors+' errores',                100-barW(s.errors, 18, 38)],
          ['Conv. breaks',         Math.round(s.breakConvert*100)+'%', barW(s.breakConvert, 0.32, 0.54)],
          ['Solidez (breaks salv.)', Math.round(s.breakSave*100)+'%', barW(s.breakSave, 0.60, 0.74)],
          ['🎯 Tiebreaks',         Math.round((p.tb_win||0.62)*100)+'%', barW(p.tb_win||0.62, 0.52, 0.76)],
          ['💪 Set decisivo',      Math.round((p.dec_win||0.64)*100)+'%', barW(p.dec_win||0.64, 0.54, 0.76)],
          ['🥅 Red',               Math.round((p.net_win||0.65)*100)+'%', barW(p.net_win||0.65, 0.50, 0.84)],
        ].map(([label, val, pct]) => `
          <div class="stat-table-row">
            <div class="str-label">${label}</div>
            <div class="str-value">${val}</div>
            <div class="str-bar"><div class="str-bar-fill" style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>
          </div>`).join('')}
      </div>
    </div>`;
}

// =====================================================
// COMPARADOR
// =====================================================
let comparadorState    = { player1: null, player2: null };
let compEraFilter      = 'all';
let compSearchFilter   = '';
let comparadorInited   = false;

function initComparador() {
  if (comparadorInited) return;
  comparadorInited = true;
  const countEl = document.getElementById('comp-player-count');
  if (countEl) countEl.textContent = PLAYERS.length;

  document.querySelectorAll('#comp-era-filter .era-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#comp-era-filter .era-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      compEraFilter = btn.dataset.era;
      renderComparadorList();
    };
  });
  renderComparadorList();
}

function renderComparadorList() {
  const list = document.getElementById('comp-players-list');
  if (!list) return;

  const filtered = PLAYERS.filter(p => {
    const matchSearch = !compSearchFilter || p.name.toLowerCase().includes(compSearchFilter.toLowerCase());
    const matchEra    = compEraFilter === 'all' || getEra(p) === compEraFilter;
    return matchSearch && matchEra;
  }).sort((a, b) => (b.gs || 0) - (a.gs || 0) || a.name.localeCompare(b.name));

  list.innerHTML = filtered.map(p => {
    let cls = 'player-list-item';
    if (comparadorState.player1?.id === p.id) cls += ' p1-selected';
    if (comparadorState.player2?.id === p.id) cls += ' p2-selected';
    return `
      <div class="${cls}" onclick="selectCompPlayer('${p.id}')">
        <span class="pli-flag">${flagHTML(p)}</span>
        <div class="pli-info">
          <div class="pli-name">${p.name}</div>
          <div class="pli-sub">${p.country} · ${p.era}</div>
        </div>
      </div>`;
  }).join('');
}

function selectCompPlayer(id) {
  const p = PLAYERS.find(x => x.id === id);
  if (!p) return;
  if (!comparadorState.player1) {
    comparadorState.player1 = p;
  } else if (!comparadorState.player2 && p.id !== comparadorState.player1.id) {
    comparadorState.player2 = p;
    renderComparadorComparison();
  } else if (comparadorState.player1.id === p.id) {
    comparadorState.player1 = null;
    comparadorState.player2 = null;
  } else if (comparadorState.player2?.id === p.id) {
    comparadorState.player2 = null;
  } else {
    comparadorState.player1 = p;
    comparadorState.player2 = null;
  }
  renderComparadorList();
}

function renderComparadorComparison() {
  const p1 = comparadorState.player1;
  const p2 = comparadorState.player2;
  if (!p1 || !p2) return;

  document.getElementById('comp-empty-view').style.display  = 'none';
  document.getElementById('comp-detail-content').style.display = 'block';

  const s1 = p1.stats, s2 = p2.stats;
  // Barra proporcional con diferencia amplificada x3 respecto al 50%.
  // Si la proporción real es 55/45, la diferencia es +5% sobre 50.
  // Amplificada x3: 50 + 5*3 = 65% vs 35%.
  // Clamp entre 5% y 95% para que siempre se vean los dos colores.
  const splitBar = (n1, n2, invert = false) => {
    const total = (Number(n1) || 0) + (Number(n2) || 0);
    if (total === 0) return 50;
    const raw = invert
      ? (Number(n2) / total) * 100
      : (Number(n1) / total) * 100;
    const diff = raw - 50;          // diferencia respecto al centro
    const amplified = 50 + diff * 3; // amplificar x3
    const clamped = Math.min(95, Math.max(5, amplified));
    return Math.trunc(clamped * 1000) / 1000;
  };

  const statRows = [
    // [label, val1, val2, rawN1, rawN2, invert?]
    ['1er Srv %',        Math.round(s1.serve1pct*100)+'%', Math.round(s2.serve1pct*100)+'%', s1.serve1pct,      s2.serve1pct,      false],
    ['Pts ganados 1er',  Math.round(s1.win1st*100)+'%',    Math.round(s2.win1st*100)+'%',    s1.win1st,         s2.win1st,         false],
    ['Pts ganados 2do',  Math.round(s1.win2nd*100)+'%',    Math.round(s2.win2nd*100)+'%',    s1.win2nd,         s2.win2nd,         false],
    [t('return_row'),       Math.round(s1.returnWin*100)+'%', Math.round(s2.returnWin*100)+'%', s1.returnWin,      s2.returnWin,      false],
    ['Winners/partido',  s1.winners,                       s2.winners,                       s1.winners,        s2.winners,        false],
    ['Errores no forz.', s1.errors,                        s2.errors,                        s1.errors,         s2.errors,         true],
    ['Conv. Breaks',     Math.round(s1.breakConvert*100)+'%', Math.round(s2.breakConvert*100)+'%', s1.breakConvert, s2.breakConvert, false],
    ['Tiebreaks',        Math.round((p1.tb_win||0.62)*100)+'%', Math.round((p2.tb_win||0.62)*100)+'%', p1.tb_win||0.62, p2.tb_win||0.62, false],
    ['Set decisivo',     Math.round((p1.dec_win||0.64)*100)+'%', Math.round((p2.dec_win||0.64)*100)+'%', p1.dec_win||0.64, p2.dec_win||0.64, false],
    ['Saque km/h',       s1.serve_kmh||'—',                s2.serve_kmh||'—',                s1.serve_kmh||200, s2.serve_kmh||200, false],
  ];

  // GS breakdown dots helper
  const gsDots = (n, max, color) => n > 0
    ? `<span class="comp-gs-dots" style="color:${color}">${'●'.repeat(Math.min(n, max))}</span>`
    : `<span class="comp-gs-dots-zero">–</span>`;

  document.getElementById('comp-detail-content').innerHTML = `
    <div class="comp-header-row">
      <div class="comp-player-head p1">
        <img src="img/${p1.id}.png" class="comp-player-photo p1-photo" onerror="this.style.display='none'">
        <div class="comp-player-text">
          <div class="comp-player-name">${flagHTML(p1)} ${p1.name}</div>
          <div class="comp-player-meta">${p1.country} · ${p1.era}</div>
        </div>
      </div>
      <div class="comp-vs-badge">VS</div>
      <div class="comp-player-head p2">
        <div class="comp-player-text">
          <div class="comp-player-name">${flagHTML(p2)} ${p2.name}</div>
          <div class="comp-player-meta">${p2.country} · ${p2.era}</div>
        </div>
        <img src="img/${p2.id}.png" class="comp-player-photo p2-photo" onerror="this.style.display='none'">
      </div>
    </div>

    <!-- TITLES -->
    <div class="comp-titles-section">
      <div class="comp-titles-row comp-titles-header">
        <div class="comp-titles-val"></div>
        <div class="comp-titles-label">${t('titles')}</div>
        <div class="comp-titles-val"></div>
      </div>

      <!-- Grand Slams total -->
      <div class="comp-titles-row highlight-row">
        <div class="comp-titles-val p1-col big">${p1.gs||0}</div>
        <div class="comp-titles-label">🏆 Grand Slams</div>
        <div class="comp-titles-val p2-col big">${p2.gs||0}</div>
      </div>

      <!-- GS breakdown -->
      <div class="comp-titles-row sub-row">
        <div class="comp-titles-val p1-col">${p1.gs_ro||0} ${gsDots(p1.gs_ro||0,14,'#ff8a65')}</div>
        <div class="comp-titles-label">🟠 Roland Garros</div>
        <div class="comp-titles-val p2-col">${p2.gs_ro||0} ${gsDots(p2.gs_ro||0,14,'#ff8a65')}</div>
      </div>
      <div class="comp-titles-row sub-row">
        <div class="comp-titles-val p1-col">${p1.gs_wi||0} ${gsDots(p1.gs_wi||0,8,'#81c784')}</div>
        <div class="comp-titles-label">🟢 Wimbledon</div>
        <div class="comp-titles-val p2-col">${p2.gs_wi||0} ${gsDots(p2.gs_wi||0,8,'#81c784')}</div>
      </div>
      <div class="comp-titles-row sub-row">
        <div class="comp-titles-val p1-col">${p1.gs_us||0} ${gsDots(p1.gs_us||0,5,'#4fc3f7')}</div>
        <div class="comp-titles-label">🔵 US Open</div>
        <div class="comp-titles-val p2-col">${p2.gs_us||0} ${gsDots(p2.gs_us||0,5,'#4fc3f7')}</div>
      </div>
      <div class="comp-titles-row sub-row">
        <div class="comp-titles-val p1-col">${p1.gs_au||0} ${gsDots(p1.gs_au||0,11,'#ffd54f')}</div>
        <div class="comp-titles-label">🟡 Australian Open</div>
        <div class="comp-titles-val p2-col">${p2.gs_au||0} ${gsDots(p2.gs_au||0,11,'#ffd54f')}</div>
      </div>

      <!-- Masters 1000 -->
      <div class="comp-titles-row highlight-row">
        <div class="comp-titles-val p1-col big">${p1.masters||0}</div>
        <div class="comp-titles-label">💎 Masters 1000</div>
        <div class="comp-titles-val p2-col big">${p2.masters||0}</div>
      </div>

      <!-- ATP 500 -->
      <div class="comp-titles-row highlight-row">
        <div class="comp-titles-val p1-col big">${p1.m500||0}</div>
        <div class="comp-titles-label">🥈 ATP 500</div>
        <div class="comp-titles-val p2-col big">${p2.m500||0}</div>
      </div>

      <!-- Total titles -->
      <div class="comp-titles-row total-row">
        <div class="comp-titles-val p1-col total">${(p1.gs||0)+(p1.masters||0)+(p1.m500||0)}</div>
        <div class="comp-titles-label">${t('total_titles')}</div>
        <div class="comp-titles-val p2-col total">${(p2.gs||0)+(p2.masters||0)+(p2.m500||0)}</div>
      </div>
    </div>
    <div class="comp-stat-table">
      ${statRows.map(([label, v1, v2, n1, n2, inv]) => {
        const pct1 = splitBar(n1, n2, inv);
        const pct2 = Math.trunc((100 - pct1) * 1000) / 1000;
        return `
        <div class="comp-stat-row">
          <div class="comp-stat-val p1-val">${v1}</div>
          <div class="comp-stat-bar-wrap">
            <div class="comp-split-bar-left">
              <div class="comp-split-p1" style="width:${pct1}%"></div>
            </div>
            <div class="comp-stat-label">${label}</div>
            <div class="comp-split-bar-right">
              <div class="comp-split-p2" style="width:${pct2}%"></div>
            </div>
          </div>
          <div class="comp-stat-val p2-val">${v2}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="comp-surface-section">
      <div class="section-label">${t('surf_advantage')}</div>
      ${[[`🔵 ${t('surf_hard')}`,'hard'],[`🟠 ${t('surf_clay')}`,'clay'],[`🟢 ${t('surf_grass')}`,'grass']].map(([label, key]) => `
        <div class="comp-surface-row">
          <span class="comp-surf-val p1-col">${((s1.surface[key]-1)*100).toFixed(0)}%</span>
          <span class="comp-surf-label">${label}</span>
          <span class="comp-surf-val p2-col">${((s2.surface[key]-1)*100).toFixed(0)}%</span>
        </div>`).join('')}
    </div>
    <button class="comp-clear-btn" onclick="clearComparador()">${t('clear_sel')}</button>`;
}

function clearComparador() {
  comparadorState.player1 = null;
  comparadorState.player2 = null;
  renderComparadorList();
  document.getElementById('comp-empty-view').style.display  = 'block';
  document.getElementById('comp-detail-content').style.display = 'none';
}

// =====================================================
// HISTÓRICO
// =====================================================
const SURF_LABEL  = { H:'Hard', C:'Clay', G:'Grass', I:'Indoor', P:'Grass', Y:'Grass' };
const ROUND_LABEL = { F:'Final', SF:'Semifinal', QF:'Cuartos', R16:'Octavos', R32:'3ª ronda', R64:'2ª ronda', R128:'1ª ronda', RR:'Round Robin' };

let resultsCurrent  = [];
let resultsPage     = 0;
const RESULTS_PER_PAGE = 50;

function initResultsPage() {
  if (typeof RESULTS_DB === 'undefined') return;

  const p1Sel   = document.getElementById('rf-p1');
  const p2Sel   = document.getElementById('rf-p2');
  const fromSel = document.getElementById('rf-year-from');
  const toSel   = document.getElementById('rf-year-to');
  if (!p1Sel || !fromSel) return;

  for (let y = 1985; y <= 2024; y++) {
    [fromSel, toSel].forEach(sel => {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      sel.appendChild(o);
    });
  }
  toSel.value = 2024;

  const sorted = PLAYERS.slice().sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(p => {
    [p1Sel, p2Sel].forEach(sel => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = `${p.countryFlag} ${p.name}`;
      sel.appendChild(o);
    });
  });

  applyResultsFilter();
}

function applyResultsFilter() {
  if (typeof RESULTS_DB === 'undefined') return;

  const p1Id  = document.getElementById('rf-p1').value;
  const p2Id  = document.getElementById('rf-p2').value;
  const surf  = document.getElementById('rf-surf').value;
  const lvl   = document.getElementById('rf-lvl').value;
  const yFrom = parseInt(document.getElementById('rf-year-from').value) || 1985;
  const yTo   = parseInt(document.getElementById('rf-year-to').value)   || 2024;

  // H2H badge
  const badge = document.getElementById('h2h-badge');
  if (badge && p1Id && p2Id) {
    const key1 = `${p1Id}_${p2Id}`, key2 = `${p2Id}_${p1Id}`;
    const h2h  = RESULTS_DB.h2h[key1] || RESULTS_DB.h2h[key2];
    if (h2h) {
      const pl1 = PLAYERS.find(x => x.id === p1Id);
      const pl2 = PLAYERS.find(x => x.id === p2Id);
      const w1  = RESULTS_DB.h2h[key1] ? h2h[0] : h2h[1];
      const w2  = RESULTS_DB.h2h[key1] ? h2h[1] : h2h[0];
      badge.style.display = 'block';
      badge.innerHTML = `
        <div class="h2h-inner">
          <span class="h2h-name p1-name">${pl1?.name || p1Id}</span>
          <span class="h2h-score"><span class="h2h-w1">${w1}</span> – <span class="h2h-w2">${w2}</span></span>
          <span class="h2h-name p2-name">${pl2?.name || p2Id}</span>
        </div>`;
    } else {
      badge.style.display = 'none';
    }
  } else if (badge) {
    badge.style.display = 'none';
  }

  resultsCurrent = RESULTS_DB.matches.filter(m => {
    const [w, l, s, lv, , , , y] = m;
    if (p1Id && p2Id && !((w===p1Id&&l===p2Id)||(w===p2Id&&l===p1Id))) return false;
    else if (p1Id && !p2Id && w!==p1Id && l!==p1Id) return false;
    else if (p2Id && !p1Id && w!==p2Id && l!==p2Id) return false;
    if (surf && s !== surf) return false;
    if (lvl  && lv !== lvl) return false;
    if (y < yFrom || y > yTo) return false;
    return true;
  });

  resultsPage = 0;
  renderResultsTable();
  renderResultsPagination();

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${resultsCurrent.length.toLocaleString()} ${t('matches_found')}`;
}

function resetResultsFilter() {
  document.getElementById('rf-p1').value   = '';
  document.getElementById('rf-p2').value   = '';
  document.getElementById('rf-surf').value = '';
  document.getElementById('rf-lvl').value  = '';
  document.getElementById('rf-year-from').value = '';
  document.getElementById('rf-year-to').value   = 2024;
  applyResultsFilter();
}

function renderResultsTable() {
  const tbody = document.getElementById('results-tbody');
  if (!tbody) return;

  const start = resultsPage * RESULTS_PER_PAGE;
  const slice = resultsCurrent.slice(start, start + RESULTS_PER_PAGE);

  tbody.innerHTML = slice.map(m => {
    const [w, l, s, lv, t, r, sc, y] = m;
    const wp = PLAYERS.find(x => x.id === w);
    const lp = PLAYERS.find(x => x.id === l);
    const wName = wp ? `${flagHTML(wp)} ${wp.name}` : w;
    const lName = lp ? `${flagHTML(lp)} ${lp.name}` : l;
    const lvlBadge = lv==='Grand Slam'?'badge-gs' : lv==='Masters 1000'?'badge-m1k' : lv==='ATP Finals'?'badge-finals' : 'badge-atp';
    return `<tr>
      <td>${y}</td>
      <td class="tourn-name">${t}</td>
      <td><span class="lvl-badge ${lvlBadge}">${lv}</span></td>
      <td>${ROUND_LABEL[r] || r}</td>
      <td>${SURF_LABEL[s] || s}</td>
      <td class="winner-cell">${wName}</td>
      <td class="loser-cell">${lName}</td>
      <td class="score-cell">${sc || ''}</td>
    </tr>`;
  }).join('');
}

function renderResultsPagination() {
  const pag = document.getElementById('results-pagination');
  if (!pag) return;
  const total = Math.ceil(resultsCurrent.length / RESULTS_PER_PAGE);
  if (total <= 1) { pag.innerHTML = ''; return; }

  const maxShow = 7;
  const start   = Math.max(0, resultsPage - 3);
  const end     = Math.min(total, start + maxShow);
  let html = '';

  if (resultsPage > 0)         html += `<button class="pag-btn" onclick="goResultsPage(${resultsPage-1})">‹</button>`;
  for (let i = start; i < end; i++)
    html += `<button class="pag-btn${i===resultsPage?' active':''}" onclick="goResultsPage(${i})">${i+1}</button>`;
  if (resultsPage < total - 1) html += `<button class="pag-btn" onclick="goResultsPage(${resultsPage+1})">›</button>`;

  pag.innerHTML = html;
}

function goResultsPage(n) {
  resultsPage = n;
  renderResultsTable();
  renderResultsPagination();
  document.querySelector('.results-table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
// =====================================================
// SIMULACIÓN 1000 PARTIDOS
// =====================================================

function simulate1000() {
  if (!sel.p1 || !sel.p2) return;

  const p1 = sel.p1, p2 = sel.p2;
  const surface = config.surface;
  const maxSets = config.sets;
  const toWin   = Math.ceil(maxSets / 2);
  const N = 100;

  let wins1 = 0, wins2 = 0;
  let totalSets1 = 0, totalSets2 = 0;
  let totalGames1 = 0, totalGames2 = 0;

  for (let i = 0; i < N; i++) {
    let winsP1 = 0, winsP2 = 0;
    let totalGames = 0;
    const firstServer = Math.floor(Math.random() * 2);
    while (winsP1 < toWin && winsP2 < toWin) {
      const setNum  = winsP1 + winsP2 + 1;
      const isFinal = (setNum === maxSets);
      const setFS   = (firstServer + totalGames) % 2;
      const set     = simSet(p1, p2, surface, isFinal, config.tb, setFS);
      totalGames   += set.gameCount || (set.games[0] + set.games[1]);
      if (set.winner === 0) winsP1++; else winsP2++;
    }
    if (winsP1 > winsP2) wins1++; else wins2++;
  }

  const pct1 = (wins1 / N * 100).toFixed(1);
  const pct2 = (wins2 / N * 100).toFixed(1);

  // Amplify x3 from 50 for bar
  const raw1 = wins1 / N * 100;
  const diff = raw1 - 50;
  const bar1 = Math.min(95, Math.max(5, 50 + diff * 3)).toFixed(3);
  const bar2 = (100 - bar1).toFixed(3);

  document.getElementById('sim1000-bar-p1').style.width = wins1 + '%';
  document.getElementById('sim1000-bar-p2').style.width = wins2 + '%';
  document.getElementById('sim1000-num-p1').textContent = wins1;
  document.getElementById('sim1000-num-p2').textContent = wins2;
  document.getElementById('sim1000-result').style.display = 'block';
}

function initializeUI() {
  console.log('[TL] initializeUI()');
  if (typeof PLAYERS === 'undefined') { console.error('[TL] PLAYERS not loaded'); return; }

  // Grids
  renderGrid('grid-p1', 'p1');
  renderGrid('grid-p2', 'p2');

  // Inicializar stats (sidebar)
  initStats();

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.onclick = () => showPage(btn.getAttribute('data-page'));
  });

  // Búsqueda grids
  document.getElementById('search-p1')?.addEventListener('input', e => filterGrid('p1', e.target.value));
  document.getElementById('search-p2')?.addEventListener('input', e => filterGrid('p2', e.target.value));
  initMobileSimulator();

  // Búsqueda sidebar stats
  document.getElementById('sidebar-search')?.addEventListener('input', e => filterSidebar(e.target.value));

  // Búsqueda sidebar comparador
  document.getElementById('comp-sidebar-search')?.addEventListener('input', e => {
    compSearchFilter = e.target.value;
    renderComparadorList();
  });

  // Botón simular
  const simBtn = document.getElementById('sim-btn');
  if (simBtn) simBtn.onclick = simulate;

  const simBtn1000 = document.getElementById('sim-btn-1000');
  if (simBtn1000) simBtn1000.onclick = simulate1000;

  // Botón nuevo partido
  const againBtn = document.getElementById('again-btn');
  if (againBtn) againBtn.onclick = resetSim;

  // Ocultar paneles de resultado al inicio
  ['scoreboard','match-stats','point-log','winner-banner','again-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Config options
  document.querySelectorAll('#surface-opts .opt-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#surface-opts .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      config.surface = btn.dataset.val;
    };
  });
  document.querySelectorAll('#sets-opts .opt-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#sets-opts .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      config.sets = parseInt(btn.dataset.val);
    };
  });
  document.querySelectorAll('#tb-opts .opt-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#tb-opts .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      config.tb = btn.dataset.val === 'yes';
    };
  });

  // Language toggle
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLang);

  applyLang();
  console.log('[TL] ✓ Ready — ' + PLAYERS.length + ' ' + t('players_loaded'));
}
