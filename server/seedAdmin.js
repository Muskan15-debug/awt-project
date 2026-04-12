import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({
    name: 'Admin',
    email: 'admin@freelancehub.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
  });
  console.log('Admin seeded: admin@freelancehub.com / admin123');
  process.exit(0);
};

seedAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
