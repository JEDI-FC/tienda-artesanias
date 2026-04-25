function Header({ cartCount }) {
  return (
    <header className="site-header">
      <div>
        <p className="eyebrow">Artesania local</p>
        <h1>Tienda de Artesanias</h1>
      </div>
      <div className="cart-badge">
        <span>Carrito</span>
        <strong>{cartCount}</strong>
      </div>
    </header>
  );
}

export default Header;
