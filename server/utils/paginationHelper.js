/**
 * Helper to calculate limit and offset for pagination
 * @param {string|number} page
 * @param {string|number} limit
 * @param {number} defaultLimit
 * @returns {{ limit: number, offset: number, page: number }}
 */
const getPagination = (page, limit, defaultLimit = 9) => {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || defaultLimit);
    const offset = (parsedPage - 1) * parsedLimit;

    return {
        limit: parsedLimit,
        offset,
        page: parsedPage
    };
};

module.exports = {
    getPagination
};
