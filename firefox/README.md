# TypeScript Console for Firefox — v0.3.0

Firefox 140+ DevTools extension. Includes temporary TypeScript file tabs, autocomplete, hover types, diagnostics, quick fixes, formatting, per-file exports, multi-file imports, async execution and console output. All compiler/editor assets are bundled locally.

## Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `firefox/dist/manifest.json` in this repository.
4. Open an ordinary HTTPS page (not `about:debugging` or another privileged browser page).
5. Open Developer Tools with **Cmd+Option+I** on macOS or **Ctrl+Shift+I** on Windows/Linux.
6. Choose **TypeScript**, possibly inside the DevTools overflow menu. Close and reopen DevTools if it was open during installation.

Temporary add-ons are removed when Firefox restarts. Reload with the same steps. Permanent installation in standard Firefox requires Mozilla signing; the ZIP in `artifacts` is unsigned and is intended for development/testing or submission, not permanent installation.

To update an already loaded copy, export wanted files, click **Reload** beside the add-on on `about:debugging`, then close and reopen Developer Tools.

## Private Browsing

Open `about:addons`, select TypeScript Console, and allow **Run in Private Windows**. Then open a Private Window and its Developer Tools. Firefox does not support Chrome's `incognito: split` mode. Private Browsing is not a secure-erasure guarantee. Downloads remain on disk; executed code can still write page data or send requests.

## Using the console

- **New file** adds a tab; use the filename field to rename its export. Each tab keeps its text, undo history, cursor and scroll position.
- **Import files** accepts UTF-8 `.ts` files up to 2 MB each. Duplicate filenames are numbered; existing files are not replaced.
- **Export current file** downloads only that file. Check the download completed before discarding code.
- Closing a file or choosing **Close session…** displays a reminder and per-file export buttons. Cancel with **Keep working**. Close session clears the workspace and output, leaving a blank tab; it does not close Firefox Developer Tools.
- All editor files and output are in memory. Closing Developer Tools or reloading the add-on loses them. Switching DevTools panels does not clear the session. Browser close warnings are best-effort; export before closing.
- Run with **Cmd+Enter / Ctrl+Enter**. The last expression becomes the result. Top-level `await`, DOM globals, and the selected element `$0` are supported.
- Use **Ctrl+Space** for suggestions, hover for types, and **Cmd+. / Ctrl+.** for available TypeScript fixes. Type errors block execution by default; that option can be disabled. Syntax errors still prevent compilation.

```ts
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
console.log('Links:', links.length);
links.map(link => link.href);
```

## Execution and privacy limits

Snippets execute in the inspected page's main frame in independent async scopes; declarations do not persist across executions. File tabs do not form a module project. No imports/exports, npm resolution, automatic site type discovery, or native debugger integration.

The add-on requests `devtools` permission to use Firefox's DevTools APIs. It does not request host, cookie, history, or extension-storage permissions. There is no built-in telemetry or remote compiler. User-executed snippets can access data available to page scripts, modify pages, and transmit data: execution is not a network-blocked sandbox.

Output is a bounded text snapshot, not a live object inspector. Existing page logs and later callbacks are not streamed. After 15 seconds the panel stops waiting without cancelling page execution. A synchronous infinite loop can freeze the inspected page.

Privileged `about:` pages do not support this evaluation API. For local `file://` pages, newer Firefox versions may require file access; start testing on HTTPS pages.

## Build

Requires Node.js, npm, and Python 3. From this folder:

```sh
npm ci
npm run rebuild
```

This runs automated tests, builds `dist`, and creates extension/source ZIPs in `artifacts`. Source stays outside generated folders. Monaco Editor, TypeScript, and esbuild versions are pinned in the lockfile.

## Validation

Automated tests cover compiler behavior, TypeScript diagnostics and fixes, filename handling, close-warning detection, Firefox promise result handling, evaluation exceptions, and missing DevTools context. Native Firefox DevTools execution and download behavior still need an end-to-end check in Firefox.

References:
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools/inspectedWindow/eval
- https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
