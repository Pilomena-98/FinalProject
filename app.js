import express from 'express';
import db from './db.js';

const app = express();
const port = 5000;

app.use(express.json());

// Servir archivos estáticos (frontend)
app.use(express.static('public'));

// ✅ Endpoint: devuelve el valor total del portafolio de un usuario
app.get('/api/portfolio/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
          s.ticker,
          SUM(
              CASE 
                  WHEN t.type = 'BUY' THEN t.quantity
                  WHEN t.type = 'SELL' THEN -t.quantity
                  ELSE 0
              END
          ) AS net_shares,
          MAX(mp.close) AS latest_price,
          SUM(
              CASE 
                  WHEN t.type = 'BUY' THEN t.quantity
                  WHEN t.type = 'SELL' THEN -t.quantity
                  ELSE 0
              END
          ) * MAX(mp.close) AS position_value
      FROM trades t
      JOIN stock s ON t.stock_Id = s.stock_Id
      JOIN market_prices mp ON t.stock_Id = mp.stock_Id
      WHERE t.user_Id = ?
      GROUP BY s.ticker;
    `, [userId]);

    // Calculamos el total del portafolio sumando todas las posiciones
    const totalValue = rows.reduce((sum, row) => sum + (row.position_value || 0), 0);

    res.json({ total: totalValue, positions: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener portafolio' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
