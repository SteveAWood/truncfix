#!/usr/bin/env node
/**
 * truncator – human-readable usage log viewer
 * Usage: node scripts/view-usage.js [path/to/usage.log]
 */

const fs = require('fs');
const path = require('path');

const logPath = process.argv[2] || path.join(process.cwd(), 'data', 'usage.log');

if (!fs.existsSync(logPath)) {
  console.error(`Log file not found: ${logPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
const events = lines.map((line, i) => {
  try {
    return JSON.parse(line);
  } catch {
    console.warn(`Skipping bad line ${i + 1}`);
    return null;
  }
}).filter(Boolean);

if (events.length === 0) {
  console.log('No events found.');
  process.exit(0);
}

// ── Helpers ──────────────────────────────────────────────
function fmt(n) {
  return n?.toLocaleString() ?? '–';
}
function fmtBytes(b) {
  if (!b) return '–';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}
function dayKey(iso) {
  return iso.slice(0, 10);
}

// ── Totals ───────────────────────────────────────────────
const uploads = events.filter(e => e.event === 'upload');
const downloads = events.filter(e => e.event === 'download');
const ips = [...new Set(events.map(e => e.ip).filter(Boolean))];
const types = [...new Set(events.map(e => e.detectedType).filter(Boolean))];

console.log('\n══════════════════════════════════════════════════');
console.log('  truncator usage summary');
console.log('══════════════════════════════════════════════════\n');

console.log(`Total events:     ${events.length}`);
console.log(`Uploads:          ${uploads.length}`);
console.log(`Downloads:        ${downloads.length}`);
console.log(`Unique IPs:       ${ips.length}  (${ips.join(', ')})`);
console.log(`Detected types:   ${types.length ? types.join(', ') : '(none recorded yet)'}`);
console.log(`First event:      ${events[0].timestamp}`);
console.log(`Last event:       ${events[events.length - 1].timestamp}`);
console.log('');

// ── By day ───────────────────────────────────────────────
const byDay = {};
for (const e of events) {
  const d = dayKey(e.timestamp);
  if (!byDay[d]) byDay[d] = { uploads: 0, downloads: 0, chars: 0, files: 0, events: [] };
  byDay[d].events.push(e);
  if (e.event === 'upload') {
    byDay[d].uploads++;
    byDay[d].chars += e.originalChars || 0;
    byDay[d].files += e.originalFiles || 0;
  } else {
    byDay[d].downloads++;
  }
}

console.log('── Activity by day ───────────────────────────────\n');
for (const [day, data] of Object.entries(byDay).sort()) {
  console.log(`${day}  ·  ${data.uploads} upload(s)  ·  ${data.downloads} download(s)`);
  if (data.uploads) {
    console.log(`         ${fmt(data.chars)} total chars  ·  ${fmt(data.files)} total blocks/files`);
  }
  console.log('');
}

// ── Detailed download table ──────────────────────────────
console.log('── Downloads (most useful signal) ───────────────\n');
console.log(
  'Date       | Chars      | Files  | Limit  | Parts | Batches | Tokens   | Zip size  | Type'
);
console.log(
  '-----------|------------|--------|--------|-------|---------|----------|-----------|--------'
);

for (const e of downloads) {
  const date = e.timestamp.slice(0, 10);
  const chars = fmt(e.originalChars).padStart(10);
  const files = fmt(e.originalFiles).padStart(6);
  const limit = fmt(e.characterLimit).padStart(6);
  const parts = fmt(e.partsCreated).padStart(5);
  const batches = fmt(e.batchesCreated || 1).padStart(7);
  const tokens = fmt(e.estimatedTokens).padStart(8);
  const zip = fmtBytes(e.zipSizeEstimate).padStart(9);
  const type = (e.detectedType || '–').padEnd(8);
  console.log(`${date} | ${chars} | ${files} | ${limit} | ${parts} | ${batches} | ${tokens} | ${zip} | ${type}`);
}

console.log('\n── Raw event count by IP ─────────────────────────\n');
const byIp = {};
for (const e of events) {
  byIp[e.ip || 'unknown'] = (byIp[e.ip || 'unknown'] || 0) + 1;
}
for (const [ip, count] of Object.entries(byIp).sort((a, b) => b[1] - a[1])) {
  console.log(`${ip.padEnd(20)} ${count} events`);
}

console.log('\nDone.\n');