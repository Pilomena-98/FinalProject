import express from 'express';
import db from './db.js';
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos (frontend)
app.use(express.static('public'));

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [results] = await db.query(
      'SELECT * FROM user WHERE email = ? AND passwords = ?',
      [email, password]
    );

    if (results.length > 0) {
      res.json({ success: true, user: results[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

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
