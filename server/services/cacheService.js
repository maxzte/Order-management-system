const Redis = require('ioredis');
const config = require('../config/index');

class CacheService {
    constructor() {
        this.client = null;
        this.isAvailable = false;
        this.memoryFallback = new Map();

        if (config.redis.enabled && config.env !== 'test') {
            this._initClient();
        }
    }

    _initClient() {
        try {
            const redisOptions = config.redis.url
                ? config.redis.url
                : {
                    host: config.redis.host,
                    port: config.redis.port,
                    password: config.redis.password,
                    lazyConnect: true,
                    maxRetriesPerRequest: 1,
                    enableOfflineQueue: false,
                    connectTimeout: 2000,
                    retryStrategy: (times) => {
                        if (times > 3) {
                            return null; // Stop retrying after 3 attempts
                        }
                        return Math.min(times * 200, 1000);
                    },
                };

            this.client = new Redis(redisOptions);

            this.client.on('connect', () => {
                this.isAvailable = true;
                if (config.env !== 'test') {
                    console.log('✅ Redis connected successfully.');
                }
            });

            this.client.on('error', (err) => {
                this.isAvailable = false;
                // Avoid crashing on connection refused
                if (config.env !== 'test' && err.code !== 'ECONNREFUSED') {
                    console.warn(`⚠️ Redis cache warning: ${err.message}`);
                }
            });

            this.client.on('end', () => {
                this.isAvailable = false;
            });

            this.client.connect().catch(() => {
                this.isAvailable = false;
            });
        } catch (e) {
            this.isAvailable = false;
        }
    }

    async get(key) {
        try {
            if (this.isAvailable && this.client) {
                const data = await this.client.get(key);
                return data ? JSON.parse(data) : null;
            }
        } catch (e) {
            // Graceful fallback to memory or null
        }

        const item = this.memoryFallback.get(key);
        if (item) {
            if (item.expiry && item.expiry < Date.now()) {
                this.memoryFallback.delete(key);
                return null;
            }
            return item.value;
        }
        return null;
    }

    async set(key, value, ttlSeconds = 300) {
        try {
            if (this.isAvailable && this.client) {
                await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
                return;
            }
        } catch (e) {
            // Graceful fallback to memory
        }

        this.memoryFallback.set(key, {
            value,
            expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null,
        });
    }

    async del(patternOrKey) {
        try {
            if (this.isAvailable && this.client) {
                if (patternOrKey.includes('*')) {
                    const keys = await this.client.keys(patternOrKey);
                    if (keys.length > 0) {
                        await this.client.del(...keys);
                    }
                } else {
                    await this.client.del(patternOrKey);
                }
            }
        } catch (e) {
            // Silently continue
        }

        if (patternOrKey.includes('*')) {
            const regex = new RegExp('^' + patternOrKey.replace(/\*/g, '.*') + '$');
            for (const key of this.memoryFallback.keys()) {
                if (regex.test(key)) {
                    this.memoryFallback.delete(key);
                }
            }
        } else {
            this.memoryFallback.delete(patternOrKey);
        }
    }

    async clear() {
        this.memoryFallback.clear();
        try {
            if (this.isAvailable && this.client) {
                await this.client.flushdb();
            }
        } catch (e) {
            // Silently continue
        }
    }
}

const cacheService = new CacheService();
module.exports = cacheService;
