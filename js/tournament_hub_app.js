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
      navTitle: 'SIMU GS',
      subtitle: 'Build a major draw manually or randomly, then simulate the tournament round by round until a champion is crowned.',
      slamLabel: 'Grand Slam',
      actionsLabel: 'Draw tools',
      progressLabel: 'Simulation',
      playersTitle: 'Available players',
      playersSearch: 'Search player...',
      playersNote: 'Click a slot in the draw, then assign a player from this list. Already assigned players stay marked.',
      randomDraw: 'Random draw',
      clearDraw: 'Clear draw',
      clearSlot: 'Clear slot',
      simulateRound: 'Simulate next round',
      championLabel: 'Tournament champion',
      photoPlaceholder: 'PHOTO AREA\nDrop your image here later',
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
      slams: {
        ao: 'Australian Open',
        rg: 'Roland Garros',
        wb: 'Wimbledon',
        us: 'US Open'
      }
    },
    es: {
      navTitle: 'SIMU GS',
      subtitle: 'Construye un cuadro de Grand Slam a mano o de forma aleatoria y luego simula el torneo ronda a ronda hasta coronar campeon.',
      slamLabel: 'Grand Slam',
      actionsLabel: 'Herramientas',
      progressLabel: 'Simulacion',
      playersTitle: 'Jugadores disponibles',
      playersSearch: 'Buscar jugador...',
      playersNote: 'Haz clic en una casilla del cuadro y luego asigna un jugador desde esta lista. Los ya usados quedan marcados.',
      randomDraw: 'Sorteo aleatorio',
      clearDraw: 'Vaciar cuadro',
      clearSlot: 'Vaciar casilla',
      simulateRound: 'Simular siguiente ronda',
      championLabel: 'Campeon del torneo',
      photoPlaceholder: 'ESPACIO PARA FOTO\nPon aqui tu imagen despues',
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

  function getDisplayPlayers() {
    if (typeof PLAYERS === 'undefined') return [];
    const query = state.search.trim().toLowerCase();
    const list = PLAYERS
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
    const pool = shuffle(PLAYERS).slice(0, DRAW_SIZE);
    state.entrants = pool;
    state.selectedSlot = 0;
    state.statusMessage = interpolate(t('randomSummary'), { count: DRAW_SIZE });
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
    const playersNote = document.getElementById('tourhub-sidebar-note');

    title.textContent = `${t('navTitle')} · ${t(`slams.${slam.key}`)}`;
    subtitle.textContent = t('subtitle');
    kicker.textContent = `${t(`slams.${slam.key}`)} · ${slam.city} · ${slam.venue}`;
    description.textContent = getLang() === 'es' ? slam.noteEs : slam.noteEn;
    photo.textContent = t('photoPlaceholder');
    slamLabel.textContent = t('slamLabel');
    actionsLabel.textContent = t('actionsLabel');
    progressLabel.textContent = t('progressLabel');
    playersTitle.textContent = t('playersTitle');
    playersSearch.placeholder = t('playersSearch');
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

    document.getElementById('tourhub-random-btn').textContent = t('randomDraw');
    document.getElementById('tourhub-clear-btn').textContent = t('clearDraw');
    document.getElementById('tourhub-clear-slot-btn').textContent = t('clearSlot');
    document.getElementById('tourhub-simulate-round-btn').textContent = t('simulateRound');
    document.getElementById('tourhub-champion-label').textContent = t('championLabel');
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
            <div class="tourhub-player-meta">${player.country} · ${player.era}</div>
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
    if (roundIndex === 0) {
      const matches = [];
      for (let i = 0; i < DRAW_SIZE; i += 2) {
        matches.push({ p1: state.entrants[i], p2: state.entrants[i + 1], score: '', winner: null, roundIndex });
      }
      return matches;
    }
    return state.rounds[roundIndex - 1] || Array(DRAW_SIZE / (2 ** (roundIndex + 1))).fill(null).map(() => ({
      p1: null, p2: null, score: '', winner: null, roundIndex
    }));
  }

  function renderBracket() {
    const bracket = document.getElementById('tourhub-bracket');
    const championMatch = getChampionMatch();
    bracket.innerHTML = '';

    ROUND_NAMES.forEach((name, roundIndex) => {
      const roundCol = document.createElement('div');
      roundCol.className = `tourhub-round tourhub-round-${roundIndex}`;
      const matches = getRoundParticipantsForRender(roundIndex);
      roundCol.innerHTML = `
        <div class="tourhub-round-title">${t(ROUND_LABEL_KEYS[roundIndex])}</div>
        <div class="tourhub-round-list">
          ${matches.map((match, matchIndex) => renderMatchCard(match, roundIndex, matchIndex)).join('')}
        </div>
      `;
      bracket.appendChild(roundCol);
    });

    const championCol = document.createElement('div');
    championCol.className = 'tourhub-round tourhub-round-champion';
    championCol.innerHTML = `
      <div class="tourhub-round-title">${t('championLabel')}</div>
      <div class="tourhub-round-list">
        <div class="tourhub-match-card champion ${championMatch ? 'done' : ''}">
          <div class="tourhub-champion-inside">
            <div class="tourhub-slot-name">${championMatch ? `${playerFlag(championMatch.winner)}${championMatch.winner.name}` : t('championPending')}</div>
            <div class="tourhub-slot-meta">${championMatch ? interpolate(t('championScore'), { score: championMatch.score }) : t('manualHint')}</div>
          </div>
        </div>
      </div>
    `;
    bracket.appendChild(championCol);
  }

  function renderMatchCard(match, roundIndex, matchIndex) {
    const slotAIndex = roundIndex === 0 ? matchIndex * 2 : null;
    const slotBIndex = roundIndex === 0 ? matchIndex * 2 + 1 : null;
    const winnerId = match.winner?.id;
    return `
      <div class="tourhub-match-card ${winnerId ? 'done' : ''}">
        ${renderSlot(match.p1, winnerId === match.p1?.id, slotAIndex)}
        ${renderSlot(match.p2, winnerId === match.p2?.id, slotBIndex)}
        <div class="tourhub-match-footer">
          <span>${match.score || t('manualHint')}</span>
        </div>
      </div>
    `;
  }

  function renderSlot(player, isWinner, slotIndex) {
    const editable = slotIndex != null && state.rounds.length === 0;
    const active = editable && state.selectedSlot === slotIndex;
    const attrs = editable ? `data-slot-index="${slotIndex}"` : '';
    return `
      <button class="tourhub-slot ${player ? 'filled' : 'empty'} ${isWinner ? 'winner' : ''} ${active ? 'active' : ''}"
              ${attrs}
              ${editable ? '' : 'disabled'}>
        <div class="tourhub-slot-seed">${slotIndex != null ? `#${slotIndex + 1}` : ''}</div>
        <div class="tourhub-slot-name">${player ? `${playerFlag(player)}${player.name}` : t('unfilled')}</div>
        <div class="tourhub-slot-meta">${player ? `${player.country} · ${player.era}` : t('manualHint')}</div>
      </button>
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
    const championName = document.getElementById('tourhub-champion-name');
    const championScore = document.getElementById('tourhub-champion-score');
    const champion = getChampionMatch();

    if (!champion) {
      banner.style.display = 'none';
      championName.textContent = '—';
      championScore.textContent = '—';
      return;
    }

    banner.style.display = 'block';
    championName.textContent = `${playerFlag(champion.winner)}${champion.winner.name}`;
    championScore.textContent = champion.score || '—';
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

    initialized = true;
    render();
  };

  window.refreshTournamentHubLang = function refreshTournamentHubLang() {
    if (!initialized) return;
    render();
  };
})();
