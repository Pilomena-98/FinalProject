ALTER TABLE stock ADD COLUMN sector VARCHAR(255);

UPDATE stock SET sector = 'Technology' WHERE ticker = 'AAPL';
UPDATE stock SET sector = 'Consumer Discretionary' WHERE ticker = 'AMZN';
UPDATE stock SET sector = 'Financials' WHERE ticker = 'BAC';
UPDATE stock SET sector = 'Technology' WHERE ticker = 'GOOG';
UPDATE stock SET sector = 'Financials' WHERE ticker = 'JPM';
UPDATE stock SET sector = 'Communication Services' WHERE ticker = 'META';
UPDATE stock SET sector = 'Technology' WHERE ticker = 'MSFT';
UPDATE stock SET sector = 'Communication Services' WHERE ticker = 'NFLX';
UPDATE stock SET sector = 'Technology' WHERE ticker = 'NVDA';
UPDATE stock SET sector = 'Consumer Discretionary' WHERE ticker = 'TSLA';