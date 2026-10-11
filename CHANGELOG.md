# Changelog

## 2026-10-11

- Kept the full percentage and reset-countdown format when usage is unavailable, using dashes for each missing value so empty bars match the populated row's layout.
- Restored `main` to the original imported author commit `18b18eb` before starting this focused repair. Prior local work is preserved on `codex/backup-before-original-reset-2026-10-11`.
- Restored visible usage bars on modern Claude composer layouts. The row now sits below the controls inside the composer card, with the original styling and legacy anchor fallbacks.
- Added visible empty tracks labeled with a dash while usage is unavailable, fetched account usage on `/new`, and prevented null/failed usage responses from causing one request per second.
- Synchronized the extension and userscript. Kept the original bridge, tokenizer, cache timer, and conversation behavior.
