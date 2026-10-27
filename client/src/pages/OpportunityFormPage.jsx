import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import OpportunityForm from '../components/OpportunityForm.jsx';
import { apiRequest, opportunityToForm, opportunityToPayload } from '../services/api.js';
import FeedbackMessage from '../components/FeedbackMessage.jsx';

export default function OpportunityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [initialValue, setInitialValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadForm() {
      setLoading(true);
      setError('');
      try {
        const [categoryResult, opportunityResult] = await Promise.all([
          apiRequest('/categories'),
          id ? apiRequest(`/vagas/admin/${encodeURIComponent(id)}`) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCategories(categoryResult.items);
        if (id && opportunityResult) setInitialValue(opportunityToForm(opportunityResult.item));
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadForm();
    return () => { active = false; };
  }, [id]);

  async function saveOpportunity(form) {
    setBusy(true);
    setError('');
    try {
      await apiRequest(id ? `/vagas/${encodeURIComponent(id)}` : '/vagas', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(opportunityToPayload(form)),
      });
      navigate('/admin/oportunidades', {
        replace: true,
        state: { notice: id ? 'Oportunidade atualizada.' : 'Oportunidade cadastrada.' },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="page-shell loading-state" role="status">Carregando formulário...</main>;

  return (
    <main className="page-shell admin-page">
      <Link className="text-link" to="/admin/oportunidades">← Voltar ao painel</Link>
      <div className="form-page-heading">
        <span className="eyebrow">{id ? 'ATUALIZE OS DETALHES' : 'AMPLIE AS POSSIBILIDADES'}</span>
        <h1>{id ? 'Editar oportunidade' : 'Nova oportunidade'}</h1>
        <p>{id ? 'Mantenha as informações claras e atualizadas.' : 'Compartilhe uma nova oportunidade com quem está buscando.'}</p>
      </div>
      {error && <FeedbackMessage>{error}</FeedbackMessage>}
      {initialValue || !id ? (
        <OpportunityForm
          key={id || 'new'}
          initialValue={initialValue || undefined}
          categories={categories}
          onSubmit={saveOpportunity}
          busy={busy}
          submitLabel={id ? 'Salvar alterações' : 'Cadastrar oportunidade'}
        />
      ) : (
        <div className="empty-state"><h2>Não foi possível carregar esta oportunidade.</h2></div>
      )}
    </main>
  );
}
