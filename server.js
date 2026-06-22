const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB, sql } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize database tables on startup
async function initializeDatabase() {
    try {
        const pool = await connectDB();
        
        if (!pool) {
            console.warn("⚠️ Database connection unavailable, skipping table initialization");
            return;
        }

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Production')
            BEGIN
                CREATE TABLE Production (
                    ProductionID INT IDENTITY(1,1) PRIMARY KEY,
                    ProductionDate DATETIME NOT NULL,
                    CementBagsUsed INT NOT NULL,
                    BlockType NVARCHAR(100) NULL,
                    QuantityProduced INT NULL,
                    Remarks NVARCHAR(255) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Production table created successfully';
            END

            IF COL_LENGTH('Production', 'BlockType') IS NULL
            BEGIN
                ALTER TABLE Production ADD BlockType NVARCHAR(100) NULL;
            END

            IF COL_LENGTH('Production', 'QuantityProduced') IS NULL
            BEGIN
                ALTER TABLE Production ADD QuantityProduced INT NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales')
            BEGIN
                CREATE TABLE Sales (
                    SaleID INT IDENTITY(1,1) PRIMARY KEY,
                    SaleDate DATETIME NOT NULL,
                    CustomerName NVARCHAR(255) NOT NULL,
                    BlockType NVARCHAR(100) NOT NULL,
                    Quantity INT NOT NULL,
                    UnitPrice DECIMAL(18,2) NOT NULL,
                    TotalAmount DECIMAL(18,2) NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Sales table created successfully';
            END

            -- Ensure Sales has expected columns (for older DBs)
            IF COL_LENGTH('Sales', 'UnitPrice') IS NULL
            BEGIN
                ALTER TABLE Sales ADD UnitPrice DECIMAL(18,2) NOT NULL DEFAULT(0);
            END

            IF COL_LENGTH('Sales', 'TotalAmount') IS NULL
            BEGIN
                ALTER TABLE Sales ADD TotalAmount DECIMAL(18,2) NOT NULL DEFAULT(0);
            END
            IF COL_LENGTH('Sales', 'Quantity') IS NULL
            BEGIN
                ALTER TABLE Sales ADD Quantity INT NOT NULL DEFAULT(0);
            END

            IF COL_LENGTH('Sales', 'CustomerName') IS NULL
            BEGIN
                ALTER TABLE Sales ADD CustomerName NVARCHAR(255) NOT NULL DEFAULT('');
            END

            IF COL_LENGTH('Sales', 'BlockType') IS NULL
            BEGIN
                ALTER TABLE Sales ADD BlockType NVARCHAR(100) NOT NULL DEFAULT('Unknown');
            END

            IF COL_LENGTH('Sales', 'SaleDate') IS NULL
            BEGIN
                ALTER TABLE Sales ADD SaleDate DATETIME NOT NULL DEFAULT(GETDATE());
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
            BEGIN
                CREATE TABLE Expenses (
                    ExpenseID INT IDENTITY(1,1) PRIMARY KEY,
                    ExpenseDate DATETIME NOT NULL,
                    ExpenseType NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(255) NULL,
                    Amount DECIMAL(18,2) NOT NULL,
                    PaymentType NVARCHAR(100) NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Expenses table created successfully';
            END

            -- Ensure Expenses has expected columns (for older DBs)
            IF COL_LENGTH('Expenses', 'Amount') IS NULL
            BEGIN
                ALTER TABLE Expenses ADD Amount DECIMAL(18,2) NOT NULL DEFAULT(0);
            END

            IF COL_LENGTH('Expenses', 'PaymentType') IS NULL
            BEGIN
                ALTER TABLE Expenses ADD PaymentType NVARCHAR(100) NOT NULL DEFAULT('Unknown');
            END
        `);

        console.log("✅ Database initialized");
    } catch (err) {
        console.error("❌ Database initialization error:", err.message);
    }
}

app.get("/", (req, res) => {
    res.send("Block Factory API Running");
});

app.get("/test-db", async (req, res) => {
    try {
        await connectDB();
        res.send("Database Connected Successfully");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = 3000;

app.post("/production", async (req, res) => {
    try {
        console.log("📩 Received production data:", req.body);
        
        const { productionDate, cementBagsUsed, blockType, quantityProduced, remarks } = req.body;

        if (!productionDate || !cementBagsUsed || !blockType || !quantityProduced) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: productionDate, cementBagsUsed, blockType, quantityProduced"
            });
        }

        const pool = await connectDB();

        await pool.request()
            .input("productionDate", sql.DateTime, new Date(productionDate))
            .input("cementBagsUsed", sql.Int, parseInt(cementBagsUsed))
            .input("blockType", sql.NVarChar(100), blockType)
            .input("quantityProduced", sql.Int, parseInt(quantityProduced))
            .input("remarks", sql.NVarChar(255), remarks || null)
            .query(`
                INSERT INTO Production
                (ProductionDate, CementBagsUsed, BlockType, QuantityProduced, Remarks)
                VALUES
                (@productionDate, @cementBagsUsed, @blockType, @quantityProduced, @remarks)
            `);

        console.log("✅ Production inserted successfully");

        res.json({
            success: true,
            message: "Production saved successfully"
        });

    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.post("/sales", async (req, res) => {
    try {
        console.log("📩 Received sale data:", req.body);

        const { saleDate, customerName, blockType, quantity, unitPrice, totalAmount } = req.body;

        if (!saleDate || !customerName || !blockType || !quantity || !unitPrice || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required sale fields"
            });
        }

        const pool = await connectDB();

        // Ensure customer exists (create if necessary) and obtain CustomerID
        const customerResult = await pool.request()
            .input("customerName", sql.NVarChar(255), customerName)
            .query(`SELECT TOP 1 CustomerID FROM Customers WHERE CustomerName = @customerName`);

        let customerId = null;
        if (customerResult.recordset && customerResult.recordset.length > 0) {
            customerId = customerResult.recordset[0].CustomerID;
        } else {
            const insertCustomer = await pool.request()
                .input("customerName", sql.NVarChar(255), customerName)
                .query(`INSERT INTO Customers (CustomerName) VALUES (@customerName); SELECT SCOPE_IDENTITY() AS CustomerID;`);
            customerId = insertCustomer.recordset[0].CustomerID;
        }

        await pool.request()
            .input("saleDate", sql.DateTime, new Date(saleDate))
            .input("customerId", sql.Int, parseInt(customerId))
            .input("customerName", sql.NVarChar(255), customerName)
            .input("blockType", sql.NVarChar(100), blockType)
            .input("quantity", sql.Int, parseInt(quantity))
            .input("unitPrice", sql.Decimal(18,2), parseFloat(unitPrice))
            .input("totalAmount", sql.Decimal(18,2), parseFloat(totalAmount))
            .query(`
                INSERT INTO Sales
                (SaleDate, CustomerID, CustomerName, BlockType, Quantity, UnitPrice, TotalAmount)
                VALUES
                (@saleDate, @customerId, @customerName, @blockType, @quantity, @unitPrice, @totalAmount)
            `);

        console.log("✅ Sale inserted successfully for CustomerID:", customerId);
        res.json({ success: true, message: "Sale saved successfully" });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/expenses", async (req, res) => {
    try {
        console.log("📩 Received expense data:", req.body);

        const { expenseDate, expenseType, description, amount, paymentType } = req.body;

        if (!expenseDate || !expenseType || !amount || !paymentType) {
            return res.status(400).json({
                success: false,
                message: "Missing required expense fields"
            });
        }

        const pool = await connectDB();

        await pool.request()
            .input("expenseDate", sql.DateTime, new Date(expenseDate))
            .input("expenseType", sql.NVarChar(100), expenseType)
            .input("description", sql.NVarChar(255), description || null)
            .input("amount", sql.Decimal(18,2), parseFloat(amount))
            .input("paymentType", sql.NVarChar(100), paymentType)
            .query(`
                INSERT INTO Expenses
                (ExpenseDate, ExpenseType, Description, Amount, PaymentType)
                VALUES
                (@expenseDate, @expenseType, @description, @amount, @paymentType)
            `);

        console.log("✅ Expense inserted successfully");
        res.json({ success: true, message: "Expense saved successfully" });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/dashboard-summary", async (req, res) => {
    try {
        const pool = await connectDB();

        const [productionResult, salesResult, expensesResult] = await Promise.all([
            pool.request().query(`SELECT COUNT(*) AS ProductionCount, ISNULL(SUM(QuantityProduced), 0) AS TotalProduced FROM Production`),
            pool.request().query(`SELECT ISNULL(SUM(TotalAmount), 0) AS TotalSales FROM Sales`),
            pool.request().query(`SELECT ISNULL(SUM(Amount), 0) AS TotalExpenses FROM Expenses`)
        ]);

        const productionCount = productionResult.recordset[0].ProductionCount;
        const totalSales = parseFloat(salesResult.recordset[0].TotalSales || 0);
        const totalExpenses = parseFloat(expensesResult.recordset[0].TotalExpenses || 0);
        const profit = totalSales - totalExpenses;

        res.json({ productionCount, totalSales, totalExpenses, profit });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/dashboard-activities", async (req, res) => {
    try {
        const pool = await connectDB();

        const [salesRows, expensesRows, productionRows] = await Promise.all([
            pool.request().query(`
                SELECT SaleDate AS ActivityDate,
                       CONCAT('Sale: ', Quantity, ' ', BlockType, ' blocks to ', CustomerName) AS Activity,
                       TotalAmount AS Amount
                FROM Sales
                ORDER BY SaleDate DESC
                OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
            `),
            pool.request().query(`
                SELECT ExpenseDate AS ActivityDate,
                       CONCAT('Expense: ', ExpenseType, ' - ', ISNULL(Description,'')) AS Activity,
                       Amount AS Amount
                FROM Expenses
                ORDER BY ExpenseDate DESC
                OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
            `),
            pool.request().query(`
                SELECT ProductionDate AS ActivityDate,
                       CONCAT('Produced ', QuantityProduced, ' ', BlockType, ' blocks') AS Activity,
                       NULL AS Amount
                FROM Production
                ORDER BY ProductionDate DESC
                OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
            `)
        ]);

        const activities = [...salesRows.recordset, ...expensesRows.recordset, ...productionRows.recordset]
            .sort((a, b) => new Date(b.ActivityDate) - new Date(a.ActivityDate))
            .slice(0, 10);

        res.json({ activities });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/chart-sales", async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT CONVERT(varchar(10), SaleDate, 120) AS Day,
                   SUM(TotalAmount) AS TotalSales
            FROM Sales
            WHERE SaleDate >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
            GROUP BY CONVERT(varchar(10), SaleDate, 120)
            ORDER BY Day
        `);
        res.json({ data: result.recordset });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/chart-expenses", async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT CONVERT(varchar(10), ExpenseDate, 120) AS Day,
                   SUM(Amount) AS TotalExpenses
            FROM Expenses
            WHERE ExpenseDate >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
            GROUP BY CONVERT(varchar(10), ExpenseDate, 120)
            ORDER BY Day
        `);
        res.json({ data: result.recordset });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Reports endpoint (JSON or CSV)
app.get('/reports', async (req, res) => {
    try {
        const pool = await connectDB();
        const type = (req.query.type || 'all').toLowerCase();
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const q = req.query.q || '';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(200, parseInt(req.query.pageSize) || 50);
        const format = (req.query.format || '').toLowerCase();
        const sort = req.query.sort || 'DateCol DESC';
        const offset = (page - 1) * pageSize;

        // Parse sort: format is "fieldName ASC/DESC" or "fieldName"
        let sortClause = 'DateCol DESC';
        if (sort) {
            const parts = sort.trim().split(/\s+/);
            const field = parts[0];
            const direction = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            // Whitelist fields to prevent injection
            const allowedFields = ['DateCol', 'TypeText', 'Details', 'Amount'];
            if (allowedFields.includes(field)) {
                sortClause = field + ' ' + direction;
            }
        }

        // Build queries per type
        let baseQuery = '';

        if (type === 'sales' || type === 'all') {
            const qSales = `SELECT SaleDate AS DateCol, 'Sale' AS TypeText, CONCAT(CustomerName, ' | ', BlockType, ' x', Quantity) AS Details, TotalAmount AS Amount FROM Sales WHERE 1=1`;
            baseQuery += (baseQuery ? '\nUNION ALL\n' : '') + qSales;
        }
        if (type === 'expenses' || type === 'all') {
            const qExp = `SELECT ExpenseDate AS DateCol, 'Expense' AS TypeText, CONCAT(ExpenseType, ' - ', ISNULL(Description,'')) AS Details, Amount AS Amount FROM Expenses WHERE 1=1`;
            baseQuery += (baseQuery ? '\nUNION ALL\n' : '') + qExp;
        }
        if (type === 'production' || type === 'all') {
            const qProd = `SELECT ProductionDate AS DateCol, 'Production' AS TypeText, CONCAT(QuantityProduced, ' x ', ISNULL(BlockType,'')) AS Details, NULL AS Amount FROM Production WHERE 1=1`;
            baseQuery += (baseQuery ? '\nUNION ALL\n' : '') + qProd;
        }
        if (type === 'activities') {
            baseQuery = `
                SELECT SaleDate AS DateCol, 'Sale' AS TypeText, CONCAT('Sale: ', Quantity, ' ', BlockType, ' to ', CustomerName) AS Details, TotalAmount AS Amount FROM Sales
                UNION ALL
                SELECT ExpenseDate AS DateCol, 'Expense' AS TypeText, CONCAT('Expense: ', ExpenseType, ' - ', ISNULL(Description,'')) AS Details, Amount AS Amount FROM Expenses
                UNION ALL
                SELECT ProductionDate AS DateCol, 'Production' AS TypeText, CONCAT('Produced ', QuantityProduced, ' ', ISNULL(BlockType,'')) AS Details, NULL AS Amount FROM Production`;
        }

        if (!baseQuery) return res.json({ rows: [], total: 0, page, pageSize });

        // Final paged query with filters and sorting
        const pagedQuery = `SELECT * FROM (\n${baseQuery}\n) t WHERE 1=1 ${dateFrom ? "AND CAST(DateCol AS DATE) >= @dateFrom" : ""} ${dateTo ? "AND CAST(DateCol AS DATE) <= @dateTo" : ""} ${q ? "AND (Details LIKE '%' + @q + '%' OR TypeText LIKE '%' + @q + '%')" : ""} ORDER BY ${sortClause} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;

        // Count total matching records
        let total = 0;
        const countQuery = `SELECT COUNT(*) AS cnt FROM (\n${baseQuery}\n) t WHERE 1=1 ${dateFrom ? "AND CAST(DateCol AS DATE) >= @dateFrom" : ""} ${dateTo ? "AND CAST(DateCol AS DATE) <= @dateTo" : ""} ${q ? "AND (Details LIKE '%' + @q + '%' OR TypeText LIKE '%' + @q + '%')" : ""}`;

        const reqCount = pool.request();
        if (dateFrom) reqCount.input('dateFrom', sql.Date, dateFrom);
        if (dateTo) reqCount.input('dateTo', sql.Date, dateTo);
        if (q) reqCount.input('q', sql.NVarChar(200), q);
        const countRes = await reqCount.query(countQuery);
        total = countRes.recordset[0].cnt || 0;

        // Execute paged query
        const reqData = pool.request();
        if (dateFrom) reqData.input('dateFrom', sql.Date, dateFrom);
        if (dateTo) reqData.input('dateTo', sql.Date, dateTo);
        if (q) reqData.input('q', sql.NVarChar(200), q);
        const result = await reqData.query(pagedQuery);
        const rows = result.recordset || [];

        if (format === 'csv' || req.query.format === 'csv') {
            // convert rows to CSV
            const keys = rows.length ? Object.keys(rows[0]) : ['DateCol','TypeText','Details','Amount'];
            const csvLines = [keys.join(',')];
            for (const r of rows) {
                csvLines.push(keys.map(k => {
                    const v = r[k] === null || r[k] === undefined ? '' : String(r[k]).replace(/"/g, '""');
                    return '"' + v + '"';
                }).join(','));
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=reports_${type || 'all'}.csv`);
            return res.send(csvLines.join('\n'));
        }

        res.json({ rows, total, page, pageSize });
    } catch (err) {
        console.error('❌ Reports error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabase();
});