import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import FormField from '../components/FormField.jsx';
import { apiRequest } from '../services/api.js';

const emptyCourse = {
  title: '',
  description: '',
  institution: '',
  categoryId: '',
  modality: 'remote',
  workloadHours: '',
  accessUrl: '',
  status: 'published',
};

function courseToForm(course) {
  return {
    title: course.title,
    description: course.description,
    institution: course.institution,
    categoryId: String(course.category_id),
    modality: course.modality,
    workloadHours: String(course.workload_hours),
    accessUrl: course.access_url,
    status: course.status,
  };
}

export default function CourseFormPage() {
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
        const [categoryResult, courseResult] = await Promise.all([
          apiRequest('/categories'),
          id ? apiRequest(`/courses/admin/${encodeURIComponent(id)}`) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCategories(categoryResult.items);
        if (courseResult) setInitialValue(courseToForm(courseResult.item));
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadForm();
    return () => { active = false; };
  }, [id]);

  async function saveCourse(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = Object.fromEntries(formData.entries());
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      institution: form.institution.trim(),
      categoryId: Number(form.categoryId),
      workloadHours: Number(form.workloadHours),
      accessUrl: form.accessUrl.trim(),
    };
    setBusy(true);
    setError('');
    try {
      await apiRequest(id ? `/courses/${encodeURIComponent(id)}` : '/courses', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      navigate('/admin/cursos', {
        replace: true,
        state: { notice: id ? 'Curso atualizado.' : 'Curso cadastrado.' },
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
      <Link className="text-link" to="/admin/cursos">← Voltar aos cursos</Link>
      <div className="form-page-heading">
        <span className="eyebrow">{id ? 'ATUALIZE AS INFORMAÇÕES' : 'AMPLIE AS POSSIBILIDADES'}</span>
        <h1>{id ? 'Editar curso' : 'Novo curso'}</h1>
        <p>{id ? 'Mantenha as informações do curso atualizadas.' : 'Cadastre uma oportunidade de capacitação profissional.'}</p>
      </div>
      {error && <FeedbackMessage>{error}</FeedbackMessage>}
      {initialValue || !id ? (
        <form className="opportunity-form" onSubmit={saveCourse}>
          <div className="form-grid">
            <FormField label="Título do curso" className="field-wide">
              <input name="title" required maxLength="180" defaultValue={(initialValue || emptyCourse).title} />
            </FormField>
            <FormField label="Instituição">
              <input name="institution" required maxLength="160" defaultValue={(initialValue || emptyCourse).institution} />
            </FormField>
            <FormField label="Categoria">
              <select name="categoryId" required defaultValue={(initialValue || emptyCourse).categoryId}>
                <option value="" disabled>Selecione uma categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </FormField>
            <FormField label="Modalidade">
              <select name="modality" required defaultValue={(initialValue || emptyCourse).modality}>
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </FormField>
            <FormField label="Carga horária (horas)">
              <input name="workloadHours" type="number" required min="1" max="32767" step="1" defaultValue={(initialValue || emptyCourse).workloadHours} />
            </FormField>
            <FormField label="Situação">
              <select name="status" required defaultValue={(initialValue || emptyCourse).status}>
                <option value="published">Publicado</option>
                <option value="closed">Encerrado</option>
              </select>
            </FormField>
            <FormField label="Link de acesso" className="field-wide">
              <input name="accessUrl" type="url" required maxLength="2048" placeholder="https://..." defaultValue={(initialValue || emptyCourse).accessUrl} />
            </FormField>
            <FormField label="Descrição" className="field-wide">
              <textarea name="description" required maxLength="20000" rows="6" defaultValue={(initialValue || emptyCourse).description} />
            </FormField>
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={busy}>{busy ? 'Salvando...' : id ? 'Salvar alterações' : 'Cadastrar curso'}</Button>
          </div>
        </form>
      ) : (
        <div className="empty-state"><h2>Não foi possível carregar este curso.</h2></div>
      )}
    </main>
  );
}
