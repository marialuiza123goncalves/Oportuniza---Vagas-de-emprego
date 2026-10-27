import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest, vagaToOpportunity } from '../services/api.js';
import FeedbackMessage from '../components/FeedbackMessage.jsx';

const typeLabels = { job: 'Emprego', training: 'Capacitação profissional' };
const modalityLabels = { onsite: 'Presencial', hybrid: 'Híbrido', remote: 'Remoto' };
const contractLabels = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  temporary: 'Temporário',
  internship: 'Estágio',
  apprenticeship: 'Aprendiz',
  contractor: 'Autônomo / prestação de serviços',
};

function formatDeadline(value) {
  if (!value) return 'Não informado';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setOpportunity(null);
    setError('');
    apiRequest(`/vagas/${encodeURIComponent(id)}`)
      .then((result) => { if (active) setOpportunity(vagaToOpportunity(result.item)); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [id]);

  if (error) {
    return (
      <main className="page-shell detail-page">
        <FeedbackMessage>{error}</FeedbackMessage>
        <Link className="text-link" to="/">← Voltar às oportunidades</Link>
      </main>
    );
  }
  if (!opportunity) return <main className="page-shell loading-state" role="status">Carregando oportunidade...</main>;

  return (
    <main className="page-shell detail-page">
      <Link className="text-link" to="/">← Todas as oportunidades</Link>
      <article className="detail-card">
        <div className="card-topline">
          <span className={`tag tag-${opportunity.type}`}>{typeLabels[opportunity.type]}</span>
          <span className="card-category">{opportunity.category_name}</span>
        </div>
        <h1>{opportunity.title}</h1>
        <p className="detail-organization">{opportunity.organization}</p>
        <div className="detail-meta">
          <span>{opportunity.location || 'Local não informado'}</span>
          <span>{modalityLabels[opportunity.modality]}</span>
          {opportunity.type === 'job' && <span>{contractLabels[opportunity.contract_type]}</span>}
          <span>Prazo: {formatDeadline(opportunity.deadline)}</span>
        </div>
        <section className="detail-section">
          <h2>Sobre a oportunidade</h2>
          <p className="detail-copy">{opportunity.description}</p>
        </section>
        {opportunity.requirements && (
          <section className="detail-section">
            <h2>Requisitos</h2>
            <p className="detail-copy">{opportunity.requirements}</p>
          </section>
        )}
        <a className="button button-primary apply-button" href={opportunity.application_url} target="_blank" rel="noopener noreferrer">
          Acessar candidatura <span aria-hidden="true">↗</span>
        </a>
      </article>
    </main>
  );
}
