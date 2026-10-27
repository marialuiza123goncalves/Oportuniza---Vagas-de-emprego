const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createPool } = require('./config/database');
const { getJwtSecret } = require('./middleware/authenticate');
const apiRoutes = require('./routes/api');
const vagasRoutes = require('./routes/vagas');
const coursesRoutes = require('./routes/courses');

const app = express();
getJwtSecret();
const port = Number(process.env.PORT || 3000);
const db = createPool();
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
}

app.locals.db = db;
app.use(helmet());
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', apiRoutes);
app.use('/api/vagas', vagasRoutes);
app.use('/api/courses', coursesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'O corpo da requisição contém JSON inválido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'A requisição excede o limite de 32 KB.' });
  }
  console.error('Erro na API:', error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

const server = app.listen(port, () => {
  console.log(`API Oportuniza disponível em http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
