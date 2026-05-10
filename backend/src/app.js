const Fastify = require('fastify');

const prismaPlugin = require('./plugins/prisma');
const authPlugin = require('./plugins/auth');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const modulesRoutes = require('./routes/modules');
const progressionsRoutes = require('./routes/progressions');
const meRoutes = require('./routes/me');
const { testsRoutes } = require('./routes/tests');
const { tentativesRoutes } = require('./routes/tentatives');
const adminRoutes = require('./routes/admin');

function buildApp() {
  const app = Fastify({ logger: true });

  app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true
  });

  app.register(prismaPlugin);
  app.register(authPlugin);

  app.register(healthRoutes, { prefix: '/health' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(meRoutes, { prefix: '/me' });
  app.register(modulesRoutes, { prefix: '/modules' });
  app.register(progressionsRoutes, { prefix: '/progressions' });
  app.register(testsRoutes, { prefix: '/tests' });
  app.register(tentativesRoutes, { prefix: '/tentatives' });
  app.register(adminRoutes, { prefix: '/admin' });

  return app;
}

module.exports = { buildApp };
