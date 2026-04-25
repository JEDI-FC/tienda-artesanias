import { useEffect, useMemo, useState } from 'react';

function ProductList({ onAddToCart, cartItems }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingProductId, setUploadingProductId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/categorias'),
        ]);
        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsData.message || 'No se pudieron cargar los productos');
        }

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || 'No se pudieron cargar las categorias');
        }

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'todas' || String(product.categoria_id) === selectedCategory;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        product.nombre.toLowerCase().includes(search) ||
        (product.descripcion || '').toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const getQuantityInCart = (productId) =>
    cartItems.find((item) => item.id === productId)?.cantidad || 0;

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) {
      return '';
    }

    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      return imageUrl;
    }

    return `/uploads/${imageUrl}`;
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('imagen', file);
    setUploadingProductId(productId);
    setError('');

    try {
      const response = await fetch(`/api/productos/${productId}/imagen`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo subir la imagen');
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId ? { ...product, imagen_url: data.imageUrl } : product
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingProductId(null);
    }
  };

  return (
    <section className="catalog-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h2>Productos disponibles</h2>
        </div>
        <span>{filteredProducts.length} resultados</span>
      </div>

      <div className="catalog-toolbar">
        <input
          type="search"
          placeholder="Buscar producto"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="todas">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="status-message">Cargando productos...</p>}
      {error && <p className="status-message error">{error}</p>}
      {!loading && !error && filteredProducts.length === 0 && (
        <p className="status-message">No hay productos para mostrar.</p>
      )}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const quantityInCart = getQuantityInCart(product.id);
            const isOutOfStock = Number(product.stock) <= 0;
            const reachedLimit = quantityInCart >= Number(product.stock);

            return (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.imagen_url ? (
                    <img src={getImageSrc(product.imagen_url)} alt={product.nombre} />
                  ) : (
                    <span>{product.nombre.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="product-info">
                  <span className="category-chip">
                    {product.categoria_nombre || 'Sin categoria'}
                  </span>
                  <h3>{product.nombre}</h3>
                  <p>{product.descripcion || 'Producto artesanal seleccionado.'}</p>
                </div>
                <div className="product-meta">
                  <strong>S/ {Number(product.precio).toFixed(2)}</strong>
                  <span>{product.stock} en stock</span>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  disabled={isOutOfStock || reachedLimit}
                >
                  {isOutOfStock
                    ? 'Sin stock'
                    : reachedLimit
                      ? 'Stock agregado'
                      : 'Agregar al carrito'}
                </button>
                <label className="image-upload-button">
                  {uploadingProductId === product.id ? 'Subiendo...' : 'Cambiar imagen'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={uploadingProductId === product.id}
                    onChange={(event) => handleImageUpload(product.id, event.target.files[0])}
                  />
                </label>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProductList;
