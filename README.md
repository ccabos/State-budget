# State Budget Sankey Diagram Visualization

An interactive Sankey diagram visualization for exploring state government income and expenditure flows using D3.js.

## Features

- **Interactive Visualization**: Hover over nodes and links to see detailed budget information
- **Multiple States**: Compare budget flows across different states (California, Texas, New York, Florida)
- **Color-Coded**: Income sources in green, expenditure categories in blue
- **Responsive Design**: Clean, professional layout with intuitive controls
- **Real-time Updates**: Switch between states to see different budget allocations

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No internet connection required - all D3.js libraries are included locally

### Running the Visualization

1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. Use the dropdown menu to select different states
4. Hover over nodes and links to see detailed information

### Local Development

No build process required! Simply open the HTML file directly:

```bash
# Open in your default browser
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

Or use a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8000`

## Understanding the Visualization

### Sankey Diagram Basics

A Sankey diagram shows flows between sources and destinations. The width of the arrows/links is proportional to the flow amount.

- **Left side**: Income sources (where the money comes from)
- **Right side**: Expenditure categories (where the money goes)
- **Links**: Show how much money flows from each source to each category

### Interactivity

- **Hover over links**: See the flow amount between specific income and expenditure
- **Hover over nodes**: See total revenue or expenditure for that category
- **Select state**: Use dropdown to switch between different state budgets
- **Reset View**: Return to default view (California)

## Data Structure

The budget data is structured as follows:

```javascript
{
    nodes: [
        { name: "Personal Income Tax", type: "income" },
        { name: "Education", type: "expense" }
    ],
    links: [
        { source: 0, target: 5, value: 25 }  // $25B from source 0 to target 5
    ]
}
```

### Adding Your Own Data

To add data for a new state:

1. Open `index.html`
2. Find the `stateData` object in the `<script>` section
3. Add a new entry following this structure:

```javascript
newstate: {
    name: "New State Name",
    nodes: [
        // Income sources (type: "income")
        { name: "Income Source 1", type: "income" },
        { name: "Income Source 2", type: "income" },
        // Expenditure categories (type: "expense")
        { name: "Expenditure Category 1", type: "expense" },
        { name: "Expenditure Category 2", type: "expense" }
    ],
    links: [
        // Connect sources to targets with values (in billions)
        { source: 0, target: 2, value: 10 },  // $10B from source 0 to target 2
        { source: 1, target: 3, value: 15 }   // $15B from source 1 to target 3
    ]
}
```

4. Add the new state to the dropdown:

```html
<select id="state-select">
    <!-- existing options -->
    <option value="newstate">New State Name</option>
</select>
```

## Sample States Included

### California
- **Income Sources**: Personal Income Tax, Sales Tax, Corporate Tax, Federal Funds, Other Revenue
- **Expenditures**: K-12 Education, Higher Education, Health & Human Services, Corrections, Transportation, Environmental Protection, Other Services

### Texas
- **Income Sources**: Sales Tax, Oil & Gas Severance, Motor Vehicle Tax, Federal Funds, Other Revenue
- **Expenditures**: K-12 Education, Higher Education, Health & Human Services, Transportation, Public Safety, Other Services

### New York
- **Income Sources**: Personal Income Tax, Sales Tax, Business Tax, Federal Funds, Other Revenue
- **Expenditures**: Education, Medicaid, Public Assistance, Transportation, Mental Hygiene, Public Safety, Other Services

### Florida
- **Income Sources**: Sales Tax, Documentary Stamp Tax, Corporate Income Tax, Federal Funds, Other Revenue
- **Expenditures**: Education, Health & Human Services, Transportation, Criminal Justice, Environmental Protection, Other Services

## Customization

### Colors

Edit the color schemes in the JavaScript:

```javascript
const incomeColor = d3.scaleOrdinal()
    .range(['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9']);

const expenseColor = d3.scaleOrdinal()
    .range(['#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB']);
```

### Dimensions

Adjust the diagram size:

```javascript
const width = 1300;  // Total width
const height = 700;  // Total height
```

### Node Spacing

Modify the Sankey layout parameters:

```javascript
const sankey = d3.sankey()
    .nodeWidth(20)      // Width of node bars
    .nodePadding(15)    // Spacing between nodes
    .extent([[1, 5], [width - 1, height - 5]]);
```

## Technologies Used

- **D3.js v7**: Data visualization library
- **d3-sankey**: Sankey diagram plugin for D3
- **HTML5/CSS3**: Structure and styling
- **Vanilla JavaScript**: Interactivity

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes on Data

The sample data in this visualization is for demonstration purposes. The values are simplified and may not reflect actual state budgets. For accurate budget information, please consult official state budget documents.

## Future Enhancements

Potential improvements:

- [ ] Load data from external JSON files
- [ ] Add year-over-year comparisons
- [ ] Export visualization as PNG/SVG
- [ ] Add filtering by expenditure type
- [ ] Include per-capita calculations
- [ ] Add historical trend analysis
- [ ] Implement drill-down for detailed subcategories

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Resources

- [D3.js Documentation](https://d3js.org/)
- [D3 Sankey Plugin](https://github.com/d3/d3-sankey)
- [Sankey Diagram Examples](https://observablehq.com/@d3/sankey)
