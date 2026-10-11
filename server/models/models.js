const sequelize = require('../dataBase');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
}, {
    paranoid: true,
    timestamps: true,
    indexes: [
        { unique: true, fields: ['email'] }
    ]
});

const Order = sequelize.define('order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderAcceptanceTime: { type: DataTypes.TIME },
    orderAmount: { type: DataTypes.DOUBLE, defaultValue: 0, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
}, {
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
    ]
});

const OrderItem = sequelize.define('order_item', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    price: { type: DataTypes.DOUBLE, allowNull: false },
    amount: { type: DataTypes.DOUBLE, defaultValue: 1, allowNull: false },
}, {
    timestamps: true,
    indexes: [
        { fields: ['orderId'] },
        { fields: ['dishId'] }
    ]
});

const Dish = sequelize.define('dish', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    price: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.STRING, allowNull: false },
    rating: { type: DataTypes.INTEGER, defaultValue: 0 },
    img: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
}, {
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['categoryId'] },
        { fields: ['price'] },
        { fields: ['rating'] }
    ]
});

const Category = sequelize.define('category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    img: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
}, {
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['menuId'] }
    ]
});

const Feedback = sequelize.define('feedback', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.STRING, defaultValue: '', allowNull: false },
    dateTime: { type: DataTypes.TIME },
}, {
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['dishId'] }
    ]
});

const Menu = sequelize.define('menu', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    description: { type: DataTypes.STRING, defaultValue: '', allowNull: false },
    img: { type: DataTypes.STRING, defaultValue: '', allowNull: false },
}, {
    paranoid: true,
    timestamps: true,
});

const Basket = sequelize.define('basket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    totalAmount: { type: DataTypes.DOUBLE, defaultValue: 0, allowNull: false },
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] }
    ]
});

const BasketItem = sequelize.define('basket_item', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
}, {
    timestamps: true,
    indexes: [
        { fields: ['basketId'] },
        { fields: ['dishId'] }
    ]
});

// Relationships
User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Feedback);
Feedback.belongsTo(User);

User.hasOne(Basket, { onDelete: 'CASCADE' });
Basket.belongsTo(User);

Basket.hasMany(BasketItem, { onDelete: 'CASCADE' });
BasketItem.belongsTo(Basket);

Dish.hasMany(BasketItem, { onDelete: 'CASCADE' });
BasketItem.belongsTo(Dish);

Dish.hasMany(Feedback);
Feedback.belongsTo(Dish);

Dish.hasMany(OrderItem);
OrderItem.belongsTo(Dish);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

Menu.hasMany(Category);
Category.belongsTo(Menu);

Category.hasMany(Dish);
Dish.belongsTo(Category);

module.exports = {
    User,
    Dish,
    Category,
    Basket,
    BasketItem,
    Order,
    OrderItem,
    Feedback,
    Menu,
    sequelize,
};
