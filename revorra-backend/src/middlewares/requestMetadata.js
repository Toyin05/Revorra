/**
 * Request Metadata Middleware
 * Captures IP address and device fingerprint from incoming requests
 */

/**
 * Extract IP address from request
 * Handles proxies (X-Forwarded-For, X-Real-IP)
 */
const getIPAddress = (req) => {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP (client IP)
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP (nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fall back to connection remote address
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Extract device fingerprint from request headers
 */
const getDeviceFingerprint = (req) => {
  // Custom header for device fingerprint (can be set by frontend)
  return req.headers['x-device-id'] || 
         req.headers['x-device-fingerprint'] || 
         null;
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || null;
};

/**
 * Request metadata middleware
 * Attaches metadata to request object
 */
const requestMetadata = (req, res, next) => {
  // Attach metadata to request
  req.metadata = {
    ip: getIPAddress(req),
    deviceFingerprint: getDeviceFingerprint(req),
    userAgent: getUserAgent(req),
    timestamp: new Date().toISOString()
  };
  
  // Also attach for convenience
  req.ipAddress = req.metadata.ip;
  req.deviceFingerprint = req.metadata.deviceFingerprint;
  req.userAgent = req.metadata.userAgent;
  
  next();
};

export {
  requestMetadata,
  getIPAddress,
  getDeviceFingerprint,
  getUserAgent
};
