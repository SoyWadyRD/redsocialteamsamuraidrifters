const dotenv = require('dotenv');
dotenv.config(); // <-- lo más arriba posible

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para procesar datos JSON en el cuerpo de la solicitud
app.use(express.json());
// Middlewares
app.use(cors());

// Usar las rutas definidas en authRoutes
app.use('/api/auth', authRoutes);

// Usar las rutas definidas en carRoutes
app.use('/api/cars', carRoutes);





// Configuración de CORS para permitir solicitudes a Cloudinary
const corsOptions = {
  origin: 'http://localhost:5000',  // Puedes especificar el origen de tu frontend
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization'],  // Permitir 'Authorization' en las cabeceras
};

app.use(cors(corsOptions));  // Habilitar CORS con las opciones configuradas






// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🟢 Conectado a MongoDB'))
  .catch((err) => console.error('🔴 Error al conectar a MongoDB:', err));

// Sirve archivos estáticos desde la carpeta 'frontend/public'
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Rutas de la API (si tienes)
app.post('/api/register', (req, res) => {
    // Tu lógica para el registro de usuarios
    res.send('Registro exitoso');
});

// Configura la ruta para la página principal (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

// Configura la ruta para la página de registro (register.html)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'register.html'));
});

// Configura la ruta para la página de login (login.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'login.html'));
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
