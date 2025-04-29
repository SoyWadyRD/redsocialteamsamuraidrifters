const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    
    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({ message: 'No autorizado. Token no encontrado.' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjuntar la información del usuario decodificada en la solicitud
    req.user = decoded;
    
    next(); // Continuar con la ejecución de la ruta
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;
