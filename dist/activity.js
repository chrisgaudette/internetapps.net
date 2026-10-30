(function () {
  'use strict';
  const endpoint = 'https://www.retiremappro.com/api/internetapps/events';
  const hosts = new Set(['internetapps.net', 'www.internetapps.net']);
  const pages = new Set(['/', '/index.html', '/dist/', '/dist/index.html',
    '/privacy.html', '/terms.html', '/dist/privacy.html', '/dist/terms.html',
    '/dist/consulting.html', '/dist/architecture-review.html', '/dist/it-reporting.html',
    '/dist/sample-review.html', '/dist/dev/', '/dist/dev/index.html']);
  if (!hosts.has(location.hostname) || !pages.has(location.pathname)) return;
  const storageKey = 'internetapps_activity_browser';
  const internalKey = 'internetapps_internal_until';
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const lifetime = 30 * 24 * 60 * 60 * 1000;
  const url = new URL(location.href);
  const choice = url.searchParams.get('ia_internal');
  let browser;
  try {
    if (choice === '1') localStorage.setItem(internalKey, String(Date.now() + lifetime));
    if (choice === '0') localStorage.removeItem(internalKey);
    if (choice === '1' || choice === '0') {
      url.searchParams.delete('ia_internal');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    if (Number(localStorage.getItem(internalKey)) > Date.now()) return;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved.id === 'string' && uuid.test(saved.id) && saved.expires > Date.now()) browser = saved.id;
    else {
      browser = crypto.randomUUID();
      localStorage.setItem(storageKey, JSON.stringify({id: browser, expires: Date.now() + lifetime}));
    }
  } catch (_) {
    // Honor a test exclusion even when this browser cannot persist storage.
    if (choice === '1') return;
    browser = crypto.randomUUID();
  }
  function record(event) {
    fetch(endpoint, {
      method: 'POST', credentials: 'omit', keepalive: true,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({event_id: crypto.randomUUID(), browser_id: browser,
        event_name: event, page_path: location.pathname})
    }).catch(function () {});
  }
  record('page_view');
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const target = new URL(link.getAttribute('href'), location.href);
    if (target.protocol === 'mailto:') record('email_app_opened');
    else if (link.hasAttribute('download')) record('resource_download');
    else if (target.origin === location.origin && ['#contact', '#request', '#pilot'].includes(target.hash)) record('contact_click');
    else if (target.origin === location.origin && /\/(consulting|architecture-review)\.html$/.test(target.pathname)) record('consulting_click');
    else if (['retiremappro.com', 'www.retiremappro.com'].includes(target.hostname)) record('retiremap_click');
  });
  document.addEventListener('submit', function (event) {
    if (['contactForm', 'inquiry', 'review-inquiry', 'pilot-form'].includes(event.target.id)) record('inquiry_prepared');
  });
})();
