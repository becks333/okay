# 🏭 Habib Blocks Management System

A professional, modern web-based management system for block factory operations. Track production, sales, expenses, and generate comprehensive reports with real-time analytics.

## ✨ Features

### 📊 Dashboard
- **Real-time Metrics**: Production count, sales total, expenses total, and profit calculation
- **Activity Timeline**: Recent sales, expenses, and production entries
- **7-Day Trend Charts**: Visual representation of sales and expenses trends

### 🏭 Production Management
- Record production batches with date, block type, quantity, and cement usage
- Track production efficiency and material consumption
- Add remarks for quality notes and batch information

### 💰 Sales Management
- Log sales transactions with customer names and block types
- Automatic total calculation (Quantity × Unit Price)
- Auto-create customers on first sale
- Multiple block type options (Standard, Hollow, Interlocking)

### 📉 Expense Tracking
- Categorize expenses (Cement, Labour, Fuel, Transport, Maintenance, Other)
- Track payment methods (Cash, Mobile Money, Bank Transfer)
- Detailed expense descriptions and amounts

### 📋 Reports & Analytics
- **Multi-type Filtering**: View All, Production, Sales, Expenses, or Activities
- **Date Range Filtering**: Filter records by custom date ranges
- **Advanced Search**: Full-text search across details and type fields
- **Column Sorting**: Click headers to sort by Date, Type, Details, or Amount
- **Smart Pagination**: Navigate through records efficiently
- **CSV Export**: Export current page or all matching records for external analysis

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- SQL Server (with BlockFactoryDB configured)
- Modern web browser

### Installation

1. **Navigate to project**
   ```bash
   cd BlockFactorySystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure `.env` file** (in project root)
   ```
   DB_SERVER=localhost
   DB_DATABASE=BlockFactoryDB
   DB_USER=nodeuser
   DB_PASSWORD=YourPassword
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Open in browser**
   - Navigate to: `http://localhost:3000/dashboard.html`

## 📁 Project Structure

```
BlockFactorySystem/
├── 📄 server.js              # Express REST API backend (~500 lines)
├── 📄 db.js                  # Database connection factory
├── 📄 script.js              # Shared client-side logic (~350 lines)
├── 🎨 style.css              # Professional CSS (~450 lines)
│
├── 🌐 HTML Pages:
│   ├── dashboard.html        # Main dashboard with charts
│   ├── production.html       # Production entry form
│   ├── sales.html            # Sales transaction form
│   ├── expenses.html         # Expense tracking form
│   └── reports.html          # Advanced reports interface
│
├── 📦 package.json           # Node dependencies
├── 🔐 .env                   # Environment configuration
└── 📖 README.md              # This file
```

## 🔧 Database Setup (SQL Server)

### 1. Enable TCP/IP Protocol

- Open **SQL Server Configuration Manager**
- Navigate to **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**
- Set **TCP/IP** to **Enabled**
- Right-click **TCP/IP** → **Properties**:
  - Set **TCP Port** to `1433` (in both IPAll and IP10)
- Restart SQL Server service

### 2. Enable Mixed Mode Authentication

- Open **SQL Server Management Studio**
- Right-click Server → **Properties** → **Security**
- Select **SQL Server and Windows Authentication mode**
- Restart SQL Server service

### 3. Create Database & User

Run in SQL Server:
```sql
CREATE DATABASE BlockFactoryDB;
GO
USE BlockFactoryDB;
GO
CREATE LOGIN nodeuser WITH PASSWORD = 'P@ssw0rd123!';
CREATE USER nodeuser FOR LOGIN nodeuser;
EXEC sp_addrolemember 'db_owner', 'nodeuser';
GO
```

## 📚 API Endpoints

### Data Entry
- `POST /production` - Add production record
- `POST /sales` - Add sales (auto-creates customer if needed)
- `POST /expenses` - Add expense

### Dashboard
- `GET /dashboard-summary` - Get profit metrics
- `GET /dashboard-activities` - Get 10 recent activities
- `GET /chart-sales` - Get 7-day sales chart data
- `GET /chart-expenses` - Get 7-day expenses chart data

### Reports (Advanced Filtering & Export)
```
GET /reports?type=all&page=1&pageSize=50&sort=Amount%20DESC&format=json
```

**Parameters:**
- `type`: all|production|sales|expenses|activities
- `dateFrom`: YYYY-MM-DD (optional)
- `dateTo`: YYYY-MM-DD (optional)
- `q`: Search text (optional)
- `page`: Page number (default: 1)
- `pageSize`: Records per page (default: 50)
- `sort`: "FieldName ASC/DESC" (default: DateCol DESC)
- `format`: json|csv (default: json)

## 💾 Database Schema

### Production
| Column | Type | Notes |
|--------|------|-------|
| ProductionDate | DATE | Required |
| BlockType | VARCHAR | Standard, Hollow, etc |
| QuantityProduced | INT | Blocks produced |
| CementBagsUsed | INT | Material tracking |
| Remarks | VARCHAR | Optional notes |

### Sales
| Column | Type | Notes |
|--------|------|-------|
| SaleDate | DATE | Required |
| CustomerName | VARCHAR | Auto-created if new |
| BlockType | VARCHAR | Hollow 5", Solid 6", etc |
| Quantity | INT | Blocks sold |
| UnitPrice | DECIMAL | Price per block |
| TotalAmount | DECIMAL | Auto-calculated |

### Expenses
| Column | Type | Notes |
|--------|------|-------|
| ExpenseDate | DATE | Required |
| ExpenseType | VARCHAR | Cement, Labour, Fuel, etc |
| Description | VARCHAR | Detailed info |
| Amount | DECIMAL | Cost amount |
| PaymentType | VARCHAR | Cash, Mobile Money, Bank |

## 🎨 Design Highlights

- **Professional Color Palette**: Navy blue (#0f172a), clean whites, accent blues
- **Responsive Layout**: Mobile-friendly with CSS Grid
- **Smooth Interactions**: Hover effects, transitions, visual feedback
- **Semantic Icons**: Emojis for quick visual identification
- **Professional Typography**: System fonts, proper hierarchy
- **Accessibility**: Proper labels, semantic HTML, keyboard support
- **Dark Mode Ready**: Foundation for future dark theme

## 🔐 Security Features

- **Parameterized SQL**: All queries use parameters (no injection risk)
- **Input Validation**: Both client and server-side validation
- **Error Handling**: Safe error messages without data exposure
- **CORS Configuration**: Proper cross-origin handling
- **Environment Variables**: Sensitive credentials in `.env`

## 📈 Performance Optimization

- **Server-Side Pagination**: Efficient database queries (OFFSET/FETCH)
- **Database Indexing**: Optimized for date range queries
- **Chart.js CDN**: Lightweight from CDN
- **CSS Grid**: Modern layout without frameworks
- **No External Dependencies**: Minimal client-side libraries

## 🧹 Daily Workflow

### Morning
1. Check Dashboard for overnight activity
2. Review recent sales and production
3. Note any anomalies or issues

### During Day
1. Record each production batch in Production form
2. Log sales as they occur in Sales form
3. Track expenses immediately in Expenses form

### End of Day
1. Export reports to CSV for backup/analysis
2. Review daily totals and profit
3. Check for data entry errors
4. Plan next day's production

## 📊 Reports Usage

### Filter by Type
- **All Records**: Complete data view
- **Production Only**: Focus on manufacturing
- **Sales Only**: Revenue analysis
- **Expenses Only**: Cost tracking
- **Activities**: Combined view with descriptions

### Sorting
- Click any column header to toggle sort direction
- Supported columns: Date, Type, Details, Amount
- Sort indicators (🔼/🔽) show current direction

### Export Options
- **Export Page**: Current page data only (respects current sort/filters)
- **Export All**: All matching records in one CSV file
- CSV format compatible with Excel, Google Sheets

### Search Tips
- Search across customer names, block types, descriptions
- Partial matches work (type "Hollow" to find "Hollow 5 Inch")
- Case-insensitive search

## 🐛 Troubleshooting

### "Failed to connect to database"
- Verify SQL Server is running: `services.msc`
- Check connection string in `.env`
- Verify TCP/IP is enabled on port 1433
- Confirm database `BlockFactoryDB` exists

### "Port 3000 already in use"
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Charts not appearing
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console (F12) for errors
- Verify Chart.js loads from CDN

### Data not showing in reports
- Check date range filters
- Clear search field if filtering
- Try "All Records" to see full data
- Refresh page

## 🔄 Maintenance

### Weekly
- Review reports for accuracy
- Backup database
- Check for errors in application logs

### Monthly
- Archive old data (optional)
- Review customer list for duplicates
- Reconcile totals with records

### Quarterly
- Analyze trend data
- Plan production based on sales history
- Update expense categories if needed

## 📝 Tips for Best Results

1. **Consistency**: Use same customer names every time
2. **Timeliness**: Record data immediately, not later
3. **Accuracy**: Double-check quantities and prices
4. **Backup**: Export reports regularly
5. **Monitoring**: Check dashboard daily
6. **Planning**: Use reports to forecast production needs

## 🚀 System Status

✅ **Production Ready**
- All core features functional
- Database optimized
- UI professional and responsive
- Error handling comprehensive
- Performance tested and approved

## 📞 Support

For issues:
1. Check error message in dialog or console
2. Verify database connectivity
3. Restart server if needed: `node server.js`
4. Review logs in terminal output
5. Check `.env` configuration

## 🎯 Future Enhancements

- [ ] Multi-user login & permissions
- [ ] Inventory management
- [ ] Invoice generation
- [ ] Mobile app
- [ ] Email notifications
- [ ] Advanced forecasting
- [ ] Multi-location support

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Status**: ✅ Production Ready  
**Made for**: Habib Blocks Factory

4. Verify connectivity
- From PowerShell on the server, check port and connection:

```powershell
netstat -ano | findstr ":1433"
Test-NetConnection -ComputerName localhost -Port 1433
```

- Test SQL auth (replace password as needed):

```powershell
sqlcmd -S DESKTOP-D0HM3E4 -U nodeuser -P 'P@ssw0rd123!' -Q "SELECT SUSER_SNAME()"
```

Running the app
---------------
Start the server (optionally set env vars for SQL auth):

```powershell
$env:DB_USER='nodeuser'
$env:DB_PASSWORD='P@ssw0rd123!'
node server.js
```

Notes
-----
- `db.js` is configured to try Windows Integrated auth via `msnodesqlv8` first (if the driver is available) and fall back to SQL auth using `DB_USER`/`DB_PASSWORD`.
- If you prefer Windows Integrated auth, run the Node process under a Windows account that has access to the database and install `msnodesqlv8`.

If you want, I can also create a `.env` example and update `package.json` scripts.
