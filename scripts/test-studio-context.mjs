import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const context = read("src/components/studio.context.tsx");
const content = read("src/components/content.tsx");
const footer = read("src/components/footer.tsx");
const css = read("src/components/content.css");
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
        "refreshed.lyrics.text !== lyrics",
        "shinobiwan:lyrics-saved:v1",
        "location.origin",
        "embedded?: boolean",
        "onSaved?: (detail: StudioSavedDetail) => void",
    ]
) assert.ok(context.includes(required), `Studio context contract missing ${required}.`);

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
    ]
) assert.ok(embed.includes(required), `Embedded LRC engine contract missing ${required}.`);

for (const forbidden of ["<iframe", "lyrics.lrc", "query.get(\"audio\")", "query.get(\"lyrics\")"]) {
    assert.ok(!embed.includes(forbidden), `Embedded LRC engine must not contain ${forbidden}.`);
}

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
    "LRC Maker Studio context passed: standalone + embedded engine, protected canonical load/save, shadow isolation and readable UI.",
);
