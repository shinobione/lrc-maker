import assert from "node:assert/strict";
import fs from "node:fs";

const embed = fs.readFileSync("src/studio-embed.tsx", "utf8");
const css = fs.readFileSync("src/studio-embed.css", "utf8");
const skin = fs.readFileSync("src/launchpad-skin.css", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.equal(pkg.version, "6.3.8", "Studio line-state cascade hotfix must ship as LRC Maker 6.3.8.");

const toolbarIndex = embed.indexOf("className=\"studio-embed-toolbar\"");
const toastIndex = embed.indexOf("<Toast />");
const mainIndex = embed.indexOf("<main className=\"studio-embed-main\">");
const footerIndex = embed.indexOf("<Footer />");
assert.ok(
    toolbarIndex >= 0 && toastIndex > toolbarIndex && mainIndex > toastIndex && footerIndex > mainIndex,
    "Embedded confirmation rail must sit between toolbar and lyrics content, never over the footer/content.",
);

for (
    const required of [
        "grid-template-rows: auto auto auto minmax(0, 1fr) auto",
        ".toast-queue {",
        "position: relative !important",
        "pointer-events: none",
        ".line:not(.select):not(.highlight) {",
        "background: rgba(10, 20, 24, 0.86) !important",
        ".line:hover:not(.select):not(.highlight) {",
        ".line.select {",
        "background: rgba(82, 227, 214, 0.075) !important",
        "border-color: rgba(82, 227, 214, 0.66) !important",
        ".line.highlight {",
        "background: linear-gradient(90deg, rgba(82, 227, 214, 0.19), rgba(82, 227, 214, 0.07)) !important",
        ".line.highlight.select {",
        "background: linear-gradient(90deg, rgba(82, 227, 214, 0.24), rgba(82, 227, 214, 0.095)) !important",
        "color: #9cece4 !important",
    ]
) assert.ok(css.includes(required), `Embedded UX guard missing ${required}.`);

assert.ok(
    skin.includes("background: rgba(166, 60, 255, 0.08) !important")
        && skin.includes(
            "background: linear-gradient(90deg, rgba(166, 60, 255, 0.62), rgba(92, 108, 255, 0.44)) !important",
        ),
    "Regression fixture changed: the standalone LaunchPAD skin must still prove why Studio needs authoritative embed overrides.",
);
assert.ok(
    embed.indexOf("skinCss") < embed.indexOf("embedCss"),
    "Studio embed stylesheet must remain last so its scoped authoritative overrides win after the standalone skin.",
);
assert.ok(
    !css.includes("background: #62ddd2"),
    "Legacy high-intensity highlight fill must not return in Studio embed.",
);

console.log(
    "LRC Maker 6.3.8 Studio embed UX guard passed: confirmations stay in-flow and authoritative teal/cyan row states defeat the standalone purple !important skin inside Studio only.",
);
