const jwtUtils = require('../utils/jwtUtils');
const ApiError = require('../lib/ApiError');

exports.protect = (req, res, next) => {
  const token = jwtUtils.extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    throw ApiError.unauthorized('No token provided');
  }

  try {
    const decoded = jwtUtils.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};
