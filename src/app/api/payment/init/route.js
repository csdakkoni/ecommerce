/**
 * iyzico Payment Initialization API
 * POST /api/payment/init
 * 
 * Creates a 3D Secure payment form for checkout
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const Iyzipay = require('iyzipay');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize iyzico
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

function generateConversationId() {
    return `GROHN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            cartItems,
            customer,
            shippingAddress,
            billingAddress,
            currency = 'TRY',
            locale = 'tr',
        } = body;

        // Validate request
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json({ error: 'Sepet boş' }, { status: 400 });
        }

        if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
            return NextResponse.json({ error: 'Müşteri bilgileri eksik' }, { status: 400 });
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Validate prices from database (security!)
        const productIds = cartItems.map(item => item.id);
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, price, sale_price, price_eur, sale_price_eur, is_active')
            .in('id', productIds);

        if (productsError) {
            console.error('DB Error:', productsError);
            return NextResponse.json({ error: 'Ürün bilgileri alınamadı' }, { status: 500 });
        }

        // Build validated basket items and calculate total
        const productMap = {};
        products.forEach(p => { productMap[p.id] = p; });

        let subtotal = 0;
        const basketItems = [];

        for (const item of cartItems) {
            const product = productMap[item.id];
            if (!product || !product.is_active) {
                return NextResponse.json({ error: `Ürün bulunamadı: ${item.name}` }, { status: 400 });
            }

            // Get correct price
            let unitPrice;
            if (currency === 'EUR' && product.price_eur) {
                unitPrice = product.sale_price_eur || product.price_eur;
            } else {
                unitPrice = product.sale_price || product.price;
            }

            const lineTotal = parseFloat(unitPrice) * parseFloat(item.quantity);
            subtotal += lineTotal;

            basketItems.push({
                id: item.id,
                name: item.name.substring(0, 50), // iyzico max 50 chars
                category1: 'Kumaş',
                category2: item.variantName || 'Standart',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: formatPrice(lineTotal)
            });
        }

        // Calculate shipping
        const freeShippingThreshold = currency === 'EUR' ? 50 : 500;
        const shippingCost = currency === 'EUR' ? 4.90 : 29.90;
        const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;

        // Apply coupon if provided
        let discountAmount = 0;
        if (body.couponCode) {
            // TODO: Validate coupon and get discount
        }

        const total = subtotal - discountAmount + shipping;

        // Generate unique conversation ID
        const conversationId = generateConversationId();

        // Get client IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Create order in database with pending status
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: customer.userId || null,
                guest_email: customer.userId ? null : customer.email,
                status: 'pending_payment',
                total: total,
                shipping_cost: shipping,
                discount: discountAmount,
                currency: currency,
                payment_method: 'iyzico',
                conversation_id: conversationId,
                shipping_address: JSON.stringify(shippingAddress),
                billing_address: JSON.stringify(billingAddress || shippingAddress),
            }])
            .select()
            .single();

        if (orderError) {
            console.error('Order create error:', orderError);
            return NextResponse.json({ error: 'Sipariş oluşturulamadı' }, { status: 500 });
        }

        // Create order items
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.id,
            variant_id: item.variantId || null,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(productMap[item.id].sale_price || productMap[item.id].price),
            unit_type: item.unitType || 'adet',
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ error: 'Sipariş kalemleri oluşturulamadı' }, { status: 500 });
        }

        // Prepare iyzico 3D Secure payment request
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const paymentRequest = {
            locale: locale === 'tr' ? Iyzipay.LOCALE.TR : Iyzipay.LOCALE.EN,
            conversationId: conversationId,
            price: formatPrice(subtotal),
            paidPrice: formatPrice(total),
            currency: currency === 'EUR' ? Iyzipay.CURRENCY.EUR : Iyzipay.CURRENCY.TRY,
            installment: '1', // Single payment
            basketId: order.id,
            paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: `${baseUrl}/api/payment/callback`,

            buyer: {
                id: customer.userId || conversationId,
                name: customer.firstName,
                surname: customer.lastName,
                gsmNumber: customer.phone?.replace(/\D/g, '') || '+905350000000',
                email: customer.email,
                identityNumber: customer.identityNumber || '11111111111',
                lastLoginDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
                registrationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
                registrationAddress: shippingAddress.address,
                ip: ip,
                city: shippingAddress.city,
                country: 'Turkey',
                zipCode: shippingAddress.zipCode || '34000'
            },

            shippingAddress: {
                contactName: `${customer.firstName} ${customer.lastName}`,
                city: shippingAddress.city,
                country: 'Turkey',
                address: shippingAddress.address,
                zipCode: shippingAddress.zipCode || '34000'
            },

            billingAddress: {
                contactName: `${customer.firstName} ${customer.lastName}`,
                city: (billingAddress || shippingAddress).city,
                country: 'Turkey',
                address: (billingAddress || shippingAddress).address,
                zipCode: (billingAddress || shippingAddress).zipCode || '34000'
            },

            basketItems: basketItems
        };

        // Initialize 3D Secure payment
        return new Promise((resolve) => {
            iyzipay.checkoutFormInitialize.create(paymentRequest, (err, result) => {
                if (err) {
                    console.error('iyzico error:', err);
                    resolve(NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 }));
                    return;
                }

                if (result.status !== 'success') {
                    console.error('iyzico result error:', result);
                    resolve(NextResponse.json({
                        error: result.errorMessage || 'Ödeme başlatılamadı',
                        errorCode: result.errorCode
                    }, { status: 400 }));
                    return;
                }

                // Update order with payment token
                supabase
                    .from('orders')
                    .update({
                        payment_token: result.token,
                        payment_page_url: result.paymentPageUrl
                    })
                    .eq('id', order.id)
                    .then(() => {
                        resolve(NextResponse.json({
                            success: true,
                            orderId: order.id,
                            token: result.token,
                            checkoutFormContent: result.checkoutFormContent,
                            paymentPageUrl: result.paymentPageUrl
                        }));
                    });
            });
        });

    } catch (error) {
        console.error('Payment init error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
