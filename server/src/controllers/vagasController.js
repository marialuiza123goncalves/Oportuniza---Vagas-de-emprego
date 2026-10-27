const { createVagasRepository } = require('../repositories/vagasRepository');

const modalities = ['onsite', 'hybrid', 'remote'];
const contractTypes = ['full_time', 'part_time', 'temporary', 'internship', 'apprenticeship', 'contractor'];
const statuses = ['draft', 'published', 'closed'];

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function valueFrom(body, primary, alternate) {
  return body[primary] === undefined ? body[alternate] : body[primary];
}

function parseVaga(body) {
  const title = valueFrom(body, 'titulo', 'title');
  const description = valueFrom(body, 'descricao', 'description');
  const company = valueFrom(body, 'empresa', 'organization');
  const categoryId = Number(valueFrom(body, 'categoria_id', 'categoryId'));
  const modality = valueFrom(body, 'modalidade', 'modality');
  const location = valueFrom(body, 'localizacao', 'location');
  const contractType = valueFrom(body, 'tipo_contratacao', 'contractType') || 'full_time';
  const requirements = valueFrom(body, 'requisitos', 'requirements');
  const applicationUrl = valueFrom(body, 'link_candidatura', 'applicationUrl');
  const deadline = valueFrom(body, 'prazo_candidatura', 'deadline');
  const status = body.status || 'draft';

  if (typeof title !== 'string' || !title.trim() || title.trim().length > 180) {
    return { error: 'O título é obrigatório e deve ter até 180 caracteres.' };
  }
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 20000) {
    return { error: 'A descrição é obrigatória e deve ter até 20000 caracteres.' };
  }
  if (typeof company !== 'string' || !company.trim() || company.trim().length > 160) {
    return { error: 'A empresa é obrigatória e deve ter até 160 caracteres.' };
  }
  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    return { error: 'Selecione uma categoria válida.' };
  }
  if (!modalities.includes(modality)) {
    return { error: 'A modalidade deve ser onsite, hybrid ou remote.' };
  }
  if (location != null && (typeof location !== 'string' || location.trim().length > 160)) {
    return { error: 'A localização deve ter até 160 caracteres.' };
  }
  if (!contractTypes.includes(contractType)) {
    return { error: 'O tipo de contratação informado não é válido.' };
  }
  if (requirements != null && (typeof requirements !== 'string' || requirements.trim().length > 10000)) {
    return { error: 'Os requisitos devem ter até 10000 caracteres.' };
  }
  if (typeof applicationUrl !== 'string') {
    return { error: 'O link de candidatura é obrigatório.' };
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(applicationUrl.trim());
  } catch {
    return { error: 'Informe um link de candidatura válido.' };
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.href.length > 2048) {
    return { error: 'O link de candidatura deve usar HTTP ou HTTPS.' };
  }
  let parsedDeadline = null;
  if (deadline != null && deadline !== '') {
    if (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return { error: 'O prazo para candidatura deve estar no formato AAAA-MM-DD.' };
    }
    const date = new Date(`${deadline}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== deadline) {
      return { error: 'Informe um prazo para candidatura válido.' };
    }
    parsedDeadline = deadline;
  }
  if (!statuses.includes(status)) return { error: 'A situação deve ser draft, published ou closed.' };

  return {
    value: {
      titulo: title.trim(),
      descricao: description.trim(),
      empresa: company.trim(),
      categoriaId: categoryId,
      modalidade: modality,
      localizacao: location?.trim() || null,
      tipoContratacao: contractType,
      requisitos: requirements?.trim() || null,
      linkCandidatura: parsedUrl.href,
      prazoCandidatura: parsedDeadline,
      status,
    },
  };
}

function createVagasController() {
  return {
    listAdmin: async (req, res, next) => {
      try {
        const items = await createVagasRepository(req.app.locals.db).listAll();
        return res.json({ items });
      } catch (error) {
        return next(error);
      }
    },

    list: async (req, res, next) => {
      const { q, categoryId, modality } = req.query;
      if (q !== undefined && (typeof q !== 'string' || q.trim().length > 100)) {
        return res.status(400).json({ error: 'A busca deve ter até 100 caracteres.' });
      }
      if (categoryId !== undefined && !/^[1-9]\d*$/.test(categoryId)) {
        return res.status(400).json({ error: 'A categoria selecionada é inválida.' });
      }
      if (modality !== undefined && !modalities.includes(modality)) {
        return res.status(400).json({ error: 'A modalidade selecionada é inválida.' });
      }
      try {
        const items = await createVagasRepository(req.app.locals.db).list({
          q: q?.trim(),
          categoryId,
          modality,
        });
        return res.json({ items });
      } catch (error) {
        return next(error);
      }
    },

    getById: async (req, res, next) => {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: 'O identificador da vaga é inválido.' });
      try {
        const item = await createVagasRepository(req.app.locals.db).findById(id, {
          admin: Boolean(req.user),
        });
        if (!item) return res.status(404).json({ error: 'Vaga não encontrada.' });
        return res.json({ item });
      } catch (error) {
        return next(error);
      }
    },

    create: async (req, res, next) => {
      const parsed = parseVaga(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      try {
        const repository = createVagasRepository(req.app.locals.db);
        const item = await repository.create(parsed.value, req.user.id);
        return res.status(201).json({ item });
      } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ error: 'A categoria selecionada não existe.' });
        }
        return next(error);
      }
    },

    update: async (req, res, next) => {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: 'O identificador da vaga é inválido.' });
      const parsed = parseVaga(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      try {
        const item = await createVagasRepository(req.app.locals.db).update(id, parsed.value);
        if (!item) return res.status(404).json({ error: 'Vaga não encontrada.' });
        return res.json({ item });
      } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ error: 'A categoria selecionada não existe.' });
        }
        return next(error);
      }
    },

    remove: async (req, res, next) => {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: 'O identificador da vaga é inválido.' });
      try {
        const deleted = await createVagasRepository(req.app.locals.db).delete(id);
        if (!deleted) return res.status(404).json({ error: 'Vaga não encontrada.' });
        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createVagasController };
