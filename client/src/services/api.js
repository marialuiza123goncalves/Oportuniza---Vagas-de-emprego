const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem('oportuniza-token');

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o servidor está em execução.');
  }

  if (response.status === 204) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('A API retornou uma resposta inválida.');
  }

  if (!response.ok) {
    throw new Error(body.error || `A solicitação falhou (${response.status}).`);
  }

  return body;
}

export function opportunityToPayload(form) {
  return {
    titulo: form.title.trim(),
    descricao: form.description.trim(),
    empresa: form.organization.trim(),
    categoria_id: Number(form.categoryId),
    localizacao: form.location.trim() || null,
    modalidade: form.modality,
    tipo_contratacao: form.contractType,
    requisitos: form.requirements.trim() || null,
    link_candidatura: form.applicationUrl.trim(),
    prazo_candidatura: form.deadline || null,
    status: form.status,
  };
}

export function vagaToOpportunity(item) {
  return {
    id: item.id,
    title: item.titulo,
    description: item.descricao,
    type: 'job',
    organization: item.empresa,
    category_id: item.categoria_id,
    category_name: item.categoria,
    location: item.localizacao,
    modality: item.modalidade,
    contract_type: item.tipo_contratacao,
    requirements: item.requisitos,
    application_url: item.link_candidatura,
    deadline: item.prazo_candidatura,
    status: item.status,
    created_at: item.data_publicacao,
  };
}

export function opportunityToForm(item) {
  return {
    title: item.title || item.titulo || '',
    description: item.description || item.descricao || '',
    type: item.type || 'job',
    organization: item.organization || item.empresa || '',
    categoryId: String(item.category_id || item.categoria_id || ''),
    location: item.location || item.localizacao || '',
    modality: item.modality || item.modalidade || 'onsite',
    contractType: item.contract_type || item.tipo_contratacao || 'full_time',
    requirements: item.requirements || item.requisitos || '',
    applicationUrl: item.application_url || item.link_candidatura || '',
    deadline: (item.deadline || item.prazo_candidatura)
      ? String(item.deadline || item.prazo_candidatura).slice(0, 10)
      : '',
    status: item.status || 'draft',
  };
}
