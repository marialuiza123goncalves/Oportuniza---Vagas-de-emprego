import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest, vagaToOpportunity } from '../services/api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import OpportunityTable from '../components/OpportunityTable.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';

export default function AdminOpportunitiesPage() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/vagas/admin');
      setItems(result.items.map(vagaToOpportunity));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function deleteOpportunity() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setBusyId(item.id);
    setError('');
    try {
      await apiRequest(`/vagas/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page-shell admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">PAINEL DE GESTÃO</span>
          <h1>Oportunidades</h1>
          <p>Publique, atualize e acompanhe oportunidades em um só lugar.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="button button-secondary" to="/admin/cursos">Gerenciar cursos</Link>
          <Link className="button button-primary" to="/admin/oportunidades/nova">＋ Nova oportunidade</Link>
        </div>
      </div>
      {location.state?.notice && <FeedbackMessage kind="success">{location.state.notice}</FeedbackMessage>}
      {error && <FeedbackMessage>{error}</FeedbackMessage>}
      {loading ? (
        <div className="loading-state" role="status">Carregando painel...</div>
      ) : items.length === 0 ? (
        <div className="empty-state admin-empty">
          <span className="empty-symbol" aria-hidden="true">✳</span>
          <h2>Seu painel começa com uma oportunidade.</h2>
          <p>Cadastre uma vaga ou capacitação e ela ficará disponível para consulta.</p>
          <Link className="button button-primary" to="/admin/oportunidades/nova">Cadastrar oportunidade</Link>
        </div>
      ) : (
        <OpportunityTable items={items} busyId={busyId} onDelete={setPendingDelete} />
      )}
      <button className="text-link refresh-link" onClick={loadItems}>Atualizar lista</button>
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir oportunidade?"
          message={`A oportunidade “${pendingDelete.title}” será removida permanentemente.`}
          busy={busyId === pendingDelete.id}
          onConfirm={deleteOpportunity}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
