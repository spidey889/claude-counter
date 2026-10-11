# Changelog

## 2026-10-11

- Restricted the below-composer placement to started conversations. Restored the original inside-card row on home/new-chat pages, including navigation between New and an existing chat.
- Moved the outside usage row underneath the entire composer, including Sonnet and the other footer controls, after trying the above-input placement.
- Moved usage bars above the composer border to try an outside placement. The input retains its native height; bars remain in normal flow and reconnect after composer replacement.
- Replaced the cluttered dashed percentage/countdown placeholders with simple Session/Weekly labels, muted tracks, and a single "Waiting for usage" note. Populated bars retain their original format.
- Kept the full percentage and reset-countdown format when usage is unavailable, using dashes for each missing value so empty bars match the populated row's layout.
- Restored `main` to the original imported author commit `18b18eb` before starting this focused repair. Prior local work is preserved on `codex/backup-before-original-reset-2026-10-11`.
- Restored visible usage bars on modern Claude composer layouts. The row now sits below the controls inside the composer card, with the original styling and legacy anchor fallbacks.
- Added visible empty tracks labeled with a dash while usage is unavailable, fetched account usage on `/new`, and prevented null/failed usage responses from causing one request per second.
- Synchronized the extension and userscript. Kept the original bridge, tokenizer, cache timer, and conversation behavior.
