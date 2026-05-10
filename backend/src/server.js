require('dotenv').config();

const { buildApp } = require('./app');

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port, host });
    app.log.info(`API démarrée sur http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
