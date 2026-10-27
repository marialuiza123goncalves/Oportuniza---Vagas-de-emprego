const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET precisa ter pelo menos 32 bytes. Configure-o em server/.env.');
  }

  return secret;
}

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Autenticação administrativa necessária.' });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], getJwtSecret());
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    return next(error);
  }

  if (typeof payload.sub !== 'string' || !/^\d+$/.test(payload.sub)) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  try {
    const [users] = await req.app.locals.db.execute(
      'SELECT id FROM users WHERE id = ? AND is_active = TRUE LIMIT 1',
      [payload.sub],
    );
    if (users.length === 0) return res.status(401).json({ error: 'A conta administrativa não está ativa.' });

    req.user = { id: payload.sub };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate, getJwtSecret };
