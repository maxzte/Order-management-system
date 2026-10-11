const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Order Management System API',
        version: '1.0.0',
        description: 'RESTful API для системи управління замовленнями ресторану/закладу',
    },
    servers: [
        {
            url: '/api',
            description: 'Поточний сервер API',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Іван Франко' },
                    email: { type: 'string', example: 'user@example.com' },
                    role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
                },
            },
            Dish: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 10 },
                    name: { type: 'string', example: 'Піца Маргарита' },
                    price: { type: 'number', example: 180 },
                    description: { type: 'string', example: 'Класична піца' },
                    rating: { type: 'integer', example: 5 },
                    img: { type: 'string', example: 'default.png' },
                    categoryId: { type: 'integer', example: 2 },
                },
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 101 },
                    orderAmount: { type: 'number', example: 360 },
                    status: {
                        type: 'string',
                        enum: ['Обробка замовлення', 'Замовлення виконується', 'Замовлення виконане', 'Оплачено'],
                        example: 'Обробка замовлення',
                    },
                    userId: { type: 'integer', example: 1 },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Health: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'integer', example: 124 },
                    database: { type: 'string', example: 'connected' },
                    timestamp: { type: 'string', format: 'date-time' },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Invalid input data' },
                    requestId: { type: 'string', example: '8f7d995c-3522-4a0f-ba0d-61c469f37c41' },
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                summary: 'Перевірка стану працездатності сервера та бази даних',
                responses: {
                    200: {
                        description: 'Сервер та база даних працюють коректно',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Health' } },
                        },
                    },
                },
            },
        },
        '/user/reg': {
            post: {
                summary: 'Реєстрація нового користувача',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string', example: 'Олександр' },
                                    email: { type: 'string', example: 'alex@example.com' },
                                    password: { type: 'string', example: 'secret123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Успішна реєстрація з поверненням JWT' },
                    400: { description: 'Помилка валідації або email вже зайнятий' },
                },
            },
        },
        '/user/login': {
            post: {
                summary: 'Вхід в систему',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'alex@example.com' },
                                    password: { type: 'string', example: 'secret123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Авторизовано' },
                    400: { description: 'Невірний пароль або email' },
                },
            },
        },
        '/dish': {
            get: {
                summary: 'Отримання списку страв (з пагінацією та сортуванням)',
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                    { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price', 'rating'] } },
                    { name: 'dir', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } },
                ],
                responses: {
                    200: { description: 'Список страв' },
                },
            },
            post: {
                summary: 'Створення нової страви (лише ADMIN)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Страву успішно створено' },
                    403: { description: 'Недостатньо прав' },
                },
            },
        },
        '/order/{userId}': {
            post: {
                summary: 'Оформлення замовлення з поточного кошика',
                parameters: [
                    { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
                ],
                responses: {
                    200: { description: 'Замовлення створено, кошик очищено' },
                    400: { description: 'Кошик порожній або некоректні дані' },
                },
            },
        },
        '/dashboard': {
            get: {
                summary: 'Загальна статистика для панелі керування (лише ADMIN)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Кількість користувачів, замовлень та продажів' },
                    403: { description: 'Доступ заборонено' },
                },
            },
        },
    },
};

module.exports = {
    swaggerUi,
    swaggerDocument,
};
