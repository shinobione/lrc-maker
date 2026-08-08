import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { swc } from "rollup-plugin-swc3";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const hash = execSync("git rev-parse --short HEAD").toString().trim();
const updateTime = execSync("git log -1 --format=%cI").toString().trim();
const langDir = "src/languages";
const langFiles = readdirSync(langDir).filter((filename) => filename.endsWith(".json")).sort();

const langMap = await Promise.all(langFiles.map(async (filename) => {
    const content = JSON.parse(await readFile(join(langDir, filename), "utf-8")) as { languageName: string };
    return [filename.slice(0, -5), content.languageName] as const;
}));

export default defineConfig({
    clearScreen: false,
    plugins: [swc()],
    base: "./",
    json: { namedExports: false },
    define: {
        "import.meta.env.app": JSON.stringify({ hash, updateTime, version: pkg.version }),
        "i18n.langCodeList": JSON.stringify(langFiles.map((filename) => filename.slice(0, -5))),
        "i18n.langMap": JSON.stringify(langMap),
    },
    build: {
        minify: true,
        cssMinify: "lightningcss",
        outDir: "build/embed",
        emptyOutDir: false,
        lib: {
            entry: resolve(__dirname, "src/studio-embed.tsx"),
            name: "ShinoBiWanLyricsStudio",
            formats: ["iife"],
            fileName: () => "lyrics-studio.js",
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});
