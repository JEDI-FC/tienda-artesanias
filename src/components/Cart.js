import { useState } from 'react';

function Cart() {
  const [cart, setCart] = useState([]);

  const handleAddToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div>
      <h2>Carrito de Compras</h2>
      <button onClick={() => handleAddToCart('Producto 1')}>
        Agregar Producto 1
      </button>
      <ul>
        {cart.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default Cart;