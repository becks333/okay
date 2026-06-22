-- Create BlockFactoryDB database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BlockFactoryDB')
BEGIN
    CREATE DATABASE BlockFactoryDB;
END

USE BlockFactoryDB;

-- Create Production table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Production')
BEGIN
    CREATE TABLE Production (
        ProductionID INT IDENTITY(1,1) PRIMARY KEY,
        ProductionDate DATETIME NOT NULL,
        CementBagsUsed INT NOT NULL,
        Remarks NVARCHAR(255) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Verify table was created
SELECT * FROM Production;
