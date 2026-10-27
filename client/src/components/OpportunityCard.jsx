import { Link } from 'react-router-dom';

const typeLabels = { job: 'Emprego', training: 'Capacitação' };
const modalityLabels = { onsite: 'Presencial', hybrid: 'Híbrido', remote: 'Remoto' };
const contractLabels = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  temporary: 'Temporário',
  internship: 'Estágio',
  apprenticeship: 'Aprendiz',
  contractor: 'Autônomo',
};

export default function OpportunityCard({ opportunity }) {
  return (
    <article className="opportunity-card">
      <div className="card-topline">
        <span className={`tag tag-${opportunity.type}`}>{typeLabels[opportunity.type]}</span>
        <span className="card-category">{opportunity.category_name}</span>
      </div>
      <h3><Link to={`/oportunidades/${opportunity.id}`}>{opportunity.title}</Link></h3>
      <p className="card-organization">{opportunity.organization}</p>
      <p className="card-description">{opportunity.description}</p>
      <div className="card-meta">
        <span>{opportunity.location || 'Local não informado'}</span>
        <span>{modalityLabels[opportunity.modality]}{opportunity.type === 'job' && opportunity.contract_type ? ` · ${contractLabels[opportunity.contract_type]}` : ''}</span>
      </div>
      <Link className="card-link" to={`/oportunidades/${opportunity.id}`}>
        Ver oportunidade <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
