const User = require('../models/User');
const Car = require('../models/Car');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const cars = await Car.find({ owner: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({ user, cars });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error });
  }
};









const bcrypt = require('bcrypt');

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar la contraseña', error });
  }
};
