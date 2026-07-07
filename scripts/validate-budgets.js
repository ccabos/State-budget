#!/usr/bin/env node
/**
 * Validates all budget JSON files in data/budgets/.
 *
 * Checks:
 *  - required metadata fields and types
 *  - revenue/expenditure arrays present and non-empty
 *  - item amounts sum to declared totals (within tolerance)
 *  - declared percentages match computed ones (within tolerance)
 *  - deficit consistency: total_expenditure - total_revenue
 *
 * Exit code 0 = all files valid (warnings allowed), 1 = at least one error.
 */

const fs = require('fs');
const path = require('path');

const BUDGETS_DIR = path.join(__dirname, '..', 'data', 'budgets');
const SUM_TOLERANCE = 0.015; // 1.5% relative tolerance for rounding
const PCT_TOLERANCE = 0.6; // percentage points

const REQUIRED_METADATA = {
  country: 'string',
  year: 'number',
  currency: 'string',
  currency_symbol: 'string',
  unit: 'string',
  total_revenue: 'number',
  total_expenditure: 'number',
  deficit: 'number',
  source: 'string',
};

const VALID_UNITS = ['millions', 'billions', 'trillions'];

function validateItems(items, sectionName, declaredTotal, errors, warnings) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`"${sectionName}" must be a non-empty array`);
    return;
  }

  let sum = 0;
  items.forEach((item, i) => {
    const label = `${sectionName}[${i}]${item && item.name ? ` (${item.name})` : ''}`;
    if (!item || typeof item !== 'object') {
      errors.push(`${label}: must be an object`);
      return;
    }
    if (typeof item.name !== 'string' || !item.name.trim()) {
      errors.push(`${label}: missing "name"`);
    }
    if (typeof item.category !== 'string' || !item.category.trim()) {
      warnings.push(`${label}: missing "category"`);
    }
    if (typeof item.amount !== 'number' || !isFinite(item.amount)) {
      errors.push(`${label}: "amount" must be a number`);
      return;
    }
    if (item.amount < 0) {
      warnings.push(`${label}: negative amount (${item.amount})`);
    }
    sum += item.amount;

    // Optional subcategory breakdown
    if (item.children !== undefined) {
      if (!Array.isArray(item.children) || item.children.length === 0) {
        errors.push(`${label}: "children" must be a non-empty array when present`);
      } else {
        let childSum = 0;
        item.children.forEach((child, j) => {
          const childLabel = `${label}.children[${j}]${child && child.name ? ` (${child.name})` : ''}`;
          if (!child || typeof child.name !== 'string' || !child.name.trim()) {
            errors.push(`${childLabel}: missing "name"`);
          }
          if (!child || typeof child.amount !== 'number' || !isFinite(child.amount)) {
            errors.push(`${childLabel}: "amount" must be a number`);
          } else {
            childSum += child.amount;
          }
        });
        if (item.amount > 0 && Math.abs(childSum - item.amount) / item.amount > SUM_TOLERANCE) {
          errors.push(
            `${label}: children sum to ${childSum.toFixed(2)} but parent amount is ${item.amount.toFixed(2)}`
          );
        }
      }
    }
  });

  if (typeof declaredTotal === 'number' && sum > 0) {
    const relDiff = Math.abs(sum - declaredTotal) / declaredTotal;
    if (relDiff > SUM_TOLERANCE) {
      errors.push(
        `${sectionName} items sum to ${sum.toFixed(2)} but metadata declares ` +
          `${declaredTotal.toFixed(2)} (off by ${(relDiff * 100).toFixed(1)}%)`
      );
    }

    // Check declared percentages against computed ones
    items.forEach((item) => {
      if (typeof item.percentage === 'number' && typeof item.amount === 'number') {
        const computed = (item.amount / declaredTotal) * 100;
        if (Math.abs(computed - item.percentage) > PCT_TOLERANCE) {
          warnings.push(
            `${sectionName} "${item.name}": declared ${item.percentage}% but ` +
              `amount implies ${computed.toFixed(1)}%`
          );
        }
      }
    });
  }
}

function validateFile(filepath) {
  const errors = [];
  const warnings = [];
  let data;

  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return { errors: [`invalid JSON: ${e.message}`], warnings };
  }

  const meta = data.metadata;
  if (!meta || typeof meta !== 'object') {
    return { errors: ['missing "metadata" object'], warnings };
  }

  for (const [field, type] of Object.entries(REQUIRED_METADATA)) {
    if (typeof meta[field] !== type) {
      errors.push(`metadata.${field}: expected ${type}, got ${typeof meta[field]}`);
    }
  }

  if (typeof meta.unit === 'string' && !VALID_UNITS.includes(meta.unit)) {
    warnings.push(`metadata.unit "${meta.unit}" is not one of: ${VALID_UNITS.join(', ')}`);
  }

  if (meta.source_url !== undefined && !/^https?:\/\//.test(String(meta.source_url))) {
    warnings.push(`metadata.source_url does not look like a URL: ${meta.source_url}`);
  }

  if (meta.population_millions === undefined) {
    warnings.push('metadata.population_millions missing (per-capita view unavailable)');
  } else if (typeof meta.population_millions !== 'number' || meta.population_millions <= 0) {
    errors.push(`metadata.population_millions must be a positive number, got ${meta.population_millions}`);
  }

  if (meta.exchange_rate_per_usd === undefined) {
    warnings.push('metadata.exchange_rate_per_usd missing (USD conversion unavailable)');
  } else if (typeof meta.exchange_rate_per_usd !== 'number' || meta.exchange_rate_per_usd <= 0) {
    errors.push(`metadata.exchange_rate_per_usd must be a positive number, got ${meta.exchange_rate_per_usd}`);
  }

  validateItems(data.revenue, 'revenue', meta.total_revenue, errors, warnings);
  validateItems(data.expenditure, 'expenditure', meta.total_expenditure, errors, warnings);

  if (
    typeof meta.total_revenue === 'number' &&
    typeof meta.total_expenditure === 'number' &&
    typeof meta.deficit === 'number'
  ) {
    const implied = meta.total_expenditure - meta.total_revenue;
    if (Math.abs(implied - meta.deficit) > Math.abs(meta.total_expenditure) * 0.01) {
      errors.push(
        `metadata.deficit is ${meta.deficit} but total_expenditure - total_revenue = ` +
          `${implied.toFixed(2)}`
      );
    }
  }

  return { errors, warnings };
}

function main() {
  if (!fs.existsSync(BUDGETS_DIR)) {
    console.error(`Budget directory not found: ${BUDGETS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(BUDGETS_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .sort();

  if (files.length === 0) {
    console.error('No budget files found.');
    process.exit(1);
  }

  let hasErrors = false;

  for (const file of files) {
    const { errors, warnings } = validateFile(path.join(BUDGETS_DIR, file));
    const status = errors.length ? 'FAIL' : warnings.length ? 'WARN' : 'OK';
    console.log(`[${status}] ${file}`);
    errors.forEach((e) => console.log(`  error: ${e}`));
    warnings.forEach((w) => console.log(`  warning: ${w}`));
    if (errors.length) hasErrors = true;
  }

  console.log(`\n${files.length} file(s) checked.`);
  process.exit(hasErrors ? 1 : 0);
}

main();
