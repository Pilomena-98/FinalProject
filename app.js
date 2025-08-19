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
        `SELECT user_Id, name, last_Name 
        FROM user 
        WHERE email = ? AND passwords = ? 
        LIMIT 1`,
      [email, password]
    );

    if (results.length > 0) {
      res.json({ success: true, user: results[0] });
      //const user = results[0];
    // Puedes incluir más campos si quieres mostrarlos en el dashboard
        //res.json({ userId: user.user_Id, name: user.name, lastName: user.last_Name });
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
        SELECT get_portafolio_value(?) AS portfolio_total;
      `, [userId]);
  
      const total = rows?.[0]?.portfolio_total ?? 0;
      res.json({ total });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al calcular el valor del portafolio' });
    }
  });

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
