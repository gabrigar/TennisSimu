(function () {
  const CONSENT_KEY = 'simutennis_cookie_consent_v1';
  const GA_SCRIPT_ID = 'simutennis-ga-script';
  const DEFAULT_CONSENT = {
    essential: true,
    analytics: false,
    status: 'unset',
    updatedAt: null
  };

  const COPY = {
    en: {
      footerCopy: 'Professional tennis simulation platform with analytics, history and rankings.',
      policyLink: 'Privacy & Cookies Policy',
      settingsLink: 'Cookie settings',
      bannerKicker: 'Cookies & privacy',
      bannerTitle: 'We use analytics cookies only with your consent.',
      bannerText: 'SimuTennis uses essential cookies to keep the site working and optional analytics cookies to understand usage and improve the experience.',
      reject: 'Reject analytics',
      customize: 'Customize',
      acceptAll: 'Accept all',
      modalKicker: 'Privacy controls',
      modalTitle: 'Choose which cookies you want to allow.',
      essentialTitle: 'Essential cookies',
      essentialText: 'Required for language preferences, navigation and core simulator functionality.',
      essentialBadge: 'Always active',
      analyticsTitle: 'Analytics cookies',
      analyticsText: 'Help us understand visits and improve the product through Google Analytics.',
      readPolicy: 'Read policy',
      save: 'Save preferences'
    },
    es: {
      footerCopy: 'Plataforma profesional de simulacion de tenis con analitica, historico y rankings.',
      policyLink: 'Politica de privacidad y cookies',
      settingsLink: 'Configurar cookies',
      bannerKicker: 'Cookies y privacidad',
      bannerTitle: 'Usamos cookies analiticas solo con tu consentimiento.',
      bannerText: 'SimuTennis utiliza cookies esenciales para que la web funcione y cookies analiticas opcionales para entender el uso y mejorar la experiencia.',
      reject: 'Rechazar analitica',
      customize: 'Personalizar',
      acceptAll: 'Aceptar todas',
      modalKicker: 'Control de privacidad',
      modalTitle: 'Elige que cookies quieres permitir.',
      essentialTitle: 'Cookies esenciales',
      essentialText: 'Necesarias para idioma, navegacion y funcionamiento base del simulador.',
      essentialBadge: 'Siempre activas',
      analyticsTitle: 'Cookies analiticas',
      analyticsText: 'Nos ayudan a entender visitas y mejorar el producto mediante Google Analytics.',
      readPolicy: 'Leer politica',
      save: 'Guardar preferencias'
    }
  };

  let consent = readConsent();

  function getLang() {
    return localStorage.getItem('lang') || window.__simuLang || document.documentElement.lang || 'en';
  }

  function getCopy() {
    return COPY[getLang()] || COPY.en;
  }

  function readConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return { ...DEFAULT_CONSENT };
      const parsed = JSON.parse(raw);
      return {
        essential: true,
        analytics: Boolean(parsed.analytics),
        status: parsed.status || 'customized',
        updatedAt: parsed.updatedAt || null
      };
    } catch (error) {
      return { ...DEFAULT_CONSENT };
    }
  }

  function saveConsent(nextConsent) {
    consent = {
      essential: true,
      analytics: Boolean(nextConsent.analytics),
      status: nextConsent.status || 'customized',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent();
    refreshCookieConsentLang();
  }

  function getMeasurementId() {
    const meta = document.querySelector('meta[name="google-analytics-id"]');
    const value = meta?.content?.trim() || '';
    if (!value || /X{4,}/i.test(value)) return '';
    return value;
  }

  function loadAnalytics() {
    if (window.__simuAnalyticsLoaded) return;
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('consent', 'default', {
      analytics_storage: 'denied'
    });
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      transport_type: 'beacon'
    });

    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.__simuAnalyticsLoaded = true;
  }

  function applyConsent() {
    if (consent.analytics) {
      loadAnalytics();
    }

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied'
      });
    }

    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    if (consent.status === 'unset') {
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }

    const analyticsToggle = document.getElementById('cookie-analytics-toggle');
    if (analyticsToggle) {
      analyticsToggle.checked = consent.analytics;
    }
  }

  function openModal() {
    const modal = document.getElementById('cookie-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('cookie-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function refreshCookieConsentLang() {
    const copy = getCopy();
    setText('[data-cookie-footer-copy]', copy.footerCopy, true);
    setText('[data-cookie-policy-link]', copy.policyLink, true);
    setText('[data-cookie-settings-link]', copy.settingsLink, true);
    setText('#cookie-banner-kicker', copy.bannerKicker);
    setText('#cookie-banner-title', copy.bannerTitle);
    setText('#cookie-banner-text', copy.bannerText);
    setText('#cookie-reject-btn', copy.reject);
    setText('#cookie-customize-btn', copy.customize);
    setText('#cookie-accept-btn', copy.acceptAll);
    setText('#cookie-modal-kicker', copy.modalKicker);
    setText('#cookie-modal-title', copy.modalTitle);
    setText('#cookie-essential-title', copy.essentialTitle);
    setText('#cookie-essential-text', copy.essentialText);
    setText('#cookie-essential-badge', copy.essentialBadge);
    setText('#cookie-analytics-title', copy.analyticsTitle);
    setText('#cookie-analytics-text', copy.analyticsText);
    setText('#cookie-modal-policy-link', copy.readPolicy);
    setText('#cookie-save-btn', copy.save);
    setText('#cookie-accept-all-btn', copy.acceptAll);
    const closeBtn = document.getElementById('cookie-modal-close');
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', getLang() === 'es' ? 'Cerrar' : 'Close');
    }
  }

  function setText(selector, value, isQuerySelector = false) {
    const element = isQuerySelector ? document.querySelector(selector) : document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function bindEvents() {
    document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
      saveConsent({ analytics: true, status: 'accepted' });
    });

    document.getElementById('cookie-accept-all-btn')?.addEventListener('click', () => {
      saveConsent({ analytics: true, status: 'accepted' });
      closeModal();
    });

    document.getElementById('cookie-reject-btn')?.addEventListener('click', () => {
      saveConsent({ analytics: false, status: 'rejected' });
    });

    document.getElementById('cookie-customize-btn')?.addEventListener('click', openModal);
    document.getElementById('open-cookie-settings')?.addEventListener('click', openModal);
    document.getElementById('cookie-modal-close')?.addEventListener('click', closeModal);
    document.querySelector('[data-cookie-close]')?.addEventListener('click', closeModal);

    document.getElementById('cookie-save-btn')?.addEventListener('click', () => {
      const analytics = Boolean(document.getElementById('cookie-analytics-toggle')?.checked);
      saveConsent({ analytics, status: 'customized' });
      closeModal();
    });

    window.addEventListener('simu:langchange', refreshCookieConsentLang);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  }

  function initializeCookieConsent() {
    refreshCookieConsentLang();
    bindEvents();
    applyConsent();
  }

  window.openCookiePreferences = openModal;
  window.refreshCookieConsentLang = refreshCookieConsentLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCookieConsent);
  } else {
    initializeCookieConsent();
  }
})();
