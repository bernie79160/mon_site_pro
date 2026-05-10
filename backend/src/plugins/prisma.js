const fp = require('fastify-plugin');
const { PrismaClient } = require('@prisma/client');

module.exports = fp(async function prismaPlugin(app) {
  const prisma = new PrismaClient();

  await prisma.$connect();
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
