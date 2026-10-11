# Claude Counter behavior

- The extension and standalone userscript share the same UI, constants and stylesheet. Keep their embedded copies synchronized when editing them.
- On home/new-chat pages, the usage row retains its original position inside the input card below its controls. Only started conversations (`/chat/<id>`) place the row after the entire `[data-cds="ChatComposer"]`, below its model selector and toolbar footer, outside the input border with a 6px gap. The existing URL-change handler switches placement when a chat starts or the user navigates back to New. The original model-selector placement remains a fallback for older layouts. A DOM observer uses the same placement rules to reconnect the row when Claude replaces the composer.
- Both usage tracks appear immediately. While both windows are unavailable, the row shows simple Session/Weekly labels, short muted tracks, and one "Waiting for usage" message. This state has no fabricated percentages or countdowns. Once either window provides usage (including an actual 0%), the original percentages, reset countdowns, markers and warnings are shown. An absent weekly window is hidden when session data is available.
- Account usage is fetched on new-chat pages and existing conversations through the original page-context bridge. REST utilization is a percentage; SSE `message_limit` utilization is a fraction converted to a percentage.
- Clicking the row refreshes usage. Window rollovers and an hourly safety check also refresh it. The hourly check counts failed/null fetch attempts so free accounts do not generate a request every second.
- Token counting, conversation fetching and caching retain the original author's behavior.

## Verification

Run `node --check` on changed JavaScript, check the embedded userscript copies against the source, and use `git diff --check`. Browser checks must cover `/new`, an existing chat, empty usage, and real usage values. Reload an installed unpacked extension after changing its source.
