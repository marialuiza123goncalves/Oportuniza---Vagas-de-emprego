import { Link } from 'react-router-dom';

const statusLabels = { draft: 'Rascunho', published: 'Publicado', closed: 'Encerrado' };
const typeLabels = { job: 'Emprego', training: 'Capacitação' };

export default function OpportunityTable({ items, busyId, onDelete }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr><th>Oportunidade</th><th>Tipo</th><th>Categoria</th><th>Situação</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td data-label="Oportunidade">
                <strong>{item.title}</strong>
                <span className="table-subtitle">{item.organization}</span>
              </td>
              <td data-label="Tipo">{typeLabels[item.type]}</td>
              <td data-label="Categoria">{item.category_name}</td>
              <td data-label="Situação"><span className={`status-pill status-${item.status}`}>{statusLabels[item.status]}</span></td>
              <td data-label="Ações">
                <div className="table-actions">
                  <Link className="table-action" to={`/admin/oportunidades/${item.id}/editar`}>Editar</Link>
                  <button className="table-action table-delete" disabled={busyId === item.id} onClick={() => onDelete(item)}>
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
