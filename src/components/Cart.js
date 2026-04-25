import { useState } from 'react';

const initialCustomer = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
};

function Cart({ items, onChangeQuantity, onRemoveItem, onOrderCreated }) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const total = items.reduce(
    (sum, item) => sum + Number(item.precio) * Number(item.cantidad),
    0
  );

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: customer,
          items: items.map((item) => ({ id: item.id, cantidad: item.cantidad })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar el pedido');
      }

      setMessage(`Pedido #${data.pedidoId} registrado por S/ ${Number(data.total).toFixed(2)}.`);
      setCustomer(initialCustomer);
      onOrderCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="cart-panel">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Compra</p>
          <h2>Carrito</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty-cart">Agrega productos para preparar un pedido.</p>
      ) : (
        <div className="cart-items">
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <strong>{item.nombre}</strong>
                <span>S/ {Number(item.precio).toFixed(2)}</span>
              </div>
              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() => onChangeQuantity(item.id, item.cantidad - 1)}
                  disabled={item.cantidad <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.cantidad}
                  onChange={(event) => onChangeQuantity(item.id, Number(event.target.value))}
                />
                <button
                  type="button"
                  onClick={() => onChangeQuantity(item.id, item.cantidad + 1)}
                  disabled={item.cantidad >= Number(item.stock)}
                >
                  +
                </button>
              </div>
              <button
                className="link-button"
                type="button"
                onClick={() => onRemoveItem(item.id)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cart-total">
        <span>Total</span>
        <strong>S/ {total.toFixed(2)}</strong>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <h3>Datos del cliente</h3>
        <input
          name="nombre"
          placeholder="Nombre completo"
          value={customer.nombre}
          onChange={handleCustomerChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Correo electronico"
          value={customer.email}
          onChange={handleCustomerChange}
          required
        />
        <input
          name="telefono"
          placeholder="Telefono"
          value={customer.telefono}
          onChange={handleCustomerChange}
        />
        <textarea
          name="direccion"
          placeholder="Direccion de envio"
          value={customer.direccion}
          onChange={handleCustomerChange}
          rows="3"
        />
        <button type="submit" disabled={items.length === 0 || submitting}>
          {submitting ? 'Registrando...' : 'Confirmar pedido'}
        </button>
      </form>

      {message && <p className="status-message success">{message}</p>}
      {error && <p className="status-message error">{error}</p>}
    </aside>
  );
}

export default Cart;
