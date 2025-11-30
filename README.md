# Split-ly 💰

A simple, elegant bill splitting calculator that helps you fairly divide restaurant bills among adults and minors.

## What It Does

Split-ly is a web-based bill splitting tool that calculates how much each person owes when splitting a restaurant bill. It handles:

- **Adults**: Can have individual items (beverages and food) added to their portion
- **Minors**: Can pay a percentage of the adult split (25%, 50%, or 75%) or a fixed dollar amount
- **Tips**: Can be entered as either a percentage or a fixed dollar amount
- **Real-time calculations**: Updates automatically as you adjust settings

## How It Works

### Step 1: Enter Bill Information

1. **Total Amount (Post Tax)**: Enter the total bill amount after tax
2. **Tip**: Enter the tip amount
   - Click the `%` button to toggle between percentage and dollar amount mode
   - In percentage mode: Enter a percentage (e.g., 18 for 18%)
   - In dollar mode: Enter a fixed dollar amount (e.g., 10.00)
3. **Number of Adults**: Use the +/- buttons to set the number of adults
4. **Number of Minors**: Use the +/- buttons to set the number of minors

### Step 2: Customize Individual Amounts

After clicking "Calculate Split", you can:

- **For Adults**: Add individual items (beverages 🥤 or food 🍔) with specific amounts
- **For Minors**: Choose how they pay:
  - Select a percentage button (25%, 50%, or 75% of the adult split)
  - OR enter a direct dollar amount

## Calculation Logic

The app uses the following calculation method:

### 1. Calculate Grand Total
```
Grand Total = Total Bill Amount + Tip Amount
```

### 2. Calculate Amount to Split
```
Amount to Split = Grand Total - Individual Items - Direct Minor Amounts
```

Where:
- **Individual Items**: Sum of all items added to adults (beverages and food)
- **Direct Minor Amounts**: Sum of all fixed dollar amounts entered for minors

### 3. Calculate Even Split Per Person
```
Even Split Per Person = Amount to Split ÷ Total Number of People
```

### 4. Calculate Minor Amounts

For each minor:
- **If using percentage**: `Minor Amount = Even Split Per Person × (Percentage ÷ 100)`
- **If using direct amount**: `Minor Amount = Direct Amount Entered`

### 5. Calculate Adult Amounts

```
Total Minor Amount = Sum of all minor amounts
Remaining Amount = Amount to Split - Total Minor Amount
Adult Base Amount = Remaining Amount ÷ Number of Adults
```

For each adult:
```
Adult Amount = Adult Base Amount + Sum of Individual Items
```

### Example Calculation

Let's say:
- Total Bill: $100.00
- Tip: 18% ($18.00)
- Grand Total: $118.00
- 2 Adults, 1 Minor
- Minor pays 50% of adult split
- Adult 1 has a $5.00 beverage

**Step 1**: Grand Total = $118.00

**Step 2**: Amount to Split = $118.00 - $5.00 (beverage) - $0 (no direct minor amounts) = $113.00

**Step 3**: Even Split Per Person = $113.00 ÷ 3 = $37.67

**Step 4**: Minor Amount = $37.67 × 50% = $18.83

**Step 5**: 
- Total Minor Amount = $18.83
- Remaining Amount = $113.00 - $18.83 = $94.17
- Adult Base Amount = $94.17 ÷ 2 = $47.09
- Adult 1 Amount = $47.09 + $5.00 = $52.09
- Adult 2 Amount = $47.09 + $0 = $47.09

**Final Split**:
- Adult 1: $52.09
- Adult 2: $47.09
- Minor: $18.83
- **Total**: $118.01 (rounding difference)

## Features

- ✅ Toggle between tip percentage and dollar amount
- ✅ Add individual items (beverages/food) to adults
- ✅ Flexible minor payment options (percentage or fixed amount)
- ✅ Real-time calculation updates
- ✅ Clean, modern UI with smooth animations
- ✅ Responsive design for mobile and desktop

## Usage

Simply open `index.html` in your web browser. No installation or dependencies required!

## File Structure

```
split-ly/
├── index.html    # Main HTML structure
├── script.js     # Application logic and calculations
├── styles.css    # Styling and layout
└── README.md     # This file
```

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- CSS Grid and Flexbox
- HTML5 form inputs

---

Made with ❤️ for fair bill splitting

