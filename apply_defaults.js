require('dotenv').config();
const sql = require('mssql');

(async () => {
  try {
    const cfg = {
      server: process.env.DB_SERVER || 'DESKTOP-D0HM3E4',
      database: process.env.DB_DATABASE || 'BlockFactoryDB',
      user: process.env.DB_USER || process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      options: { trustServerCertificate: true, encrypt: false }
    };

    const pool = await sql.connect(cfg);
    const query = `
      IF NOT EXISTS (
        SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('Sales') AND name = 'DF_Sales_CustomerID'
      )
      BEGIN
        ALTER TABLE Sales ADD CONSTRAINT DF_Sales_CustomerID DEFAULT (0) FOR CustomerID;
      END
    `;

    await pool.request().query(query);
    console.log('Default constraint ensured for Sales.CustomerID');
    await pool.close();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
