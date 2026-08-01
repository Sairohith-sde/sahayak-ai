import app from './app.js';
import { connectDB } from './config/db.js';
import { seedData } from './data/seed.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  console.log("🚀 Initializing Sahayak AI Server Bootstrap Process...");
  
  // Connect to DB (will fallback gracefully to memory mode if connection fails)
  await connectDB();

  // Run the automatic seeder
  await seedData();

  // Listen on configured port
  app.listen(PORT, () => {
    console.log(`✅ Sahayak AI Server listening at http://localhost:${PORT}`);
    console.log(`📡 API Base endpoint mapped to http://localhost:${PORT}/api`);
  });
}

bootstrap().catch(err => {
  console.error("❌ Critical server bootstrap panic:", err);
  process.exit(1);
});
