const cacheService = require('../services/cacheService');

describe('Cache Service Tests', () => {
    beforeEach(async () => {
        await cacheService.clear();
    });

    it('should store and retrieve data from cache', async () => {
        const testKey = 'test:item:1';
        const testData = { name: 'Pizza', price: 150 };

        await cacheService.set(testKey, testData, 60);
        const retrieved = await cacheService.get(testKey);

        expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existing keys', async () => {
        const result = await cacheService.get('non:existing:key');
        expect(result).toBeNull();
    });

    it('should delete keys by exact name', async () => {
        await cacheService.set('key:1', { a: 1 }, 60);
        await cacheService.del('key:1');

        const result = await cacheService.get('key:1');
        expect(result).toBeNull();
    });

    it('should delete keys matching wildcard patterns', async () => {
        await cacheService.set('categories:all:1', { items: [] }, 60);
        await cacheService.set('categories:all:2', { items: [] }, 60);
        await cacheService.set('dishes:1', { name: 'Burger' }, 60);

        await cacheService.del('categories:*');

        expect(await cacheService.get('categories:all:1')).toBeNull();
        expect(await cacheService.get('categories:all:2')).toBeNull();
        expect(await cacheService.get('dishes:1')).toEqual({ name: 'Burger' });
    });

    it('should respect TTL expiration', async () => {
        const shortKey = 'short:lived';
        // Set with 0 (immediately expired or expired timestamp)
        cacheService.memoryFallback.set(shortKey, {
            value: 'expired',
            expiry: Date.now() - 1000,
        });

        const result = await cacheService.get(shortKey);
        expect(result).toBeNull();
    });
});
