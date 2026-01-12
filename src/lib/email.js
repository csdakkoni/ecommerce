/**
 * Email Service Configuration
 * Grohn Fabrics E-Commerce
 * 
 * Uses Resend (recommended) or can be adapted for SendGrid/Mailgun
 * Install: npm install resend
 */

/**
 * Send email using native fetch (works without external deps for simple cases)
 * For production, use Resend, SendGrid, or similar service
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Grohn Fabrics <siparis@grohn.com.tr>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@grohn.com.tr';

/**
 * Format currency for display
 */
function formatCurrency(amount, currency = 'TRY') {
    return new Intl.NumberFormat(currency === 'EUR' ? 'de-DE' : 'tr-TR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation({ order, customerEmail, locale = 'tr' }) {
    const subject = locale === 'tr'
        ? `Grohn Fabrics - Siparişiniz Alındı #${order.id.substring(0, 8).toUpperCase()}`
        : `Grohn Fabrics - Order Confirmed #${order.id.substring(0, 8).toUpperCase()}`;

    const html = generateOrderConfirmationHTML(order, locale);

    return sendEmail({
        to: customerEmail,
        subject,
        html
    });
}

/**
 * Send new order notification to admin
 */
export async function sendNewOrderNotification({ order, customerEmail }) {
    const subject = `🛒 Yeni Sipariş! #${order.id.substring(0, 8).toUpperCase()} - ${formatCurrency(order.total, order.currency)}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🛒 Yeni Sipariş Alındı!</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sipariş No:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${order.id.substring(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Müşteri:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${customerEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Toplam:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 18px; color: #16a34a;">${formatCurrency(order.total, order.currency)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Durum:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${order.status}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${order.id}" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Siparişi Görüntüle
                </a>
            </p>
        </div>
    `;

    return sendEmail({
        to: ADMIN_EMAIL,
        subject,
        html
    });
}

/**
 * Send shipping notification to customer
 */
export async function sendShippingNotification({ order, customerEmail, trackingNumber, carrierName, locale = 'tr' }) {
    const subject = locale === 'tr'
        ? `Grohn Fabrics - Siparişiniz Kargoya Verildi! #${order.id.substring(0, 8).toUpperCase()}`
        : `Grohn Fabrics - Your Order Has Been Shipped! #${order.id.substring(0, 8).toUpperCase()}`;

    const html = generateShippingNotificationHTML(order, trackingNumber, carrierName, locale);

    return sendEmail({
        to: customerEmail,
        subject,
        html
    });
}

/**
 * Core email sending function
 */
async function sendEmail({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        console.log('📧 Email would be sent (no API key configured):');
        console.log('   To:', to);
        console.log('   Subject:', subject);
        return { success: true, mock: true };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Email send error:', data);
            return { success: false, error: data };
        }

        console.log('📧 Email sent successfully to:', to);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Email send exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate order confirmation HTML
 */
function generateOrderConfirmationHTML(order, locale) {
    const labels = locale === 'tr' ? {
        title: 'Siparişiniz Alındı!',
        orderNumber: 'Sipariş Numarası',
        thankYou: 'Grohn Fabrics\'i tercih ettiğiniz için teşekkür ederiz.',
        orderDetails: 'Sipariş Detayları',
        shippingTo: 'Teslimat Adresi',
        total: 'Toplam',
        shipping: 'Kargo',
        free: 'Ücretsiz',
        trackOrder: 'Siparişi Takip Et',
        questions: 'Sorularınız için:',
        footer: 'Bu e-posta Grohn Fabrics tarafından gönderilmiştir.'
    } : {
        title: 'Order Confirmed!',
        orderNumber: 'Order Number',
        thankYou: 'Thank you for choosing Grohn Fabrics.',
        orderDetails: 'Order Details',
        shippingTo: 'Shipping Address',
        total: 'Total',
        shipping: 'Shipping',
        free: 'Free',
        trackOrder: 'Track Order',
        questions: 'Questions?',
        footer: 'This email was sent by Grohn Fabrics.'
    };

    const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #78716c; font-size: 24px; margin: 0;">GROHN FABRICS</h1>
        <p style="color: #a8a29e; font-size: 12px; margin: 5px 0;">Premium Kumaş & Tekstil</p>
    </div>

    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #16a34a; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 30px;">✓</span>
        </div>
        <h2 style="margin: 0 0 10px; color: #1a1a1a;">${labels.title}</h2>
        <p style="margin: 0; color: #666;">${labels.thankYou}</p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #666;">${labels.orderNumber}</p>
        <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #78716c; font-family: monospace;">
            #${order.id.substring(0, 8).toUpperCase()}
        </p>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; font-size: 16px;">${labels.shippingTo}</h3>
        <p style="margin: 0; color: #666;">
            ${shippingAddress?.address || ''}<br>
            ${shippingAddress?.district || ''} ${shippingAddress?.city || ''}<br>
            ${shippingAddress?.zipCode || ''}
        </p>
    </div>

    <div style="border-top: 2px solid #78716c; padding-top: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666;">${labels.shipping}</span>
            <span>${order.shipping_cost > 0 ? formatCurrency(order.shipping_cost, order.currency) : labels.free}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
            <span>${labels.total}</span>
            <span style="color: #16a34a;">${formatCurrency(order.total, order.currency)}</span>
        </div>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/orders/${order.id}" 
           style="display: inline-block; background: #78716c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            ${labels.trackOrder}
        </a>
    </div>

    <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #999; font-size: 12px;">
        <p>${labels.questions} <a href="mailto:info@grohn.com.tr" style="color: #78716c;">info@grohn.com.tr</a></p>
        <p>${labels.footer}</p>
    </div>
</body>
</html>
    `;
}

/**
 * Generate shipping notification HTML
 */
function generateShippingNotificationHTML(order, trackingNumber, carrierName, locale) {
    const labels = locale === 'tr' ? {
        title: 'Siparişiniz Yola Çıktı! 🚚',
        subtitle: 'Siparişiniz kargoya verildi ve size doğru yola çıktı.',
        trackingNumber: 'Takip Numarası',
        carrier: 'Kargo Firması',
        trackPackage: 'Kargoyu Takip Et',
        estimatedDelivery: 'Tahmini teslimat: 2-4 iş günü',
        footer: 'Bu e-posta Grohn Fabrics tarafından gönderilmiştir.'
    } : {
        title: 'Your Order is On Its Way! 🚚',
        subtitle: 'Your order has been shipped and is on its way to you.',
        trackingNumber: 'Tracking Number',
        carrier: 'Carrier',
        trackPackage: 'Track Package',
        estimatedDelivery: 'Estimated delivery: 2-4 business days',
        footer: 'This email was sent by Grohn Fabrics.'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #78716c;">GROHN FABRICS</h1>
    </div>

    <div style="background: #ecfdf5; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px;">${labels.title}</h2>
        <p style="margin: 0; color: #666;">${labels.subtitle}</p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0 0 5px; color: #666;">${labels.trackingNumber}</p>
        <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace;">${trackingNumber}</p>
        <p style="margin: 10px 0 0; color: #666;">${labels.carrier}: ${carrierName}</p>
    </div>

    <p style="text-align: center; color: #666; margin-bottom: 30px;">${labels.estimatedDelivery}</p>

    <div style="text-align: center;">
        <a href="https://gonderitakip.ptt.gov.tr" 
           style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
            ${labels.trackPackage}
        </a>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>${labels.footer}</p>
    </div>
</body>
</html>
    `;
}

module.exports = {
    sendOrderConfirmation,
    sendNewOrderNotification,
    sendShippingNotification,
    sendEmail
};
