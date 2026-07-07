# National Budget Sankey Diagram Visualization

An interactive Sankey diagram visualization for exploring national government budgets, showing revenue sources and expenditure flows using D3.js. Compare budgets across different countries with real data from official government sources.

## Features

- **Real Budget Data**: Actual government budget data for Germany, USA, UK, France, Japan, and Denmark
- **Automatic Budget Discovery**: The budget selector is populated from a generated manifest — no manual HTML edits needed to add a budget
- **Year-over-Year Comparison**: When multiple years exist for a country (currently Germany and USA), a comparison table shows changes in totals and matching expenditure categories
- **Per-Capita View**: Toggle to display all amounts per inhabitant instead of national totals
- **Export**: Download the current diagram as SVG or PNG
- **Works Offline and from Disk**: All D3.js libraries and data are local; an embedded data fallback makes the page work even when opened directly via `file://`
- **Data Validation**: `npm run validate` checks every budget file for consistency (sums, percentages, deficit)
- **Interactive Visualization**: Hover over nodes and links to see detailed budget information
- **Multiple Countries**: Compare budget structures across different nations
- **Color-Coded**: Revenue sources in green, expenditure categories in blue
- **Detailed Metadata**: View total revenue, expenditure, deficit/surplus, and data sources
- **Extensible Format**: Easy-to-use JSON format for adding new budgets

## Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No internet connection required - all libraries and data are included locally

### Running the Visualization

**Option 1: Direct File Access**
1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. Use the dropdown menu to select different country budgets

**Option 2: Local Web Server (Recommended)**

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8000`

## Understanding the Visualization

### Sankey Diagram Basics

A Sankey diagram shows flows between sources and destinations. The width of the arrows/links is proportional to the flow amount.

- **Left side**: Revenue sources (where government money comes from)
- **Right side**: Expenditure categories (where government money is spent)
- **Links**: Proportional flows showing how revenue is distributed to expenditures

### Interactivity

- **Hover over links**: See the flow amount between specific revenue and expenditure
- **Hover over nodes**: See the amount and percentage for that revenue source or expenditure category
- **Select budget**: Use dropdown to switch between different country budgets
- **Reload Data**: Refresh the current budget data
- **Per-capita view**: Toggle the checkbox to show all amounts per inhabitant (requires `population_millions` in the data file)
- **Export SVG / Export PNG**: Download the current diagram as an image
- **Year-over-year comparison**: Selecting a budget automatically shows a comparison table against the previous available year for that country

## Available Budget Data

Currently includes budget data for:

- **Germany 2024** - Federal budget (€416.2B revenue, €466.7B expenditure)
- **Germany 2023** - Federal budget (€411.5B revenue, €457.1B expenditure)
- **United States 2024** - Federal fiscal year budget ($4,919B revenue, $6,752B expenditure)
- **United States 2023** - Federal fiscal year budget ($4,439B revenue, $6,134B expenditure)
- **United Kingdom 2024-25** - Government budget (£1,141B revenue, £1,279B expenditure)
- **France 2024** - State budget (€299.9B revenue, €446.4B expenditure)
- **Japan 2024** - General account budget (¥77.1T revenue, ¥112.6T expenditure)
- **Denmark 2024** - National budget (902B DKK revenue, 888B DKK expenditure - surplus)

All data sourced from official government publications and statistical offices.

## Budget Information Display

Each budget includes detailed metadata:

- Country and fiscal year
- Total revenue and expenditure
- Budget deficit or surplus
- Official data source
- Additional notes and context

## Adding Your Own Budget Data

Budget data is stored in JSON files in the `data/budgets/` directory. Each file follows a standardized format.

### Quick Example

Create a file named `data/budgets/yourcontry-2024.json`:

```json
{
  "metadata": {
    "country": "Your Country",
    "year": 2024,
    "currency": "USD",
    "currency_symbol": "$",
    "unit": "billions",
    "total_revenue": 1000.0,
    "total_expenditure": 1100.0,
    "deficit": 100.0,
    "source": "Official Source",
    "notes": "Optional notes"
  },
  "revenue": [
    {
      "name": "Income Tax",
      "category": "Direct Taxes",
      "amount": 500.0,
      "percentage": 50.0
    }
  ],
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

### Adding to the Visualization

Regenerate the manifest and embedded data (this also validates all files):

```bash
npm run build-data
```

This updates `data/budgets/index.json` (used to populate the dropdown) and
`data/budgets-embedded.js` (the offline/`file://` fallback). No HTML changes
are needed — the new budget appears in the selector automatically.

To only check the data files without regenerating anything:

```bash
npm run validate
```

For detailed format specifications, see [`data/budgets/README.md`](data/budgets/README.md)

## Data Format

The budget data format includes:

1. **Metadata**: Country, year, currency, totals, source attribution
2. **Revenue Array**: List of revenue sources with amounts and categories
3. **Expenditure Array**: List of spending categories with amounts and categories

All amounts should be in the same unit (billions or millions) as specified in metadata.

### Data Categories

**Revenue Categories:**
- Direct Taxes (Income Tax, Corporate Tax)
- Indirect Taxes (VAT, Sales Tax, Excise)
- Social Insurance (Payroll Taxes, Contributions)
- Business Taxes
- Local Taxes
- Other Revenue

**Expenditure Categories:**
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
- Research
- General Services

## Technical Details

### Technologies Used

- **D3.js v7**: Data visualization library (included locally)
- **HTML5/CSS3**: Structure and styling
- **Vanilla JavaScript**: Interactivity and data loading

### Custom Sankey Implementation

This visualization uses a custom Sankey layout algorithm designed specifically for government budgets:

- Proportional flow distribution from revenue to expenditure
- Automatic scaling based on data values
- Support for multiple currencies and units
- Handles budget deficits and surpluses

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
State-budget/
├── index.html                  # Main visualization page
├── README.md                   # This file
├── package.json                # npm scripts (validate, build-data, serve)
├── data/
│   ├── budgets-embedded.js     # Generated: embedded data for file:// fallback
│   └── budgets/
│       ├── README.md           # Data format documentation
│       ├── index.json          # Generated: manifest of available budgets
│       ├── germany-2024.json
│       ├── usa-2024.json
│       ├── uk-2024.json
│       ├── france-2024.json
│       ├── japan-2024.json
│       └── denmark-2024.json
├── scripts/
│   ├── validate-budgets.js     # Data consistency checker
│   └── build-data.js           # Regenerates manifest + embedded data
├── lib/
│   └── d3.min.js               # D3.js library (local copy)
└── data-template.json          # Legacy template file
```

## Data Sources

All budget data is sourced from official government publications:

- **Germany**: Federal Ministry of Finance (Bundesfinanzministerium)
- **USA**: Congressional Budget Office (CBO), U.S. Treasury
- **UK**: Office for Budget Responsibility (OBR), HM Treasury
- **France**: Ministry of Economy and Finance (budget.gouv.fr)
- **Japan**: Ministry of Finance (MOF)
- **Denmark**: Danish Ministry of Finance (Finansministeriet)

Data is accurate as of fiscal year 2024. Please refer to the metadata in each budget file for specific source citations.

## Contributing

Contributions are welcome! To add new budget data:

1. Research official government budget documents
2. Create a JSON file following the format in `data/budgets/README.md`
3. Add the file to `data/budgets/`
4. Run `npm run build-data` to validate the data and regenerate the manifest and embedded fallback
5. Submit a pull request

Please ensure:
- Data is from official government sources
- All required metadata fields are included
- Amounts are accurate and properly attributed
- Currency and units are consistent

## License

This project is open source and available under the MIT License.

## Future Enhancements

Potential improvements:

- [x] Automatic detection of budget files (no manual HTML update needed)
- [x] Multi-year comparisons for the same country
- [ ] Budget category drill-down for detailed subcategories
- [x] Export visualization as PNG/SVG
- [x] Per-capita calculations
- [ ] Historical trend analysis
- [ ] Currency conversion for direct comparisons
- [ ] Sub-national budgets (states, provinces, municipalities)

## Acknowledgments

- D3.js team for the excellent visualization library
- Government statistical offices for publishing open budget data
- Contributors to the project

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Refer to the data format documentation in `data/budgets/README.md`
- Check existing budget files for examples
