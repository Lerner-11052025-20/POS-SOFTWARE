const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Category = require('../models/Category');
const User = require('../models/User');

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#F59E0B' },
  { name: 'Drink', color: '#38BDF8' },
  { name: 'Pastries', color: '#F472B6' },
  { name: 'Quick Bites', color: '#34D399' },
  { name: 'Desserts', color: '#8B5CF6' },
  { name: 'Beverages', color: '#06B6D4' },
  { name: 'Starters', color: '#F97316' },
  { name: 'Main Course', color: '#EF4444' },
  { name: 'Combo Meals', color: '#D97706' },
  { name: 'Specials', color: '#E11D48' },
];

async function seedCategories() {
  try {
    await connectDB();
    console.log('Connected to MongoDB...');

    // Find a manager user to assign as creator
    let creator = await User.findOne({ role: 'manager' });
    if (!creator) {
      creator = await User.findOne({});
    }
    if (!creator) {
      console.error('No users found in the database. Please create a user first.');
      process.exit(1);
    }

    console.log(`Using creator: ${creator.fullName || creator.email} (${creator.role})`);

    let created = 0;
    let skipped = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const exists = await Category.findOne({
        name: { $regex: new RegExp(`^${cat.name}$`, 'i') },
      });
      if (exists) {
        if (exists.color !== cat.color) {
          exists.color = cat.color;
          await exists.save();
          console.log(`  🔄  "${cat.name}" color updated to ${cat.color}`);
          created++;
        } else {
          console.log(`  ⏭️  "${cat.name}" already exists — skipped`);
          skipped++;
        }
      } else {
        await Category.create({
          name: cat.name,
          color: cat.color,
          createdBy: creator._id,
        });
        console.log(`  ✅  "${cat.name}" created (${cat.color})`);
        created++;
      }
    }

    console.log(`\nDone! Created: ${created} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedCategories();
