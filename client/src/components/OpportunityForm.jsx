import Button from './Button.jsx';
import FormField from './FormField.jsx';

const initialValues = {
  title: '',
  description: '',
  organization: '',
  categoryId: '',
  location: '',
  modality: 'onsite',
  contractType: 'full_time',
  requirements: '',
  applicationUrl: '',
  deadline: '',
  status: 'draft',
};

export default function OpportunityForm({ initialValue = initialValues, categories, onSubmit, busy, submitLabel }) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(formData.entries()));
  }

  return (
    <form className="opportunity-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <FormField label="Título da oportunidade" className="field-wide">
          <input name="title" required maxLength="180" defaultValue={initialValue.title} placeholder="Ex.: Assistente administrativo" />
        </FormField>
        <FormField label="Categoria">
          <select name="categoryId" required defaultValue={initialValue.categoryId}>
            <option value="" disabled>Selecione uma categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </FormField>
        <FormField label="Empresa ou instituição">
          <input name="organization" required maxLength="160" defaultValue={initialValue.organization} />
        </FormField>
        <FormField label="Localidade">
          <input name="location" maxLength="160" defaultValue={initialValue.location} placeholder="Cidade, estado ou remoto" />
        </FormField>
        <FormField label="Modalidade">
          <select name="modality" required defaultValue={initialValue.modality}>
            <option value="onsite">Presencial</option>
            <option value="hybrid">Híbrido</option>
            <option value="remote">Remoto</option>
          </select>
        </FormField>
        <FormField label="Tipo de contratação">
          <select name="contractType" required defaultValue={initialValue.contractType}>
            <option value="full_time">Tempo integral</option>
            <option value="part_time">Meio período</option>
            <option value="temporary">Temporário</option>
            <option value="internship">Estágio</option>
            <option value="apprenticeship">Aprendiz</option>
            <option value="contractor">Autônomo / prestação de serviços</option>
          </select>
        </FormField>
        <FormField label="Situação">
          <select name="status" required defaultValue={initialValue.status}>
            <option value="draft">Rascunho (não publicado)</option>
            <option value="published">Publicado</option>
            <option value="closed">Encerrado</option>
          </select>
        </FormField>
        <FormField label="Prazo para candidatura">
          <input name="deadline" type="date" defaultValue={initialValue.deadline} />
        </FormField>
        <FormField label="Link externo de candidatura ou inscrição" className="field-wide">
          <input name="applicationUrl" type="url" required maxLength="2048" defaultValue={initialValue.applicationUrl} placeholder="https://..." />
        </FormField>
        <FormField label="Descrição" className="field-wide">
          <textarea name="description" required maxLength="20000" rows="6" defaultValue={initialValue.description} />
        </FormField>
        <FormField label="Requisitos (opcional)" className="field-wide">
          <textarea name="requirements" maxLength="10000" rows="4" defaultValue={initialValue.requirements} />
        </FormField>
      </div>
      <div className="form-actions">
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
