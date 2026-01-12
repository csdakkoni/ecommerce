'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check } from 'lucide-react';

/**
 * ProductOptions Component
 * 
 * Displays product variant options (size, color, quality etc.)
 * and calculates dynamic pricing based on selections.
 * 
 * @param {Object} product - Product data with base price
 * @param {Array} optionGroups - Option groups with their values
 * @param {Object} selectedOptions - Currently selected option values { groupId: valueId }
 * @param {Function} onOptionChange - Callback when option changes
 * @param {Function} onPriceChange - Callback when calculated price changes
 */
export default function ProductOptions({
    product,
    optionGroups = [],
    selectedOptions = {},
    onOptionChange,
    onPriceChange,
    currency = '₺'
}) {
    const t = useTranslations('Product');
    const locale = useLocale();

    // Calculate total price based on selected options
    const calculatedPrice = useMemo(() => {
        const basePrice = parseFloat(product?.sale_price || product?.price) || 0;
        let additionalFixed = 0;
        let percentageModifier = 0;

        optionGroups.forEach(group => {
            const selectedValueId = selectedOptions[group.id];
            if (selectedValueId) {
                const selectedValue = group.values?.find(v => v.id === selectedValueId);
                if (selectedValue) {
                    // Add fixed price modifier
                    if (selectedValue.price_modifier) {
                        additionalFixed += parseFloat(selectedValue.price_modifier);
                    }
                    // Add percentage modifier
                    if (selectedValue.price_modifier_percent) {
                        percentageModifier += parseFloat(selectedValue.price_modifier_percent);
                    }
                }
            }
        });

        // Calculate: (base + fixed) * (1 + percentage/100)
        const priceBeforePercent = basePrice + additionalFixed;
        const finalPrice = priceBeforePercent * (1 + percentageModifier / 100);

        return {
            basePrice,
            additionalFixed,
            percentageModifier,
            finalPrice: Math.round(finalPrice * 100) / 100,
            breakdown: getBreakdown(basePrice, optionGroups, selectedOptions)
        };
    }, [product, optionGroups, selectedOptions]);

    // Notify parent of price change
    useEffect(() => {
        if (onPriceChange) {
            onPriceChange(calculatedPrice);
        }
    }, [calculatedPrice, onPriceChange]);

    // Get price breakdown for display
    function getBreakdown(basePrice, groups, selections) {
        const breakdown = [
            { label: locale === 'en' ? 'Base Price' : 'Baz Fiyat', value: basePrice, type: 'base' }
        ];

        groups.forEach(group => {
            const selectedValueId = selections[group.id];
            if (selectedValueId) {
                const selectedValue = group.values?.find(v => v.id === selectedValueId);
                if (selectedValue) {
                    const groupName = locale === 'en' && group.name_en ? group.name_en : group.name;
                    const valueName = locale === 'en' && selectedValue.value_en ? selectedValue.value_en : selectedValue.value;

                    if (selectedValue.price_modifier && parseFloat(selectedValue.price_modifier) !== 0) {
                        breakdown.push({
                            label: `${groupName} (${valueName})`,
                            value: parseFloat(selectedValue.price_modifier),
                            type: 'fixed'
                        });
                    }
                    if (selectedValue.price_modifier_percent && parseFloat(selectedValue.price_modifier_percent) !== 0) {
                        breakdown.push({
                            label: `${groupName} (${valueName})`,
                            value: parseFloat(selectedValue.price_modifier_percent),
                            type: 'percent'
                        });
                    }
                }
            }
        });

        return breakdown;
    }

    // Handle option selection
    const handleSelect = (groupId, valueId) => {
        if (onOptionChange) {
            onOptionChange(groupId, valueId);
        }
    };

    // Render option group based on type
    const renderOptionGroup = (group) => {
        const groupName = locale === 'en' && group.name_en ? group.name_en : group.name;
        const selectedValueId = selectedOptions[group.id];

        switch (group.type) {
            case 'color_swatch':
                return (
                    <div key={group.id} className="mb-6">
                        <label className="block text-sm font-medium mb-3">
                            {groupName}
                            {group.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {group.values?.filter(v => v.is_available).map(value => {
                                const isSelected = selectedValueId === value.id;
                                const valueName = locale === 'en' && value.value_en ? value.value_en : value.value;
                                return (
                                    <button
                                        key={value.id}
                                        onClick={() => handleSelect(group.id, value.id)}
                                        title={valueName}
                                        className={`
                                            relative w-10 h-10 rounded-full border-2 transition-all
                                            ${isSelected
                                                ? 'border-primary ring-2 ring-primary/30 scale-110'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }
                                        `}
                                        style={{
                                            backgroundColor: value.hex_color || '#ccc',
                                            backgroundImage: value.image ? `url(${value.image})` : undefined,
                                            backgroundSize: 'cover'
                                        }}
                                    >
                                        {isSelected && (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <Check className={`w-5 h-5 ${value.hex_color?.toLowerCase() === '#ffffff' ||
                                                        value.hex_color?.toLowerCase() === '#fff'
                                                        ? 'text-gray-800'
                                                        : 'text-white drop-shadow-md'
                                                    }`} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedValueId && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {locale === 'en' ? 'Selected: ' : 'Seçili: '}
                                {group.values?.find(v => v.id === selectedValueId)?.[locale === 'en' ? 'value_en' : 'value'] ||
                                    group.values?.find(v => v.id === selectedValueId)?.value}
                            </p>
                        )}
                    </div>
                );

            case 'radio':
                return (
                    <div key={group.id} className="mb-6">
                        <label className="block text-sm font-medium mb-3">
                            {groupName}
                            {group.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="space-y-2">
                            {group.values?.filter(v => v.is_available).map(value => {
                                const isSelected = selectedValueId === value.id;
                                const valueName = locale === 'en' && value.value_en ? value.value_en : value.value;
                                const priceText = getPriceModifierText(value);

                                return (
                                    <label
                                        key={value.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name={`option-${group.id}`}
                                            checked={isSelected}
                                            onChange={() => handleSelect(group.id, value.id)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="flex-1">{valueName}</span>
                                        {priceText && (
                                            <span className="text-sm text-primary font-medium">{priceText}</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'size_grid':
                return (
                    <div key={group.id} className="mb-6">
                        <label className="block text-sm font-medium mb-3">
                            {groupName}
                            {group.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {group.values?.filter(v => v.is_available).map(value => {
                                const isSelected = selectedValueId === value.id;
                                const valueName = locale === 'en' && value.value_en ? value.value_en : value.value;
                                const priceText = getPriceModifierText(value);

                                return (
                                    <button
                                        key={value.id}
                                        onClick={() => handleSelect(group.id, value.id)}
                                        className={`
                                            py-2 px-3 rounded-md text-sm font-medium border transition-all
                                            ${isSelected
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-primary'
                                            }
                                        `}
                                    >
                                        <span className="block">{valueName}</span>
                                        {priceText && (
                                            <span className={`block text-xs ${isSelected ? 'text-white/80' : 'text-primary'}`}>
                                                {priceText}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'select':
            default:
                return (
                    <div key={group.id} className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            {groupName}
                            {group.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            value={selectedValueId || ''}
                            onChange={(e) => handleSelect(group.id, e.target.value)}
                            className="w-full border rounded-lg p-3 bg-background"
                        >
                            <option value="">{locale === 'en' ? 'Select...' : 'Seçiniz...'}</option>
                            {group.values?.filter(v => v.is_available).map(value => {
                                const valueName = locale === 'en' && value.value_en ? value.value_en : value.value;
                                const priceText = getPriceModifierText(value);

                                return (
                                    <option key={value.id} value={value.id}>
                                        {valueName}{priceText ? ` (${priceText})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                );
        }
    };

    // Get price modifier text for display
    function getPriceModifierText(value) {
        const parts = [];
        if (value.price_modifier && parseFloat(value.price_modifier) !== 0) {
            const mod = parseFloat(value.price_modifier);
            parts.push(`${mod > 0 ? '+' : ''}${mod}${currency}`);
        }
        if (value.price_modifier_percent && parseFloat(value.price_modifier_percent) !== 0) {
            const mod = parseFloat(value.price_modifier_percent);
            parts.push(`${mod > 0 ? '+' : ''}%${mod}`);
        }
        return parts.join(' ');
    }

    if (!optionGroups || optionGroups.length === 0) {
        return null;
    }

    return (
        <div className="product-options">
            {/* Option Groups */}
            {optionGroups
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map(group => renderOptionGroup(group))}

            {/* Price Breakdown */}
            {calculatedPrice.breakdown.length > 1 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">
                        {locale === 'en' ? 'Price Breakdown' : 'Fiyat Detayı'}
                    </h4>
                    <div className="space-y-1 text-sm">
                        {calculatedPrice.breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className={item.type === 'percent' ? 'text-primary' : ''}>
                                    {item.type === 'percent'
                                        ? `+%${item.value}`
                                        : item.type === 'fixed' && item.value > 0
                                            ? `+${item.value}${currency}`
                                            : `${item.value}${currency}`
                                    }
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-zinc-700">
                            <span>{locale === 'en' ? 'Total' : 'Toplam'}</span>
                            <span className="text-primary">{calculatedPrice.finalPrice}{currency}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
