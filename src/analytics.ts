import { counterUrls, isProductionPage, parseVisitCount, portfolioPath, visitPreference } from './analytics-core';
import './analytics.css';

interface GoatCounter {
  no_onload: boolean;
  no_events: boolean;
  endpoint: string;
  path: string;
  title: string;
  referrer: string;
  get_data?: (vars?: Record<string, unknown>) => Record<string, unknown>;
  count?: () => void;
}
declare global { interface Window { goatcounter?: GoatCounter } }

export function setupAnalytics() {
  const indicator = document.querySelector<HTMLElement>('#visit-indicator');
  if (!indicator) return;
  const url = new URL(location.href);
  const site = (import.meta.env.VITE_GOATCOUNTER_SITE ?? '').trim();
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* Exclusion still applies to this load. */ }
  const preference = visitPreference(url, storage);
  const status = indicator.querySelector<HTMLElement>('[data-visit-status]')!;
  const details = indicator.querySelector<HTMLElement>('[data-visit-details]')!;
  const showPanel = url.searchParams.get('estadisticas') === 'ver' || Boolean(preference.action);

  // Remove preference commands before any analytics or referrer can observe them.
  if (preference.action) {
    url.searchParams.delete('visitas');
    history.replaceState(history.state, '', url);
  }
  if (showPanel) {
    indicator.classList.add('is-revealed');
    indicator.removeAttribute('aria-hidden');
    const controls = indicator.querySelector<HTMLElement>('.visit-controls')!;
    controls.hidden = false;
    const toggle = controls.querySelector<HTMLAnchorElement>('[data-visit-toggle]')!;
    const target = new URL(location.href);
    target.searchParams.set('visitas', preference.excluded ? 'incluir' : 'excluir');
    toggle.href = target.href;
    toggle.textContent = preference.excluded ? 'Volver a contar este navegador' : 'Excluir este navegador';
    toggle.hidden = preference.providerExcluded;
    const panel = controls.querySelector<HTMLAnchorElement>('[data-visit-panel]')!;
    panel.hidden = !site;
    if (site) panel.href = `https://${site}.goatcounter.com/`;
    controls.querySelector('button')!.addEventListener('click', () => {
      indicator.classList.remove('is-revealed');
      indicator.setAttribute('aria-hidden', 'true');
      controls.hidden = true;
      const clean = new URL(location.href);
      clean.searchParams.delete('estadisticas');
      history.replaceState(history.state, '', clean);
    });
  }
  details.textContent = preference.excluded
    ? preference.providerExcluded ? 'Exclusión general de GoatCounter activa; se gestiona desde su configuración.'
      : preference.persisted ? 'Este navegador está excluido.' : 'Excluido solo ahora: el navegador no permite guardar la preferencia.'
    : 'Actualización hasta 4 h · visitas, no personas únicas.';

  if (!site) {
    status.textContent = 'Estadísticas pendientes de conectar';
    return;
  }
  if (!isProductionPage(url) || window.self !== window.top) {
    status.textContent = 'Vista de prueba: no cuenta visitas';
    return;
  }

  // A single portfolio path: scrolling, hash navigation and URL queries never
  // create extra visits. No contact fields, URL parameters or click events sent.
  const privacyOptOut = navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  if (privacyOptOut) details.textContent = 'Conteo desactivado por la privacidad de tu navegador.';
  const start = () => {
    void loadCounts();
    if (preference.excluded || privacyOptOut) return;
    let referrer = '';
    try { if (document.referrer) referrer = new URL(document.referrer).origin; } catch { /* Leave empty. */ }
    window.goatcounter = {
      no_onload: true, no_events: true,
      endpoint: `https://${site}.goatcounter.com/count`,
      path: portfolioPath, title: 'Portafolio de Alexis Flores', referrer,
    };
    const script = document.createElement('script');
    script.src = 'https://gc.zgo.at/count.js';
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.addEventListener('load', () => {
      // Re-check in case another tab excluded this browser while the script loaded.
      if (visitPreference(new URL(location.href), storage).excluded) return;
      const counter = window.goatcounter;
      const getData = counter?.get_data;
      if (!counter || !getData) return;
      // count.js adds location.search independently of its path setting. Remove
      // that field at the payload boundary, before url()/count() can send it.
      counter.get_data = vars => {
        const data = getData(vars);
        delete data.q;
        return data;
      };
      try { counter.count?.(); } catch { /* A blocked tracker must never affect the portfolio. */ }
    }, { once: true });
    document.head.appendChild(script);
  };
  // Do not register a visit for a background/prerender tab never actually viewed.
  if (document.visibilityState === 'visible') start();
  else document.addEventListener('visibilitychange', function onVisible() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onVisible);
    start();
  });

  async function loadCounts() {
    status.textContent = 'Visitas';
    const metrics = indicator!.querySelector<HTMLElement>('.visit-metrics')!;
    metrics.hidden = false;
    const results = await Promise.allSettled(counterUrls(site).map(async period => {
      const response = await fetch(period.url, {
        mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error('Counter unavailable');
      const value = parseVisitCount(await response.json());
      indicator!.querySelector<HTMLElement>(`[data-visit-count="${period.key}"]`)!.textContent = value;
    }));
    if (results.some(result => result.status === 'rejected')) {
      status.textContent = 'Visitas · datos no disponibles';
      // Keep failed values as —; 404 may mean an unregistered path or disabled
      // public counters, and must not be misrepresented as a real zero.
    }
  }
}
