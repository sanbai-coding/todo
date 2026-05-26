import express from 'express';
import cors from 'cors';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Redis (Render will provide REDIS_URL environment variable)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Zhouzhou API is running' });
});

// GET user todos from Redis
app.get('/api/todos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await redis.get(`todos:${userId}`);
    
    if (data) {
      res.json({ success: true, data: JSON.parse(data) });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST (Sync) user todos to Redis
app.post('/api/todos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { todos } = req.body;
    
    // Store as JSON string
    await redis.set(`todos:${userId}`, JSON.stringify(todos));
    
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Error saving todos:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
