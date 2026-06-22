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
    const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Sales'");
    console.log(JSON.stringify(res.recordset, null, 2));
    await pool.close();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
