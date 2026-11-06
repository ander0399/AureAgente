require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server: SocketServer } = require('socket.io');
const { sequelize } = require('./models');
const webhookRoutes = require('./routes/webhook');
const conversationRoutes = require('./routes/conversations');
const { setIo } = require('./socket');

require('./workers/followUpWorker');

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.set('io', io);
setIo(io);

app.use('/webhook', webhookRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

io.on('connection', (socket) => {
  console.log('[Socket.io] Dashboard conectado:', socket.id);
  socket.on('disconnect', () => console.log('[Socket.io] Dashboard desconectado:', socket.id));
});

const PORT = process.env.PORT || 3001;

sequelize
  .authenticate()
  .then(() => {
    console.log('[DB] Conexión exitosa a PostgreSQL');
    return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`[Server] Corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Server] Error al iniciar:', err);
    process.exit(1);
  });
