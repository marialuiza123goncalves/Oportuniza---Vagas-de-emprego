import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import Button from '../components/Button.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import FormField from '../components/FormField.jsx';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to="/admin/oportunidades" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || '/admin/oportunidades', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-intro">
        <span className="eyebrow"><span className="eyebrow-dot" /> ÁREA ADMINISTRATIVA</span>
        <h1>Cada oportunidade começa com alguém que acredita.</h1>
        <p>Entre para publicar e gerenciar novas possibilidades.</p>
        <span className="login-decoration" aria-hidden="true">O.</span>
      </section>
      <section className="login-panel">
        <Link className="text-link" to="/">← Voltar ao início</Link>
        <h2>Bem-vindo de volta</h2>
        <p>Acesse o painel de oportunidades.</p>
        {error && <FeedbackMessage>{error}</FeedbackMessage>}
        <form className="login-form" onSubmit={handleSubmit}>
          <FormField label="E-mail">
            <input type="email" autoComplete="username" required maxLength="255" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <FormField label="Senha">
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </FormField>
          <Button type="submit" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar no painel'} <span aria-hidden="true">→</span>
          </Button>
        </form>
      </section>
    </main>
  );
}
