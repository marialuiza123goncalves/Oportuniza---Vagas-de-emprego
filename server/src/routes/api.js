const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { authenticate, getJwtSecret } = require('../middleware/authenticate');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

const opportunityColumns = `
  o.id, o.title, o.description, o.type, o.organization, o.category_id,
  c.name AS category_name, o.location, o.modality, o.requirements,
  o.contract_type, o.application_url, o.deadline, o.status, o.created_by,
  o.created_at, o.updated_at
`;

function sendValidationError(res, message) {
  return res.status(400).json({ error: message });
}

function parseOpportunity(body) {
  const textFields = ['title', 'description', 'type', 'organization', 'modality', 'applicationUrl', 'status'];
  for (const field of textFields) {
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      return { error: `O campo "${field}" é obrigatório.` };
    }
  }

  const title = body.title.trim();
  const description = body.description.trim();
  const organization = body.organization.trim();
  if (title.length > 180) return { error: 'O título deve ter no máximo 180 caracteres.' };
  if (description.length > 20000) return { error: 'A descrição deve ter no máximo 20000 caracteres.' };
  if (organization.length > 160) return { error: 'A organização deve ter no máximo 160 caracteres.' };
  if (!['job', 'training'].includes(body.type)) return { error: 'O tipo deve ser job ou training.' };
  if (!['onsite', 'hybrid', 'remote'].includes(body.modality)) {
    return { error: 'A modalidade deve ser onsite, hybrid ou remote.' };
  }
  const contractType = body.contractType || 'full_time';
  if (!['full_time', 'part_time', 'temporary', 'internship', 'apprenticeship', 'contractor'].includes(contractType)) {
    return { error: 'O tipo de contratação informado não é válido.' };
  }
  if (!['draft', 'published', 'closed'].includes(body.status)) {
    return { error: 'A situação deve ser draft, published ou closed.' };
  }

  const categoryId = Number(body.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    return { error: 'Selecione uma categoria válida.' };
  }

  const optionalText = (field, maxLength) => {
    if (body[field] == null || body[field] === '') return null;
    if (typeof body[field] !== 'string' || body[field].trim().length > maxLength) {
      return undefined;
    }
    return body[field].trim();
  };

  const location = optionalText('location', 160);
  if (location === undefined) return { error: 'A localidade deve ter no máximo 160 caracteres.' };
  const requirements = optionalText('requirements', 10000);
  if (requirements === undefined) return { error: 'Os requisitos devem ter no máximo 10000 caracteres.' };

  let applicationUrl;
  try {
    applicationUrl = new URL(body.applicationUrl.trim());
  } catch {
    return { error: 'Informe um link de candidatura válido.' };
  }
  if (!['http:', 'https:'].includes(applicationUrl.protocol) || applicationUrl.href.length > 2048) {
    return { error: 'O link de candidatura deve usar HTTP ou HTTPS e ter no máximo 2048 caracteres.' };
  }

  let deadline = null;
  if (body.deadline != null && body.deadline !== '') {
    if (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
      return { error: 'O prazo deve estar no formato AAAA-MM-DD.' };
    }
    const date = new Date(`${body.deadline}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.deadline) {
      return { error: 'Informe uma data de prazo válida.' };
    }
    deadline = body.deadline;
  }

  return {
    value: {
      title,
      description,
      type: body.type,
      organization,
      categoryId,
      location,
      modality: body.modality,
      contractType,
      requirements,
      applicationUrl: applicationUrl.href,
      deadline,
      status: body.status,
    },
  };
}

function parsePositiveInteger(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

router.get('/health', async (req, res, next) => {
  try {
    await req.app.locals.db.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return next(error);
  }
});

router.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return sendValidationError(res, 'Informe e-mail e senha.');
    }

    const [users] = await req.app.locals.db.execute(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? AND is_active = TRUE LIMIT 1',
      [email.trim().toLowerCase()],
    );
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { name: users[0].name, email: users[0].email },
      getJwtSecret(),
      { subject: String(users[0].id), expiresIn: '8h' },
    );
    return res.json({
      token,
      expiresIn: 28800,
      admin: { id: users[0].id, name: users[0].name, email: users[0].email },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [categories] = await req.app.locals.db.query(
      'SELECT id, name, slug FROM categories ORDER BY name',
    );
    return res.json({ items: categories });
  } catch (error) {
    return next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.query(
      `SELECT
        (SELECT COUNT(*) FROM opportunities WHERE type = 'job' AND status = 'published') AS vacancies,
        (SELECT COUNT(*) FROM courses WHERE status = 'published') AS courses`,
    );
    return res.json({ vacancies: rows[0].vacancies, courses: rows[0].courses });
  } catch (error) {
    return next(error);
  }
});

router.get('/opportunities', async (req, res, next) => {
  const { q, type, categoryId, page = '1', pageSize = '12' } = req.query;
  const pageNumber = parsePositiveInteger(page);
  const sizeNumber = parsePositiveInteger(pageSize);
  const parsedCategoryId = categoryId === undefined ? null : parsePositiveInteger(categoryId);

  if (pageNumber === null || sizeNumber === null || sizeNumber > 50) {
    return sendValidationError(res, 'A página deve ser positiva e o tamanho deve estar entre 1 e 50.');
  }
  if (q !== undefined && (typeof q !== 'string' || q.trim().length > 100)) {
    return sendValidationError(res, 'A pesquisa deve ter no máximo 100 caracteres.');
  }
  if (type !== undefined && !['job', 'training'].includes(type)) {
    return sendValidationError(res, 'O tipo deve ser job ou training.');
  }
  if (categoryId !== undefined && parsedCategoryId === null) {
    return sendValidationError(res, 'A categoria selecionada é inválida.');
  }

  const conditions = ["o.status = 'published'"];
  const values = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push('(o.title LIKE ? OR o.description LIKE ? OR o.organization LIKE ? OR o.location LIKE ?)');
    values.push(term, term, term, term);
  }
  if (type) {
    conditions.push('o.type = ?');
    values.push(type);
  }
  if (parsedCategoryId !== null) {
    conditions.push('o.category_id = ?');
    values.push(parsedCategoryId);
  }

  try {
    const where = conditions.join(' AND ');
    const [countRows] = await req.app.locals.db.execute(
      `SELECT COUNT(*) AS total FROM opportunities o WHERE ${where}`,
      values,
    );
    const offset = (pageNumber - 1) * sizeNumber;
    if (!Number.isSafeInteger(offset)) return sendValidationError(res, 'O número da página é muito grande.');

    const [items] = await req.app.locals.db.execute(
      `SELECT o.id, o.title, o.description, o.type, o.organization, o.category_id,
        c.name AS category_name, o.location, o.modality, o.application_url,
        o.contract_type, o.deadline, o.created_at
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       WHERE ${where}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT ? OFFSET ?`,
      [...values, sizeNumber, offset],
    );

    return res.json({
      items,
      pagination: { page: pageNumber, pageSize: sizeNumber, total: countRows[0].total },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/opportunities/:id', async (req, res, next) => {
  const id = parsePositiveInteger(req.params.id);
  if (id === null) return sendValidationError(res, 'O identificador da oportunidade é inválido.');

  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT ${opportunityColumns}
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       WHERE o.id = ? AND o.status = 'published'
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Oportunidade não encontrada.' });
    return res.json({ item: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.use('/admin', authenticate);

router.get('/admin/opportunities', async (req, res, next) => {
  try {
    const [items] = await req.app.locals.db.query(
      `SELECT ${opportunityColumns}
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       ORDER BY o.created_at DESC, o.id DESC`,
    );
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/opportunities/:id', async (req, res, next) => {
  const id = parsePositiveInteger(req.params.id);
  if (id === null) return sendValidationError(res, 'O identificador da oportunidade é inválido.');

  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT ${opportunityColumns}
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       WHERE o.id = ? LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Oportunidade não encontrada.' });
    return res.json({ item: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/opportunities', async (req, res, next) => {
  const parsed = parseOpportunity(req.body || {});
  if (parsed.error) return sendValidationError(res, parsed.error);
  const item = parsed.value;

  try {
    const [result] = await req.app.locals.db.execute(
      `INSERT INTO opportunities
        (title, description, type, organization, category_id, location, modality, contract_type,
         requirements, application_url, deadline, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.title, item.description, item.type, item.organization, item.categoryId,
        item.location, item.modality, item.contractType, item.requirements, item.applicationUrl,
        item.deadline, item.status, req.user.id,
      ],
    );
    const [rows] = await req.app.locals.db.execute(
      `SELECT ${opportunityColumns}
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       WHERE o.id = ?`,
      [result.insertId],
    );
    return res.status(201).json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendValidationError(res, 'A categoria selecionada não existe.');
    }
    return next(error);
  }
});

router.put('/admin/opportunities/:id', async (req, res, next) => {
  const id = parsePositiveInteger(req.params.id);
  if (id === null) return sendValidationError(res, 'O identificador da oportunidade é inválido.');
  const parsed = parseOpportunity(req.body || {});
  if (parsed.error) return sendValidationError(res, parsed.error);
  const item = parsed.value;

  try {
    const [existing] = await req.app.locals.db.execute(
      'SELECT id FROM opportunities WHERE id = ? LIMIT 1',
      [id],
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Oportunidade não encontrada.' });

    await req.app.locals.db.execute(
      `UPDATE opportunities
       SET title = ?, description = ?, type = ?, organization = ?, category_id = ?,
           location = ?, modality = ?, contract_type = ?, requirements = ?, application_url = ?,
           deadline = ?, status = ?
       WHERE id = ?`,
      [
        item.title, item.description, item.type, item.organization, item.categoryId,
        item.location, item.modality, item.contractType, item.requirements, item.applicationUrl,
        item.deadline, item.status, id,
      ],
    );
    const [rows] = await req.app.locals.db.execute(
      `SELECT ${opportunityColumns}
       FROM opportunities o
       INNER JOIN categories c ON c.id = o.category_id
       WHERE o.id = ?`,
      [id],
    );
    return res.json({ item: rows[0] });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendValidationError(res, 'A categoria selecionada não existe.');
    }
    return next(error);
  }
});

router.delete('/admin/opportunities/:id', async (req, res, next) => {
  const id = parsePositiveInteger(req.params.id);
  if (id === null) return sendValidationError(res, 'O identificador da oportunidade é inválido.');

  try {
    const [result] = await req.app.locals.db.execute(
      'DELETE FROM opportunities WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Oportunidade não encontrada.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
