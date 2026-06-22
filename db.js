require("dotenv").config();
const sql = require("mssql");

// Try Windows (Integrated) auth via msnodesqlv8 driver first,
// then fall back to SQL auth using environment variables.
const serverName = process.env.DB_SERVER || "DESKTOP-D0HM3E4";
const databaseName = process.env.DB_DATABASE || "BlockFactoryDB";

const windowsConfig = {
    driver: "msnodesqlv8",
    server: serverName,
    database: databaseName,
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

const sqlAuthConfig = {
    server: serverName,
    database: databaseName,
    user: process.env.DB_USER || process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    options: {
        trustServerCertificate: true,
        encrypt: false,
        connectTimeout: 15000
    }
};

let pool = null;

async function connectDB() {
    try {
        if (pool) return pool;

        // First attempt: Windows integrated using msnodesqlv8
        try {
            console.log("Trying Windows Integrated authentication (msnodesqlv8)...");
            pool = await sql.connect(windowsConfig);
            console.log("✅ Connected to SQL Server using Windows authentication (msnodesqlv8)");
            return pool;
        } catch (winErr) {
            console.warn("⚠️ Windows auth failed:", winErr.message);
            // Fall through to SQL auth attempt
        }

        // Second attempt: SQL Server authentication (user/password)
        if (!sqlAuthConfig.user) {
            throw new Error("No SQL credentials provided. Set DB_USER and DB_PASSWORD environment variables or enable Windows auth with the msnodesqlv8 driver installed.");
        }

        console.log("Trying SQL authentication with user:", sqlAuthConfig.user);
        pool = await sql.connect(sqlAuthConfig);
        console.log("✅ Connected to SQL Server using SQL authentication");
        return pool;

    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        console.error("Ensure SQL Server is running and credentials are correct. Server:", serverName);
        throw err;
    }
}

module.exports = { sql, connectDB };