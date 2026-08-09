import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const reducerPath = "src/hooks/useLrc.ts";
const transitionPath = "src/hooks/lrc-transitions.ts";
const reducerSource = fs.readFileSync(reducerPath, "utf8");
const transitionSource = fs.readFileSync(transitionPath, "utf8");

assert.match(
    reducerSource,
    /case ActionType\.next:\s*return timestampSelectedLineAndAdvance\(state, action\.payload\);/,
    "ActionType.next must use the behaviorally tested timestamp+advance transition.",
);
assert.match(
    reducerSource,
    /case ActionType\.time:\s*return timestampSelectedLine\(state, action\.payload\);/,
    "ActionType.time must use the tested selected-line timestamp transition.",
);
assert.ok(
    reducerSource.includes("from \"./lrc-transitions\""),
    "Reducer must consume the isolated pure transition module tested below.",
);

const output = ts.transpileModule(transitionSource, {
    compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
    },
    fileName: transitionPath,
}).outputText;

const tempPath = path.resolve(`.tmp-lrc-transitions-${process.pid}-${Date.now()}.mjs`);
fs.writeFileSync(tempPath, output, "utf8");

try {
    const module = await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
    const { timestampSelectedLineAndAdvance } = module;
    assert.equal(typeof timestampSelectedLineAndAdvance, "function");

    const state = {
        info: new Map(),
        lyric: [
            { text: "Line A", time: 1.0 },
            { text: "Line B", time: 4.0 },
            { text: "Line C", time: 8.0 },
        ],
        currentTime: 4.0,
        currentIndex: 1,
        nextTime: 8.0,
        nextIndex: 2,
        selectIndex: 1,
    };

    const next = timestampSelectedLineAndAdvance(state, 6.543);

    assert.equal(state.lyric[1].time, 4.0, "Reducer transition must not mutate the previous state.");
    assert.equal(next.lyric[0].time, 1.0, "Line N-1 must remain untouched.");
    assert.equal(next.lyric[1].time, 6.543, "Space must timestamp the currently selected line N.");
    assert.equal(next.lyric[2].time, 8.0, "Line N+1 timestamp must not be overwritten.");
    assert.equal(next.selectIndex, 2, "After stamping line N, selection must advance exactly to N+1.");
    assert.equal(next.currentTime, 6.543);
    assert.equal(next.nextTime, -Infinity);

    const atLastLine = { ...next, selectIndex: 2 };
    const clamped = timestampSelectedLineAndAdvance(atLastLine, 9.25);
    assert.equal(clamped.lyric[2].time, 9.25, "Last selected line must still receive its timestamp.");
    assert.equal(clamped.selectIndex, 2, "Selection must clamp at the final lyric line.");

    console.log("LRC reducer behavior passed: Space stamps selected line N then advances exactly to N+1.");
} finally {
    fs.rmSync(tempPath, { force: true });
    assert.equal(fs.existsSync(tempPath), false, "Reducer test must clean its temporary module.");
}
