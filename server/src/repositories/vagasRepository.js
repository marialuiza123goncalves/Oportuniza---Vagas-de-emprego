const selectVaga = `
  SELECT o.id, o.title AS titulo, o.description AS descricao,
    o.organization AS empresa, o.category_id AS categoria_id,
    c.name AS categoria, o.modality AS modalidade, o.location AS localizacao,
    o.contract_type AS tipo_contratacao, o.requirements AS requisitos,
    o.application_url AS link_candidatura, o.deadline AS prazo_candidatura,
    o.created_at AS data_publicacao, o.status
  FROM opportunities o
  INNER JOIN categories c ON c.id = o.category_id
`;

function createVagasRepository(db) {
  return {
    async listAll() {
      const [rows] = await db.execute(
        `${selectVaga} WHERE o.type = 'job' ORDER BY o.created_at DESC, o.id DESC`,
      );
      return rows;
    },

    async list(filters = {}) {
      const conditions = ["o.type = 'job'", "o.status = 'published'"];
      const values = [];
      if (filters.q) {
        conditions.push('(o.title LIKE ? OR o.description LIKE ? OR o.organization LIKE ? OR o.location LIKE ?)');
        const search = `%${filters.q}%`;
        values.push(search, search, search, search);
      }
      if (filters.categoryId) {
        conditions.push('o.category_id = ?');
        values.push(filters.categoryId);
      }
      if (filters.modality) {
        conditions.push('o.modality = ?');
        values.push(filters.modality);
      }

      const [rows] = await db.execute(
        `${selectVaga} WHERE ${conditions.join(' AND ')} ORDER BY o.created_at DESC, o.id DESC`,
        values,
      );
      return rows;
    },

    async findById(id, { admin = false } = {}) {
      const conditions = ['o.id = ?', "o.type = 'job'"];
      if (!admin) conditions.push("o.status = 'published'");
      const [rows] = await db.execute(
        `${selectVaga} WHERE ${conditions.join(' AND ')} LIMIT 1`,
        [id],
      );
      return rows[0] || null;
    },

    async create(vaga, createdBy) {
      const [result] = await db.execute(
        `INSERT INTO opportunities
          (title, description, type, organization, category_id, location, modality,
           contract_type, requirements, application_url, deadline, status, created_by)
         VALUES (?, ?, 'job', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vaga.titulo, vaga.descricao, vaga.empresa, vaga.categoriaId,
          vaga.localizacao, vaga.modalidade, vaga.tipoContratacao, vaga.requisitos,
          vaga.linkCandidatura, vaga.prazoCandidatura, vaga.status, createdBy,
        ],
      );
      return this.findById(result.insertId, { admin: true });
    },

    async update(id, vaga) {
      const [existing] = await db.execute(
        "SELECT id FROM opportunities WHERE id = ? AND type = 'job' LIMIT 1",
        [id],
      );
      if (existing.length === 0) return null;

      await db.execute(
        `UPDATE opportunities
         SET title = ?, description = ?, organization = ?, category_id = ?,
             location = ?, modality = ?, contract_type = ?, requirements = ?,
             application_url = ?, deadline = ?, status = ?
         WHERE id = ? AND type = 'job'`,
        [
          vaga.titulo, vaga.descricao, vaga.empresa, vaga.categoriaId,
          vaga.localizacao, vaga.modalidade, vaga.tipoContratacao, vaga.requisitos,
          vaga.linkCandidatura, vaga.prazoCandidatura, vaga.status, id,
        ],
      );
      return this.findById(id, { admin: true });
    },

    async delete(id) {
      const [result] = await db.execute(
        "DELETE FROM opportunities WHERE id = ? AND type = 'job'",
        [id],
      );
      return result.affectedRows > 0;
    },
  };
}

module.exports = { createVagasRepository };
