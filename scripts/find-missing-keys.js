// find-missing-keys.js
// This script compares two i18n JSON files and prints missing keys

import fs from "fs";

function flatten(obj, prefix = "", result = {}) {
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      flatten(obj[key], newKey, result);
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

const en = JSON.parse(fs.readFileSync("src/locales/en.json", "utf-8"));
const de = JSON.parse(fs.readFileSync("src/locales/de.json", "utf-8"));

const flatEn = flatten(en);
const flatDe = flatten(de);

const missing = Object.keys(flatEn).filter(key => !flatDe[key]);

console.log("\nMissing keys:\n");

missing.forEach(key => console.log(key));

console.log(`\nTotal missing: ${missing.length}\n`);