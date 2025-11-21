import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Role } from '../src/models/Role.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Load Environment Variables ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Load .env file from root

// This runs ONCE before all tests
beforeAll(async () => {
  // Connect to the real database
  await mongoose.connect(process.env.MONGO_URI);
});

// This runs before EACH test
beforeEach(async () => {
  // Clear all data from all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // --- SEED ESSENTIAL DATA ---
  // We MUST seed the "Employee" and "Admin" roles,
  // otherwise, the register API will fail.
  await Role.insertMany([
    { name: 'Employee', description: 'Default user role' },
    { name: 'Admin', description: 'Administrator role' }
  ]);
});

// This runs ONCE after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});