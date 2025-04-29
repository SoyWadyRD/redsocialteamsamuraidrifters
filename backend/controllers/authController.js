const bcrypt = require('bcrypt');
const User = require('../models/User');
const crypto = require('crypto'); // Necesario para la generación del token de verificación
const nodemailer = require('nodemailer'); // Necesario para enviar el correo de verificación
const jwt = require('jsonwebtoken'); // Necesario para crear el token JWT
const path = require('path'); // Asegúrate de importar 'path'

// Función para registrar usuarios
const registerUser = async (req, res) => {
  try {
    let { email, username, password } = req.body;

    // Validaciones básicas
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    email = email.toLowerCase(); // Asegurarse que el email esté en minúscula

    // Validar formato de correo
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return res.status(400).json({ message: 'Correo electrónico inválido.' });
    }

    // Verificar si ya existe el email o username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo o el nombre de usuario ya están registrados.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken;

    // Guardar usuario en la base de datos
    await newUser.save();

    // Crear un enlace de verificación
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;

    // Enviar correo de verificación
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: 'Verificación de correo electrónico',
      html: `
        <div style="background-color:#0a0a0a;padding:40px 0; font-family: 'Orbitron', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;color:#e0e0e0;padding:30px;border:1px solid #00f0ff;">
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <h1 style="color:#00f0ff;font-size:28px;margin:0;text-shadow:2px 2px 10px #00f0ff;">¡Bienvenido al Team Samurai Drifters!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;line-height:1.5;padding-bottom:30px;">
                      Estás a un paso de unirte a nuestra comunidad. Haz clic en el siguiente enlace para verificar tu correo electrónico:
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="${verificationUrl}" style="display:inline-block;background-color:#00f0ff;color:#0a0a0a;text-decoration:none;padding:14px 28px;font-weight:bold;font-size:18px;border-radius:6px;border:2px solid #00f0ff;">Verificar correo</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:30px;font-size:14px;color:#ff4f4f;text-align:center;">
                      Si no fuiste tú quien se registró, puedes ignorar este mensaje.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    };
    
    

    


    await transporter.sendMail(mailOptions);

    // Crear token JWT para el usuario
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
      },
      token,
    });

  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: 'Error al registrar usuario, por favor intenta de nuevo más tarde.', error });
  }
};

















const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    // Buscar al usuario por el token de verificación
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send('Enlace de verificación inválido o expirado.');
    }

    // Marca al usuario como verificado
    user.isVerified = true;
    user.verificationToken = undefined;  // Borra el token de verificación
    await user.save();  // Guardar los cambios en la base de datos

    // Redirige al archivo HTML de verificación de correo
    res.sendFile(path.join(__dirname, '../..', 'frontend', 'public', 'verify-email.html'));

  } catch (error) {
    console.error(error);
    return res.status(500).send('Hubo un error al verificar el correo.');
  }
};

















const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar si el correo está verificado
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Por favor, verifica tu correo antes de iniciar sesión.' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    // Generar el token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Inicio de sesión exitoso.', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Hubo un error en el proceso de inicio de sesión.' });
  }
};

  


























  const updateProfile = async (req, res) => {
    try {
      const { username, profilePic } = req.body;
      const userId = req.user.id;  // Obtener el ID del usuario desde el token JWT
  
      // Buscar al usuario por ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }
  
      // Validar nombre de usuario (si lo está actualizando)
      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        user.username = username;
      }
  
      // Actualizar foto de perfil (si la está actualizando)
      if (profilePic) {
        user.profilePic = profilePic;
      }
  
      // Guardar los cambios en la base de datos
      await user.save();
  
      res.status(200).json({ message: 'Perfil actualizado exitosamente.', user });
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el perfil.', error });
    }
  };
  















  // Función para recuperar la contraseña
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar si el correo electrónico existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'El correo electrónico no está registrado.' });
    }

    // Generar un token de recuperación único
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000;  // Expira en 1 hora
    await user.save();

    // Crear un enlace para la recuperación de la contraseña
    const resetUrl = `${process.env.BASE_URL}/api/auth/reset-password/${resetToken}`;

    // Enviar el correo con el enlace de recuperación
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Restablece tu contraseña - Samurai Drifters',
      html: `
        <div style="background-color:#0a0a0a;padding:40px 0; font-family: 'Orbitron', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;color:#e0e0e0;padding:30px;border:1px solid #00f0ff;">
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <h1 style="color:#00f0ff;font-size:26px;margin:0;text-shadow:2px 2px 10px #00f0ff;">Solicitud para restablecer tu contraseña</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;line-height:1.5;padding-bottom:30px;">
                      Hemos recibido una solicitud para cambiar tu contraseña. Si fuiste tú, haz clic en el siguiente botón para restablecerla:
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="${resetUrl}" style="display:inline-block;background-color:#00f0ff;color:#0a0a0a;text-decoration:none;padding:14px 28px;font-weight:bold;font-size:18px;border-radius:6px;border:2px solid #00f0ff;">Restablecer contraseña</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:30px;font-size:14px;color:#ff4f4f;text-align:center;">
                      Si no solicitaste este cambio, puedes ignorar este mensaje.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    };
    





    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Te hemos enviado un correo con el enlace para recuperar tu contraseña.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar el correo de recuperación', error });
  }
};













// Función para restablecer la contraseña
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Buscar al usuario por el token y verificar que no esté expirado
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: 'Token de recuperación inválido o expirado.' });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Actualizar la contraseña del usuario
    user.password = hashedPassword;
    user.resetToken = undefined;  // Limpiar el token de recuperación
    user.resetTokenExpiration = undefined;  // Limpiar la fecha de expiración
    await user.save();
    
    // Solo enviamos la respuesta de éxito sin redirección
    res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
    
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar la contraseña', error });
  }
};











// Función para servir la página de restablecimiento de contraseña
const serveResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    // Verificar si existe un usuario con ese token y que no esté expirado
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send('El enlace para restablecer la contraseña no es válido o ha expirado.');
    }

    // Si el token es válido, servir la página HTML
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'public', 'reset-password.html'));
  } catch (err) {
    res.status(500).send('Error al cargar la página de restablecimiento');
  }
};























// Verifica si el token es válido (para mantener sesión)
const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    res.json({ user });
  });
};
  




  module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyEmail, // ← esta debe existir
    serveResetPasswordPage,
    verifyToken // <= no olvides exportarla aquí
  };
  











  