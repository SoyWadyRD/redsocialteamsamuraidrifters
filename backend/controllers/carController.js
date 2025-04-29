const Car = require('../models/Car');
const cloudinary = require('../config/cloudinary'); // Asegúrate de importar correctamente

const uploadCar = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body; // Ahora obtenemos imageUrl del cuerpo

   

    if (!title || !description || !imageUrl) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    if (!req.user) {
      return res.status(400).json({ message: 'Usuario no autenticado' });
    }

    const car = new Car({
      title,
      description,
      user: req.user._id,  // Asegúrate de que el ID del usuario esté disponible
      imageUrl,  // Aquí ya tenemos la URL de la imagen desde Cloudinary
    });

    
    await car.save();
    res.status(201).json({ message: 'Auto subido con éxito', car });
  } catch (error) {
    console.error('Error al subir el auto:', error);
    res.status(500).json({ message: 'Error al subir el auto' });
  }
};









const getCars = async (req, res) => {
  try {
    const cars = await Car.find()
      .populate('user', 'username')           // Poblamos el 'user' que subió el auto
      .populate('likes', 'username')          // Poblamos los usuarios que dieron like
      .populate('comments.user', 'username')  // Poblamos el 'user' de cada comentario
      .sort({ createdAt: -1 });               // Ordenar por fecha (opcional)

    // Verificar si los autos están definidos correctamente
    if (!cars || cars.length === 0) {
      return res.status(404).json({ message: 'No se encontraron autos.' });
    }

    // Asegurarse de que los datos sean válidos y no haya undefined en likes o comments
    const carsWithValidData = cars.map(car => ({
      ...car.toObject(),
      likes: car.likes || [],  // Si no tiene likes, asegurarse de que sea un array vacío
      comments: car.comments || []  // Si no tiene comentarios, asegurarse de que sea un array vacío
    }));

    return res.status(200).json(carsWithValidData);
  } catch (error) {
    console.error('Error al obtener los autos:', error);
    return res.status(500).json({ message: 'Error al obtener los autos' });
  }
};















// Dar like a un auto
const likeCar = async (req, res) => {
  try {
    const carId = req.params.id;  // Usamos 'id' en vez de 'carId'
    const userId = req.user._id;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Auto no encontrado' });
    }

    if (car.likes.includes(userId)) {
      return res.status(400).json({ message: 'Ya le diste like a este auto' });
    }

    car.likes.push(userId);
    await car.save();

    res.status(200).json({ message: 'Like agregado exitosamente', car });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({ message: 'Error al dar like' });
  }
};

// Quitar like de un auto
const unlikeCar = async (req, res) => {
  try {
    const carId = req.params.id;  // Usamos 'id' en vez de 'carId'
    const userId = req.user._id;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Auto no encontrado' });
    }

    const index = car.likes.indexOf(userId);
    if (index === -1) {
      return res.status(400).json({ message: 'No has dado like a este auto' });
    }

    car.likes.splice(index, 1);
    await car.save();

    return res.status(200).json({ message: 'Like eliminado correctamente', car });
  } catch (error) {
    console.error('Error al quitar like:', error);
    return res.status(500).json({ message: 'Error al quitar el like' });
  }
};





// Comentar un auto
const commentCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user._id;
    const { text } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Auto no encontrado' });
    }

    car.comments.push({ user: userId, text });
    await car.save();

    res.status(200).json({ message: 'Comentario agregado exitosamente' });
  } catch (error) {
    console.error('Error al comentar:', error);
    res.status(500).json({ message: 'Error al comentar' });
  }
};










const deleteComment = async (req, res) => {
  try {
    const carId = req.params.carId;
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Auto no encontrado' });
    }

    // Buscar el comentario
    const comment = car.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Solo el autor del comentario puede borrarlo
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para borrar este comentario' });
    }

    // Elimina el comentario del array
    car.comments.pull(commentId);  // Usar 'pull' en lugar de 'remove'

    await car.save();

    res.status(200).json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al borrar comentario:', error);
    res.status(500).json({ message: 'Error al borrar comentario' });
  }
};















// Función para eliminar un auto
const deleteCar = async (req, res) => {
  try {
    const { carId } = req.params;  // Obtener el ID del auto desde la URL
    const userId = req.user.id;    // Obtener el ID del usuario desde el JWT

    // Buscar el auto por ID
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ message: 'Auto no encontrado' });
    }

    // Verificar que el usuario sea el propietario del auto
    if (car.user.toString() !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este auto' });
    }

    // Eliminar el auto
    await Car.findByIdAndDelete(carId);  // Eliminar usando findByIdAndDelete

    res.status(200).json({ message: 'Auto eliminado exitosamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el auto' });
  }
};

module.exports = { uploadCar, getCars, commentCar, likeCar, deleteComment, unlikeCar, deleteCar }; // Exporta las funciones
