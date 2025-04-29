const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Ajusta según tu estructura

const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    req.user = user;  // Asigna el usuario al objeto req
    next();  // Pasa al siguiente middleware o controlador
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = authenticateUser;
