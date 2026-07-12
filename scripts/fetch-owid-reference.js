#!/usr/bin/env node
/**
 * Downloads reference series from Our World in Data (ourworldindata.org)
 * and writes them to data/reference/owid.json, for cross-checking the
 * hand-curated budget files with scripts/check-owid.js.
 *
 * Requires internet access (OWID grapher CSV endpoints):
 *   node scripts/fetch-owid-reference.js
 *
 * OWID data is republished under CC BY 4.0; the generated file records
 * the source URL and access date for attribution.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_PATH = path.join(__dirname, '..', 'data', 'reference', 'owid.json');

// ISO codes for the countries in data/budgets/ (base names, general scope)
const COUNTRIES = {
  DEU: 'Germany',
  FRA: 'France',
  DNK: 'Denmark',
  GBR: 'United Kingdom',
  USA: 'United States',
  CHN: 'China',
};

// OWID grapher slug -> which of our measures it checks.
// "category" entries compare against a budget category's % of GDP;
// "total" compares against total expenditure % of GDP.
const SERIES = {
  'military-expenditure-share-gdp': {
    measure: 'category', category: 'Defense',
    note: 'SIPRI definition; broader than COFOG defence (incl. military pensions, paramilitary), so our values may sit slightly lower.',
  },
  'public-health-expenditure-share-gdp': {
    measure: 'category', category: 'Health',
    note: 'Public/compulsory health expenditure; close to COFOG health.',
  },
  'total-government-expenditure-on-education-gdp': {
    measure: 'category', category: 'Education',
    note: 'Government education expenditure; close to COFOG education.',
  },
  'total-gov-expenditure-gdp-wdi': {
    measure: 'total',
    note: 'IMF/WDI general government total expenditure; matches our general-scope totals.',
  },
};

function fetchCsv(slug) {
  const country = Object.keys(COUNTRIES).join('~');
  const url = `https://ourworldindata.org/grapher/${slug}.csv?csvType=filtered&country=${country}&time=2005..latest`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'state-budget-sankey data check' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r2 => collect(r2, resolve, reject)).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${slug}`));
        return;
      }
      collect(res, resolve, reject);
    }).on('error', reject);
  });
}

function collect(res, resolve, reject) {
  let body = '';
  res.on('data', d => (body += d));
  res.on('end', () => resolve(body));
  res.on('error', reject);
}

// Grapher CSVs are simple: Entity,Code,Year,<value>  (no quoted commas)
function parseCsv(text) {
  const lines = text.trim().split('\n');
  return lines.slice(1).map(line => {
    const [entity, code, year, value] = line.split(',');
    return { entity, code, year: Number(year), value: Number(value) };
  }).filter(r => r.code in COUNTRIES && isFinite(r.value));
}

async function main() {
  const reference = {
    source: 'Our World in Data (ourworldindata.org), CC BY 4.0',
    accessed: new Date().toISOString().slice(0, 10),
    provisional_seed: false,
    series: {},
  };

  for (const [slug, cfg] of Object.entries(SERIES)) {
    process.stdout.write(`Fetching ${slug} ... `);
    try {
      const rows = parseCsv(await fetchCsv(slug));
      const values = {};
      rows.forEach(r => {
        (values[r.code] = values[r.code] || {})[r.year] = r.value;
      });
      reference.series[slug] = { ...cfg, values };
      console.log(`${rows.length} rows`);
    } catch (e) {
      console.log(`FAILED (${e.message}) - skipped`);
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(reference, null, 2) + '\n');
  console.log(`Wrote ${path.relative(process.cwd(), OUT_PATH)}`);
}

main();
