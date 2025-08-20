import express from 'express';
import db from './db.js';
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from 'bcryptjs';

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
        `SELECT user_Id, name, last_Name, passwords
        FROM user 
        WHERE email = ?
        LIMIT 1`,
      [email]
    );

    if (!results.length) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      //res.json({ success: true, user: results[0] });
    } 

    const user = results[0];

    if (!user.passwords.startsWith('$2b$')) {
    // contraseña vieja sin hash
    if (password !== user.passwords) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    // re-hash y actualiza en DB
    const newHash = await bcrypt.hash(password, 10);
    await db.query('UPDATE user SET passwords=? WHERE user_Id=?', [newHash, user.user_Id]);
    } else {
    const ok = await bcrypt.compare(password, user.passwords);
    if (!ok) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    delete user.passwords;
    res.json({ success: true, user });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { name, lastName, phone, email, age, gender, state, streetAddress, postalCode, city, country, password } = req.body;

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await db.query(
      'SELECT user_Id FROM user WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hashear la contraseña antes de guardarla
    const hashed = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const [result] = await db.query(
      `INSERT INTO user (name, last_Name, phone, email, age, gender, state, street_Address, postal_Code, city, country, passwords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, lastName, phone, email, age, gender, state, streetAddress, postalCode, city, country, hashed]
    );

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Database error during signup' });
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