(function () {
  const DATA = window.RANKINGS_HUB_DATA;
  if (!DATA) return;

  const state = { mode: 'goat', surface: 'all', era: 'all', search: '' };
  let initialized = false;

  const I18N = {
    en: {
      heroKicker: 'SimuTennis rankings',
      heroTitle: 'Calculated and Real GOAT',
      heroCopy: 'Compare a calculated GOAT ranking from the simulator against a real GOAT ranking built from wins and titles already present in the database.',
      filters: {
        mode: 'Mode',
        surface: 'Surface',
        era: 'Era',
        search: 'Search player',
        searchPlaceholder: 'Federer, Nadal, Djokovic...'
      },
      modes: {
        goat: 'Calculated GOAT',
        real: 'Real GOAT'
      },
      modeDescriptions: {
        goat: 'Calculated GOAT. All-vs-all simulation, 100 matches per matchup and surface.',
        real: 'Real GOAT. Wins from the database plus weighted titles from player profiles.'
      },
      eras: { all: 'All', '70s': '70s', '80s': '80s', '90s': '90s', '2000s': '2000s', '2010s': '2010s+' },
      surfaces: { all: 'All', hard: 'Hard', clay: 'Clay', grass: 'Grass' },
      summary: {
        view: 'View',
        activeFilter: 'Active filter',
        leader: 'Leader',
        rows: 'Rows',
        visiblePlayer: 'visible player',
        visiblePlayers: 'visible players',
        scorePrefix: 'Score'
      },
      board: {
        goatTitle: 'Calculated GOAT',
        goatSubtitle: 'Full field simulated ranking',
        realTitle: 'Real GOAT',
        realSubtitle: 'Wins and titles available in the database',
        noRows: 'No players match the current filter.'
      },
      table: {
        rank: '#',
        player: 'Player',
        score: 'Score',
        wins: 'Wins',
        matches: 'Matches',
        trophies: 'Titles',
        winPct: 'Win%',
        era: 'Era'
      },
      realFormulaAll: 'Score = wins + GS*{gs} + Masters*{masters} + ATP500*{m500}',
      realFormulaSurface: 'Score = wins + surface slams*{slam}',
      sample: '100 matches per matchup',
      metadata: 'Engine {engine} - GOAT sim {goat} - Era sim {era} - {date}',
      trophiesAll: 'GS {gs} - M {masters} - 500 {m500}',
      trophiesSurface: 'GS {slams}',
      countryUnknown: 'Unknown'
    },
    es: {
      heroKicker: 'Rankings de SimuTennis',
      heroTitle: 'Calculated y Real GOAT',
      heroCopy: 'Compara un ranking GOAT calculado por el simulador con un ranking GOAT real construido con victorias y titulos ya presentes en la base de datos.',
      filters: {
        mode: 'Modo',
        surface: 'Superficie',
        era: 'Era',
        search: 'Buscar jugador',
        searchPlaceholder: 'Federer, Nadal, Djokovic...'
      },
      modes: {
        goat: 'Calculated GOAT',
        real: 'Real GOAT'
      },
      modeDescriptions: {
        goat: 'Calculated GOAT. Simulacion all-vs-all con 100 partidos por cruce y superficie.',
        real: 'Real GOAT. Suma victorias de la base y titulos ponderados del perfil de cada jugador.'
      },
      eras: { all: 'Todas', '70s': '70s', '80s': '80s', '90s': '90s', '2000s': '2000s', '2010s': '2010s+' },
      surfaces: { all: 'Todas', hard: 'Hard', clay: 'Clay', grass: 'Grass' },
      summary: {
        view: 'Vista',
        activeFilter: 'Filtro activo',
        leader: 'Lider',
        rows: 'Filas',
        visiblePlayer: 'jugador visible',
        visiblePlayers: 'jugadores visibles',
        scorePrefix: 'Score'
      },
      board: {
        goatTitle: 'Calculated GOAT',
        goatSubtitle: 'Ranking simulado sobre todo el campo',
        realTitle: 'Real GOAT',
        realSubtitle: 'Victorias y titulos disponibles en la base',
        noRows: 'No hay jugadores para el filtro actual.'
      },
      table: {
        rank: '#',
        player: 'Jugador',
        score: 'Score',
        wins: 'Victorias',
        matches: 'Partidos',
        trophies: 'Titulos',
        winPct: 'Win%',
        era: 'Era'
      },
      realFormulaAll: 'Score = wins + GS*{gs} + Masters*{masters} + ATP500*{m500}',
      realFormulaSurface: 'Score = wins + GS de superficie*{slam}',
      sample: '100 partidos por cruce',
      metadata: 'Engine {engine} - GOAT sim {goat} - Era sim {era} - {date}',
      trophiesAll: 'GS {gs} - M {masters} - 500 {m500}',
      trophiesSurface: 'GS {slams}',
      countryUnknown: 'Sin pais'
    }
  };

  function getLang() {
    return window.__simuLang || localStorage.getItem('lang') || 'en';
  }

  function t(path) {
    const lang = getLang();
    return path.split('.').reduce((acc, part) => acc && acc[part], I18N[lang] || I18N.en);
  }

  function fmtPct(value) {
    if (!Number.isFinite(value)) return '--';
    return `${(value * 100).toFixed(1)}%`;
  }

  function fmtInt(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function fmtDate(value) {
    return new Date(value).toLocaleString(getLang() === 'es' ? 'es-ES' : 'en-US');
  }

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function getModeData(mode, eraKey, surface) {
    const pickSurface = (obj) => surface === 'all' ? obj.overall : obj.surfaces[surface];

    if (mode === 'goat') {
      const rows = pickSurface(DATA.goat);
      return eraKey === 'all' ? rows : rows.filter((row) => row.eraKey === eraKey);
    }
    if (mode === 'real') {
      if (eraKey === 'all') return pickSurface(DATA.real);
      const era = DATA.eras.find((item) => item.key === eraKey);
      return era ? pickSurface(era.real) : [];
    }
    return [];
  }

  function safeRows(rows) {
    return Array.isArray(rows) ? rows.filter(Boolean) : [];
  }

  function filterRows(rows) {
    const query = state.search.trim().toLowerCase();
    let filtered = rows;

    if (query) {
      filtered = filtered.filter((row) => {
        const haystack = [row.name, row.country, row.style, row.eraKey].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return filtered;
  }

  function buildButtons() {
    const modeWrap = document.getElementById('mode-buttons');
    const surfaceWrap = document.getElementById('surface-buttons');
    const eraWrap = document.getElementById('era-buttons');
    if (!modeWrap || !surfaceWrap || !eraWrap) return;

    modeWrap.innerHTML = Object.keys(t('modes')).map((key) =>
      `<button class="rankhub-btn ${state.mode === key ? 'active' : ''}" data-mode="${key}">${t(`modes.${key}`)}</button>`
    ).join('');

    surfaceWrap.innerHTML = Object.keys(t('surfaces')).map((key) =>
      `<button class="rankhub-btn ${state.surface === key ? 'active' : ''}" data-surface="${key}">${t(`surfaces.${key}`)}</button>`
    ).join('');

    eraWrap.innerHTML = Object.keys(t('eras')).map((key) =>
      `<button class="rankhub-btn ${state.era === key ? 'active' : ''}" data-era="${key}">${t(`eras.${key}`)}</button>`
    ).join('');

    modeWrap.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        state.mode = button.dataset.mode;
        render();
      };
    });

    surfaceWrap.querySelectorAll('[data-surface]').forEach((button) => {
      button.onclick = () => {
        state.surface = button.dataset.surface;
        render();
      };
    });

    eraWrap.querySelectorAll('[data-era]').forEach((button) => {
      button.onclick = () => {
        state.era = button.dataset.era;
        render();
      };
    });
  }

  function buildSummaryCards(rows, label, sampleLabel) {
    if (!rows.length) return [];
    const leader = rows[0];
    return [
      { key: t('summary.view'), value: t(`modes.${state.mode}`), note: t(`modeDescriptions.${state.mode}`) },
      { key: t('summary.activeFilter'), value: label, note: sampleLabel },
      { key: t('summary.leader'), value: leader.name, note: state.mode === 'real' ? `${t('summary.scorePrefix')} ${leader.realScore.toFixed(1)}` : fmtPct(leader.winPct) },
      { key: t('summary.rows'), value: String(rows.length), note: rows.length === 1 ? t('summary.visiblePlayer') : t('summary.visiblePlayers') }
    ];
  }

  function renderSummary(rows, label, sampleLabel) {
    const target = document.getElementById('summary-cards');
    if (!target) return;
    const cards = buildSummaryCards(rows, label, sampleLabel);
    target.innerHTML = cards.map((card) => `
      <article class="stat-card ${card.key === t('summary.leader') ? 'highlight' : ''}">
        <div class="stat-card-label">${card.key}</div>
        <div class="rankhub-card-value ${String(card.value).length > 14 ? 'small' : ''}">${card.value}</div>
        <div class="rankhub-card-note">${card.note}</div>
      </article>
    `).join('');
  }

  function renderTable(rows, title, subtitle) {
    const body = rows.length ? rows.map((row) => {
      if (state.mode === 'real') {
        const trophyLabel = state.surface === 'all'
          ? interpolate(t('trophiesAll'), { gs: row.gs, masters: row.masters, m500: row.m500 })
          : interpolate(t('trophiesSurface'), { slams: row.surfaceSlams || 0 });

        return `
          <div class="rankhub-table-row">
            <div class="rankhub-rank">${row.rank}</div>
            <div>
              <div class="rankhub-player-name">${row.name}</div>
              <div class="rankhub-player-meta">${row.country || t('countryUnknown')} - ${t(`eras.${row.eraKey}`) || row.eraKey}</div>
            </div>
            <div>
              <div class="rankhub-main-value">${row.realScore.toFixed(1)}</div>
              <div class="rankhub-cell-note">${t('table.score')}</div>
            </div>
            <div>
              <div class="str-value">${fmtInt(row.wins)}</div>
              <div class="rankhub-cell-note">${t('table.wins')}</div>
            </div>
            <div>
              <div class="str-value">${fmtInt(row.matches)}</div>
              <div class="rankhub-cell-note">${t('table.matches')}</div>
            </div>
            <div>
              <div class="str-value">${trophyLabel}</div>
              <div class="rankhub-cell-note">${t('table.trophies')}</div>
            </div>
          </div>
        `;
      }

      return `
        <div class="rankhub-table-row">
          <div class="rankhub-rank">${row.rank}</div>
          <div>
            <div class="rankhub-player-name">${row.name}</div>
            <div class="rankhub-player-meta">${row.country || t('countryUnknown')} - ${row.style || ''}</div>
          </div>
            <div>
              <div class="rankhub-main-value">${fmtPct(row.winPct)}</div>
              <div class="rankhub-cell-note">${t('table.winPct')}</div>
          </div>
          <div>
            <div class="str-value">${fmtInt(row.wins)}</div>
            <div class="rankhub-cell-note">${t('table.wins')}</div>
          </div>
          <div>
            <div class="str-value">${fmtInt(row.matches)}</div>
            <div class="rankhub-cell-note">${t('table.matches')}</div>
          </div>
          <div>
            <div class="str-value">${t(`eras.${row.eraKey}`) || row.eraKey}</div>
            <div class="rankhub-cell-note">${t('table.era')}</div>
          </div>
        </div>
      `;
    }).join('') : `<div class="rankhub-empty">${t('board.noRows')}</div>`;

    return `
      <section class="rankhub-section">
        <div class="rankhub-section-head">
          <div>
            <div class="section-label">${title}</div>
            <div class="results-subtitle">${subtitle}</div>
          </div>
          <div class="rankhub-pill">${t(`surfaces.${state.surface}`)}</div>
        </div>
        <div class="rankhub-table">
          <div class="rankhub-table-header">
            <div>${t('table.rank')}</div>
            <div>${t('table.player')}</div>
            <div>${state.mode === 'real' ? t('table.score') : t('table.winPct')}</div>
            <div>${t('table.wins')}</div>
            <div>${t('table.matches')}</div>
            <div>${state.mode === 'real' ? t('table.trophies') : t('table.era')}</div>
          </div>
          ${body}
        </div>
      </section>
    `;
  }

  function render() {
    buildButtons();

    const modeNote = document.getElementById('mode-note');
    if (modeNote) modeNote.textContent = t(`modeDescriptions.${state.mode}`);

    const rows = filterRows(safeRows(getModeData(state.mode, state.era, state.surface))).slice(0, 80);
    const label = `${t(`modes.${state.mode}`)} - ${t(`surfaces.${state.surface}`)}`;
    const sampleLabel = state.mode === 'real'
      ? (state.surface === 'all'
        ? interpolate(t('realFormulaAll'), DATA.meta.realWeights)
        : interpolate(t('realFormulaSurface'), DATA.meta.realSurfaceWeights))
      : t('sample');

    renderSummary(rows, label, sampleLabel);

    let title = t('board.goatTitle');
    let subtitle = t('board.goatSubtitle');

    if (state.mode === 'real') {
      title = `${t('board.realTitle')} - ${t(`eras.${state.era}`)}`;
      subtitle = t('board.realSubtitle');
    } else {
      title = `${t('board.goatTitle')} - ${t(`eras.${state.era}`)}`;
    }

    const boards = document.getElementById('boards');
    if (boards) boards.innerHTML = renderTable(rows, title, subtitle);
  }

  function applyLang() {
    const heroKicker = document.getElementById('hero-kicker');
    const heroTitle = document.getElementById('hero-title');
    const heroCopy = document.getElementById('hero-copy');
    const search = document.getElementById('search-input');
    if (!heroKicker || !heroTitle || !heroCopy || !search) return;

    heroKicker.textContent = `${t('heroKicker')} - ${interpolate(t('metadata'), {
      engine: DATA.meta.engine,
      goat: fmtInt(DATA.meta.goatMatchesSimulated),
      era: fmtInt(DATA.meta.eraMatchesSimulated),
      date: fmtDate(DATA.meta.generatedAt)
    })}`;
    heroTitle.textContent = t('heroTitle');
    heroCopy.textContent = t('heroCopy');

    document.getElementById('filter-mode-label').textContent = t('filters.mode');
    document.getElementById('filter-surface-label').textContent = t('filters.surface');
    document.getElementById('filter-era-label').textContent = t('filters.era');
    document.getElementById('filter-search-label').textContent = t('filters.search');
    search.placeholder = t('filters.searchPlaceholder');

    render();
  }

  window.initRankingsHub = function initRankingsHub() {
    const search = document.getElementById('search-input');
    const boards = document.getElementById('boards');
    if (!search || !boards) return;

    if (!initialized) {
      search.addEventListener('input', (event) => {
        state.search = event.target.value;
        render();
      });

      initialized = true;
    }

    applyLang();
  };

  window.refreshRankingsHubLang = function refreshRankingsHubLang() {
    if (!initialized) return;
    applyLang();
  };
})();
