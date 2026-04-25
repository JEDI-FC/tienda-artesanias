import { useMemo, useState } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad, 0),
    [cartItems]
  );

  const handleAddToCart = (product) => {
    setCartItems((items) => {
      const currentItem = items.find((item) => item.id === product.id);

      if (currentItem) {
        return items.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, Number(product.stock)) }
            : item
        );
      }

      return [...items, { ...product, cantidad: 1 }];
    });
  };

  const handleChangeQuantity = (productId, quantity) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === productId
          ? { ...item, cantidad: Math.max(1, Math.min(quantity, Number(item.stock))) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((items) => items.filter((item) => item.id !== productId));
  };

  const handleOrderCreated = () => {
    setCartItems([]);
  };

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} />
      <main className="store-layout">
        <ProductList onAddToCart={handleAddToCart} cartItems={cartItems} />
        <Cart
          items={cartItems}
          onChangeQuantity={handleChangeQuantity}
          onRemoveItem={handleRemoveItem}
          onOrderCreated={handleOrderCreated}
        />
      </main>
    </div>
  );
}

export default App;
