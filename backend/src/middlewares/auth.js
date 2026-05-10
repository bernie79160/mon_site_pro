async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.code(401).send({ message: 'Non authentifié' });
  }
}

function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async function roleGuard(request, reply) {
    if (!request.user || !request.user.role) {
      return reply.code(401).send({ message: 'Non authentifié' });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ message: 'Accès refusé' });
    }
  };
}

module.exports = { authenticate, requireRole };
