import { useState } from 'react';

// Removed logo imports as we'll use themed components instead.

/**
 * A component to showcase the accounting system's Tailwind theme.
 *
 * Make sure your `index.html` file includes:
 * 1. The Google Fonts <link> tag from your CSS file.
 * 2. The `tailwind.css` file.
 * 3. The `dark` class on the <html> tag if you want to default to dark mode.
 * <html lang="en" class="dark">
 */
function App() {
  const [count, setCount] = useState(0);

  return (
    // Set the base background and text colors for the whole app.
    // Added padding, min-height, and flex for layout.
    <div className="min-h-screen bg-background text-foreground font-sans p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Accounting Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, here's your financial overview.
          </p>
        </header>

        {/* Grid for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card: Primary */}
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Total Revenue (YTD)</h3>
            {/* Use font-mono for numbers */}
            <p className="text-3xl font-bold font-mono text-primary">$1,482,305.77</p>
          </div>

          {/* Card: Muted */}
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Expenses</h3>
            <p className="text-3xl font-bold font-mono text-danger">$731,092.12</p>
          </div>

          {/* Card: Muted */}
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Net Income</h3>
            <p className="text-3xl font-bold font-mono text-success">$751,213.65</p>
          </div>
        </div>

        {/* Interactive Elements Section */}
        <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold mb-4">Actions & Components</h2>
          
          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              type="button"
              onClick={() => setCount((c) => c + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Primary Action (Count: {count})
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-md shadow-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Secondary Action
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-danger text-danger-foreground font-medium rounded-md shadow-sm hover:bg-danger/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Delete Transaction
            </button>
          </div>

          {/* Form Input */}
          <div className="max-w-sm">
            <label htmlFor="entry" className="block text-sm font-medium text-muted-foreground mb-2">
              New Journal Entry
            </label>
            <input
              id="entry"
              type="text"
              placeholder="e.g., 'Office Supplies Purchase'"
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Alerts Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="p-4 bg-success text-success-foreground rounded-md">
              <span className="font-medium">Success!</span> Payment received and reconciliation is complete.
            </div>
            <div className="p-4 bg-warning text-warning-foreground rounded-md">
              <span className="font-medium">Warning:</span> 12 invoices are overdue. Please review.
            </div>
            <div className="p-4 bg-danger text-danger-foreground rounded-md">
              <span className="font-medium">Danger:</span> Payroll batch failed to process. Immediate attention required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
