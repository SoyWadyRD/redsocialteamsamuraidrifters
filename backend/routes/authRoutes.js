const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  updateProfile, 
  forgotPassword, 
  resetPassword, 
  serveResetPasswordPage, 
  verifyEmail,
  verifyToken
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Registro
router.post('/register', registerUser);

// Verificación de correo
router.get('/verify-email/:token', verifyEmail);

// Login
router.post('/login', loginUser);

// Ruta para actualizar nombre de usuario o foto de perfil
router.put('/update-profile', authMiddleware, updateProfile);

// Recuperar contraseña
router.post('/forgot-password', forgotPassword);

// Redirige a la página de restablecimiento de contraseña
router.get('/reset-password/:token', serveResetPasswordPage);

// Restablecer la contraseña
router.post('/reset-password/:token', resetPassword);

router.get('/verify-token', verifyToken);

module.exports = router;
