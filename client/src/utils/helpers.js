/**
 * Escape HTML to prevent XSS vulnerabilities when inserting untrusted text into the DOM.
 * @param {string|number} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Format a Date object or ISO string nicely with padded zero for minutes and hours.
 * @param {Date|string} dateInput
 * @returns {string} e.g. "11.10.2026 21:05"
 */
export function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Setup navigation buttons for common header links across user pages.
 * @param {string|number} userId
 */
export function setupHeaderNavigation(userId) {
    const homeBtn = document.querySelector('.home-button');
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = userId ? `index.html?id=${userId}` : 'index.html';
        });
    }

    const basketBtn = document.querySelector('.basket-button');
    if (basketBtn) {
        basketBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = userId ? `basket.html?id=${userId}` : 'basket.html';
        });
    }

    const orderBtn = document.querySelector('.order-button');
    if (orderBtn) {
        orderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = userId ? `orders.html?id=${userId}` : 'orders.html';
        });
    }
}
