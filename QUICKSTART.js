#!/usr/bin/env node

/**
 * ====================================================================
 * HABIB BLOCKS MANAGEMENT SYSTEM - QUICK START GUIDE
 * ====================================================================
 * 
 * This file documents the quick steps to get the system running.
 * 
 * ====================================================================
 * FIRST TIME SETUP (One-time)
 * ====================================================================
 */

// Step 1: SQL Server Configuration
// ─────────────────────────────────
// ✅ Enable TCP/IP on port 1433
// ✅ Enable Mixed Mode Authentication (SQL + Windows)
// ✅ Create database: BlockFactoryDB
// ✅ Create user: nodeuser with password
// 
// SQL Script (run in SQL Server Management Studio):
/*
CREATE DATABASE BlockFactoryDB;
GO
USE BlockFactoryDB;
GO
CREATE LOGIN nodeuser WITH PASSWORD = 'P@ssw0rd123!';
CREATE USER nodeuser FOR LOGIN nodeuser;
EXEC sp_addrolemember 'db_owner', 'nodeuser';
GO
*/

// Step 2: Project Setup
// ─────────────────────
// 1. npm install              (install dependencies)
// 2. Create .env file         (configure database connection)
// 3. node server.js           (start the application)

// Step 3: Configure .env
// ──────────────────────
// Create file: .env
// Add these lines:
/*
DB_SERVER=localhost
DB_DATABASE=BlockFactoryDB
DB_USER=nodeuser
DB_PASSWORD=P@ssw0rd123!
*/

/**
 * ====================================================================
 * DAILY STARTUP
 * ====================================================================
 */

// 1. Start SQL Server (should auto-start on Windows)
// 2. Run: node server.js
// 3. Open browser: http://localhost:3000/dashboard.html

/**
 * ====================================================================
 * SYSTEM FEATURES
 * ====================================================================
 */

const FEATURES = {
  dashboard: {
    icon: '📊',
    description: 'View real-time metrics and activity',
    url: '/dashboard.html',
    features: [
      '✓ Production count',
      '✓ Sales total',
      '✓ Expenses total',
      '✓ Profit calculation',
      '✓ 7-day charts',
      '✓ Recent activities'
    ]
  },
  production: {
    icon: '🏭',
    description: 'Record production batches',
    url: '/production.html',
    fields: [
      'Production Date',
      'Block Type',
      'Quantity Produced',
      'Cement Bags Used',
      'Remarks'
    ]
  },
  sales: {
    icon: '💰',
    description: 'Log sales transactions',
    url: '/sales.html',
    features: [
      '✓ Auto total calculation',
      '✓ Auto customer creation',
      '✓ Multiple block types',
      '✓ Unit price tracking'
    ]
  },
  expenses: {
    icon: '📉',
    description: 'Track expense entries',
    url: '/expenses.html',
    categories: [
      'Cement',
      'Labour',
      'Fuel',
      'Transport',
      'Maintenance',
      'Other'
    ]
  },
  reports: {
    icon: '📋',
    description: 'Advanced reporting & analytics',
    url: '/reports.html',
    features: [
      '✓ Multi-type filtering',
      '✓ Date range filtering',
      '✓ Advanced search',
      '✓ Column sorting',
      '✓ CSV export',
      '✓ Smart pagination'
    ]
  }
};

/**
 * ====================================================================
 * KEYBOARD SHORTCUTS
 * ====================================================================
 */

const SHORTCUTS = {
  'Ctrl+Shift+Delete': 'Clear browser cache (if UI issues)',
  'F12': 'Open browser developer console (for debugging)',
  'Ctrl+S': 'Save form data (as per browser)',
  'Tab': 'Navigate form fields',
  'Enter': 'Submit form'
};

/**
 * ====================================================================
 * COMMON ISSUES & SOLUTIONS
 * ====================================================================
 */

const TROUBLESHOOTING = {
  'Failed to connect to database': [
    '1. Check SQL Server is running',
    '2. Verify credentials in .env',
    '3. Ensure port 1433 is accessible',
    '4. Check database BlockFactoryDB exists'
  ],
  'Port 3000 already in use': [
    'powershell: netstat -ano | findstr :3000',
    'powershell: taskkill /PID <PID> /F',
    'Try different port: node server.js --port 3001'
  ],
  'Charts not showing': [
    'Clear browser cache',
    'Hard refresh: Ctrl+Shift+R',
    'Check F12 console for errors',
    'Verify Chart.js loads from CDN'
  ],
  'Data not appearing in reports': [
    'Check date range filters',
    'Clear search field',
    'Select "All Records" in type filter',
    'Refresh page: F5'
  ]
};

/**
 * ====================================================================
 * API ENDPOINTS REFERENCE
 * ====================================================================
 */

const ENDPOINTS = {
  production: 'POST /production',
  sales: 'POST /sales',
  expenses: 'POST /expenses',
  dashboardSummary: 'GET /dashboard-summary',
  dashboardActivities: 'GET /dashboard-activities',
  chartSales: 'GET /chart-sales',
  chartExpenses: 'GET /chart-expenses',
  reports: 'GET /reports?type=all&page=1&pageSize=50&sort=DateCol%20DESC&format=json'
};

/**
 * ====================================================================
 * PROJECT FILES
 * ====================================================================
 */

const FILES = {
  'server.js': 'Express REST API backend',
  'db.js': 'Database connection manager',
  'script.js': 'Shared client JavaScript',
  'style.css': 'Professional CSS styling',
  'dashboard.html': 'Main dashboard page',
  'production.html': 'Production form',
  'sales.html': 'Sales form',
  'expenses.html': 'Expenses form',
  'reports.html': 'Reports page',
  'package.json': 'Node dependencies',
  '.env': 'Environment configuration',
  'README.md': 'Full documentation'
};

/**
 * ====================================================================
 * DAILY WORKFLOW
 * ====================================================================
 */

const DAILY_WORKFLOW = {
  morning: [
    '1. Start server: node server.js',
    '2. Open Dashboard: http://localhost:3000/dashboard.html',
    '3. Review overnight activity and metrics'
  ],
  during_day: [
    '1. Production entry: Use Production form',
    '2. Sales logging: Use Sales form',
    '3. Expense tracking: Use Expenses form'
  ],
  end_of_day: [
    '1. Export reports to CSV (for backup)',
    '2. Review daily totals in Dashboard',
    '3. Check for any data errors',
    '4. Plan next day production'
  ]
};

/**
 * ====================================================================
 * REPORTS GUIDE
 * ====================================================================
 */

const REPORTS_TIPS = {
  filtering: {
    'By Type': 'Select: All, Production, Sales, Expenses, or Activities',
    'By Date': 'Enter From and To dates (YYYY-MM-DD)',
    'By Search': 'Search customer names, block types, descriptions',
    'By Amount': 'Click Amount header to sort high-to-low or low-to-high'
  },
  export: {
    'Export Page': 'Downloads current page data as CSV',
    'Export All': 'Downloads all matching records as CSV',
    'Use Excel': 'Open CSV in Excel for further analysis'
  },
  sorting: {
    'Click Headers': 'Click any column header to toggle sort',
    'Indicators': '🔽 = Descending, 🔼 = Ascending',
    'Sortable Columns': 'Date, Type, Details, Amount'
  }
};

/**
 * ====================================================================
 * DEFAULT CREDENTIALS & VALUES
 * ====================================================================
 */

const DEFAULTS = {
  server_port: 3000,
  database_port: 1433,
  page_size: 50,
  max_page_size: 200,
  session_timeout: 'No timeout (stateless API)',
  browser_cache_time: '1 hour (clear with Ctrl+Shift+Del)'
};

/**
 * ====================================================================
 * SYSTEM STATUS
 * ====================================================================
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🏭 HABIB BLOCKS MANAGEMENT SYSTEM - STARTUP GUIDE            ║
║                                                                ║
║   Status: ✅ PRODUCTION READY                                  ║
║   Version: 1.0.0                                               ║
║   Last Updated: June 2026                                      ║
╚════════════════════════════════════════════════════════════════╝

🚀 QUICK START:
   1. npm install
   2. Create .env with DB credentials
   3. node server.js
   4. Open http://localhost:3000/dashboard.html

📚 FEATURES:
   ✓ Dashboard with real-time metrics
   ✓ Production, Sales & Expenses entry
   ✓ Advanced Reports with sorting & export
   ✓ Professional UI with responsive design
   ✓ SQL Server integration

🔧 DATABASE:
   • Server: SQL Server
   • Database: BlockFactoryDB
   • Port: 1433
   • User: nodeuser

🌐 APPLICATION:
   • Server: http://localhost:3000
   • Framework: Express.js
   • Client: Vanilla JavaScript + Chart.js
   • UI: Professional CSS Grid layout

📖 For full documentation, see: README.md

`);