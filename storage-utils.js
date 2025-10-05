/**
 * Centralized localStorage utility with error handling
 * Prevents crashes from quota exceeded, JSON parse errors, etc.
 */

const StorageUtils = {
    /**
     * Get item from localStorage with error handling
     * @param {string} key - localStorage key
     * @param {*} defaultValue - value to return if key doesn't exist or error occurs
     * @returns {*} parsed value or defaultValue
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error getting ${key} from localStorage:`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with error handling
     * @param {string} key - localStorage key
     * @param {*} value - value to store (will be JSON stringified)
     * @returns {boolean} success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in localStorage:`, error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage limit exceeded. Please clear some data.');
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - localStorage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// Cart Utilities - User-specific cart management
const CartUtils = {
    /**
     * Get current user's cart key
     * @returns {string} cart key for current user
     */
    getCartKey() {
        const adminEmail = localStorage.getItem('adminEmail');
        const userEmail = localStorage.getItem('userEmail');
        
        if (adminEmail) {
            return `cart_${adminEmail}`;
        } else if (userEmail) {
            return `cart_${userEmail}`;
        }
        return 'cart_guest'; // Guest cart
    },

    /**
     * Get current user's cart
     * @returns {Array} cart items
     */
    getCart() {
        const cartKey = this.getCartKey();
        return StorageUtils.get(cartKey, []);
    },

    /**
     * Save cart for current user
     * @param {Array} cart - cart items to save
     */
    saveCart(cart) {
        const cartKey = this.getCartKey();
        StorageUtils.set(cartKey, cart);
    },

    /**
     * Clear current user's cart
     */
    clearCart() {
        const cartKey = this.getCartKey();
        StorageUtils.set(cartKey, []);
    },

    /**
     * Migrate guest cart to user cart on login
     * @param {string} userEmail - user's email
     */
    migrateGuestCart(userEmail) {
        const guestCart = StorageUtils.get('cart_guest', []);
        if (guestCart.length > 0) {
            const userCartKey = `cart_${userEmail}`;
            const existingUserCart = StorageUtils.get(userCartKey, []);
            
            // Merge carts, avoiding duplicates
            guestCart.forEach(guestItem => {
                const existing = existingUserCart.find(item => item.id === guestItem.id);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + (guestItem.quantity || 1);
                } else {
                    existingUserCart.push(guestItem);
                }
            });
            
            StorageUtils.set(userCartKey, existingUserCart);
            StorageUtils.set('cart_guest', []); // Clear guest cart
        }
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageUtils, CartUtils };
}