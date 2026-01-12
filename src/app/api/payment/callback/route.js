/**
 * iyzico Payment Callback API
 * POST /api/payment/callback
 * 
 * Called by iyzico after 3D Secure authentication
 * Updates order status based on payment result
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

export async function POST(request) {
    try {
        // Parse form data from iyzico callback
        const formData = await request.formData();
        const token = formData.get('token');

        if (!token) {
            console.error('No token in callback');
            return NextResponse.redirect(new URL('/checkout/error?reason=no_token', request.url));
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Find order by token
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_token', token)
            .single();

        if (orderError || !order) {
            console.error('Order not found for token:', token);
            return NextResponse.redirect(new URL('/checkout/error?reason=order_not_found', request.url));
        }

        // Retrieve payment result from iyzico
        return new Promise((resolve) => {
            const retrieveRequest = {
                locale: Iyzipay.LOCALE.TR,
                conversationId: order.conversation_id,
                token: token
            };

            iyzipay.checkoutForm.retrieve(retrieveRequest, async (err, result) => {
                if (err) {
                    console.error('iyzico retrieve error:', err);
                    await updateOrderStatus(supabase, order.id, 'payment_failed', null, err.message);
                    resolve(NextResponse.redirect(new URL('/checkout/error?reason=payment_error', request.url)));
                    return;
                }

                console.log('iyzico result:', JSON.stringify(result, null, 2));

                if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                    // Payment successful!
                    await updateOrderStatus(supabase, order.id, 'paid', result);

                    // Reduce stock (optional - implement based on your stock management)
                    await reduceProductStock(supabase, order.id);

                    // Send confirmation email (async, don't wait)
                    sendOrderConfirmationEmail(order, result).catch(console.error);

                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    resolve(NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${order.id}`));
                } else {
                    // Payment failed
                    const errorMessage = result.errorMessage || 'Ödeme başarısız';
                    await updateOrderStatus(supabase, order.id, 'payment_failed', result, errorMessage);

                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    resolve(NextResponse.redirect(`${baseUrl}/checkout/error?reason=payment_failed&message=${encodeURIComponent(errorMessage)}`));
                }
            });
        });

    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(new URL('/checkout/error?reason=server_error', request.url));
    }
}

/**
 * Update order status in database
 */
async function updateOrderStatus(supabase, orderId, status, paymentResult, errorMessage = null) {
    const updateData = {
        status: status,
        updated_at: new Date().toISOString(),
    };

    if (paymentResult) {
        updateData.payment_id = paymentResult.paymentId;
        updateData.payment_details = JSON.stringify({
            paymentId: paymentResult.paymentId,
            price: paymentResult.price,
            paidPrice: paymentResult.paidPrice,
            installment: paymentResult.installment,
            cardType: paymentResult.cardType,
            cardAssociation: paymentResult.cardAssociation,
            cardFamily: paymentResult.cardFamily,
            binNumber: paymentResult.binNumber,
            lastFourDigits: paymentResult.lastFourDigits,
            fraudStatus: paymentResult.fraudStatus,
        });
    }

    if (errorMessage) {
        updateData.payment_error = errorMessage;
    }

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) {
        console.error('Failed to update order status:', error);
    }
}

/**
 * Reduce product stock after successful payment
 */
async function reduceProductStock(supabase, orderId) {
    try {
        // Get order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, variant_id, quantity')
            .eq('order_id', orderId);

        if (itemsError || !items) return;

        // Update stock for each item
        for (const item of items) {
            if (item.variant_id) {
                // Update variant stock
                await supabase.rpc('decrement_variant_stock', {
                    p_variant_id: item.variant_id,
                    p_quantity: item.quantity
                });
            } else {
                // Update product stock
                await supabase.rpc('decrement_product_stock', {
                    p_product_id: item.product_id,
                    p_quantity: item.quantity
                });
            }

            // Create stock movement record
            await supabase.from('stock_movements').insert([{
                product_id: item.product_id,
                variant_id: item.variant_id,
                type: 'sale',
                quantity: -item.quantity,
                reference_type: 'order',
                reference_id: orderId,
                notes: `Sipariş satışı`
            }]);
        }
    } catch (error) {
        console.error('Stock reduction error:', error);
    }
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(order, paymentResult) {
    // TODO: Implement with SendGrid or similar
    // For now, just log
    console.log('📧 Order confirmation email would be sent to:', order.guest_email || 'registered user');
    console.log('Order ID:', order.id);
    console.log('Total:', paymentResult?.paidPrice);
}

// Also handle GET for redirect scenarios
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/checkout/error?reason=no_token', request.url));
    }

    // Create mock form data and call POST handler
    const formData = new FormData();
    formData.append('token', token);

    // Reprocess with token
    return POST(new Request(request.url, {
        method: 'POST',
        body: formData
    }));
}
