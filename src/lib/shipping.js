/**
 * Shipping Service Configuration
 * Grohn Fabrics E-Commerce
 * 
 * Supports: Yurtiçi Kargo, MNG Kargo, Aras Kargo, PTT Kargo
 * 
 * Environment variables (optional - for API integration):
 * - YURTICI_USERNAME
 * - YURTICI_PASSWORD
 * - MNG_API_KEY
 */

// Shipping carriers configuration
export const CARRIERS = {
    yurtici: {
        name: 'Yurtiçi Kargo',
        code: 'YURTICI',
        trackingUrl: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=',
        logo: '/carriers/yurtici.png',
        estimatedDays: { min: 1, max: 3 },
    },
    mng: {
        name: 'MNG Kargo',
        code: 'MNG',
        trackingUrl: 'https://www.mngkargo.com.tr/gonderi-takip/',
        logo: '/carriers/mng.png',
        estimatedDays: { min: 1, max: 3 },
    },
    aras: {
        name: 'Aras Kargo',
        code: 'ARAS',
        trackingUrl: 'https://www.araskargo.com.tr/trendyol_teslimat_,',
        logo: '/carriers/aras.png',
        estimatedDays: { min: 1, max: 3 },
    },
    ptt: {
        name: 'PTT Kargo',
        code: 'PTT',
        trackingUrl: 'https://gonderitakip.ptt.gov.tr/?b=',
        logo: '/carriers/ptt.png',
        estimatedDays: { min: 2, max: 5 },
    },
    ups: {
        name: 'UPS',
        code: 'UPS',
        trackingUrl: 'https://www.ups.com/track?tracknum=',
        logo: '/carriers/ups.png',
        estimatedDays: { min: 3, max: 7 },
        international: true,
    },
};

// Shipping rates (can be moved to database/settings)
export const SHIPPING_RATES = {
    TR: {
        standard: {
            name: 'Standart Kargo',
            price: 29.90,
            freeAbove: 500,
            estimatedDays: { min: 2, max: 4 },
            carriers: ['yurtici', 'mng', 'aras'],
        },
        express: {
            name: 'Hızlı Kargo',
            price: 49.90,
            freeAbove: null, // No free shipping for express
            estimatedDays: { min: 1, max: 2 },
            carriers: ['yurtici', 'mng'],
        },
    },
    EU: {
        standard: {
            name: 'Standard Shipping',
            price: 14.90,
            currency: 'EUR',
            freeAbove: 100,
            estimatedDays: { min: 5, max: 10 },
            carriers: ['ups'],
        },
    },
    WORLD: {
        standard: {
            name: 'International Shipping',
            price: 24.90,
            currency: 'EUR',
            freeAbove: 150,
            estimatedDays: { min: 7, max: 14 },
            carriers: ['ups'],
        },
    },
};

/**
 * Calculate shipping cost for cart
 */
export function calculateShipping(subtotal, country = 'TR', method = 'standard', currency = 'TRY') {
    const region = country === 'TR' ? 'TR' :
        ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'].includes(country) ? 'EU' : 'WORLD';

    const rate = SHIPPING_RATES[region]?.[method] || SHIPPING_RATES.TR.standard;

    // Check free shipping threshold
    if (rate.freeAbove && subtotal >= rate.freeAbove) {
        return {
            cost: 0,
            isFree: true,
            method: rate.name,
            estimatedDays: rate.estimatedDays,
            carriers: rate.carriers,
            freeAbove: rate.freeAbove,
        };
    }

    return {
        cost: rate.price,
        isFree: false,
        method: rate.name,
        estimatedDays: rate.estimatedDays,
        carriers: rate.carriers,
        freeAbove: rate.freeAbove,
        amountToFree: rate.freeAbove ? rate.freeAbove - subtotal : null,
    };
}

/**
 * Get tracking URL for a shipment
 */
export function getTrackingUrl(carrier, trackingNumber) {
    const carrierConfig = CARRIERS[carrier.toLowerCase()];
    if (!carrierConfig) return null;

    return carrierConfig.trackingUrl + trackingNumber;
}

/**
 * Format estimated delivery date
 */
export function getEstimatedDelivery(estimatedDays, locale = 'tr') {
    const today = new Date();
    const minDate = new Date(today);
    const maxDate = new Date(today);

    minDate.setDate(today.getDate() + estimatedDays.min);
    maxDate.setDate(today.getDate() + estimatedDays.max);

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', options);

    if (estimatedDays.min === estimatedDays.max) {
        return formatter.format(minDate);
    }

    return `${formatter.format(minDate)} - ${formatter.format(maxDate)}`;
}

/**
 * Shipping status types
 */
export const SHIPPING_STATUS = {
    pending: { label: { tr: 'Beklemede', en: 'Pending' }, color: 'gray' },
    processing: { label: { tr: 'Hazırlanıyor', en: 'Processing' }, color: 'blue' },
    shipped: { label: { tr: 'Kargoya Verildi', en: 'Shipped' }, color: 'yellow' },
    in_transit: { label: { tr: 'Yolda', en: 'In Transit' }, color: 'orange' },
    out_for_delivery: { label: { tr: 'Dağıtımda', en: 'Out for Delivery' }, color: 'purple' },
    delivered: { label: { tr: 'Teslim Edildi', en: 'Delivered' }, color: 'green' },
    returned: { label: { tr: 'İade Edildi', en: 'Returned' }, color: 'red' },
    failed: { label: { tr: 'Teslim Edilemedi', en: 'Delivery Failed' }, color: 'red' },
};

module.exports = {
    CARRIERS,
    SHIPPING_RATES,
    SHIPPING_STATUS,
    calculateShipping,
    getTrackingUrl,
    getEstimatedDelivery,
};
