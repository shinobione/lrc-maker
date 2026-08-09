import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const context = read("src/components/studio.context.tsx");
const content = read("src/components/content.tsx");
const footer = read("src/components/footer.tsx");
const css = read("src/components/content.css");
const editor = read("src/components/editor.tsx");
const synchronizer = read("src/components/synchronizer.tsx");
const cleanup = read("src/utils/lyrics-cleanup.ts");
const embed = read("src/studio-embed.tsx");
const embedCss = read("src/studio-embed.css");
const embedConfig = read("vite.embed.config.ts");

for (
    const required of [
        "query.get(\"studio\") !== \"lyrics-v1\"",
        "query.get(\"trackId\")",
        "query.get(\"returnPath\")",
        "TRACK_ID_PATTERN",
        "candidate?.startsWith(\"/shinobiwan-studio/\")",
        "/lyrics/context",
        "/lyrics/sync/${suffix}",
        "\"lyrics-sync-validate-v1\"",
        "\"lyrics-sync-save-v1\"",
        "credentials: \"include\"",
        "\"Content-Type\": \"text/plain;charset=UTF-8\"",
        "expectedUpdatedAt: context.lyrics.updatedAt",
        "expectedLyricsEtag: context.lyrics.etag",
        "export const canonicalizeLyricsText",
        "replace(/^\\uFEFF/, \"\")",
        "replace(/\\r\\n?/g, \"\\n\")",
        "const expectedCanonicalLyrics = canonicalizeLyricsText(lyrics)",
        "lyrics: expectedCanonicalLyrics",
        "canonicalizeLyricsText(refreshed.lyrics.text) !== expectedCanonicalLyrics",
        "shinobiwan:lyrics-saved:v1",
        "location.origin",
        "embedded?: boolean",
        "onSaved?: (detail: StudioSavedDetail) => void",
    ]
) assert.ok(context.includes(required), `Studio context contract missing ${required}.`);

assert.ok(
    !context.includes("refreshed.lyrics.text !== lyrics"),
    "Canonical reread must not compare raw editor text against backend-normalized lyrics.txt.",
);

const canonicalize = text => String(text ?? "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
assert.equal(
    canonicalize("\uFEFF[00:01.000] One\r\n[00:02.000] Two\r"),
    "[00:01.000] One\n[00:02.000] Two\n",
    "Canonical comparison must match Track Manager BOM and line-ending normalization.",
);
assert.equal(
    canonicalize("[00:01.000] One\r\n") === canonicalize("[00:01.000] One\n"),
    true,
    "CRLF and LF forms of the same lyrics must compare equal after canonicalization.",
);
assert.notEqual(
    canonicalize("[00:01.000] One\n"),
    canonicalize("[00:01.000] Changed\n"),
    "A real lyric difference must still fail the canonical equality guard.",
);

for (const forbidden of ["query.get(\"lyrics\")", "query.get(\"audio\")", "lyrics.lrc"]) {
    assert.ok(!context.includes(forbidden), `Studio context must not accept ${forbidden}.`);
}

assert.ok(
    content.includes("if (!studio.launch)"),
    "Standalone local lyric persistence must remain isolated from Studio context.",
);
assert.ok(
    content.includes("stringify({ ...lrcState, info: new Map() }, prefState)"),
    "Canonical save must serialize lyrics-only LRC text.",
);
assert.ok(
    footer.includes("crossOrigin={studio.launch ? \"use-credentials\" : undefined}"),
    "Protected canonical audio must use credentialed CORS.",
);
assert.ok(footer.includes("searchParams.get(\"url\")"), "Standalone URL-loading compatibility must be preserved.");
assert.ok(footer.includes("!studio.embedded"), "Embedded Studio mode must not expose manual audio loading.");

for (
    const required of [
        "attachShadow({ mode: \"open\" })",
        "customElements.define(TAG_NAME",
        "<Synchronizer state={lrcState} dispatch={lrcDispatch} />",
        "<Footer />",
        "<StudioProvider launch={launch} embedded={true} onSaved={onSaved}>",
        "new CustomEvent<StudioSavedDetail>(\"lyrics-saved\"",
        "tracks/{trackId}/lyrics.txt",
        "lang.editor.removeTags",
        "lang.editor.removeEmptyLines",
        "removeNonTimestampBracketTags",
        "removeEmptyLyricLines",
        "Simple clic = sélectionner",
        "double-clic = revenir au timestamp",
        "Espace = timestamp + ligne",
        "suivante.",
    ]
) assert.ok(embed.includes(required), `Embedded LRC engine contract missing ${required}.`);

for (const forbidden of ["<iframe", "lyrics.lrc", "query.get(\"audio\")", "query.get(\"lyrics\")"]) {
    assert.ok(!embed.includes(forbidden), `Embedded LRC engine must not contain ${forbidden}.`);
}

for (const required of ["removeEmptyLyricLines", "removeNonTimestampBracketTags"]) {
    assert.ok(editor.includes(required), `Standalone editor must share cleanup utility ${required}.`);
    assert.ok(cleanup.includes(`export const ${required}`), `Cleanup utility must export ${required}.`);
}
assert.ok(
    cleanup.includes("lrcTimestampPattern.test(content.trim())"),
    "Tag cleanup must preserve timestamp brackets while removing non-timestamp [tags].",
);

for (
    const required of [
        "dispatch({ type: ActionType.select, payload: () => lineKey })",
        "onDoubleClickCapture={onLineDoubleClick}",
        "adjust(ev, 0, key)",
        "type: ActionType.next",
        "payload: audioRef.currentTime",
    ]
) assert.ok(synchronizer.includes(required), `Native synchronization flow missing ${required}.`);

const singleClickStart = synchronizer.indexOf("const onLineClick = useCallback(");
const doubleClickStart = synchronizer.indexOf("const onLineDoubleClick = useCallback(");
const lyricIteratorStart = synchronizer.indexOf("const LyricLineIter = useCallback(");
assert.ok(singleClickStart >= 0 && doubleClickStart > singleClickStart, "Simple-click handler must remain identifiable.");
assert.ok(lyricIteratorStart > doubleClickStart, "Double-click handler must remain identifiable.");

const singleClickHandler = synchronizer.slice(singleClickStart, doubleClickStart);
const doubleClickHandler = synchronizer.slice(doubleClickStart, lyricIteratorStart);

assert.ok(
    singleClickHandler.includes("dispatch({ type: ActionType.select, payload: () => lineKey })"),
    "Simple click must select the clicked lyric line.",
);
for (const forbidden of ["adjust(", "audioRef.currentTime =", "const seekTime ="]) {
    assert.ok(!singleClickHandler.includes(forbidden), `Simple click must not seek audio: ${forbidden}`);
}
assert.ok(doubleClickHandler.includes("adjust(ev, 0, key)"), "Double-click must remain the explicit seek path.");

assert.ok(embedConfig.includes("outDir: \"build/embed\""), "Embed bundle must be emitted under build/embed.");
assert.ok(
    embedConfig.includes("fileName: () => \"lyrics-studio.js\""),
    "Embed bundle filename must remain stable for Studio lazy loading.",
);

const tinyFonts = [...`${css}\n${embedCss}`.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
    .map(match => Number(match[1]))
    .filter(size => size < 11);
assert.deepEqual(tinyFonts, [], `Studio context UI must not introduce text below 11px; found ${tinyFonts.join(", ")}.`);

console.log(
    "LRC Maker Studio context passed: canonical load/save, normalized reread equality, embedded cleanup parity, isolated simple-click/double-click contracts, shadow isolation and readable UI.",
);
