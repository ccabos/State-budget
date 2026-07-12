#!/usr/bin/env node
/**
 * Aligns the general-government budget files with Our World in Data's
 * curated COFOG dataset (OECD "Government at a Glance" via OWID).
 *
 *   node scripts/build-owid-budgets.js            # report differences only
 *   node scripts/build-owid-budgets.js --write    # update the budget files
 *   node scripts/build-owid-budgets.js --input path/to/local.csv [--write]
 *
 * Division of labour:
 *   - Totals (revenue, expenditure, deficit) and GDP stay curated from
 *     national statistics - they are newer than OWID's OECD vintage.
 *   - The expenditure *function split* of scope:"general" files is
 *     re-derived from OWID's "% of GDP by function" series, which is the
 *     authoritative cross-country source.
 *   - Interest is kept from national data (COFOG folds it into "general
 *     public services"); the GPS item is set to the OWID value minus it.
 *   - An "Other" item, when present, absorbs the residual so items still
 *     sum to the declared total.
 *
 * The raw OWID CSV is stored at data/reference/owid-cofog.csv so every
 * refresh is reviewable in git. OWID data is CC BY 4.0.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BUDGETS_DIR = process.env.BUDGETS_DIR || path.join(__dirname, '..', 'data', 'budgets');
const RAW_PATH = path.join(__dirname, '..', 'data', 'reference', 'owid-cofog.csv');
const SLUG = 'government-spending-by-function-as-share-of-gdp-across-countries';

const COUNTRY_CODES = {
  'Germany': 'DEU', 'France': 'FRA', 'Denmark': 'DNK',
  'United Kingdom': 'GBR', 'United States': 'USA', 'China': 'CHN',
  'Italy': 'ITA', 'Spain': 'ESP', 'Sweden': 'SWE', 'Japan': 'JPN',
};

// Fuzzy match from OWID/COFOG series names to our categories.
// GPS is special-cased: COFOG includes debt interest there, we split it out.
const FUNCTION_PATTERNS = [
  [/social protection/i, 'Social Protection'],
  [/health/i, 'Health'],
  [/education/i, 'Education'],
  [/defen[cs]e/i, 'Defense'],
  [/economic affairs/i, 'Economic Affairs'],
  [/public order/i, 'Public Safety'],
  [/environment/i, 'Environment'],
  [/housing/i, 'Housing'],
  [/recreation|culture/i, 'Recreation'],
  [/general public services/i, '__GPS__'],
];

function matchFunction(name) {
  for (const [re, cat] of FUNCTION_PATTERNS) if (re.test(name)) return cat;
  return null;
}

function baseCountry(name) {
  return String(name).replace(/\s*\(general government\)$/i, '');
}

function fetchCsv() {
  const country = Object.values(COUNTRY_CODES).join('~');
  const url = `https://ourworldindata.org/grapher/${SLUG}.csv?csvType=filtered&country=${country}&time=2000..latest`;
  return new Promise((resolve, reject) => {
    const get = (u, hops) => https.get(u, { headers: { 'User-Agent': 'state-budget-sankey data refresh (github.com/ccabos/State-budget)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops < 3) {
        get(res.headers.location, hops + 1);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => resolve(body));
      res.on('error', reject);
    }).on('error', reject);
    get(url, 0);
  });
}

// Minimal CSV parsing with quote support (grapher CSVs quote names with commas)
function splitCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Parses the CSV into { CODE: { year: { Category: pctOfGdp } } }.
 * Handles both shapes grapher exports use:
 *  - wide: Entity,Code,Year,<one column per function>
 *  - long: Entity,Code,Year,<function/indicator column>,<value column>
 */
function parseCofog(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  const idx = name => header.findIndex(h => h.trim().toLowerCase() === name);
  const iEntity = idx('entity'), iCode = idx('code'), iYear = idx('year');
  if (iCode < 0 || iYear < 0) throw new Error(`Unexpected header: ${header.join(', ')}`);

  const fixed = new Set([iEntity, iCode, iYear]);
  const rest = header.map((h, i) => ({ h, i })).filter(c => !fixed.has(c.i));

  const wideCols = rest
    .map(c => ({ ...c, cat: matchFunction(c.h) }))
    .filter(c => c.cat);

  const out = {};
  const wanted = new Set(Object.values(COUNTRY_CODES));
  const add = (code, year, cat, value) => {
    if (!wanted.has(code) || !isFinite(value)) return;
    ((out[code] = out[code] || {})[year] = out[code][year] || {})[cat] = value;
  };

  if (wideCols.length >= 3) {
    // wide format: several function columns matched
    for (const line of lines.slice(1)) {
      const cells = splitCsvLine(line);
      const code = cells[iCode], year = Number(cells[iYear]);
      wideCols.forEach(c => add(code, year, c.cat, Number(cells[c.i])));
    }
  } else {
    // long format: find the dimension column (its cell values match functions)
    const probe = splitCsvLine(lines[1] || '');
    const iDim = rest.find(c => matchFunction(probe[c.i] || ''))?.i;
    const iVal = rest.find(c => c.i !== iDim && isFinite(Number(probe[c.i])))?.i;
    if (iDim === undefined || iVal === undefined) {
      throw new Error(`Could not detect function/value columns in: ${header.join(', ')}`);
    }
    for (const line of lines.slice(1)) {
      const cells = splitCsvLine(line);
      const cat = matchFunction(cells[iDim] || '');
      if (cat) add(cells[iCode], Number(cells[iYear]), cat, Number(cells[iVal]));
    }
  }
  return out;
}

function round(v, unit) {
  return unit === 'trillions' ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10;
}

function alignFile(file, cofog, write) {
  const p = path.join(BUDGETS_DIR, file);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const meta = doc.metadata || {};
  if (meta.scope !== 'general' || !(meta.gdp > 0)) return null;
  const code = COUNTRY_CODES[baseCountry(meta.country)];
  const shares = code && cofog[code] && cofog[code][meta.year];
  if (!shares) return { file, status: 'no OWID data' };

  const total = meta.total_expenditure;
  const unit = meta.unit;
  const items = doc.expenditure;
  const byCat = {};
  items.forEach(i => (byCat[i.category] = byCat[i.category] || []).push(i));

  const interest = (byCat['Debt Service'] || []).reduce((s, i) => s + i.amount, 0);
  const changes = [];

  for (const [cat, share] of Object.entries(shares)) {
    let target = (share / 100) * meta.gdp;
    let targets;
    if (cat === '__GPS__') {
      target = Math.max(target - interest, 0);
      targets = (byCat['General Services'] || []);
    } else {
      targets = (byCat[cat] || []);
    }
    if (targets.length !== 1) continue; // ambiguous or absent -> leave curated value
    const it = targets[0];
    const next = round(target, unit);
    if (Math.abs(next - it.amount) / Math.max(it.amount, 0.001) > 0.005) {
      changes.push(`${it.name}: ${it.amount} -> ${next}`);
      if (write) it.amount = next;
    }
  }

  if (write && changes.length) {
    // Let "Other" absorb the residual so items still sum to the total
    const other = items.find(i => i.category === 'Other');
    if (other) {
      const sumRest = items.reduce((s, i) => (i === other ? s : s + i.amount), 0);
      other.amount = round(Math.max(total - sumRest, 0), unit);
    }
    // OWID's OECD vintage can disagree slightly with our newer national
    // totals; keep OWID's relative shares but honor the curated total.
    const sum = items.reduce((s, i) => s + i.amount, 0);
    if (Math.abs(sum - total) / total > 0.01) {
      const k = (total - interest) / (sum - interest);
      items.forEach(i => {
        if (i.category !== 'Debt Service') i.amount = round(i.amount * k, unit);
      });
      changes.push(`(rescaled non-interest items by ${k.toFixed(3)} to match the curated total)`);
    }
    items.forEach(i => (i.percentage = Math.round(i.amount / total * 1000) / 10));
    meta.function_split_source = `Our World in Data (OECD COFOG), retrieved ${new Date().toISOString().slice(0, 10)}, CC BY 4.0`;
    fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
  }
  return { file, status: changes.length ? (write ? 'updated' : 'differs') : 'aligned', changes };
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const inputIdx = args.indexOf('--input');

  let csv;
  if (inputIdx >= 0) {
    csv = fs.readFileSync(args[inputIdx + 1], 'utf8');
  } else {
    console.log(`Fetching ${SLUG} from ourworldindata.org ...`);
    csv = await fetchCsv();
    fs.mkdirSync(path.dirname(RAW_PATH), { recursive: true });
    fs.writeFileSync(RAW_PATH, csv);
    console.log(`Saved raw CSV to ${path.relative(process.cwd(), RAW_PATH)}`);
  }

  const cofog = parseCofog(csv);
  const codes = Object.keys(cofog);
  console.log(`Parsed COFOG shares for: ${codes.join(', ') || '(none)'}\n`);

  const files = fs.readdirSync(BUDGETS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  let updated = 0;
  for (const file of files) {
    const res = alignFile(file, cofog, write);
    if (!res) continue;
    console.log(`[${res.status}] ${res.file}`);
    (res.changes || []).forEach(c => console.log(`    ${c}`));
    if (res.status === 'updated') updated++;
  }
  console.log(write
    ? `\n${updated} file(s) updated. Run "npm run build-data" to rebuild the manifest.`
    : '\nReport mode - run with --write to apply.');
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
