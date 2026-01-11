
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
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('grohnfabrics_cart', JSON.stringify(cart));
        }
    }, [cart]);

    const addToCart = (product, quantity = 1, variant = null) => {
        setCart(prev => {
            const existingItem = prev.find(item =>
                item.id === product.id && item.variantId === variant?.id
            );

            if (existingItem) {
                return prev.map(item =>
                    (item.id === product.id && item.variantId === variant?.id)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || null,
                variantId: variant?.id,
                variantName: variant?.name,
                quantity
            }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId, variantId) => {
        setCart(prev => prev.filter(item => !(item.id === itemId && item.variantId === variantId)));
    };

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            cartCount,
            cartTotal,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
