import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side Supabase client (service role for secure operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    try {
        const body = await request.json();
        const { items, couponCode } = body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Sepet boş veya geçersiz', valid: false },
                { status: 400 }
            );
        }

        // Create Supabase client
        // Use service role key for server-side operations (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Extract product IDs from cart
        const productIds = items.map(item => item.id);

        // Fetch actual prices from database
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, name_en, price, sale_price, price_eur, sale_price_eur, is_active')
            .in('id', productIds);

        if (productsError) {
            console.error('DB Error:', productsError);
            return NextResponse.json(
                { error: 'Ürün bilgileri alınamadı', valid: false },
                { status: 500 }
            );
        }

        // Create a map for quick lookup
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });

        // Validate each item
        const validatedItems = [];
        const errors = [];
        let subtotal = 0;

        for (const item of items) {
            const product = productMap[item.id];

            // Check if product exists
            if (!product) {
                errors.push(`Ürün bulunamadı: ${item.name || item.id}`);
                continue;
            }

            // Check if product is active
            if (!product.is_active) {
                errors.push(`Ürün artık satışta değil: ${product.name}`);
                continue;
            }

            // Validate quantity
            const quantity = parseFloat(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                errors.push(`Geçersiz miktar: ${product.name}`);
                continue;
            }

            // Get correct price based on locale (currency from request)
            const currency = body.currency || 'TRY';
            let unitPrice;

            if (currency === 'EUR' && product.price_eur) {
                unitPrice = product.sale_price_eur || product.price_eur;
            } else {
                unitPrice = product.sale_price || product.price;
            }

            // Calculate line total
            const lineTotal = parseFloat(unitPrice) * quantity;
            subtotal += lineTotal;

            // Add to validated items with SERVER price (not client price)
            validatedItems.push({
                id: product.id,
                name: product.name,
                name_en: product.name_en,
                quantity: quantity,
                unitPrice: parseFloat(unitPrice),
                lineTotal: lineTotal,
                variantId: item.variantId || null,
                variantName: item.variantName || null,
            });
        }

        // If there are errors, return them
        if (errors.length > 0) {
            return NextResponse.json({
                valid: false,
                errors: errors,
            }, { status: 400 });
        }

        // Apply coupon if provided
        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            const { data: couponResult, error: couponError } = await supabase
                .rpc('validate_coupon', {
                    p_code: couponCode.toUpperCase(),
                    p_order_total: subtotal,
                    p_user_email: body.email || null
                });

            if (!couponError && couponResult && couponResult[0]?.is_valid) {
                discountAmount = couponResult[0].discount_amount;
                appliedCoupon = {
                    id: couponResult[0].coupon_id,
                    code: couponCode.toUpperCase(),
                    discountType: couponResult[0].discount_type,
                    discountValue: couponResult[0].discount_value,
                    discountAmount: discountAmount,
                };
            } else if (couponResult && couponResult[0]?.error_message) {
                return NextResponse.json({
                    valid: false,
                    errors: [couponResult[0].error_message],
                }, { status: 400 });
            }
        }

        // Calculate shipping
        const currency = body.currency || 'TRY';
        const freeShippingThreshold = currency === 'EUR' ? 50 : 500;
        const shippingCost = currency === 'EUR' ? 4.90 : 29.90;
        const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;

        // Calculate final total
        const total = subtotal - discountAmount + shipping;

        // Compare with client-sent total (if provided) - for fraud detection
        if (body.clientTotal && Math.abs(body.clientTotal - total) > 0.01) {
            console.warn('Price mismatch detected!', {
                clientTotal: body.clientTotal,
                serverTotal: total,
                difference: Math.abs(body.clientTotal - total)
            });
            // We don't reject, but use server-calculated price
        }

        // Return validated cart with SERVER prices
        return NextResponse.json({
            valid: true,
            items: validatedItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: discountAmount,
            coupon: appliedCoupon,
            shipping: shipping,
            total: parseFloat(total.toFixed(2)),
            currency: currency,
            message: 'Sepet doğrulandı',
        });

    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: 'Sunucu hatası', valid: false },
            { status: 500 }
        );
    }
}
