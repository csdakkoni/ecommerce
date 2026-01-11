'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                setFavorites([]);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    const addToFavorites = (product) => {
        if (!favorites.find(f => f.id === product.id)) {
            setFavorites(prev => [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                sale_price: product.sale_price,
                images: product.images,
            }]);
        }
    };

    const removeFromFavorites = (productId) => {
        setFavorites(prev => prev.filter(f => f.id !== productId));
    };

    const isFavorite = (productId) => {
        return favorites.some(f => f.id === productId);
    };

    const toggleFavorite = (product) => {
        if (isFavorite(product.id)) {
            removeFromFavorites(product.id);
        } else {
            addToFavorites(product);
        }
    };

    return (
        <FavoritesContext.Provider value={{
            favorites,
            addToFavorites,
            removeFromFavorites,
            isFavorite,
            toggleFavorite,
            favoritesCount: favorites.length
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => useContext(FavoritesContext);
