/**
 * Middleware para logging de peticiones HTTP
 * 
 * Este middleware registra información sobre las peticiones entrantes
 */

/**
 * Genera un ID único para cada petición
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Middleware para registrar información de las peticiones
 */
function requestLogger(req, res, next) {
  // Generar ID único para la petición
  const requestId = generateRequestId();
  req.requestId = requestId;

  // Capturar tiempo de inicio
  const start = Date.now();
  
  // Información básica de la petición
  const logData = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
  };

  // Log de inicio de petición
  console.log(`[REQUEST] ${JSON.stringify(logData)}`);
  
  // Capturar respuesta
  const originalSend = res.send;
  res.send = function(body) {
    const end = Date.now();
    const duration = end - start;
    
    // Log de finalización con código de estado y duración
    console.log(`[RESPONSE] ${JSON.stringify({
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    })}`);
    
    return originalSend.call(this, body);
  };
  
  next();
}

module.exports = { requestLogger };
