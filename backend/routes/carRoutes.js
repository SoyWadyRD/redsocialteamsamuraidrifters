const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const { getCars, likeCar, commentCar, unlikeCar, deleteComment, deleteCar } = require('../controllers/carController');





// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Configuración del almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'autos',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

// Creación del middleware multer
const upload = multer({ storage: storage });

router.post('/upload', authenticateJWT, upload.single('image'), async (req, res) => {
    try {
      console.log('Imagen recibida:', req.file); // Verifica que se recibe la imagen
      // Llamar al controlador para guardar el auto
      await carController.uploadCar(req, res);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).json({ message: 'Error al procesar la solicitud de carga' });
    }
  });








// Ruta para obtener todos los autos
router.get('/', carController.getCars); // <-- sólo '/'





// Ruta para dar like a un auto
router.post('/:id/like', authenticateJWT, likeCar);

// Ruta para quitar el like de un auto
router.delete('/:id/unlike', authenticateJWT, unlikeCar);




router.post('/:id/comment', authenticateJWT, commentCar);






// Para borrar un comentario
router.delete('/:carId/comment/:commentId', authenticateJWT, deleteComment);




// Ruta para eliminar un auto
router.delete('/:carId', authenticateJWT, carController.deleteCar); 
  

module.exports = router;
