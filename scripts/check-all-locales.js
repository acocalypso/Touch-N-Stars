import fs from "fs";
import path from "path";

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

const localesDir = "src/locales";
const enPath = path.join(localesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));
const flatEn = flatten(en);

const files = fs.readdirSync(localesDir).filter(f => f.endsWith(".json") && f !== "en.json");

files.forEach(file => {
  const localePath = path.join(localesDir, file);
  const locale = JSON.parse(fs.readFileSync(localePath, "utf-8"));
  const flatLocale = flatten(locale);
  const missing = Object.keys(flatEn).filter(key => !Object.prototype.hasOwnProperty.call(flatLocale, key));
  
  if (missing.length > 0) {
    console.log(`\nLocale: ${file}`);
    missing.forEach(key => console.log(`  - ${key}`));
    console.log(`Total missing for ${file}: ${missing.length}`);
  } else {
    console.log(`\nLocale: ${file} - All keys present.`);
  }
});
