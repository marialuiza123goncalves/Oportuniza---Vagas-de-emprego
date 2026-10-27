import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import Button from '../components/Button.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import { useAuth } from '../auth/useAuth.js';

const modalityLabels = { onsite: 'Presencial', hybrid: 'Híbrido', remote: 'Remoto' };

export default function CoursesPage() {
  const { admin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', categoryId: '', modality: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/categories')
      .then((result) => { if (active) setCategories(result.items); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) query.set(key, value);
    }
    apiRequest(`/courses${query.size ? `?${query}` : ''}`)
      .then((result) => {
        if (!active) return;
        setCourses(result.items);
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  function submitSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <main className="page-shell courses-page">
      <section className="courses-heading">
        <span className="eyebrow">APRENDIZADO CONTÍNUO</span>
        <h1>Conhecimento que abre caminhos<span className="brand-period">.</span></h1>
        <p>Encontre cursos para desenvolver novas habilidades e fortalecer sua trajetória profissional.</p>
        {admin && <Link className="button button-secondary courses-admin-link" to="/admin/cursos">Gerenciar cursos</Link>}
      </section>
      <form className="search-panel courses-search" onSubmit={submitSearch}>
        <label className="search-input-wrap">
          <span className="visually-hidden">Buscar cursos</span>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} maxLength="100" placeholder="Curso, instituição ou palavra-chave" />
        </label>
        <label className="filter-control">
          <span className="visually-hidden">Categoria do curso</span>
          <select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <span className="visually-hidden">Modalidade do curso</span>
          <select value={filters.modality} onChange={(event) => setFilters((current) => ({ ...current, modality: event.target.value }))}>
            <option value="">Todas as modalidades</option>
            <option value="remote">Remoto</option>
            <option value="hybrid">Híbrido</option>
            <option value="onsite">Presencial</option>
          </select>
        </label>
        <Button className="search-button" type="submit">Buscar <span aria-hidden="true">→</span></Button>
      </form>
      <p className="data-disclaimer">
        Registros de demonstração podem não estar disponíveis para inscrição.
        Confirme informações e oferta diretamente com a instituição.
      </p>
      {error && <FeedbackMessage>{error}</FeedbackMessage>}
      {loading ? (
        <div className="loading-state" role="status">Carregando cursos...</div>
      ) : courses.length > 0 ? (
        <div className="courses-grid">
          {courses.map((course) => (
            <article className="course-card" key={course.id}>
              <div className="card-topline">
                <span className="tag tag-training">Capacitação</span>
                <span className="card-category">{course.category_name}</span>
              </div>
              <h2>{course.title}</h2>
              <p className="course-institution">{course.institution}</p>
              <p className="course-description">{course.description}</p>
              <div className="card-meta">
                <span>{modalityLabels[course.modality]}</span>
                <span>{course.workload_hours} horas</span>
              </div>
              <a className="card-link" href={course.access_url} target="_blank" rel="noopener noreferrer">
                Acessar curso <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      ) : !error ? (
        <div className="empty-state">
          <span className="empty-symbol" aria-hidden="true">✳</span>
          <h2>Nenhum curso encontrado.</h2>
          <p>Experimente mudar a busca ou os filtros.</p>
          {(filters.q || filters.categoryId || filters.modality) && (
            <Button
              variant="secondary"
              onClick={() => { setSearchText(''); setFilters({ q: '', categoryId: '', modality: '' }); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : null}
    </main>
  );
}
