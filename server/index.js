const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');

const app = express();
const port = Number(process.env.API_PORT || 4000);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imagenes JPG, PNG, WEBP o GIF.'));
    }

    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      ok: true,
      database: process.env.DB_NAME || 'tienda_artesanias',
      message: 'Conexion a MySQL correcta',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'No se pudo conectar a MySQL',
      error: error.message,
    });
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url,
        p.categoria_id,
        p.creado_en,
        c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ORDER BY p.creado_en DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'No se pudieron obtener los productos. Verifica que exista la tabla productos.',
      error: error.message,
    });
  }
});

app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, descripcion FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'No se pudieron obtener las categorias.',
      error: error.message,
    });
  }
});

app.post('/api/productos/:id/imagen', upload.single('imagen'), async (req, res) => {
  const productId = Number(req.params.id);

  if (!req.file) {
    return res.status(400).json({
      ok: false,
      message: 'Debes seleccionar una imagen.',
    });
  }

  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    const [result] = await db.query('UPDATE productos SET imagen_url = ? WHERE id = ?', [
      imageUrl,
      productId,
    ]);

    if (result.affectedRows === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({
        ok: false,
        message: 'Producto no encontrado.',
      });
    }

    res.json({
      ok: true,
      imageUrl,
      message: 'Imagen actualizada correctamente.',
    });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({
      ok: false,
      message: 'No se pudo guardar la imagen.',
      error: error.message,
    });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { cliente, items } = req.body;

  if (!cliente?.nombre || !cliente?.email || !items?.length) {
    return res.status(400).json({
      ok: false,
      message: 'Faltan datos del cliente o productos en el carrito.',
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
        INSERT INTO usuarios (nombre, email, contrasena, direccion, telefono)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          direccion = VALUES(direccion),
          telefono = VALUES(telefono)
      `,
      [
        cliente.nombre,
        cliente.email,
        'cliente_temporal',
        cliente.direccion || '',
        cliente.telefono || '',
      ]
    );

    const [[usuario]] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [
      cliente.email,
    ]);

    const productIds = items.map((item) => item.id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, nombre, precio, stock FROM productos WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    const productsById = new Map(products.map((product) => [product.id, product]));
    let total = 0;
    const detailRows = [];

    for (const item of items) {
      const product = productsById.get(item.id);
      const quantity = Number(item.cantidad || 1);

      if (!product) {
        throw new Error(`El producto con ID ${item.id} no existe.`);
      }

      if (quantity < 1 || quantity > product.stock) {
        throw new Error(`Stock insuficiente para ${product.nombre}.`);
      }

      total += Number(product.precio) * quantity;
      detailRows.push([item.id, quantity, product.precio]);
    }

    const [pedidoResult] = await connection.query(
      'INSERT INTO pedidos (usuario_id, total, direccion_envio) VALUES (?, ?, ?)',
      [usuario.id, total, cliente.direccion || '']
    );

    for (const [productId, quantity, unitPrice] of detailRows) {
      await connection.query(
        'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedidoResult.insertId, productId, quantity, unitPrice]
      );
      await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [
        quantity,
        productId,
      ]);
    }

    await connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuario.id]);
    await connection.commit();

    res.status(201).json({
      ok: true,
      pedidoId: pedidoResult.insertId,
      total,
      message: 'Pedido registrado correctamente.',
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo registrar el pedido.',
    });
  } finally {
    connection.release();
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message.includes('Solo se permiten')) {
    return res.status(400).json({
      ok: false,
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no debe superar los 3 MB.'
          : error.message,
    });
  }

  next(error);
});

app.listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`);
});
