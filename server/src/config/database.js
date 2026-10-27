const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getDatabaseConfig(includeDatabase = true) {
  const requiredVariables = ['DB_HOST', 'DB_USER'];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Variáveis obrigatórias ausentes no server/.env: ${missingVariables.join(', ')}`);
  }

  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT deve ser um número inteiro entre 1 e 65535.');
  }

  const config = {
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  };

  if (includeDatabase) {
    config.database = process.env.DB_DATABASE || 'oportuniza';
  }

  return config;
}

function createPool() {
  return mysql.createPool({
    ...getDatabaseConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: ['DATE'],
  });
}

module.exports = { createPool, getDatabaseConfig };
