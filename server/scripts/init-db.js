const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { getDatabaseConfig } = require('../src/config/database');

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];

    if (quote) {
      current += character;
      if (character === '\\' && quote !== '`' && index + 1 < sql.length) {
        current += sql[++index];
      } else if (character === quote) {
        if (sql[index + 1] === quote) {
          current += sql[++index];
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === '\'' || character === '"' || character === '`') {
      quote = character;
      current += character;
    } else if (character === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  if (quote) throw new Error('O script SQL contém uma string ou identificador sem fechamento.');
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function initializeDatabase() {
  const config = getDatabaseConfig(false);
  const databaseName = process.env.DB_DATABASE || 'oportuniza';

  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error('DB_DATABASE deve conter somente letras, números e sublinhados.');
  }

  const connection = await mysql.createConnection(config);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${databaseName}\``);

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    let schema = await fs.readFile(schemaPath, 'utf8');
    schema = schema
      .replace(/CREATE DATABASE IF NOT EXISTS oportuniza/i, `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``)
      .replace(/^USE\s+oportuniza\s*;/im, `USE \`${databaseName}\`;`);
    const statements = splitSqlStatements(schema);

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log(`Banco "${databaseName}" e tabelas inicializados com sucesso.`);
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch((error) => {
  console.error(`Falha ao inicializar o banco de dados: ${error.message}`);
  process.exitCode = 1;
});
