import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';

const modalityLabels = { onsite: 'Presencial', hybrid: 'Híbrido', remote: 'Remoto' };

export default function AdminCoursesPage() {
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
      const result = await apiRequest('/courses/admin');
      setItems(result.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function deleteCourse() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setBusyId(item.id);
    setError('');
    try {
      await apiRequest(`/courses/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((course) => course.id !== item.id));
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
          <h1>Cursos</h1>
          <p>Cadastre, atualize e remova oportunidades de capacitação.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="button button-secondary" to="/admin/oportunidades">Painel de vagas</Link>
          <Link className="button button-primary" to="/admin/cursos/novo">＋ Novo curso</Link>
        </div>
      </div>
      {location.state?.notice && <FeedbackMessage kind="success">{location.state.notice}</FeedbackMessage>}
      {error && <FeedbackMessage>{error}</FeedbackMessage>}
      {loading ? (
        <div className="loading-state" role="status">Carregando cursos...</div>
      ) : items.length === 0 ? (
        <div className="empty-state admin-empty">
          <span className="empty-symbol" aria-hidden="true">✳</span>
          <h2>Nenhum curso cadastrado.</h2>
          <p>Cadastre o primeiro curso de capacitação.</p>
          <Link className="button button-primary" to="/admin/cursos/novo">Cadastrar curso</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Curso</th><th>Categoria</th><th>Modalidade</th><th>Situação</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {items.map((course) => (
                <tr key={course.id}>
                  <td><strong>{course.title}</strong><span className="table-subtitle">{course.institution}</span></td>
                  <td>{course.category_name}</td>
                  <td>{modalityLabels[course.modality]} · {course.workload_hours} h</td>
                  <td><span className={`status-pill status-${course.status}`}>{course.status === 'published' ? 'Publicado' : 'Encerrado'}</span></td>
                  <td>
                    <div className="table-actions">
                      <Link className="table-action" to={`/admin/cursos/${course.id}/editar`}>Editar</Link>
                      <button className="table-action table-delete" type="button" disabled={busyId === course.id} onClick={() => setPendingDelete(course)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="text-link refresh-link" type="button" onClick={loadItems}>Atualizar lista</button>
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir curso?"
          message={`O curso “${pendingDelete.title}” será removido permanentemente.`}
          busy={busyId === pendingDelete.id}
          onConfirm={deleteCourse}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
