const { createCoursesRepository } = require('../repositories/coursesRepository');

const modalities = ['onsite', 'hybrid', 'remote'];
const statuses = ['published', 'closed'];

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function parseCourse(body) {
  const title = body.title;
  const description = body.description;
  const institution = body.institution;
  const categoryId = Number(body.categoryId);
  const modality = body.modality;
  const workloadHours = Number(body.workloadHours);
  const accessUrl = body.accessUrl;
  const status = body.status || 'published';

  if (typeof title !== 'string' || !title.trim() || title.trim().length > 180) {
    return { error: 'O título é obrigatório e deve ter até 180 caracteres.' };
  }
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 20000) {
    return { error: 'A descrição é obrigatória e deve ter até 20000 caracteres.' };
  }
  if (typeof institution !== 'string' || !institution.trim() || institution.trim().length > 160) {
    return { error: 'A instituição é obrigatória e deve ter até 160 caracteres.' };
  }
  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    return { error: 'Selecione uma categoria válida.' };
  }
  if (!modalities.includes(modality)) {
    return { error: 'A modalidade deve ser onsite, hybrid ou remote.' };
  }
  if (!Number.isInteger(workloadHours) || workloadHours < 1 || workloadHours > 32767) {
    return { error: 'A carga horária deve ser um número inteiro entre 1 e 32767.' };
  }
  if (typeof accessUrl !== 'string') {
    return { error: 'O link de acesso é obrigatório.' };
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(accessUrl.trim());
  } catch {
    return { error: 'Informe um link de acesso válido.' };
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.href.length > 2048) {
    return { error: 'O link deve usar HTTP ou HTTPS e ter no máximo 2048 caracteres.' };
  }
  if (!statuses.includes(status)) {
    return { error: 'A situação deve ser published ou closed.' };
  }

  return {
    value: {
      title: title.trim(),
      description: description.trim(),
      institution: institution.trim(),
      categoryId,
      modality,
      workloadHours,
      accessUrl: parsedUrl.href,
      status,
    },
  };
}

function createCoursesController() {
  return {
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
        const items = await createCoursesRepository(req.app.locals.db).list({
          q: q?.trim(),
          categoryId,
          modality,
        });
        return res.json({ items });
      } catch (error) {
        return next(error);
      }
    },

    listAdmin: async (req, res, next) => {
      try {
        const items = await createCoursesRepository(req.app.locals.db).list({}, { admin: true });
        return res.json({ items });
      } catch (error) {
        return next(error);
      }
    },

    getById: async (req, res, next) => {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: 'O identificador do curso é inválido.' });
      try {
        const item = await createCoursesRepository(req.app.locals.db).findById(id);
        if (!item) return res.status(404).json({ error: 'Curso não encontrado.' });
        return res.json({ item });
      } catch (error) {
        return next(error);
      }
    },

    create: async (req, res, next) => {
      const parsed = parseCourse(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      try {
        const item = await createCoursesRepository(req.app.locals.db).create(parsed.value);
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
      if (!id) return res.status(400).json({ error: 'O identificador do curso é inválido.' });
      const parsed = parseCourse(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      try {
        const item = await createCoursesRepository(req.app.locals.db).update(id, parsed.value);
        if (!item) return res.status(404).json({ error: 'Curso não encontrado.' });
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
      if (!id) return res.status(400).json({ error: 'O identificador do curso é inválido.' });
      try {
        const deleted = await createCoursesRepository(req.app.locals.db).delete(id);
        if (!deleted) return res.status(404).json({ error: 'Curso não encontrado.' });
        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createCoursesController };
