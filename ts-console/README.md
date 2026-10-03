# TypeScript Console

A Chrome DevTools extension with a Monaco editor, TypeScript diagnostics, autocomplete, hover types, compiler-provided quick fixes, formatting, and execution in the inspected page.

## Install the built extension

1. Extract `typescript-console-extension.zip` (or use this project's `dist` folder).
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and choose the folder containing `manifest.json`.
4. Open a normal web page, open DevTools, and select **TypeScript** (possibly under the » menu). If DevTools was already open, close and reopen it.
5. Write a snippet and press **Cmd+Enter** / **Ctrl+Enter**.

The last expression is displayed as the result. `console.log`, `info`, `warn`, `error`, `debug`, and `table` calls through the snippet's console are displayed in the panel. Hover a symbol for its type; use Ctrl+Space for suggestions and Cmd+. / Ctrl+. for available fixes. Fixes are offered where TypeScript provides them, not for every error.

```ts
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
console.log('Links found:', links.length);
links.map(link => ({ text: link.textContent, url: link.href }));
```

## Behavior and limits

- TypeScript is compiled locally to JavaScript; Chrome's engine itself is not modified. No remote compiler, telemetry, or host permissions.
- Each run has an independent async scope. Variables do not persist between runs. Assign to `window` explicitly if persistence is needed; those changes affect the page.
- Supports top-level `await`, DOM globals, and `$0` for the selected element. The last expression is automatically returned.
- Live errors block execution by default. You can disable that check; syntax errors still prevent compilation.
- Runs in the inspected page's main frame. Chrome internal pages and other restricted targets may reject execution. There is no frame selector.
- Imports/exports, npm package resolution, automatic discovery of the site's TypeScript types, and native DevTools debugger integration are not included. Add type declarations in your snippet for site-specific globals.
- Output is a bounded text snapshot, not a live object inspector. Arrays/objects are abbreviated and circular references are handled. Existing page logs and later asynchronous callbacks are not streamed into the panel.
- After 15 seconds the panel stops waiting; this does not cancel code in the page. A synchronous infinite loop can freeze the page, just as in the native console.
- Files and output are temporary: stored only in memory and lost when DevTools closes or the extension reloads. Version 0.1's locally saved snippet is deleted when this version opens. Switching to another DevTools panel keeps this session alive.
- **New file** creates another tab. Each tab retains its editor contents, undo history, cursor, and scroll position. The file-name field sets its download name. Types are isolated between files; tabs do not form a module project.
- **Import files** opens one or more UTF-8 `.ts` files (up to 2 MB each). Each import creates a new tab; duplicate names are numbered instead of overwriting existing content. Examples also open in new tabs.
- **Export current file** downloads just that file. Exporting does not close it or guarantee the browser completed the download: check your downloads before discarding code.
- Closing an individual file or choosing **Close session…** opens a reminder with per-file export buttons and **Keep working** / **Discard and close** choices. Close session clears the workspace and output; Chrome does not let a panel close DevTools programmatically.
- Closing DevTools via Chrome's own controls cannot reliably be intercepted. The panel requests a best-effort `beforeunload` warning, but Chrome can skip it and controls its text. A permanent export reminder is shown for this reason. Export wanted files before closing DevTools.

## Build and test

Requires Node.js and npm.

```sh
npm ci
npm test
npm run build
```

Load `dist` as the unpacked extension. Dependencies are pinned and all runtime scripts and workers are bundled into that folder. No development server is needed.

## Implementation

Manifest V3 DevTools panel; Monaco's TypeScript worker supplies language features. The TypeScript compiler removes types and returns the last expression. `chrome.devtools.inspectedWindow.eval` runs an async wrapper; the panel polls a temporary page property for serialized results and removes it afterward.

Reference: https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools
