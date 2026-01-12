'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Star Rating Component
 * Interactive or display-only star rating
 */
export default function StarRating({
    rating = 0,
    maxRating = 5,
    size = 'default', // 'small' | 'default' | 'large'
    interactive = false,
    onChange,
    showValue = false,
    reviewCount,
    color = '#f59e0b', // amber-500
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        small: 'w-3 h-3',
        default: 'w-5 h-5',
        large: 'w-7 h-7',
    };

    const starSize = sizes[size] || sizes.default;

    const handleClick = (value) => {
        if (interactive && onChange) {
            onChange(value);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[...Array(maxRating)].map((_, index) => {
                    const value = index + 1;
                    const isFilled = value <= displayRating;
                    const isHalf = !isFilled && value - 0.5 <= displayRating;

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleClick(value)}
                            onMouseEnter={() => interactive && setHoverRating(value)}
                            onMouseLeave={() => interactive && setHoverRating(0)}
                            disabled={!interactive}
                            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                            <Star
                                className={starSize}
                                fill={isFilled ? color : isHalf ? `url(#half-${index})` : 'none'}
                                stroke={color}
                                strokeWidth={1.5}
                            />
                            {isHalf && (
                                <svg width="0" height="0">
                                    <defs>
                                        <linearGradient id={`half-${index}`}>
                                            <stop offset="50%" stopColor={color} />
                                            <stop offset="50%" stopColor="transparent" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>

            {showValue && (
                <span className="text-sm font-medium ml-1">
                    {rating.toFixed(1)}
                </span>
            )}

            {reviewCount !== undefined && (
                <span className="text-sm text-muted-foreground ml-1">
                    ({reviewCount})
                </span>
            )}
        </div>
    );
}
