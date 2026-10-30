export const portfolioOrigin = 'https://alexis01001415-oss.github.io';
export const portfolioPath = '/alexis-flores-portfolio/';
export const exclusionKey = 'af:portfolio:exclude-visits';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function isProductionPage(url: URL) {
  return url.origin === portfolioOrigin &&
    (url.pathname === portfolioPath || url.pathname === `${portfolioPath}index.html`);
}

/** Applied before any tracker is loaded. Failure to persist never counts an opt-out visit. */
export function visitPreference(url: URL, storage: PreferenceStorage | undefined) {
  const action = url.searchParams.get('visitas');
  let excluded = false;
  let providerExcluded = false;
  let persisted = Boolean(storage);
  try {
    providerExcluded = storage?.getItem('skipgc') === 't';
    excluded = storage?.getItem(exclusionKey) === '1' || providerExcluded;
    if (action === 'excluir') storage?.setItem(exclusionKey, '1');
    if (action === 'incluir') storage?.removeItem(exclusionKey);
  } catch { persisted = false; }
  if (action === 'excluir') excluded = true;
  if (action === 'incluir') {
    // Do not undo an opt-out set independently through GoatCounter's own controls.
    try { excluded = storage?.getItem('skipgc') === 't'; }
    catch { excluded = true; }
  }
  return { excluded, providerExcluded, persisted, action: action === 'excluir' || action === 'incluir' ? action : null };
}

export function counterUrls(site: string) {
  const base = `https://${site}.goatcounter.com/counter/${encodeURIComponent(portfolioPath)}.json`;
  return [
    { key: 'week', url: `${base}?start=week` },
    { key: 'month', url: `${base}?start=month` },
    { key: 'total', url: base },
  ];
}

export function parseVisitCount(data: unknown): string {
  // The public API supplies a formatted string, not a number. Never render HTML or
  // turn an unavailable counter into a misleading zero.
  if (!data || typeof data !== 'object' || !('count' in data)) throw new Error('Invalid counter');
  const count = data.count;
  if (typeof count !== 'string' || !/^\d[\d,.\s\u00a0\u202f]*$/.test(count) || count.length > 24) {
    throw new Error('Invalid count');
  }
  return count;
}
