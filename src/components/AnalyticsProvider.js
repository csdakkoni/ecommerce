'use client';

import Script from 'next/script';

/**
 * Analytics Provider Component
 * Integrates Google Analytics, Microsoft Clarity, and Facebook Pixel
 * Add these environment variables to .env.local:
 * - NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 * - NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx
 * - NEXT_PUBLIC_FB_PIXEL_ID=xxxxxxxxxx
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export function AnalyticsProvider({ children }) {
    return (
        <>
            {/* Google Analytics 4 */}
            {GA_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}', {
                                page_path: window.location.pathname,
                            });
                        `}
                    </Script>
                </>
            )}

            {/* Microsoft Clarity */}
            {CLARITY_ID && (
                <Script id="microsoft-clarity" strategy="afterInteractive">
                    {`
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "${CLARITY_ID}");
                    `}
                </Script>
            )}

            {/* Facebook Pixel */}
            {FB_PIXEL_ID && (
                <Script id="facebook-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${FB_PIXEL_ID}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}

            {children}
        </>
    );
}

/**
 * Analytics event tracking functions
 */
export const analytics = {
    // Page view
    pageView: (url) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', GA_ID, { page_path: url });
        }
    },

    // Generic event
    event: (action, category, label, value) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value,
            });
        }
    },

    // E-commerce: View Product
    viewProduct: (product) => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'view_item', {
                    currency: 'TRY',
                    value: product.price,
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        item_category: product.fabric_type,
                        price: product.price,
                    }]
                });
            }
            if (window.fbq) {
                window.fbq('track', 'ViewContent', {
                    content_ids: [product.id],
                    content_name: product.name,
                    content_type: 'product',
                    value: product.price,
                    currency: 'TRY',
                });
            }
        }
    },

    // E-commerce: Add to Cart
    addToCart: (product, quantity) => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'add_to_cart', {
                    currency: 'TRY',
                    value: product.price * quantity,
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        price: product.price,
                        quantity: quantity,
                    }]
                });
            }
            if (window.fbq) {
                window.fbq('track', 'AddToCart', {
                    content_ids: [product.id],
                    content_name: product.name,
                    content_type: 'product',
                    value: product.price * quantity,
                    currency: 'TRY',
                });
            }
        }
    },

    // E-commerce: Begin Checkout
    beginCheckout: (cart, total) => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'begin_checkout', {
                    currency: 'TRY',
                    value: total,
                    items: cart.map(item => ({
                        item_id: item.id,
                        item_name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    }))
                });
            }
            if (window.fbq) {
                window.fbq('track', 'InitiateCheckout', {
                    content_ids: cart.map(item => item.id),
                    value: total,
                    currency: 'TRY',
                    num_items: cart.length,
                });
            }
        }
    },

    // E-commerce: Purchase
    purchase: (order) => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'purchase', {
                    transaction_id: order.id,
                    currency: order.currency || 'TRY',
                    value: order.total,
                    shipping: order.shipping_cost,
                    items: order.items?.map(item => ({
                        item_id: item.product_id,
                        item_name: item.name,
                        price: item.unit_price,
                        quantity: item.quantity,
                    })) || []
                });
            }
            if (window.fbq) {
                window.fbq('track', 'Purchase', {
                    content_ids: order.items?.map(item => item.product_id) || [],
                    value: order.total,
                    currency: order.currency || 'TRY',
                    num_items: order.items?.length || 0,
                });
            }
        }
    },

    // Search
    search: (term) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search', {
                search_term: term,
            });
        }
    },

    // Sign Up
    signUp: (method = 'email') => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'sign_up', { method });
            }
            if (window.fbq) {
                window.fbq('track', 'CompleteRegistration');
            }
        }
    },

    // Contact / Inquiry
    contact: (method = 'form') => {
        if (typeof window !== 'undefined') {
            if (window.gtag) {
                window.gtag('event', 'generate_lead', { method });
            }
            if (window.fbq) {
                window.fbq('track', 'Contact');
            }
        }
    },
};

export default AnalyticsProvider;
