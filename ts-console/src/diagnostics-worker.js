// Diagnostics contain only startup messages. No snippets, URLs, or persistent storage.
const sessions = new Map();
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'ts-console-diagnostics') return;
  sessions.set(port, 'DevTools entry point connected');
  port.onMessage.addListener(message => {
    if (typeof message.status === 'string') sessions.set(port, message.status.slice(0, 2000));
  });
  port.onDisconnect.addListener(() => sessions.delete(port));
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'ts-console-status') respond({sessions: [...sessions.values()]});
});
