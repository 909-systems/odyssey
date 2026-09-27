// Renders icons/icon.svg to the PNG sizes iOS and the manifest need.
// Run: node scripts/render-icons.mjs  (uses the globally installed playwright)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright")); }
const svg = readFileSync(new URL("../icons/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: new URL(`../icons/${name}`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
