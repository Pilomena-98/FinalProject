-- Crear procedimiento almacenado para obtener las acciones por activo de un usuario
DELIMITER $$

CREATE PROCEDURE get_current_shares(IN user_id BIGINT)
BEGIN
	SELECT
		s.ticker,
		s.stock_Name,
		SUM(CASE WHEN t.type = 'buy' THEN t.quantity
				 WHEN t.type = 'sell' THEN -t.quantity
				 ELSE 0 END) AS current_shares
	FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
	WHERE t.user_id = user_id -- id a buscar
	GROUP BY s.ticker, s.stock_Name;
END$$

DELIMITER ;

-- Crear vista para obtener los precios actuales (o más reciente) por activo
CREATE VIEW current_prices AS
SELECT
	s.ticker,
    s.stock_Name,
	max_p.open,
    max_p.high,
    max_p.low,
    max_p.close
FROM (
	SELECT * FROM market_prices
    WHERE price_Date = (SELECT MAX(price_Date) FROM market_prices)
    ) max_p JOIN stock s
    ON max_p.stock_Id = s.stock_Id;

-- Crear procedimiento almacenado para obtener el resumen del portafolio de un usuario
DELIMITER $$

CREATE PROCEDURE get_portafolio_summary(IN user_id BIGINT)
BEGIN
    SELECT
	tr.ticker AS "Ticker",
    tr.stock_Name AS "Enterprise",
    cs.current_shares AS "Current Shares",
	ROUND((total_amount_purchased - total_amount_sold) / cs.current_shares, 2) AS "Mean Cost",
    cp.close AS "Current Price",
    cs.current_shares * cp.close AS "Market Value",
    (cp.close * cs.current_shares) - (total_amount_purchased - total_amount_sold) AS "Profit Loss",
    ROUND(((cp.close / ((total_amount_purchased - total_amount_sold) / cs.current_shares)) - 1) * 100, 2) AS "% Profit Loss"
	FROM
		(
		SELECT
		s.ticker,
		s.stock_Name,
		SUM(CASE WHEN t.type = 'buy' THEN t.quantity
				 WHEN t.type = 'sell' THEN -t.quantity
				 ELSE 0 END) AS current_shares
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) cs JOIN 
		(
		SELECT
			s.ticker,
			s.stock_Name,
			SUM(CASE WHEN t.type = 'buy' THEN amount ELSE 0 END) AS total_amount_purchased,
			SUM(CASE WHEN t.type = 'sell' THEN amount ELSE 0 END) AS total_amount_sold
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) tr
	ON cs.ticker = tr.ticker JOIN current_prices cp ON tr.ticker = cp.ticker
	WHERE cs.current_shares > 0;
END$$

DELIMITER ;

-- Crear función para obtener el valor total del portafolio de un usuario
DELIMITER $$

CREATE FUNCTION get_portafolio_value(user_id BIGINT)
RETURNS DECIMAL(8,2)
DETERMINISTIC
BEGIN
    DECLARE portafolio_value DECIMAL(8,2);
    SELECT
    SUM(cs.current_shares * cp.close) INTO portafolio_value
	FROM
		(
		SELECT
		s.ticker,
		s.stock_Name,
		SUM(CASE WHEN t.type = 'buy' THEN t.quantity
				 WHEN t.type = 'sell' THEN -t.quantity
				 ELSE 0 END) AS current_shares
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_Id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) cs JOIN 
		(
		SELECT
			s.ticker,
			s.stock_Name,
			SUM(CASE WHEN t.type = 'buy' THEN amount ELSE 0 END) AS total_amount_purchased,
			SUM(CASE WHEN t.type = 'sell' THEN amount ELSE 0 END) AS total_amount_sold
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_Id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) tr
	ON cs.ticker = tr.ticker JOIN current_prices cp ON tr.ticker = cp.ticker
	WHERE cs.current_shares > 0;
	RETURN portafolio_value;
END$$

DELIMITER ;

-- Crear función para obtener la ganancia total del portafolio de un usuario
DELIMITER $$

CREATE FUNCTION get_portafolio_profit(user_id BIGINT)
RETURNS DECIMAL(8,2)
DETERMINISTIC
BEGIN
    DECLARE portafolio_profit DECIMAL(8,2);
    SELECT
    SUM((cp.close * cs.current_shares) - (total_amount_purchased - total_amount_sold)) INTO portafolio_profit
	FROM
		(
		SELECT
		s.ticker,
		s.stock_Name,
		SUM(CASE WHEN t.type = 'buy' THEN t.quantity
				 WHEN t.type = 'sell' THEN -t.quantity
				 ELSE 0 END) AS current_shares
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_Id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) cs JOIN 
		(
		SELECT
			s.ticker,
			s.stock_Name,
			SUM(CASE WHEN t.type = 'buy' THEN amount ELSE 0 END) AS total_amount_purchased,
			SUM(CASE WHEN t.type = 'sell' THEN amount ELSE 0 END) AS total_amount_sold
		FROM trades t JOIN stock s ON t.stock_Id = s.stock_Id
		WHERE t.user_Id = user_id -- id a buscar
		GROUP BY s.ticker, s.stock_Name
		) tr
	ON cs.ticker = tr.ticker JOIN current_prices cp ON tr.ticker = cp.ticker
	WHERE cs.current_shares > 0;
	RETURN portafolio_profit;
END$$

DELIMITER ;