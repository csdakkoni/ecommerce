/**
 * iyzico Payment Gateway Configuration
 * Grohn Fabrics E-Commerce
 */

const Iyzipay = require('iyzipay');

// Environment variables (add to .env.local):
// IYZICO_API_KEY=your_api_key
// IYZICO_SECRET_KEY=your_secret_key
// IYZICO_BASE_URL=https://sandbox-api.iyzipay.com (sandbox) or https://api.iyzipay.com (production)

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

/**
 * Generate conversation ID for iyzico
 */
function generateConversationId() {
    return `GROHN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format price for iyzico (must be string with 2 decimal places)
 */
function formatPrice(price) {
    return parseFloat(price).toFixed(2);
}

/**
 * Map order items to iyzico basket items
 */
function mapBasketItems(cartItems, locale = 'tr') {
    return cartItems.map((item, index) => ({
        id: item.id,
        name: locale === 'en' && item.name_en ? item.name_en : item.name,
        category1: 'Kumaş',
        category2: item.variantName || 'Standart',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: formatPrice(item.price * item.quantity),
        subMerchantKey: null, // For marketplace, set sub-merchant key
        subMerchantPrice: null
    }));
}

/**
 * Create buyer object for iyzico
 */
function createBuyer(customerData, ip = '127.0.0.1') {
    return {
        id: customerData.id || generateConversationId(),
        name: customerData.firstName,
        surname: customerData.lastName,
        gsmNumber: customerData.phone?.replace(/\D/g, '') || '+905350000000',
        email: customerData.email,
        identityNumber: customerData.identityNumber || '11111111111', // TC Kimlik No (required)
        lastLoginDate: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        registrationDate: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        registrationAddress: customerData.address,
        ip: ip,
        city: customerData.city,
        country: 'Turkey',
        zipCode: customerData.zipCode || '34000'
    };
}

/**
 * Create address object for iyzico
 */
function createAddress(addressData) {
    return {
        contactName: `${addressData.firstName} ${addressData.lastName}`,
        city: addressData.city,
        country: 'Turkey',
        address: addressData.address,
        zipCode: addressData.zipCode || '34000'
    };
}

module.exports = {
    iyzipay,
    generateConversationId,
    formatPrice,
    mapBasketItems,
    createBuyer,
    createAddress,
    Iyzipay
};
