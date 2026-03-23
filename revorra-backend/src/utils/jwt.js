import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's ID
 * @param {string} role - The user's role
 * @returns {string} The generated JWT token
 */
export const generateToken = (userId, role) => {
  const payload = {
    userId,
    role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return token;
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object|null} The decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
};
