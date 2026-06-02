import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import examRoutes from './routes/examRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('ExamApp Server is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
