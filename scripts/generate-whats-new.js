#!/usr/bin/env node

/**
 * What's New Generator
 *
 * Reads CHANGELOG.md and writes the latest entry as JSON into public/whats-new.json
 * to be consumed by the app's "What's New" modal.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const OUTPUT = path.join(ROOT, 'public', 'whats-new.json');

function readChangelog() {
  if (!fs.existsSync(CHANGELOG)) {
    throw new Error(`CHANGELOG.md not found at ${CHANGELOG}`);
  }
  return fs.readFileSync(CHANGELOG, 'utf8');
}

function extractLatestSection(markdown) {
  const lines = markdown.split(/\r?\n/);
  // Find first release heading line starting with "## ["
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) {
    throw new Error('No release section found in CHANGELOG.md');
  }
  // Find next section or end
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      endIdx = i;
      break;
    }
  }
  const sectionLines = lines.slice(startIdx, endIdx);
  const heading = sectionLines[0].trim();
  const match = heading.match(/^## \[(.+?)\]\s*-\s*(.+)$/);
  const version = match ? match[1].trim() : 'unknown';
  const date = match ? match[2].trim() : '';
  const bodyLines = sectionLines.slice(1);
  // Trim leading/trailing blank lines
  while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();
  const markdownOut = [heading, '', ...bodyLines].join('\n');
  return { version, date, markdown: markdownOut, heading, bodyLines };
}

function mdToHtml(lines, titleHeading) {
  // Very small, safe-ish converter for a limited subset we use in CHANGELOG
  const htmlParts = [];
  if (titleHeading) {
    htmlParts.push(`<h2 class="text-xl sm:text-2xl font-bold mb-3">${escapeHtml(titleHeading.replace(/^##\s*/, ''))}</h2>`);
  }
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      htmlParts.push(`<h3 class="text-lg sm:text-xl font-semibold mt-4 mb-2">${escapeHtml(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith('- ')) {
      // Collect consecutive list items
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      const lis = items
        .map((t) => `<li class="ml-4 list-disc"><span class="align-middle">${escapeHtml(t)}</span></li>`) 
        .join('');
      htmlParts.push(`<ul class="pl-5 space-y-1">${lis}</ul>`);
      continue;
    }
    // Paragraph fallback
    htmlParts.push(`<p class="mb-2">${escapeHtml(line)}</p>`);
    i++;
  }
  return htmlParts.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeOutput(payload) {
  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2));
  console.log(`What's new written to: ${OUTPUT}`);
}

function run() {
  try {
    console.log("Generating what's new from CHANGELOG.md...");
    const md = readChangelog();
    const { version, date, markdown, heading, bodyLines } = extractLatestSection(md);
    const htmlBody = mdToHtml(bodyLines, heading);
    const title = `What's New in ${version}${date ? ` (${date})` : ''}`;
    const payload = { version, date, title, html: htmlBody, markdown };
    writeOutput(payload);
  } catch (err) {
    console.error('Failed to generate whats-new.json:', err.message);
    process.exitCode = 1;
  }
}

run();
