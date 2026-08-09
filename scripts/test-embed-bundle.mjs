import assert from "node:assert/strict";
import fs from "node:fs";

const path = "build/embed/lyrics-studio.js";
assert.ok(fs.existsSync(path), "Embedded Lyrics Studio bundle was not emitted.");

const bundle = fs.readFileSync(path, "utf8");

assert.ok(
    bundle.includes("shinobiwan-lyrics-studio"),
    "Embedded bundle must expose the Lyrics Studio custom element name.",
);
assert.ok(bundle.includes("customElements.define"), "Embedded bundle must register its custom element at runtime.");
assert.ok(
    !bundle.includes("process.env.NODE_ENV"),
    "Embedded browser bundle must not retain an unbound process.env.NODE_ENV reference.",
);
assert.ok(!/\bprocess\.env\b/.test(bundle), "Embedded browser bundle must not retain process.env references.");

console.log(
    "Embedded Lyrics Studio bundle runtime guard passed: custom element registration present and browser-safe React environment inlined.",
);
