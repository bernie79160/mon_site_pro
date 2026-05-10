module.exports = async function healthRoutes(app) {
  app.get('/', async () => {
    return {
      status: 'ok',
      service: 'mon-site-pro-backend',
      timestamp: new Date().toISOString()
    };
  });
};
