#!/usr/bin/env node
/**
 * Copy face-api weights from node_modules into public/models.
 * These .bin files are large vendor assets — keep them out of git.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules", "@vladmandic", "face-api", "model");
const destDir = join(root, "public", "models");

const files = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model.bin",
  "age_gender_model-weights_manifest.json",
  "age_gender_model.bin",
  "face_expression_model-weights_manifest.json",
  "face_expression_model.bin",
];

if (!existsSync(srcDir)) {
  console.warn(
    "[copy-face-models] @vladmandic/face-api not installed; skip model copy.",
  );
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const from = join(srcDir, file);
  const to = join(destDir, file);
  if (!existsSync(from)) {
    console.warn(`[copy-face-models] missing source: ${file}`);
    continue;
  }
  cpSync(from, to);
}

console.log(`[copy-face-models] synced ${files.length} files → public/models/`);
