# Budget Data Format

This directory contains budget data files in JSON format for various countries. Each file follows a standardized structure to enable consistent visualization in the Sankey diagram.

## File Naming Convention

Files should be named: `{country}-{year}.json`

Examples:
- `germany-2024.json`
- `usa-2024.json`
- `uk-2023.json`

## JSON Structure

Each budget file contains three main sections:

### 1. Metadata

Contains information about the budget:

```json
{
  "metadata": {
    "country": "Country Name",
    "year": 2024,
    "currency": "USD|EUR|GBP|DKK",
    "currency_symbol": "$|€|£|kr",
    "unit": "billions|millions",
    "total_revenue": 1000.0,
    "total_expenditure": 1100.0,
    "deficit": 100.0,
    "source": "Source of the data",
    "source_url": "https://example.gov/budget-data",
    "notes": "Additional notes about the budget"
  }
}
```

**Fields:**
- `country`: Full name of the country
- `year`: Fiscal year for the budget
- `currency`: Three-letter ISO currency code
- `currency_symbol`: Symbol for display
- `unit`: Scale of numbers (billions or millions)
- `total_revenue`: Total government revenue
- `total_expenditure`: Total government spending
- `deficit`: Budget deficit (positive) or surplus (negative)
- `source`: Official source of the data
- `source_url`: URL to the official data source (optional, but recommended)
- `notes`: Any additional context or caveats

### 2. Revenue

An array of revenue/income sources:

```json
{
  "revenue": [
    {
      "name": "Income Tax",
      "category": "Direct Taxes",
      "amount": 500.0,
      "percentage": 50.0
    }
  ]
}
```

**Fields:**
- `name`: Name of the revenue source
- `category`: High-level category (e.g., "Direct Taxes", "Indirect Taxes", "Social Insurance")
- `amount`: Amount in the unit specified in metadata
- `percentage`: Percentage of total revenue

**Common Categories:**
- Direct Taxes
- Indirect Taxes
- Social Insurance
- Business Taxes
- Local Taxes
- Other

### 3. Expenditure

An array of spending categories:

```json
{
  "expenditure": [
    {
      "name": "Healthcare",
      "category": "Health",
      "amount": 300.0,
      "percentage": 27.3
    }
  ]
}
```

**Fields:**
- `name`: Name of the expenditure category
- `category`: High-level category for grouping
- `amount`: Amount in the unit specified in metadata
- `percentage`: Percentage of total expenditure

**Common Categories:**
- Health
- Education
- Social Protection
- Defense
- Debt Service
- Infrastructure
- Public Safety
- Environment
- Economic Affairs
- Foreign Affairs
- Housing
- Recreation
- Research
- General Services
- Other

## Data Sources

### Germany
- **Source:** German Federal Ministry of Finance (Bundesfinanzministerium)
- **URL:** https://www.bundesfinanzministerium.de
- **Format:** Federal budget data, January-November 2024

### United States
- **Source:** Congressional Budget Office (CBO), U.S. Treasury
- **URL:** https://www.cbo.gov, https://fiscaldata.treasury.gov
- **Format:** Fiscal year 2024 (October 2023 - September 2024)

### United Kingdom
- **Source:** Office for Budget Responsibility (OBR), HM Treasury
- **URL:** https://obr.uk, https://www.gov.uk/government/organisations/hm-treasury
- **Format:** Fiscal year 2024-25

### Denmark
- **Source:** Danish Ministry of Finance (Finansministeriet)
- **URL:** https://fm.dk
- **Format:** Finansloven for 2024

## Adding New Budget Data

To add a new budget file:

1. Create a new JSON file following the naming convention
2. Ensure all required fields in metadata are filled
3. Include at least 3-5 revenue sources
4. Include at least 5-10 expenditure categories
5. Verify that amounts sum to approximately the totals (minor discrepancies due to rounding are acceptable)
6. Include proper source attribution
7. Save to the `data/budgets/` directory

The visualization will automatically detect and load new files when the page is refreshed.

## Data Validation

When creating budget files, ensure:

- Revenue amounts sum to approximately `total_revenue`
- Expenditure amounts sum to approximately `total_expenditure`
- Percentages for each section sum to approximately 100%
- All amounts are positive (except for rare cases like negative interest)
- Currency and units are consistent throughout the file

## Notes

- All monetary values should be in the same unit (specified in metadata)
- Percentages are for reference and visualization purposes
- Categories help with color-coding and grouping in the visualization
- The deficit field is calculated as: expenditure - revenue (positive = deficit, negative = surplus)
