require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const coordinatorRoutes = require('./routes/coordinator');
const studentRoutes = require('./routes/student');

const app = express();

// CORS - allow localhost in dev, same origin in production
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/student', studentRoutes);

// Serve files stored in MongoDB
app.get('/api/files/:id', async (req, res) => {
  try {
    const FileStore = require('./models/FileStore');
    const file = await FileStore.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.set('Content-Type', file.mimeType);
    res.set('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.data);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving file' });
  }
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected (primary)');
  } catch (err) {
    console.error('Primary MongoDB failed:', err.message);
    if (process.env.MONGO_URI_BACKUP) {
      try {
        await mongoose.connect(process.env.MONGO_URI_BACKUP);
        console.log('MongoDB connected (backup)');
      } catch (err2) {
        console.error('Backup MongoDB also failed:', err2.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
