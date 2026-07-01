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

// GET user's month plan data (projects/categories/plans/tags) from Redis
app.get('/api/plans/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await redis.get(`plans:${userId}`);

    if (data) {
      res.json({ success: true, data: JSON.parse(data) });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST (Sync) user's month plan data to Redis
app.post('/api/plans/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { projects, categories, plans, tags } = req.body;

    await redis.set(`plans:${userId}`, JSON.stringify({ projects, categories, plans, tags }));

    res.json({ success: true, message: 'Plans synced successfully' });
  } catch (error) {
    console.error('Error saving plans:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- Analytics / Stats Endpoints ---

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Track an event
app.post('/api/track', async (req, res) => {
  try {
    const { userId, event } = req.body; // event: 'register', 'login', 'todo_create', 'view_timeline', 'view_status', 'view_calendar', 'view_quadrant', 'view_monthPlan', 'view_tag_modal'
    if (!userId || !event) return res.status(400).json({ success: false });

    const today = getTodayDateStr();

    if (event === 'register') {
      await redis.sadd('stats:users:total', userId);
      await redis.sadd(`stats:daily:${today}:registered`, userId);
    } else if (event === 'login') {
      await redis.sadd(`stats:daily:${today}:login`, userId);
    } else if (event === 'todo_create') {
      await redis.sadd('stats:users:has_todo', userId);
      await redis.sadd(`stats:daily:${today}:todo_create`, userId);
    } else if (event.startsWith('view_')) {
      await redis.sadd(`stats:daily:${today}:${event}`, userId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ success: false });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const today = getTodayDateStr();

    const [
      totalUsers,
      totalUsersWithTodo,
      todayRegistered,
      todayLogin,
      todayTodoCreate,
      todayViewTimeline,
      todayViewStatus,
      todayViewCalendar,
      todayViewQuadrant,
      todayViewMonthPlan,
      todayViewTagModal
    ] = await Promise.all([
      redis.scard('stats:users:total'),
      redis.scard('stats:users:has_todo'),
      redis.scard(`stats:daily:${today}:registered`),
      redis.scard(`stats:daily:${today}:login`),
      redis.scard(`stats:daily:${today}:todo_create`),
      redis.scard(`stats:daily:${today}:view_timeline`),
      redis.scard(`stats:daily:${today}:view_status`),
      redis.scard(`stats:daily:${today}:view_calendar`),
      redis.scard(`stats:daily:${today}:view_quadrant`),
      redis.scard(`stats:daily:${today}:view_monthPlan`),
      redis.scard(`stats:daily:${today}:view_tag_modal`)
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalUsersWithTodo,
        todayRegistered,
        todayLogin,
        todayTodoCreate,
        todayViewTimeline,
        todayViewStatus,
        todayViewCalendar,
        todayViewQuadrant,
        todayViewMonthPlan,
        todayViewTagModal
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
