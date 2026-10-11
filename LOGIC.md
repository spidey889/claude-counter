# Claude Counter behavior

- The extension and standalone userscript share the same UI, constants and stylesheet. Keep their embedded copies synchronized when editing them.
- The usage row is appended to the current `[data-cds="ChatComposer"]` card, below its controls in normal flex flow. Legacy composer/model-selector anchors remain as fallbacks. A DOM observer reattaches the row when Claude replaces the composer.
- Both usage tracks appear immediately. A dash means Claude has not supplied a utilization value; it must never be presented as zero percent. Once usage arrives, the original percentages, reset countdowns, markers and warnings are shown. An absent weekly window is hidden when session data is available.
- Account usage is fetched on new-chat pages and existing conversations through the original page-context bridge. REST utilization is a percentage; SSE `message_limit` utilization is a fraction converted to a percentage.
- Clicking the row refreshes usage. Window rollovers and an hourly safety check also refresh it. The hourly check counts failed/null fetch attempts so free accounts do not generate a request every second.
- Token counting, conversation fetching and caching retain the original author's behavior.

## Verification

Run `node --check` on changed JavaScript, check the embedded userscript copies against the source, and use `git diff --check`. Browser checks must cover `/new`, an existing chat, empty usage, and real usage values. Reload an installed unpacked extension after changing its source.
