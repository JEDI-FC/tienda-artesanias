# Tienda de Artesanias

Aplicativo web simple para una tienda de artesanias. Incluye catalogo de productos, filtro por categorias, carrito de compras, registro de pedidos y carga local de imagenes para productos.

## Tecnologias

- React con Create React App
- Express
- MySQL con `mysql2`
- Multer para subida de imagenes
- Laragon como entorno local

## Funcionalidades

- Listado de productos desde MySQL.
- Filtro por categoria y busqueda por texto.
- Carrito con control de cantidades.
- Registro de cliente y pedido.
- Descuento de stock al confirmar compra.
- Subida de imagenes a la carpeta `uploads`.
- Visualizacion de imagenes mediante rutas guardadas en `productos.imagen_url`.

## Requisitos

- Node.js
- npm
- Laragon con MySQL activo
- Base de datos local llamada `tienda_artesanias`

## Instalacion

Clona el repositorio e instala dependencias:

```bash
npm install
```

Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

En Windows PowerShell tambien puedes hacerlo asi:

```powershell
Copy-Item .env.example .env
```

Configura `.env` segun tu entorno local:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tienda_artesanias
API_PORT=4000
```

En Laragon, por defecto el usuario suele ser `root` y la contrasena suele estar vacia.

## Base de datos

Crea la base de datos:

```sql
CREATE DATABASE tienda_artesanias;
USE tienda_artesanias;
```

Crea las tablas:

```sql
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(500),
    categoria_id INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','pagado','enviado','cancelado') DEFAULT 'pendiente',
    direccion_envio TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE detalle_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);
```

Datos de prueba opcionales:

```sql
INSERT INTO categorias (nombre, descripcion) VALUES
('Ceramica', 'Artesanias en barro y ceramica'),
('Textiles', 'Telares y tejidos'),
('Madera', 'Tallados en madera');

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id) VALUES
('Jarron pintado a mano', 'Jarron de ceramica decorativo', 25.99, 10, NULL, 1),
('Cobija de lana de alpaca', 'Cobija suave y calida', 45.50, 5, NULL, 2),
('Mascara de madera', 'Artesania tallada en cedro', 32.00, 8, NULL, 3);
```

## Ejecucion

Levanta backend y frontend al mismo tiempo:

```powershell
npm.cmd start
```

En algunos entornos Windows, `npm start` puede fallar por politicas de PowerShell. Usa `npm.cmd start`.

URLs locales:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Salud de la API: `http://localhost:4000/api/health`

## Scripts disponibles

```bash
npm run client
```

Levanta solo React en `http://localhost:3000`.

```bash
npm run server
```

Levanta solo la API Express en `http://localhost:4000`.

```bash
npm run build
```

Genera la version de produccion en la carpeta `build`.

## Imagenes de productos

Las imagenes se guardan en la carpeta:

```text
uploads/
```

La base de datos debe guardar rutas relativas en `productos.imagen_url`, por ejemplo:

```sql
UPDATE productos
SET imagen_url = '/uploads/mi-imagen.jpg'
WHERE id = 1;
```

No guardes rutas de Windows como:

```text
C:\laragon\www\tienda-artesanias\uploads\mi-imagen.jpg
```

El servidor publica las imagenes desde:

```text
http://localhost:4000/uploads/mi-imagen.jpg
```

Tambien puedes cambiar la imagen desde la interfaz usando el boton `Cambiar imagen` en cada producto.

## Endpoints principales

```text
GET  /api/health
GET  /api/categorias
GET  /api/productos
POST /api/productos/:id/imagen
POST /api/pedidos
```

## Estructura del proyecto

```text
tienda-artesanias/
  server/
    db.js
    index.js
  src/
    components/
      Cart.js
      Header.js
      ProductList.js
    App.js
    App.css
  uploads/
  .env.example
  package.json
```

## Notas

- La carpeta `uploads` esta preparada para guardar imagenes locales.
- Los archivos subidos dentro de `uploads` no se versionan en Git.
- La autenticacion real de usuarios no esta implementada. Actualmente el pedido crea o actualiza un cliente por email con una contrasena temporal interna.
- Para produccion se recomienda agregar registro/login, hash de contrasenas con bcrypt y validaciones adicionales.
