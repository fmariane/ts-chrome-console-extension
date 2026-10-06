browser.devtools.panels.create('TypeScript', '', 'panel.html').catch(error => {
  console.error('TypeScript Console panel could not be created:', error);
});
