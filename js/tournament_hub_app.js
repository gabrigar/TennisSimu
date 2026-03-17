(function () {
  const DRAW_SIZE = 32;
  const ROUND_NAMES = ['R32', 'R16', 'QF', 'SF', 'F'];
  const ROUND_LABEL_KEYS = ['roundR32', 'roundR16', 'roundQf', 'roundSf', 'roundF'];
  const SLAM_DEFS = {
    ao: {
      key: 'ao',
      surface: 'hard',
      bestOf: 5,
      useTb: true,
      country: 'Australia',
      city: 'Melbourne',
      venue: 'Melbourne Park',
      timing: 'January',
      altitude: 'Sea level',
      court: 'Outdoor acrylic hard court',
      pace: 'Medium-fast',
      bounce: 'High and lively',
      noteEn: 'The hottest major on the calendar. The court rewards first strike tennis but the heat makes depth, legs and recovery matter over five sets.',
      noteEs: 'El major mas caluroso del calendario. La pista premia el primer golpe, pero el calor hace que la profundidad, las piernas y la recuperacion pesen mucho a cinco sets.'
    },
    rg: {
      key: 'rg',
      surface: 'clay',
      bestOf: 5,
      useTb: true,
      country: 'France',
      city: 'Paris',
      venue: 'Roland-Garros',
      timing: 'May / June',
      altitude: 'Low altitude',
      court: 'Outdoor clay court',
      pace: 'Slow',
      bounce: 'Heavy and high',
      noteEn: 'The slowest major. Heavy topspin, return quality and resistance in long exchanges are constantly rewarded.',
      noteEs: 'El major mas lento. El topspin pesado, la calidad al resto y la resistencia en intercambios largos reciben premio continuo.'
    },
    wb: {
      key: 'wb',
      surface: 'grass',
      bestOf: 5,
      useTb: true,
      country: 'United Kingdom',
      city: 'London',
      venue: 'All England Club',
      timing: 'June / July',
      altitude: 'Sea level',
      court: 'Outdoor grass court',
      pace: 'Fast',
      bounce: 'Low and skidding',
      noteEn: 'The most compressed major. Short points, first serve protection and low-contact ball striking decide everything quickly.',
      noteEs: 'El major mas comprimido. Los puntos cortos, la proteccion del primer saque y el golpeo a baja altura deciden muy rapido.'
    },
    us: {
      key: 'us',
      surface: 'hard',
      bestOf: 5,
      useTb: true,
      country: 'United States',
      city: 'New York',
      venue: 'USTA Billie Jean King National Tennis Center',
      timing: 'August / September',
      altitude: 'Sea level',
      court: 'Outdoor acrylic hard court',
      pace: 'Medium-fast',
      bounce: 'True and direct',
      noteEn: 'Night-session energy, hard court pace and loud momentum swings. The draw tends to reward big serving and front-foot aggression.',
      noteEs: 'Energia de night session, ritmo de hard court y cambios de inercia fuertes. El cuadro suele premiar el gran saque y la agresion hacia delante.'
    }
  };

  const I18N = {
    en: {
      navTitle: 'Grand Slams Simulator',
      subtitle: 'Build a major draw manually or randomly, then simulate the tournament round by round until a champion is crowned.',
      slamLabel: 'Grand Slam',
      actionsLabel: 'Draw tools',
      progressLabel: 'Simulation',
      playersTitle: 'Available players',
      playersSearch: 'Search player...',
      eraLabel: 'Era filter',
      playersNote: 'Click a slot in the draw, then assign a player from this list. Already assigned players stay marked.',
      randomDraw: 'Random draw',
      clearDraw: 'Clear draw',
      clearSlot: 'Clear slot',
      simulateRound: 'Simulate next round',
      championLabel: 'Tournament champion',
      photoPlaceholder: '',
      stageEmpty: 'Fill the draw to start. You can select slots manually or generate a random bracket instantly.',
      stageReady: 'Draw ready. Simulate the first round when you want.',
      stageRound: 'Current step: {round}. Winners advance automatically into the next column.',
      stageDone: 'Tournament complete. The champion card is locked and the full path stays visible in the bracket.',
      selectedSlot: 'Selected slot {slot}',
      selectedSlotEmpty: 'No slot selected',
      selectedSlotLocked: 'Only round-of-32 slots are editable',
      roundR32: 'Round of 32',
      roundR16: 'Round of 16',
      roundQf: 'Quarterfinals',
      roundSf: 'Semifinals',
      roundF: 'Final',
      drawComplete: 'Draw complete',
      drawIncomplete: '{count}/{size} filled',
      championPending: 'Champion pending',
      championScore: 'Final score {score}',
      manualHint: 'Click to place player',
      pendingHint: 'Waiting for simulation',
      awaitingWinner: 'Awaiting winner',
      winnerTag: 'Winner',
      scoreTag: 'Score',
      unfilled: 'Empty slot',
      bye: 'TBD',
      metaCountry: 'Country',
      metaVenue: 'Venue',
      metaSurface: 'Surface',
      metaCourt: 'Court',
      metaPace: 'Pace',
      metaBounce: 'Bounce',
      metaTiming: 'Dates',
      metaAltitude: 'Altitude',
      randomSummary: 'Random draw created with {count} players.',
      clearSummary: 'Draw cleared. Start again from the first round.',
      slotCleared: 'Selected slot cleared.',
      autoWinner: 'Advanced',
      randomFillSummary: 'Random draw filled {count} open slots from the current era pool.',
      viewOverview: 'Overview',
      viewFocus: 'Focus',
      eras: { all: 'All', '70s': '70s', '80s': '80s', '90s': '90s', '2000s': '2000s', '2010s': '2010s+' },
      slams: {
        ao: 'Australian Open',
        rg: 'Roland Garros',
        wb: 'Wimbledon',
        us: 'US Open'
      }
    },
    es: {
      navTitle: 'Grand Slams Simulator',
      subtitle: 'Construye un cuadro de Grand Slam a mano o de forma aleatoria y luego simula el torneo ronda a ronda hasta coronar campeon.',
      slamLabel: 'Grand Slam',
      actionsLabel: 'Herramientas',
      progressLabel: 'Simulacion',
      playersTitle: 'Jugadores disponibles',
      playersSearch: 'Buscar jugador...',
      eraLabel: 'Filtro de era',
      playersNote: 'Haz clic en una casilla del cuadro y luego asigna un jugador desde esta lista. Los ya usados quedan marcados.',
      randomDraw: 'Sorteo aleatorio',
      clearDraw: 'Vaciar cuadro',
      clearSlot: 'Vaciar casilla',
      simulateRound: 'Simular siguiente ronda',
      championLabel: 'Campeon del torneo',
      photoPlaceholder: '',
      stageEmpty: 'Rellena el cuadro para empezar. Puedes elegir slots a mano o generar un cuadro aleatorio al instante.',
      stageReady: 'Cuadro listo. Puedes simular la primera ronda cuando quieras.',
      stageRound: 'Paso actual: {round}. Los ganadores avanzan automaticamente a la siguiente columna.',
      stageDone: 'Torneo completo. La casilla de campeon queda fijada y el camino entero se mantiene visible en el cuadro.',
      selectedSlot: 'Casilla seleccionada {slot}',
      selectedSlotEmpty: 'Ninguna casilla seleccionada',
      selectedSlotLocked: 'Solo se pueden editar las casillas de primera ronda',
      roundR32: 'Dieciseisavos',
      roundR16: 'Octavos',
      roundQf: 'Cuartos',
      roundSf: 'Semifinales',
      roundF: 'Final',
      drawComplete: 'Cuadro completo',
      drawIncomplete: '{count}/{size} rellenas',
      championPending: 'Campeon pendiente',
      championScore: 'Marcador final {score}',
      manualHint: 'Haz clic para poner jugador',
      pendingHint: 'Pendiente de simulacion',
      awaitingWinner: 'Esperando ganador',
      winnerTag: 'Ganador',
      scoreTag: 'Marcador',
      unfilled: 'Casilla vacia',
      bye: 'Pendiente',
      metaCountry: 'Pais',
      metaVenue: 'Sede',
      metaSurface: 'Superficie',
      metaCourt: 'Pista',
      metaPace: 'Ritmo',
      metaBounce: 'Bote',
      metaTiming: 'Fechas',
      metaAltitude: 'Altitud',
      randomSummary: 'Sorteo aleatorio generado con {count} jugadores.',
      clearSummary: 'Cuadro vaciado. Puedes empezar otra vez desde primera ronda.',
      slotCleared: 'Casilla seleccionada vaciada.',
      autoWinner: 'Clasificado',
      randomFillSummary: 'El sorteo aleatorio ha rellenado {count} huecos usando el filtro de era actual.',
      viewOverview: 'Vista general',
      viewFocus: 'Vista cercana',
      eras: { all: 'Todas', '70s': '70s', '80s': '80s', '90s': '90s', '2000s': '2000s', '2010s': '2010s+' },
      slams: {
        ao: 'Open de Australia',
        rg: 'Roland Garros',
        wb: 'Wimbledon',
        us: 'US Open'
      }
    }
  };

  const state = {
    slam: 'ao',
    search: '',
    eraFilter: 'all',
    mobileView: 'focus',
    selectedSlot: 0,
    entrants: Array(DRAW_SIZE).fill(null),
    rounds: [],
    statusMessage: ''
  };

  let initialized = false;

  function getLang() {
    return window.__simuLang || localStorage.getItem('lang') || 'en';
  }

  function t(key) {
    const lang = getLang();
    return key.split('.').reduce((acc, part) => acc && acc[part], I18N[lang]) || key;
  }

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function playerFlag(player) {
    return player?.countryFlag ? `${player.countryFlag} ` : '';
  }

  function getSlam() {
    return SLAM_DEFS[state.slam];
  }

  function getAssignedMap() {
    const map = new Map();
    state.entrants.forEach((player, index) => {
      if (player) map.set(player.id, index);
    });
    return map;
  }

  function getEraBucket(player) {
    const start = parseInt(String(player?.era || '').split('-')[0], 10);
    if (start >= 2010) return '2010s';
    if (start >= 2000) return '2000s';
    if (start >= 1990) return '90s';
    if (start >= 1980) return '80s';
    return '70s';
  }

  function getEraFilteredPlayers() {
    if (typeof PLAYERS === 'undefined') return [];
    return PLAYERS.filter((player) => state.eraFilter === 'all' || getEraBucket(player) === state.eraFilter);
  }

  function getDisplayPlayers() {
    const query = state.search.trim().toLowerCase();
    const list = getEraFilteredPlayers()
      .filter((player) => {
        if (!query) return true;
        return [player.name, player.country, player.era, player.style]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .slice()
      .sort((a, b) => {
        const scoreA = (a.gs || 0) * 100 + (a.masters || 0) * 10 + (a.m500 || 0);
        const scoreB = (b.gs || 0) * 100 + (b.masters || 0) * 10 + (b.m500 || 0);
        return scoreB - scoreA || a.name.localeCompare(b.name);
      });
    return list;
  }

  function clearRounds() {
    state.rounds = [];
  }

  function resetTournament(messageKey) {
    state.entrants = Array(DRAW_SIZE).fill(null);
    state.selectedSlot = 0;
    clearRounds();
    state.statusMessage = messageKey ? t(messageKey) : '';
  }

  function setSlam(key) {
    state.slam = key;
    clearRounds();
    state.statusMessage = '';
    render();
  }

  function assignPlayerToSlot(player, slotIndex) {
    if (slotIndex == null || slotIndex < 0 || slotIndex >= DRAW_SIZE) return;
    clearRounds();
    state.entrants = state.entrants.map((entry) => entry?.id === player.id ? null : entry);
    state.entrants[slotIndex] = player;
    const nextEmpty = state.entrants.findIndex((entry) => !entry);
    state.selectedSlot = nextEmpty >= 0 ? nextEmpty : slotIndex;
    state.statusMessage = '';
    render();
  }

  function clearSelectedSlot() {
    if (state.selectedSlot == null || state.selectedSlot >= DRAW_SIZE) return;
    clearRounds();
    state.entrants[state.selectedSlot] = null;
    state.statusMessage = t('slotCleared');
    render();
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function createRandomDraw() {
    if (typeof PLAYERS === 'undefined') return;
    clearRounds();
    const assignedIds = new Set(state.entrants.filter(Boolean).map((player) => player.id));
    const openSlots = [];
    state.entrants.forEach((player, index) => {
      if (!player) openSlots.push(index);
    });

    const pool = shuffle(getEraFilteredPlayers().filter((player) => !assignedIds.has(player.id)));
    let filled = 0;

    openSlots.forEach((slotIndex, index) => {
      const player = pool[index];
      if (!player) return;
      state.entrants[slotIndex] = player;
      filled++;
    });

    const nextEmpty = state.entrants.findIndex((entry) => !entry);
    state.selectedSlot = nextEmpty >= 0 ? nextEmpty : 0;
    state.statusMessage = interpolate(t('randomFillSummary'), { count: filled });
    render();
  }

  function getCurrentParticipants() {
    if (!state.rounds.length) return state.entrants;
    return state.rounds[state.rounds.length - 1].map((match) => match.winner);
  }

  function isDrawComplete() {
    return state.entrants.every(Boolean);
  }

  function getCurrentRoundIndex() {
    return state.rounds.length;
  }

  function buildRoundMatches(participants, roundIndex) {
    const roundLabel = t(ROUND_LABEL_KEYS[roundIndex]);
    const matches = [];
    for (let i = 0; i < participants.length; i += 2) {
      const p1 = participants[i] || null;
      const p2 = participants[i + 1] || null;
      if (!p1 && !p2) {
        matches.push({ roundIndex, roundLabel, p1: null, p2: null, winner: null, score: '' });
        continue;
      }

      if (p1 && !p2) {
        matches.push({ roundIndex, roundLabel, p1, p2: null, winner: p1, score: t('autoWinner') });
        continue;
      }

      if (!p1 && p2) {
        matches.push({ roundIndex, roundLabel, p1: null, p2, winner: p2, score: t('autoWinner') });
        continue;
      }

      const slam = getSlam();
      const result = typeof simMatch === 'function'
        ? simMatch(p1, p2, slam.surface, slam.bestOf, slam.useTb)
        : null;
      const winner = result ? result.winner : p1;
      matches.push({
        roundIndex,
        roundLabel,
        p1,
        p2,
        winner,
        loser: result ? result.loser : p2,
        score: result ? result.scoreStr : ''
      });
    }
    return matches;
  }

  function simulateNextRound() {
    const roundIndex = getCurrentRoundIndex();
    if (roundIndex === 0 && !isDrawComplete()) return;
    if (roundIndex >= ROUND_NAMES.length) return;
    const participants = getCurrentParticipants();
    if (!participants.every(Boolean)) return;

    const roundMatches = buildRoundMatches(participants, roundIndex);
    state.rounds.push(roundMatches);
    state.statusMessage = '';
    render();
  }

  function getChampionMatch() {
    if (!state.rounds.length) return null;
    const lastRound = state.rounds[state.rounds.length - 1];
    if (lastRound.length !== 1) return null;
    return lastRound[0].winner ? lastRound[0] : null;
  }

  function renderTop() {
    const slam = getSlam();
    const title = document.getElementById('tourhub-title');
    const subtitle = document.getElementById('tourhub-subtitle');
    const kicker = document.getElementById('tourhub-kicker');
    const metaGrid = document.getElementById('tourhub-meta-grid');
    const description = document.getElementById('tourhub-description');
    const photo = document.getElementById('tourhub-photo-placeholder');
    const slamLabel = document.getElementById('tourhub-slam-label');
    const actionsLabel = document.getElementById('tourhub-actions-label');
    const progressLabel = document.getElementById('tourhub-progress-label');
    const playersTitle = document.getElementById('tourhub-players-title');
    const playersSearch = document.getElementById('tourhub-player-search');
    const eraLabel = document.getElementById('tourhub-era-label');
    const playersNote = document.getElementById('tourhub-sidebar-note');
    const overviewBtn = document.getElementById('tourhub-view-overview-btn');
    const focusBtn = document.getElementById('tourhub-view-focus-btn');
    const bracketWrap = document.getElementById('tourhub-bracket-wrap');

    title.textContent = `${t('navTitle')} · ${t(`slams.${slam.key}`)}`;
    subtitle.textContent = t('subtitle');
    kicker.textContent = `${t(`slams.${slam.key}`)} · ${slam.city} · ${slam.venue}`;
    description.textContent = getLang() === 'es' ? slam.noteEs : slam.noteEn;
    photo.innerHTML = '';
    photo.style.backgroundImage = `linear-gradient(135deg, rgba(10,10,15,0.28), rgba(10,10,15,0.82)), url('img/slams/${slam.key}.png')`;
    bracketWrap?.style.setProperty('--tourhub-bracket-art', `url('img/slams/${slam.key}.png')`);
    slamLabel.textContent = t('slamLabel');
    actionsLabel.textContent = t('actionsLabel');
    progressLabel.textContent = t('progressLabel');
    playersTitle.textContent = t('playersTitle');
    playersSearch.placeholder = t('playersSearch');
    eraLabel.textContent = t('eraLabel');
    playersNote.textContent = t('playersNote');

    const meta = [
      [t('metaCountry'), `${slam.country} · ${slam.city}`],
      [t('metaVenue'), slam.venue],
      [t('metaSurface'), `${slam.surface.toUpperCase()} · BO${slam.bestOf}`],
      [t('metaCourt'), slam.court],
      [t('metaPace'), slam.pace],
      [t('metaBounce'), slam.bounce],
      [t('metaTiming'), slam.timing],
      [t('metaAltitude'), slam.altitude]
    ];

    metaGrid.innerHTML = meta.map(([label, value]) => `
      <div class="tourhub-meta-card">
        <div class="tourhub-meta-label">${label}</div>
        <div class="tourhub-meta-value">${value}</div>
      </div>
    `).join('');

    const slamButtons = document.getElementById('tourhub-slam-buttons');
    slamButtons.innerHTML = Object.keys(SLAM_DEFS).map((key) => `
      <button class="rankhub-btn ${state.slam === key ? 'active' : ''}" data-slam="${key}">
        ${t(`slams.${key}`)}
      </button>
    `).join('');
    slamButtons.querySelectorAll('[data-slam]').forEach((button) => {
      button.onclick = () => setSlam(button.dataset.slam);
    });

    const eraButtons = document.getElementById('tourhub-era-buttons');
    eraButtons.innerHTML = Object.keys(t('eras')).map((key) => `
      <button class="rankhub-btn ${state.eraFilter === key ? 'active' : ''}" data-era="${key}">
        ${t(`eras.${key}`)}
      </button>
    `).join('');
    eraButtons.querySelectorAll('[data-era]').forEach((button) => {
      button.onclick = () => {
        state.eraFilter = button.dataset.era;
        renderTop();
        renderSidebar();
      };
    });

    document.getElementById('tourhub-random-btn').textContent = t('randomDraw');
    document.getElementById('tourhub-clear-btn').textContent = t('clearDraw');
    document.getElementById('tourhub-clear-slot-btn').textContent = t('clearSlot');
    document.getElementById('tourhub-simulate-round-btn').textContent = t('simulateRound');
    document.getElementById('tourhub-champion-label').textContent = t('championLabel');
    overviewBtn.textContent = t('viewOverview');
    focusBtn.textContent = t('viewFocus');
    overviewBtn.classList.toggle('active', state.mobileView === 'overview');
    focusBtn.classList.toggle('active', state.mobileView === 'focus');
  }

  function renderSidebar() {
    const list = document.getElementById('tourhub-player-list');
    const assigned = getAssignedMap();
    const players = getDisplayPlayers();
    list.innerHTML = players.map((player) => {
      const assignedSlot = assigned.get(player.id);
      const selected = state.selectedSlot != null && state.entrants[state.selectedSlot]?.id === player.id;
      return `
        <button class="tourhub-player-item ${assignedSlot != null ? 'assigned' : ''} ${selected ? 'selected' : ''}"
                data-player-id="${player.id}">
          <div class="tourhub-player-main">
            <div class="tourhub-player-name">${playerFlag(player)}${player.name}</div>
            <div class="tourhub-player-meta">${playerFlag(player)}${player.era}</div>
          </div>
          <div class="tourhub-player-side">
            ${assignedSlot != null ? `<span class="tourhub-slot-tag">#${assignedSlot + 1}</span>` : ''}
            <span class="tourhub-player-gs">GS ${player.gs || 0}</span>
          </div>
        </button>
      `;
    }).join('');

    list.querySelectorAll('[data-player-id]').forEach((button) => {
      button.onclick = () => {
        const player = PLAYERS.find((item) => item.id === button.dataset.playerId);
        if (!player) return;
        assignPlayerToSlot(player, state.selectedSlot);
      };
    });
  }

  function getStageMessage() {
    const roundIndex = getCurrentRoundIndex();
    if (!isDrawComplete()) return t('stageEmpty');
    if (roundIndex === 0) return t('stageReady');
    if (roundIndex >= ROUND_NAMES.length) return t('stageDone');
    return interpolate(t('stageRound'), { round: t(ROUND_LABEL_KEYS[roundIndex]) });
  }

  function renderStageBar() {
    const selectedSlot = document.getElementById('tourhub-selected-slot');
    const roundPill = document.getElementById('tourhub-round-pill');
    const stageNote = document.getElementById('tourhub-stage-note');
    const simButton = document.getElementById('tourhub-simulate-round-btn');
    const roundIndex = getCurrentRoundIndex();
    const drawCount = state.entrants.filter(Boolean).length;

    if (roundIndex > 0) {
      selectedSlot.textContent = t('selectedSlotLocked');
    } else if (state.selectedSlot != null) {
      selectedSlot.textContent = interpolate(t('selectedSlot'), { slot: state.selectedSlot + 1 });
    } else {
      selectedSlot.textContent = t('selectedSlotEmpty');
    }

    roundPill.textContent = isDrawComplete()
      ? t('drawComplete')
      : interpolate(t('drawIncomplete'), { count: drawCount, size: DRAW_SIZE });

    stageNote.textContent = state.statusMessage || getStageMessage();
    simButton.disabled = !isDrawComplete() || roundIndex >= ROUND_NAMES.length;
  }

  function getRoundParticipantsForRender(roundIndex) {
    const buildPendingMatches = (participants, targetRoundIndex) => {
      const matches = [];
      for (let i = 0; i < participants.length; i += 2) {
        matches.push({
          p1: participants[i] || null,
          p2: participants[i + 1] || null,
          score: '',
          winner: null,
          roundIndex: targetRoundIndex,
          pending: true
        });
      }
      return matches;
    };

    if (roundIndex === 0) {
      if (state.rounds[0]) return state.rounds[0];
      const matches = [];
      for (let i = 0; i < DRAW_SIZE; i += 2) {
        matches.push({ p1: state.entrants[i], p2: state.entrants[i + 1], score: '', winner: null, roundIndex });
      }
      return matches;
    }

    if (state.rounds[roundIndex]) return state.rounds[roundIndex];

    if (state.rounds[roundIndex - 1]) {
      const participants = state.rounds[roundIndex - 1].map((match) => match.winner || null);
      return buildPendingMatches(participants, roundIndex);
    }

    return Array(DRAW_SIZE / (2 ** (roundIndex + 1))).fill(null).map(() => ({
      p1: null, p2: null, score: '', winner: null, roundIndex
    }));
  }

  function getBracketSideMatches(roundIndex, side) {
    const matches = getRoundParticipantsForRender(roundIndex);
    if (roundIndex === ROUND_NAMES.length - 1) return matches;
    const midpoint = matches.length / 2;
    return side === 'left' ? matches.slice(0, midpoint) : matches.slice(midpoint);
  }

  function renderRoundColumn(roundIndex, side) {
    const matches = getBracketSideMatches(roundIndex, side);
    const sideClass = side === 'left' ? 'tourhub-side-left' : 'tourhub-side-right';
    return `
      <div class="tourhub-round ${sideClass} tourhub-depth-${roundIndex}">
        <div class="tourhub-round-title">${t(ROUND_LABEL_KEYS[roundIndex])}</div>
        <div class="tourhub-round-list">
          ${matches.map((match, matchIndex) => renderMatchCard(match, roundIndex, matchIndex, side)).join('')}
        </div>
      </div>
    `;
  }

  function renderBracket() {
    const bracket = document.getElementById('tourhub-bracket');
    const bracketWrap = document.getElementById('tourhub-bracket-wrap');
    const championMatch = getChampionMatch();
    const finalMatch = getRoundParticipantsForRender(ROUND_NAMES.length - 1)[0] || null;
    bracketWrap.dataset.view = state.mobileView;
    bracket.innerHTML = `
      ${renderRoundColumn(0, 'left')}
      ${renderRoundColumn(1, 'left')}
      ${renderRoundColumn(2, 'left')}
      ${renderRoundColumn(3, 'left')}
      <div class="tourhub-round tourhub-round-final">
        <div class="tourhub-round-title">${t(ROUND_LABEL_KEYS[4])}</div>
        <div class="tourhub-round-list">
          ${finalMatch ? renderMatchCard(finalMatch, 4, 0, 'center') : renderMatchCard({ p1: null, p2: null, score: '', winner: null, roundIndex: 4, pending: true }, 4, 0, 'center')}
          ${championMatch ? renderChampionCard(championMatch) : ''}
        </div>
      </div>
      ${renderRoundColumn(3, 'right')}
      ${renderRoundColumn(2, 'right')}
      ${renderRoundColumn(1, 'right')}
      ${renderRoundColumn(0, 'right')}
    `;
  }

  function renderMatchCard(match, roundIndex, matchIndex, side = 'left') {
    const baseIndex = side === 'right' && roundIndex === 0 ? DRAW_SIZE / 2 : 0;
    const slotAIndex = roundIndex === 0 ? baseIndex + matchIndex * 2 : null;
    const slotBIndex = roundIndex === 0 ? baseIndex + matchIndex * 2 + 1 : null;
    const winnerId = match.winner?.id;
    const footerText = match.score || (match.pending ? t('pendingHint') : t('manualHint'));
    return `
      <div class="tourhub-match-card ${winnerId ? 'done' : ''}">
        ${renderSlot(match.p1, winnerId === match.p1?.id, slotAIndex)}
        ${renderSlot(match.p2, winnerId === match.p2?.id, slotBIndex)}
        <div class="tourhub-match-footer">
          <span>${footerText}</span>
        </div>
      </div>
    `;
  }

  function renderSlot(player, isWinner, slotIndex) {
    const editable = slotIndex != null && state.rounds.length === 0;
    const active = editable && state.selectedSlot === slotIndex;
    const attrs = editable ? `data-slot-index="${slotIndex}"` : '';
    const emptyMeta = editable ? t('manualHint') : t('awaitingWinner');
    const winnerStyle = isWinner && player
      ? `style="--winner-bg: linear-gradient(90deg, rgba(200,240,0,0.18), rgba(10,10,15,0.88) 62%), url('img/${player.id}.png');"`
      : '';
    return `
      <button class="tourhub-slot ${player ? 'filled' : 'empty'} ${isWinner ? 'winner' : ''} ${active ? 'active' : ''}"
              ${winnerStyle}
              ${attrs}
              ${editable ? '' : 'disabled'}>
        <div class="tourhub-slot-seed">${slotIndex != null ? `#${slotIndex + 1}` : ''}</div>
        <div class="tourhub-slot-name">${player ? `${playerFlag(player)}${player.name}` : t('unfilled')}</div>
        <div class="tourhub-slot-meta">${player ? `${playerFlag(player)}${player.era}` : emptyMeta}</div>
      </button>
    `;
  }

  function renderChampionCard(match) {
    const winner = match?.winner;
    if (!winner) return '';
    const scoreText = match.score || '-';
    return `
      <div class="tourhub-match-card champion" style="--champion-bg: linear-gradient(180deg, rgba(200,240,0,0.14), rgba(10,10,15,0.92) 72%), url('img/${winner.id}.png');">
        <div class="tourhub-champion-inside">
          <div class="tourhub-champion-kicker">${t('championLabel')}</div>
          <div class="tourhub-champion-name">${playerFlag(winner)}${winner.name}</div>
          <div class="tourhub-champion-score">${scoreText}</div>
        </div>
      </div>
    `;
  }

  function bindBracketSlots() {
    document.querySelectorAll('[data-slot-index]').forEach((button) => {
      button.onclick = () => {
        state.selectedSlot = Number(button.dataset.slotIndex);
        renderStageBar();
        renderSidebar();
        renderBracket();
        bindBracketSlots();
      };
    });
  }

  function renderChampion() {
    const banner = document.getElementById('tourhub-champion-banner');
    banner.style.display = 'none';
  }

  function render() {
    renderTop();
    renderSidebar();
    renderStageBar();
    renderBracket();
    bindBracketSlots();
    renderChampion();
  }

  window.initTournamentHub = function initTournamentHub() {
    if (initialized) return;

    document.getElementById('tourhub-player-search')?.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderSidebar();
    });

    document.getElementById('tourhub-random-btn')?.addEventListener('click', createRandomDraw);
    document.getElementById('tourhub-clear-btn')?.addEventListener('click', () => {
      resetTournament('clearSummary');
      render();
    });
    document.getElementById('tourhub-clear-slot-btn')?.addEventListener('click', clearSelectedSlot);
    document.getElementById('tourhub-simulate-round-btn')?.addEventListener('click', simulateNextRound);
    document.getElementById('tourhub-view-overview-btn')?.addEventListener('click', () => {
      state.mobileView = 'overview';
      renderTop();
      renderBracket();
      bindBracketSlots();
    });
    document.getElementById('tourhub-view-focus-btn')?.addEventListener('click', () => {
      state.mobileView = 'focus';
      renderTop();
      renderBracket();
      bindBracketSlots();
    });

    initialized = true;
    render();
  };

  window.refreshTournamentHubLang = function refreshTournamentHubLang() {
    if (!initialized) return;
    render();
  };
})();





