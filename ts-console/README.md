# TypeScript Console — v0.2

A Chrome DevTools extension with temporary file tabs, Monaco's TypeScript editor, diagnostics, autocomplete, hover types, quick fixes, formatting, and execution in the inspected page.

## Install or reload

1. Extract `typescript-console-extension.zip`, or use `outputs/ts-console/dist` from this task.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Open a normal page, open DevTools, and select **TypeScript** (possibly under »).
5. Write TypeScript and press **Cmd+Enter** / **Ctrl+Enter**.

If the extension was loaded from the restored `outputs/ts-console/dist` folder, click its Reload button on `chrome://extensions`, then close and reopen DevTools. Export code you want to keep before reloading.

## Files and temporary sessions

- **New file** creates a tab. Tabs retain their contents, undo history, cursor, and scroll position. The file-name field changes the name used for downloads.
- **Import files** accepts one or more UTF-8 `.ts` files, up to 2 MB each. Each opens in a new tab. Duplicate names receive a numeric suffix; existing tabs are never overwritten. Examples also open in new tabs.
- **Export current file** downloads that file individually. Check that the download completed before discarding code.
- Files and output are held only in memory. Closing DevTools or reloading the extension loses the session. Switching to another DevTools panel keeps it alive. The old v0.1 saved snippet is removed when v0.2 opens.
- Closing a file or choosing **Close session…** shows a reminder with per-file export buttons and **Keep working** / **Discard and close** choices. Closing the session clears the workspace and output, leaving a new blank tab.
- Chrome does not expose a cancellable DevTools close event. The panel requests a best-effort `beforeunload` warning, but Chrome can bypass it and controls its wording. A permanent reminder is shown. Export wanted files before closing DevTools with Chrome's own controls.

## TypeScript console

TypeScript compiles locally into JavaScript. The last expression is returned as the result. Supports top-level `await`, DOM globals, and `$0` for the selected element. Snippet console calls (`log`, `info`, `warn`, `error`, `debug`, `table`) appear in the panel.

Hover for types; use **Ctrl+Space** for autocomplete and **Cmd+. / Ctrl+.** for available fixes. TypeScript supplies fixes where available, not for every error. Live type errors block execution by default; you can turn that off. Syntax errors still prevent compilation.

```ts
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
console.log('Links found:', links.length);
links.map(link => ({ text: link.textContent, url: link.href }));
```

Each execution has an independent async scope. Variables do not persist between runs, and tabs do not share types or form a module project. Explicit assignments to `window` affect and persist in the inspected page.

## Limitations

- Main frame only. Chrome internal/restricted pages may reject execution.
- No imports/exports, npm resolution, automatic site type discovery, or native debugger integration. Supply declarations for site-specific globals yourself.
- Output uses bounded text snapshots, not live object inspection. Existing page logs and later asynchronous callbacks are not streamed into the panel.
- After 15 seconds the panel stops waiting; this does not cancel page execution. Synchronous infinite loops can freeze the inspected page.
- All scripts and workers are bundled locally; there is no remote compiler, telemetry, or host permission request.

## Rebuild

Requires Node.js, npm, and Python 3. In the source directory:

```sh
npm ci
npm run rebuild
```

This runs the tests, builds `dist`, and packages extension and source ZIPs. `npm run build` alone only rebuilds `dist`.

For the original task workspace, the canonical source is now `extension/`, outside generated `outputs/`. Running `npm run rebuild --prefix extension` from the workspace restores `outputs/ts-console/dist` and both ZIPs even if `outputs` was deleted.

## Verification

Ten automated tests cover transpilation, await, logs, runtime errors, circular values, scope isolation, diagnostics/fixes, safe download names, duplicate file names, and close-warning detection. The prior v0.2 browser preview verified tabs, imports, renaming and session clearing; completed downloads and native DevTools-close behavior have not been verified in Chrome.

## Reference

https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools

## Chrome startup diagnostics (v0.2.1)

The DevTools entry point reports registration success or failure in its console and status text. This diagnostic build does not establish the cause of a missing panel. On chrome://extensions, enable Developer mode and inspect the extension’s devtools.html view while the inspected page’s DevTools is open. Check its Console for `[TypeScript Console startup]`. If no devtools.html view is present, Chrome has not started the extension entry point for that toolbox. Check the loaded folder, enabled state and browser errors.
