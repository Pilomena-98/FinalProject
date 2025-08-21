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
      // ADMIN
      const isAdmin = (email === 'cocodev@sasalele.ejp' && password === 'sal3sal3!');
      if(isAdmin){
      res.json({ 
        success: true, 
        user: user,
        isAdmin: isAdmin
      });
    }else {

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
    }
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

      const [gainRows] = await db.query(`
        SELECT get_portafolio_profit(?) AS "Portfolio_Profit";
      `, [userId]);
      const gain = gainRows?.[0]?.Portfolio_Profit ?? 0;

      res.json({ total, gain});
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al calcular el valor del portafolio' });
    }
  });

// 🔹 Historial del portafolio por usuario
app.get('/api/portfolio-history/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  try {
    // CALL devuelve un arreglo de result sets; el primero es el SELECT del SP
    const [resultSets] = await db.query('CALL get_portafolio_history(?);', [userId]);
    const rows = Array.isArray(resultSets) ? resultSets[0] : resultSets;

    // Normalizamos tipos: fecha como string ISO (yyyy-mm-dd) y valor como número
    const data = rows.map(r => ({
      date:
        r.price_Date instanceof Date
          ? r.price_Date.toISOString().slice(0, 10)
          : String(r.price_Date),              // si ya viene como string
      value: Number(r.portafolio_value) || 0
    }));

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener el historial' });
  }
});

// 🔹 Acciones actuales del usuario
app.get('/api/current-shares/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  try {
    const [resultSets] = await db.query('CALL get_current_shares(?);', [userId]);
    const rows = Array.isArray(resultSets) ? resultSets[0] : resultSets;

    const data = rows.map(r => ({
      ticker: r.ticker,
      current_shares: Number(r.current_shares) || 0
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo obtener acciones actuales' });
  }
});

// 🔹 Resumen del portafolio del usuario
app.get('/api/portfolio-summary/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  try {
    const [resultSets] = await db.query('CALL get_portafolio_summary(?);', [userId]);
    const rows = Array.isArray(resultSets) ? resultSets[0] : resultSets;

    // Normalizamos claves y nos aseguramos de que los numéricos sean Number
    const data = rows.map(r => ({
      ticker: r.Ticker,
      enterprise: r.Enterprise,
      currentShares: Number(r['Current Shares']) || 0,
      meanCost: Number(r['Mean Cost']) || 0,
      currentPrice: Number(r['Current Price']) || 0,
      marketValue: Number(r['Market Value']) || 0,
      profitLoss: Number(r['Profit Loss']) || 0,
      profitLossPct: Number(r['% Profit Loss']) || 0
    }));

    return res.json({ rows: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo obtener el resumen' });
  }
});

// 🔹 Precio de una acción específica
app.get('/api/stock-price/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT mp.open, mp.price_Date
      FROM market_prices mp
      JOIN stock s ON s.stock_Id = mp.stock_Id
      WHERE s.ticker = ?
      ORDER BY mp.price_Date DESC
      LIMIT 1
    `, [ticker]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró precio para el ticker ' + ticker });
    }

    return res.json(rows[0]); // { price: 123.45, price_date: '2025-08-20' }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo precio de mercado' });
  }
});

// 🔹 insertar trades
app.post('/api/trades', async (req, res) => {
  try {
    const { userId, ticker, type, quantity } = req.body;

    if (!userId || !ticker || !type || !quantity) {
      return res.status(400).json({ error: 'Faltan campos: userId, ticker, type, quantity' });
    }
    const qty = parseInt(quantity, 10);
    const typeUp = String(type).toLowerCase();
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }
    if (!['buy', 'sell'].includes(typeUp)) {
      return res.status(400).json({ error: 'Tipo inválido (usa BUY o SELL)' });
    }

    // 1) stock_Id por ticker
    const [stockRows] = await db.query(
      'SELECT stock_Id FROM stock WHERE ticker = ? LIMIT 1',
      [ticker]
    );
    if (!stockRows.length) {
      return res.status(404).json({ error: `No existe el ticker ${ticker}` });
    }
    const stockId = stockRows[0].stock_Id;

    // 2) Si SELL, validar acciones netas disponibles
    if (typeUp === 'sell') {
      const [posRows] = await db.query(
        `SELECT COALESCE(SUM(CASE WHEN type='buy' THEN quantity
                                  WHEN type='sell' THEN -quantity
                                  ELSE 0 END), 0) AS net_shares
         FROM trades
         WHERE user_Id = ? AND stock_Id = ?`,
        [userId, stockId]
      );
      const netShares = Number(posRows[0]?.net_shares || 0);
      if (qty > netShares) {
        return res.status(400).json({
          error: `No tienes suficientes acciones para vender. Disponibles: ${netShares}`
        });
      }
    }

    // 3) Obtener último precio (usa la columna correcta; aquí 'close')
    const [priceRows] = await db.query(
      `SELECT mp.open AS price
       FROM market_prices mp
       WHERE mp.stock_Id = ?
       ORDER BY mp.price_Date DESC
       LIMIT 1`,
      [stockId]
    );
    if (!priceRows.length) {
      return res.status(400).json({ error: 'No hay precio reciente para este ticker' });
    }
    const price = Number(priceRows[0].price);
    if (!Number.isFinite(price)) {
      return res.status(400).json({ error: 'Precio inválido' });
    }

    // 4) Calcular amount (positivo; el tipo indica compra/venta)
    const amount = +(price * qty).toFixed(2);

    // 5) Insertar trade con amount
    const [ins] = await db.query(
      `INSERT INTO trades (trade_Id, user_Id, date, time, type, quantity, stock_Id, amount)
       VALUES (UUID(), ?, CURDATE(), CURTIME(), ?, ?, ?, ?)`,
      [userId, typeUp, qty, stockId, amount]
    );

    return res.json({
      success: true,
      tradeId: ins.insertId ?? null,
      userId,
      ticker,
      type: typeUp,
      quantity: qty,
      price,
      amount
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudo guardar el trade' });
  }
});

// obtener usuario por ID
app.get('/api/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  try {
    const [rows] = await db.query(
      `SELECT user_Id, name, last_Name, email, phone
       FROM user WHERE user_Id = ? LIMIT 1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true, user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

// actualizar usuario por ID
app.put('/api/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  const { name, last_Name, email, phone } = req.body;
  if (!name || !last_Name || !email) {
    return res.status(400).json({ error: 'name, last_Name y email son obligatorios' });
  }

  try {
    // opcional: verificar duplicado de email en otro usuario
    const [dups] = await db.query(
      'SELECT user_Id FROM user WHERE email = ? AND user_Id <> ? LIMIT 1',
      [email, userId]
    );
    if (dups.length) return res.status(409).json({ error: 'El email ya está en uso' });

    await db.query(
      `UPDATE user
         SET name = ?, last_Name = ?, email = ?, phone = ?
       WHERE user_Id = ?`,
      [name, last_Name, email, phone || '', userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
});

// PUT /api/user/:userId/password
app.put('/api/user/:userId/password', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Faltan contraseñas' });
  }

  try {
    const [rows] = await db.query(
      'SELECT passwords FROM user WHERE user_Id = ? LIMIT 1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const hash = rows[0].passwords;
    if (!hash.startsWith('$2b$')) {
      // contraseña vieja sin hash
      if (currentPassword != hash) {
        return res.status(401).json({ success: false, error: `la constraseña actual no es correcta ${currentPassword} y ${hash}` });
      } 
    }else { 
      const ok = await bcrypt.compare(currentPassword, hash);
      if (!ok) return res.status(401).json({ error: 'la constraseña actual no es correcta' });
    }
    // re-hash y actualizar en DB
      const newHash = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE user SET passwords = ? WHERE user_Id = ?',
        [newHash, userId]
      );

      res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar la contraseña' });
  }
});

// Borrar cuenta de usuario
app.delete('/api/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId inválido' });

  try {
    const [result] = await db.query('DELETE FROM user WHERE user_Id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error borrando cuenta:', e);
    return res.status(500).json({ error: 'No se pudo eliminar la cuenta' });
  }
})

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});