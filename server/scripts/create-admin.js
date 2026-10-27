const bcrypt = require('bcryptjs');
const { createPool } = require('../src/config/database');

async function createAdmin() {
  const { ADMIN_NAME: name, ADMIN_EMAIL: rawEmail, ADMIN_PASSWORD: password } = process.env;

  if (!name || !rawEmail || !password) {
    throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente antes de criar o administrador.');
  }
  if (name.trim().length > 120 || password.length < 12) {
    throw new Error('O nome deve ter até 120 caracteres e a senha deve ter pelo menos 12 caracteres.');
  }

  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    throw new Error('ADMIN_EMAIL deve ser um endereço de e-mail válido.');
  }

  const pool = createPool();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email, passwordHash],
    );
    console.log(`Administrador ${email} criado com sucesso.`);
  } finally {
    await pool.end();
  }
}

createAdmin().catch((error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    console.error('Já existe uma conta com esse e-mail; nenhum administrador foi alterado.');
  } else {
    console.error(`Falha ao criar administrador: ${error.message}`);
  }
  process.exitCode = 1;
});
