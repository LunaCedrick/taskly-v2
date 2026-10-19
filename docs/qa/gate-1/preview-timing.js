(() => {
  const original = window.open;
  window.open = function (...args) {
    const opened = performance.now(), popup = original.apply(this, args);
    window.open = original;
    if (!popup) { console.warn('Popup blocked; discard this run.'); return popup; }
    let closed, heading;
    const iso = t => new Date(performance.timeOrigin + t).toISOString();
    const stop = () => {
      clearInterval(timer); observer.disconnect(); removeEventListener('focus', sample);
    };
    const sample = () => {
      const now = performance.now();
      if (closed === undefined && popup.closed) {
        closed = now; console.log('Popup closed at', iso(closed));
      }
      if (heading === undefined && [...document.querySelectorAll('header h1')].some(h =>
        h.textContent.trim() === 'Dashboard' && h.getClientRects().length &&
        getComputedStyle(h).visibility === 'visible')) heading = now;
      if (closed !== undefined && heading !== undefined) {
        stop();
        console.table({
          popupClosedAt: iso(closed), dashboardVisibleAt: iso(heading),
          popupOpenMs: +(closed - opened).toFixed(1),
          closeToDashboardMs: +Math.max(0, heading - closed).toFixed(1),
        });
      } else if (closed !== undefined && now - closed > 10000) {
        stop(); console.table({ popupClosedAt: iso(closed), popupOpenMs: +(closed - opened).toFixed(1) });
        console.warn('No Dashboard within 10 seconds: record this run as FAILED.');
      }
    };
    const timer = setInterval(sample, 20), observer = new MutationObserver(sample);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    addEventListener('focus', sample);
    return popup;
  };
  console.log('Ready: click Continue with Google from the signed-out Dashboard URL.');
})();
