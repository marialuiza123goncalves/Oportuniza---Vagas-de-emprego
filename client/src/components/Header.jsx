import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';

export default function Header() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Oportuniza, página inicial">
          <span className="brand-mark" aria-hidden="true">O</span>
          <span>oportuniza<span className="brand-period">.</span></span>
        </Link>
        <nav className="header-nav" aria-label="Navegação principal">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Explorar oportunidades</NavLink>
          <NavLink to="/cursos" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Cursos</NavLink>
          <NavLink to="/sobre" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>Sobre</NavLink>
          {admin ? (
            <>
              <NavLink to="/admin/oportunidades" end className={({ isActive }) => `nav-link nav-admin${isActive ? ' nav-link-active' : ''}`}>Painel</NavLink>
              <button className="nav-link nav-button" onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <Link to="/admin/login" className="nav-login">Área administrativa</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
