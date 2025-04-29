const express = require('express');
const router = express.Router();
const { createComment, getCommentsByCar } = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un comentario (requiere autenticación)
router.post('/:carId', authMiddleware, createComment);

// Obtener comentarios por auto (público)
router.get('/:carId', getCommentsByCar);

module.exports = router;
