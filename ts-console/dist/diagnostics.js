async function refresh() {
  const manifest = chrome.runtime.getManifest();
  const lines = [`TypeScript Console ${manifest.version}`, `Extension ID: ${chrome.runtime.id}`, `Browser: ${navigator.userAgent}`, ''];
  for (const file of ['devtools.html', 'devtools.js', 'panel.html', 'panel.js', 'panel.css', 'ts.worker.js', 'editor.worker.js']) {
    try {
      const response = await fetch(chrome.runtime.getURL(file));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
      lines.push(`OK: ${file}`);
    } catch (error) { lines.push(`MISSING/UNREADABLE: ${file}: ${error.message}`); }
  }
  lines.push('');
  try {
    const result = await chrome.runtime.sendMessage({type: 'ts-console-status'});
    const sessions = result?.sessions || [];
    if (!sessions.length) lines.push('No connected DevTools entry point. Keep the website DevTools open and refresh this report.');
    for (const [index, status] of sessions.entries()) lines.push(`DevTools ${index + 1}: ${status}`);
  } catch (error) { lines.push(`Diagnostic connection failed: ${error.message}`); }
  document.getElementById('report').value = lines.join('\n');
}
document.getElementById('refresh').onclick = refresh;
refresh();
