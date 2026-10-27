import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand">Oportuniza<span className="brand-period">.</span></Link>
        <span>Plataforma para maiores de 18 anos · Mais acesso ao trabalho e à qualificação.</span>
        <span>ODS 8 · Trabalho decente e crescimento econômico</span>
        <Link to="/sobre" className="footer-about">Sobre o projeto</Link>
      </div>
    </footer>
  );
}
