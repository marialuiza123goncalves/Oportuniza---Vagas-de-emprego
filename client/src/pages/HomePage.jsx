import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, vagaToOpportunity } from '../services/api.js';
import OpportunityCard from '../components/OpportunityCard.jsx';
import Button from '../components/Button.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';

const defaultFilters = { q: '', categoryId: '', modality: '' };

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, total: 0 });
  const [stats, setStats] = useState(null);
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
    apiRequest('/stats')
      .then((result) => { if (active) setStats(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (filters.q) query.set('q', filters.q);
    if (filters.categoryId) query.set('categoryId', filters.categoryId);
    if (filters.modality) query.set('modality', filters.modality);

    apiRequest(`/vagas?${query}`)
      .then((result) => {
        if (!active) return;
        setOpportunities(result.items.map(vagaToOpportunity));
        setPagination({ page, pageSize: 12, total: result.items.length });
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  function setFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> OPORTUNIDADES PARA CRESCER</span>
            <h1>Seu próximo passo <span>começa aqui.</span></h1>
            <p>Encontre oportunidades de trabalho e capacitação que combinam com o seu momento.</p>
            <a className="hero-anchor" href="#resultados">Encontre sua oportunidade <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✦</div>
            <div className="art-card art-card-back"><span>novos caminhos</span><b>↗</b></div>
            <div className="art-card art-card-front">
              <span className="art-card-icon">✳</span>
              <span>Oportunidade</span>
              <strong>Um futuro<br />de possibilidades.</strong>
              <span className="art-card-link">É a sua vez <b>→</b></span>
            </div>
            <span className="art-label">TRABALHO · APRENDIZADO · FUTURO</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span><strong>{stats?.vacancies ?? '—'}</strong> VAGAS PUBLICADAS</span>
          <span><strong>{stats?.courses ?? '—'}</strong> CURSOS DISPONÍVEIS</span>
          <Link to="/cursos">VER CAPACITAÇÕES <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="results-section page-shell" id="resultados">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CAMINHOS ABERTOS</span>
            <h2>Oportunidades em destaque<span className="brand-period">.</span></h2>
            <p>Um novo começo pode estar a uma busca de distância.</p>
          </div>
          <span className="results-count">{pagination.total} {pagination.total === 1 ? 'oportunidade' : 'oportunidades'}</span>
        </div>

        <form className="search-panel" onSubmit={submitSearch}>
          <label className="search-input-wrap">
            <span className="visually-hidden">Buscar oportunidades</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Cargo, empresa, localidade ou palavra-chave"
              maxLength="100"
            />
          </label>
          <label className="filter-control">
            <span className="visually-hidden">Modalidade</span>
            <select value={filters.modality} onChange={(event) => setFilter('modality', event.target.value)}>
              <option value="">Todas as modalidades</option>
              <option value="onsite">Presencial</option>
              <option value="hybrid">Híbrido</option>
              <option value="remote">Remoto</option>
            </select>
          </label>
          <label className="filter-control">
            <span className="visually-hidden">Categoria</span>
            <select value={filters.categoryId} onChange={(event) => setFilter('categoryId', event.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <Button className="search-button" type="submit">Buscar <span aria-hidden="true">→</span></Button>
        </form>
        <p className="data-disclaimer">
          Alguns anúncios são registros de demonstração, não vagas confirmadas.
          Confira os detalhes e a validade diretamente com a empresa.
        </p>

        {error && <FeedbackMessage>{error}</FeedbackMessage>}
        {loading ? (
          <div className="loading-state" role="status">Carregando oportunidades...</div>
        ) : opportunities.length > 0 ? (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
          </div>
        ) : !error ? (
          <div className="empty-state">
            <span className="empty-symbol" aria-hidden="true">✳</span>
            <h3>Nenhuma oportunidade por aqui, ainda.</h3>
            <p>Tente outros termos ou filtros. Novas possibilidades chegam sempre.</p>
            {(filters.q || filters.modality || filters.categoryId) && (
              <Button
                variant="secondary"
                onClick={() => { setSearchText(''); setFilters(defaultFilters); setPage(1); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : null}

        {!loading && totalPages > 1 && (
          <nav className="pagination" aria-label="Paginação das oportunidades">
            <button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="button button-secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima →</button>
          </nav>
        )}
      </section>

      <section className="impact-strip">
        <div className="impact-inner">
          <span className="impact-mark" aria-hidden="true">8</span>
          <div>
            <span className="eyebrow">NOSSO COMPROMISSO</span>
            <h2>Oportunidades que transformam futuros.</h2>
          </div>
          <p>Conectamos pessoas a novos caminhos de trabalho e aprendizagem, em sintonia com o ODS 8.</p>
        </div>
      </section>
    </main>
  );
}
