require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../dataBase');
const { User, Menu, Category, Dish, Basket } = require('../models/models');

/**
 * Database seed script.
 * Ensures the system has at least one Administrator account and basic catalog structure.
 * Safe to run multiple times (idempotent).
 */
async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        await sequelize.authenticate();
        await sequelize.sync();

        // 1. Seed Admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.ADMIN_NAME || 'System Administrator';

        let admin = await User.findOne({ where: { email: adminEmail }, paranoid: false });
        if (!admin) {
            const hashPassword = await bcrypt.hash(adminPassword, 10);
            admin = await User.create({
                name: adminName,
                email: adminEmail,
                password: hashPassword,
                role: 'ADMIN',
            });
            await Basket.findOrCreate({ where: { userId: admin.id } });
            console.log(`✅ Admin user created: ${adminEmail}`);
        } else {
            console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
        }

        // 2. Seed basic Menu & Category if database is empty
        const menusCount = await Menu.count();
        if (menusCount === 0) {
            const menu = await Menu.create({
                name: 'Основне меню',
                description: 'Головне ресторанне меню',
            });

            const category = await Category.create({
                name: 'Піца',
                description: 'Свіжа італійська піца',
                menuId: menu.id,
            });

            await Dish.create({
                name: 'Маргарита',
                price: 180,
                description: 'Класична піца з моцарелою та базиліком',
                categoryId: category.id,
            });

            console.log('✅ Initial Menu, Category and Dish seeded.');
        } else {
            console.log('ℹ️ Catalog items already exist. Skipping catalog seed.');
        }

        console.log('🎉 Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
