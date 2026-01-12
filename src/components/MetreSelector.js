'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Ruler } from 'lucide-react';

/**
 * MetreSelector - Quantity selector for fabric products
 * Supports both 'metre' and 'adet' unit types
 * Handles decimal quantities (0.5, 1.0, 1.5, etc.)
 */
export default function MetreSelector({
    unitType = 'adet',
    minQuantity = 1,
    stepQuantity = 1,
    maxQuantity = 100,
    value = 1,
    onChange,
    price = 0,
    currency = '₺',
    disabled = false,
    showPrice = true,
    size = 'default', // 'small' | 'default' | 'large'
}) {
    const [quantity, setQuantity] = useState(value);

    // Sync with external value
    useEffect(() => {
        setQuantity(value);
    }, [value]);

    // Format quantity for display
    const formatQuantity = (qty) => {
        if (unitType === 'metre') {
            return qty.toFixed(1);
        }
        return Math.floor(qty).toString();
    };

    // Handle quantity change with validation
    const handleQuantityChange = (newQty) => {
        // Ensure within bounds
        let validQty = Math.max(minQuantity, Math.min(maxQuantity, newQty));

        // Round to step
        if (stepQuantity > 0) {
            validQty = Math.round(validQty / stepQuantity) * stepQuantity;
            // Ensure at least minimum after rounding
            validQty = Math.max(minQuantity, validQty);
        }

        // Round to 2 decimal places
        validQty = parseFloat(validQty.toFixed(2));

        setQuantity(validQty);
        onChange?.(validQty);
    };

    const increment = () => {
        handleQuantityChange(quantity + stepQuantity);
    };

    const decrement = () => {
        handleQuantityChange(quantity - stepQuantity);
    };

    // Calculate total price
    const totalPrice = price * quantity;

    // Size classes
    const sizeClasses = {
        small: {
            container: 'gap-1',
            button: 'w-7 h-7',
            input: 'w-14 h-7 text-sm',
            icon: 'w-3 h-3',
        },
        default: {
            container: 'gap-2',
            button: 'w-10 h-10',
            input: 'w-20 h-10',
            icon: 'w-4 h-4',
        },
        large: {
            container: 'gap-3',
            button: 'w-12 h-12',
            input: 'w-24 h-12 text-lg',
            icon: 'w-5 h-5',
        },
    };

    const s = sizeClasses[size] || sizeClasses.default;

    return (
        <div className="space-y-3">
            {/* Unit Type Label */}
            {unitType === 'metre' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ruler className="w-4 h-4" />
                    <span>Metraj bazlı satış • Min: {minQuantity}m • Adım: {stepQuantity}m</span>
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                <div className={`flex items-center ${s.container}`}>
                    <button
                        type="button"
                        onClick={decrement}
                        disabled={disabled || quantity <= minQuantity}
                        className={`${s.button} flex items-center justify-center rounded-lg border 
                            bg-background hover:bg-muted transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Azalt"
                    >
                        <Minus className={s.icon} />
                    </button>

                    <div className="relative">
                        <input
                            type="text"
                            value={formatQuantity(quantity)}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                    handleQuantityChange(val);
                                }
                            }}
                            disabled={disabled}
                            className={`${s.input} text-center font-semibold border rounded-lg 
                                bg-background focus:outline-none focus:ring-2 focus:ring-primary
                                disabled:opacity-50`}
                        />
                        {unitType === 'metre' && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                m
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={increment}
                        disabled={disabled || quantity >= maxQuantity}
                        className={`${s.button} flex items-center justify-center rounded-lg border 
                            bg-background hover:bg-muted transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Artır"
                    >
                        <Plus className={s.icon} />
                    </button>
                </div>

                {/* Price Display */}
                {showPrice && price > 0 && (
                    <div className="flex-1 text-right">
                        <div className="text-lg font-bold">
                            {totalPrice.toFixed(2)} {currency}
                        </div>
                        {quantity > 1 && (
                            <div className="text-xs text-muted-foreground">
                                {price.toFixed(2)} {currency} / {unitType === 'metre' ? 'metre' : 'adet'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Select Buttons (for metre) */}
            {unitType === 'metre' && (
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 10].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => handleQuantityChange(preset)}
                            disabled={disabled || preset > maxQuantity}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors
                                ${quantity === preset
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted'
                                }
                                disabled:opacity-50`}
                        >
                            {preset}m
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
