(() => {
  const label = '[TypeScript Console startup]';
  const status = document.getElementById('startup-status');
  const report = (message, error = false) => {
    if (status) status.textContent = message;
    console[error ? 'error' : 'info'](label, message);
  };
  const fail = error => report(error?.message || String(error), true);
  window.addEventListener('error', event => fail(event.error || event.message));
  window.addEventListener('unhandledrejection', event => fail(event.reason));
  if (!globalThis.chrome?.devtools?.panels) {
    report('DevTools API is unavailable. This page must be opened by Chrome as the extension devtools_page.', true);
    return;
  }
  report('DevTools entry point loaded; requesting TypeScript panel.');
  try {
    // Use the callback form for compatibility with Chrome versions before 152.
    const pending = chrome.devtools.panels.create('TypeScript', '', 'panel.html', panel => {
      if (chrome.runtime?.lastError) { fail(chrome.runtime.lastError); return; }
      if (!panel) { fail('Chrome did not return a panel.'); return; }
      report('TypeScript panel registered. Look in the DevTools tab overflow menu (»).');
      panel.onShown.addListener(() => report('TypeScript panel is visible.'));
    });
    // Catch rejections as well if a Chrome implementation returns a Promise.
    pending?.catch?.(fail);
  } catch (error) { fail(error); }
})();
