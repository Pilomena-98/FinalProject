-- Precios actuales (o más reciente) por activo
SELECT * FROM current_prices;

-- Acciones por activo del usuario
CALL get_current_shares(1402944639); -- grafica

-- Resumen del portafolio del usuario
CALL get_portafolio_summary(1402944639);

-- Valor total del portafolio del usuario
SELECT get_portafolio_value(1402944639) AS "Total Portafolio Value";

-- Ganancia total NO REALIZADA del portafolio del usuario
SELECT get_portafolio_future_profit(1402944639) AS "Portafolio Profit";

-- Ganancia total REALIZADA del portafolio del usuario
SELECT get_portafolio_past_profit(1402944639) AS "Portafolio Profit";

-- Hisotrial del valor del portafolio del usuario
CALL get_portafolio_history(1402944639);

-- Historial de compra/venta de acciones del usuario
CALL get_purchase_sale_history(1402944639, "buy");
