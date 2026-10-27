const selectCourse = `
  SELECT courses.id, courses.title, courses.description,
    courses.institution, courses.category_id, categories.name AS category_name,
    courses.modality, courses.workload_hours, courses.access_url,
    courses.status, courses.created_at
  FROM courses
  INNER JOIN categories ON categories.id = courses.category_id
`;

function createCoursesRepository(db) {
  return {
    async list(filters = {}, { admin = false } = {}) {
      const conditions = admin ? [] : ["courses.status = 'published'"];
      const values = [];
      if (filters.q) {
        conditions.push('(courses.title LIKE ? OR courses.description LIKE ? OR courses.institution LIKE ?)');
        const term = `%${filters.q}%`;
        values.push(term, term, term);
      }
      if (filters.categoryId) {
        conditions.push('courses.category_id = ?');
        values.push(filters.categoryId);
      }
      if (filters.modality) {
        conditions.push('courses.modality = ?');
        values.push(filters.modality);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const [rows] = await db.execute(
        `${selectCourse} ${where} ORDER BY courses.created_at DESC, courses.id DESC`,
        values,
      );
      return rows;
    },

    async findById(id) {
      const [rows] = await db.execute(`${selectCourse} WHERE courses.id = ? LIMIT 1`, [id]);
      return rows[0] || null;
    },

    async create(course) {
      const [result] = await db.execute(
        `INSERT INTO courses
          (title, description, institution, category_id, modality, workload_hours, access_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.title, course.description, course.institution, course.categoryId,
          course.modality, course.workloadHours, course.accessUrl, course.status,
        ],
      );
      return this.findById(result.insertId);
    },

    async update(id, course) {
      const [existing] = await db.execute('SELECT id FROM courses WHERE id = ? LIMIT 1', [id]);
      if (!existing.length) return null;
      await db.execute(
        `UPDATE courses
         SET title = ?, description = ?, institution = ?, category_id = ?,
             modality = ?, workload_hours = ?, access_url = ?, status = ?
         WHERE id = ?`,
        [
          course.title, course.description, course.institution, course.categoryId,
          course.modality, course.workloadHours, course.accessUrl, course.status, id,
        ],
      );
      return this.findById(id);
    },

    async delete(id) {
      const [result] = await db.execute('DELETE FROM courses WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
  };
}

module.exports = { createCoursesRepository };
