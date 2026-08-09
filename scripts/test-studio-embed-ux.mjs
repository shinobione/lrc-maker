import assert from "node:assert/strict";
import fs from "node:fs";

const embed = fs.readFileSync("src/studio-embed.tsx", "utf8");
const css = fs.readFileSync("src/studio-embed.css", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.equal(pkg.version, "6.3.7", "Studio embed UX polish must ship as LRC Maker 6.3.7.");

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
        ".line.select {",
        "rgba(82, 227, 214, 0.075)",
        ".line.highlight {",
        "rgba(82, 227, 214, 0.19)",
        ".line.highlight.select {",
        "color: #9cece4",
    ]
) assert.ok(css.includes(required), `Embedded UX guard missing ${required}.`);

assert.ok(
    !css.includes("background: #62ddd2"),
    "Legacy high-intensity highlight fill must not return in Studio embed.",
);

console.log(
    "LRC Maker 6.3.7 Studio embed UX guard passed: confirmations stay in-flow and line states use readable Studio teal/cyan styling.",
);
