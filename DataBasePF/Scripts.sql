-- Precios actuales (o más reciente) por activo
SELECT * FROM current_prices;

-- Acciones por activo del usuario
CALL get_current_shares(1402944639);

-- Resumen del portafolio del usuario
CALL get_portafolio_summary(1402944639);

-- Valor total del portafolio del usuario
SELECT get_portafolio_value(1402944639) AS "Total Portafolio Value";

-- Ganancia total del portafolio del usuario
SELECT get_portafolio_profit(1402944639) AS "Portafolio Profit";
