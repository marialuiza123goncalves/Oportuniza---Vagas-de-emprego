const { createPool } = require('../src/config/database');

async function checkDatabase() {
  const pool = createPool();

  try {
    const [tableRows] = await pool.query(
      `SELECT
        VERSION() AS version,
        COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name IN ('users', 'categories', 'opportunities', 'courses')`,
    );

    if (Number(tableRows[0].table_count) !== 4) {
      throw new Error(
        `Conexão estabelecida, mas as tabelas esperadas não foram encontradas (4 de 4; encontradas: ${tableRows[0].table_count}). Execute "npm run db:init".`,
      );
    }

    const expectedColumns = {
      opportunities: ['id', 'title', 'description', 'organization', 'category_id', 'modality', 'location', 'contract_type', 'requirements', 'created_at'],
      courses: ['id', 'title', 'description', 'institution', 'category_id', 'modality', 'workload_hours', 'access_url', 'created_at'],
    };
    const [columns] = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name IN ('opportunities', 'courses')`,
    );
    const availableColumns = new Map();
    for (const column of columns) {
      const table = column.TABLE_NAME.toLowerCase();
      if (!availableColumns.has(table)) availableColumns.set(table, new Set());
      availableColumns.get(table).add(column.COLUMN_NAME.toLowerCase());
    }

    const missingColumns = Object.entries(expectedColumns).flatMap(([table, names]) =>
      names.filter((name) => !availableColumns.get(table)?.has(name)).map((name) => `${table}.${name}`),
    );
    if (missingColumns.length > 0) {
      throw new Error(
        `Faltam colunas obrigatórias no esquema: ${missingColumns.join(', ')}. Execute "npm run db:init".`,
      );
    }

    console.log(`Conexão MySQL OK (versão ${tableRows[0].version}); 4 tabelas e colunas obrigatórias de vagas/cursos confirmadas.`);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch((error) => {
  console.error(`Falha na verificação do banco de dados: ${error.message}`);
  process.exitCode = 1;
});
