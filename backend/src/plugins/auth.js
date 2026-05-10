const fp = require('fastify-plugin');

module.exports = fp(async function authPlugin(app) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET manquant dans les variables d\'environnement');
  }

  app.register(require('@fastify/jwt'), {
    secret: jwtSecret
  });
});
