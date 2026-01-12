'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Hydrate cart from localStorage on mount (client-side)
    useEffect(() => {
        const savedCart = localStorage.getItem('grohnfabrics_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                // Ensure quantities are numbers (float)
                const validated = parsed.map(item => ({
                    ...item,
                    quantity: parseFloat(item.quantity) || 1
                }));
                setCart(validated);
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('grohnfabrics_cart', JSON.stringify(cart));
        } else {
            // Clear cart from storage when empty
            localStorage.removeItem('grohnfabrics_cart');
        }
    }, [cart]);

    /**
     * Add item to cart with support for float quantities (metre-based sales)
     * @param {Object} product - Product object from database
     * @param {number} quantity - Quantity (can be float like 2.5 for fabric)
     * @param {Object|null} variant - Product variant (color etc.)
     */
    const addToCart = (product, quantity = 1, variant = null) => {
        // Ensure quantity is a valid positive number
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            console.error('Invalid quantity:', quantity);
            return;
        }

        // Create a unique key for cart item based on product id and selected options
        const optionsKey = product.selected_options
            ? JSON.stringify(product.selected_options)
            : null;

        setCart(prev => {
            const existingItem = prev.find(item =>
                item.id === product.id &&
                item.variantId === (variant?.id || null) &&
                item.optionsKey === optionsKey
            );

            if (existingItem) {
                // Update existing item quantity
                return prev.map(item =>
                    (item.id === product.id &&
                        item.variantId === (variant?.id || null) &&
                        item.optionsKey === optionsKey)
                        ? { ...item, quantity: parseFloat((item.quantity + qty).toFixed(2)) }
                        : item
                );
            }

            // Add new item
            return [...prev, {
                id: product.id,
                name: product.name,
                name_en: product.name_en || product.name,
                price: parseFloat(product.sale_price || product.price),
                originalPrice: parseFloat(product.price),
                price_eur: product.price_eur ? parseFloat(product.sale_price_eur || product.price_eur) : null,
                image: product.images?.[0] || null,
                variantId: variant?.id || null,
                variantName: variant?.name || null,
                quantity: qty,
                // Textile-specific fields
                unitType: product.unit_type || 'adet',
                minQuantity: parseFloat(product.min_order_quantity) || 1,
                stepQuantity: parseFloat(product.step_quantity) || 1,
                // Product option variants
                selectedOptions: product.selected_options || null,
                optionsKey: optionsKey,
                optionsDisplay: product.options_display || null,
            }];
        });
        setIsCartOpen(true);
    };

    /**
     * Update item quantity in cart
     * @param {string} itemId - Product ID
     * @param {string|null} variantId - Variant ID
     * @param {number} newQuantity - New quantity value
     * @param {string|null} optionsKey - Options key for variant products
     */
    const updateQuantity = (itemId, variantId, newQuantity, optionsKey = null) => {
        const qty = parseFloat(newQuantity);
        if (isNaN(qty) || qty <= 0) {
            // If invalid or zero, remove item
            removeFromCart(itemId, variantId, optionsKey);
            return;
        }

        setCart(prev => prev.map(item => {
            if (item.id === itemId && item.variantId === variantId && item.optionsKey === optionsKey) {
                // Validate against min and step quantities
                const minQty = item.minQuantity || 1;
                const stepQty = item.stepQuantity || 1;

                // Ensure quantity is at least minimum
                let validQty = Math.max(qty, minQty);

                // Round to nearest step
                if (stepQty > 0 && stepQty !== 1) {
                    validQty = Math.round(validQty / stepQty) * stepQty;
                    validQty = Math.max(validQty, minQty);
                }

                return { ...item, quantity: parseFloat(validQty.toFixed(2)) };
            }
            return item;
        }));
    };

    /**
     * Remove item from cart
     * @param {string} itemId - Product ID
     * @param {string|null} variantId - Variant ID
     * @param {string|null} optionsKey - Options key for variant products
     */
    const removeFromCart = (itemId, variantId, optionsKey = null) => {
        setCart(prev => prev.filter(item =>
            !(item.id === itemId && item.variantId === variantId && item.optionsKey === optionsKey)
        ));
    };

    /**
     * Clear entire cart
     */
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('grohnfabrics_cart');
    };

    /**
     * Get cart count - for metre items, count as 1 item regardless of quantity
     */
    const cartCount = cart.reduce((acc, item) => {
        // For display purposes, show item count not total quantity
        return acc + 1;
    }, 0);

    /**
     * Get total quantity (useful for showing "X metre kumaş" etc.)
     */
    const cartTotalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

    /**
     * Calculate cart total
     */
    const cartTotal = cart.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
    }, 0);

    /**
     * Calculate cart total in EUR (for international customers)
     */
    const cartTotalEur = cart.reduce((acc, item) => {
        if (item.price_eur) {
            return acc + (item.price_eur * item.quantity);
        }
        return acc;
    }, 0);

    /**
     * Get formatted unit label
     */
    const getUnitLabel = (unitType, quantity) => {
        if (unitType === 'metre') {
            return quantity === 1 ? 'metre' : 'metre';
        }
        return quantity === 1 ? 'adet' : 'adet';
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            cartCount,
            cartTotalQuantity,
            cartTotal,
            cartTotalEur,
            isCartOpen,
            setIsCartOpen,
            getUnitLabel,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
