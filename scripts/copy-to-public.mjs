#!/usr/bin/env node
/**
 * Copy every deployable site file into ./public so Workers Builds can
 * publish that directory exclusively — keeping .git/, .github/, node_modules/,
 * and other repo-internal directories out of the deployed site.
 *
 * Pure Node, no dependencies. Runs on every Workers Build.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(root, "public");

// Anything in this list is shipped as-is into public/.
// Anything NOT listed never reaches the deploy.
const INCLUDE = [
  "index.html",
  "privacy.html",
  "terms.html",
  "styles.css",
  "waitlist.js",
  "favicon.ico",
  "favicon.svg",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "favicon-180.png",
  "apple-touch-icon.png",
  "apple-touch-icon-precomposed.png",
  "apple-touch-icon-120x120.png",
  "apple-touch-icon-120x120-precomposed.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "og.png",
  "manifest.json",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  ".well-known",
  "for",
];

async function reset() {
  if (existsSync(out)) {
    await rm(out, { recursive: true, force: true });
  }
  await mkdir(out, { recursive: true });
}

async function copyOne(name) {
  const src = path.join(root, name);
  if (!existsSync(src)) {
    console.warn(`  ⚠ skip (not found): ${name}`);
    return;
  }
  const dest = path.join(out, name);
  await cp(src, dest, { recursive: true });
  console.log(`  → ${name}`);
}

await reset();
console.log(`Copying site files to ${path.relative(root, out)}/`);
for (const name of INCLUDE) {
  await copyOne(name);
}
console.log("done.");
