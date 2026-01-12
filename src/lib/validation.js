/**
 * Input Validation Helper
 * Server-side validation utilities for form data
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (Turkish format)
const PHONE_REGEX = /^(\+90|0)?[0-9]{10}$/;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate email address
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number (Turkish format)
 */
export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return PHONE_REGEX.test(cleaned);
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    return UUID_REGEX.test(uuid);
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') return '';

    return input
        .trim()
        .slice(0, maxLength)
        // Remove potential XSS vectors
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

/**
 * Sanitize HTML content (for CMS, allow some tags)
 */
export function sanitizeHTML(input, maxLength = 50000) {
    if (!input || typeof input !== 'string') return '';

    // Allow safe HTML tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'];

    return input
        .trim()
        .slice(0, maxLength)
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '');
}

/**
 * Validate positive number
 */
export function isValidPositiveNumber(value, allowFloat = true) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return false;
    if (!allowFloat && !Number.isInteger(num)) return false;
    return true;
}

/**
 * Validate price (positive, max 2 decimals)
 */
export function isValidPrice(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return false;
    // Check max 2 decimal places
    if (Math.round(num * 100) / 100 !== num) return false;
    return true;
}

/**
 * Validate quantity (positive, can be float for fabrics)
 */
export function isValidQuantity(value, minQuantity = 0.1, maxQuantity = 10000) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (num < minQuantity || num > maxQuantity) return false;
    return true;
}

/**
 * Validate checkout form data
 */
export function validateCheckoutForm(data) {
    const errors = [];

    // Required fields
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Geçerli bir e-posta adresi giriniz');
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push('Adınızı giriniz (en az 2 karakter)');
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push('Soyadınızı giriniz (en az 2 karakter)');
    }

    if (!data.phone || !isValidPhone(data.phone)) {
        errors.push('Geçerli bir telefon numarası giriniz');
    }

    if (!data.address || data.address.trim().length < 10) {
        errors.push('Adres en az 10 karakter olmalıdır');
    }

    if (!data.city || data.city.trim().length < 2) {
        errors.push('İl giriniz');
    }

    if (!data.district || data.district.trim().length < 2) {
        errors.push('İlçe giriniz');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate product form data (admin)
 */
export function validateProductForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 3) {
        errors.push('Ürün adı en az 3 karakter olmalıdır');
    }

    if (!isValidPrice(data.price)) {
        errors.push('Geçerli bir fiyat giriniz');
    }

    if (data.sale_price && !isValidPrice(data.sale_price)) {
        errors.push('Geçerli bir indirimli fiyat giriniz');
    }

    if (data.sale_price && parseFloat(data.sale_price) >= parseFloat(data.price)) {
        errors.push('İndirimli fiyat normal fiyattan düşük olmalıdır');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate inquiry form data
 */
export function validateInquiryForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Adınızı giriniz');
    }

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Geçerli bir e-posta adresi giriniz');
    }

    if (!data.message || data.message.trim().length < 10) {
        errors.push('Mesajınız en az 10 karakter olmalıdır');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Rate limiting helper (simple in-memory store)
 * NOTE: For production, use Redis or similar
 */
const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry) {
        entry = { requests: [], blocked: false };
        rateLimitStore.set(key, entry);
    }

    // Remove old requests
    entry.requests = entry.requests.filter(time => time > windowStart);

    // Check if over limit
    if (entry.requests.length >= maxRequests) {
        return { allowed: false, remaining: 0, resetIn: Math.ceil((entry.requests[0] + windowMs - now) / 1000) };
    }

    // Add current request
    entry.requests.push(now);

    return { allowed: true, remaining: maxRequests - entry.requests.length, resetIn: 0 };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.requests.length === 0 || entry.requests[entry.requests.length - 1] < now - maxAge) {
            rateLimitStore.delete(key);
        }
    }
}
