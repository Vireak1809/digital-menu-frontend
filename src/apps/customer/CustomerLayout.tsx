import { Link, Outlet } from 'react-router-dom';

export function CustomerLayout() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Digital Menu</Link>
        <Link to="/checkout">Your order</Link>
      </header>
      <main className="content"><Outlet /></main>
    </>
  );
}
