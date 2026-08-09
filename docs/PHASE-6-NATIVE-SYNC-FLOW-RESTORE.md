# Phase 6 — Native synchronization flow restore

## Scope

Phase 6 stabilization only. Phase 7 remains explicitly out of scope.

## Symptom observed in production

During timestamp correction, the added single-click seek changed the historical LRC Maker interaction sequence. A user could select a line, retimestamp it with `Espace`, continue listening, then unintentionally continue the synchronization from the wrong selected line. The perceived result was a one-line offset where successive timestamps appeared to land on the line above the intended lyric.

The same behavior was reproducible in standalone LRC Maker, which isolates the issue from SHINOBIWAN Studio, Track Manager, Cloudflare R2 and the protected Range/206 media route.

## Root cause

LRC Maker 6.3.2 added direct audio seeking inside `onLineClick`. That changed a mature interaction contract that previously separated three actions:

1. simple click selected a lyric line only;
2. double-click returned the audio to an existing timestamp;
3. `Espace` wrote the current audio time and advanced `selectIndex` to the following line through `ActionType.next`.

The custom single-click seek was unnecessary for the native synchronization workflow and made correction sessions easier to desynchronize conceptually.

## Fix — 6.3.4

The `Synchronizer` is restored to its pre-click-to-seek implementation from commit `10dc5dce566db1ce31998680c3c40bf461c492e4`:

- simple click only dispatches `ActionType.select`;
- no direct `audioRef.currentTime` assignment occurs on simple click;
- double-click remains the explicit timestamp reposition action;
- `Espace` keeps the native `ActionType.next` behavior: timestamp selected line, then select next line.

The same shared `Synchronizer` is used by standalone and embedded Lyrics Studio, so both modes regain identical behavior.

## Preserved contracts

This hotfix does not change:

- canonical `tracks/<slug>/lyrics.txt` authority;
- canonical reread normalization introduced in 6.3.3;
- Track Manager write routes or stale guards;
- Cloudflare R2 objects;
- protected media Range/206 handling;
- cleanup tools (`Supprimer les tags [ ]`, `Supprimer les lignes vides`);
- standalone fallback;
- Phase 7 stop line.

## Regression guard

`scripts/test-studio-context.mjs` now verifies that:

- simple-click selection remains present;
- direct single-click seek code is absent;
- double-click timestamp reposition remains wired;
- `ActionType.next` still timestamps with `audioRef.currentTime` and advances selection;
- embedded help text documents the native click / double-click / Space workflow.

## Required smoke test

After deployment:

1. open standalone LRC Maker and load a timestamped track;
2. double-click a known timestamped line and verify audio returns to that timestamp;
3. play, press `Espace` at the corrected start, and confirm selection advances exactly one line;
4. continue listening and press `Espace` for the next phrase; confirm the new timestamp lands on the currently selected next line, not the line above;
5. repeat the same sequence in embedded Lyrics Studio;
6. save `lyrics.txt` and verify canonical reread succeeds.

Only after both standalone and embedded smoke tests pass may the final Phase 6 checkpoint be created. STOP before Phase 7.
