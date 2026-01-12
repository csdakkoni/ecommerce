'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
    Filter, X, ChevronDown, ChevronUp, SlidersHorizontal,
    Check, RotateCcw, Ruler, Palette, Grid3X3
} from 'lucide-react';

/**
 * Advanced Product Filters Component
 * Supports fabric type, pattern, color, price range, width, and more
 */
export default function ProductFilters({
    onFilterChange,
    initialFilters = {},
    categories = [],
    showMobileButton = true,
}) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState(['fabric_type', 'price']);

    const [filters, setFilters] = useState({
        fabric_type: initialFilters.fabric_type || [],
        pattern: initialFilters.pattern || [],
        color: initialFilters.color || [],
        priceMin: initialFilters.priceMin || '',
        priceMax: initialFilters.priceMax || '',
        widthMin: initialFilters.widthMin || '',
        widthMax: initialFilters.widthMax || '',
        unit_type: initialFilters.unit_type || '',
        inStock: initialFilters.inStock || false,
        onSale: initialFilters.onSale || false,
        ...initialFilters
    });

    // Labels
    const labels = {
        filters: locale === 'tr' ? 'Filtreler' : 'Filters',
        clearAll: locale === 'tr' ? 'Temizle' : 'Clear All',
        apply: locale === 'tr' ? 'Uygula' : 'Apply',
        fabricType: locale === 'tr' ? 'Kumaş Tipi' : 'Fabric Type',
        pattern: locale === 'tr' ? 'Desen' : 'Pattern',
        color: locale === 'tr' ? 'Renk' : 'Color',
        priceRange: locale === 'tr' ? 'Fiyat Aralığı' : 'Price Range',
        width: locale === 'tr' ? 'En (cm)' : 'Width (cm)',
        salesType: locale === 'tr' ? 'Satış Tipi' : 'Sales Type',
        inStock: locale === 'tr' ? 'Stokta Olanlar' : 'In Stock',
        onSale: locale === 'tr' ? 'İndirimli' : 'On Sale',
        min: locale === 'tr' ? 'Min' : 'Min',
        max: locale === 'tr' ? 'Max' : 'Max',
        metre: locale === 'tr' ? 'Metrelik' : 'By Metre',
        piece: locale === 'tr' ? 'Adet' : 'By Piece',
        all: locale === 'tr' ? 'Tümü' : 'All',
    };

    // Static filter options
    const fabricTypes = [
        { value: 'Pamuk', label: locale === 'tr' ? 'Pamuk' : 'Cotton' },
        { value: 'İpek', label: locale === 'tr' ? 'İpek' : 'Silk' },
        { value: 'Keten', label: locale === 'tr' ? 'Keten' : 'Linen' },
        { value: 'Kadife', label: locale === 'tr' ? 'Kadife' : 'Velvet' },
        { value: 'Polyester', label: locale === 'tr' ? 'Polyester' : 'Polyester' },
        { value: 'Yün', label: locale === 'tr' ? 'Yün' : 'Wool' },
        { value: 'Karışım', label: locale === 'tr' ? 'Karışım' : 'Blend' },
    ];

    const patterns = [
        { value: 'Düz', label: locale === 'tr' ? 'Düz' : 'Solid' },
        { value: 'Çizgili', label: locale === 'tr' ? 'Çizgili' : 'Striped' },
        { value: 'Kareli', label: locale === 'tr' ? 'Kareli' : 'Checkered' },
        { value: 'Çiçekli', label: locale === 'tr' ? 'Çiçekli' : 'Floral' },
        { value: 'Geometrik', label: locale === 'tr' ? 'Geometrik' : 'Geometric' },
        { value: 'Desenli', label: locale === 'tr' ? 'Desenli' : 'Patterned' },
    ];

    const colors = [
        { value: 'white', label: locale === 'tr' ? 'Beyaz' : 'White', hex: '#FFFFFF' },
        { value: 'black', label: locale === 'tr' ? 'Siyah' : 'Black', hex: '#000000' },
        { value: 'red', label: locale === 'tr' ? 'Kırmızı' : 'Red', hex: '#EF4444' },
        { value: 'blue', label: locale === 'tr' ? 'Mavi' : 'Blue', hex: '#3B82F6' },
        { value: 'green', label: locale === 'tr' ? 'Yeşil' : 'Green', hex: '#22C55E' },
        { value: 'beige', label: locale === 'tr' ? 'Bej' : 'Beige', hex: '#D4C5B9' },
        { value: 'brown', label: locale === 'tr' ? 'Kahve' : 'Brown', hex: '#92400E' },
        { value: 'navy', label: locale === 'tr' ? 'Lacivert' : 'Navy', hex: '#1E3A5F' },
        { value: 'pink', label: locale === 'tr' ? 'Pembe' : 'Pink', hex: '#EC4899' },
        { value: 'gray', label: locale === 'tr' ? 'Gri' : 'Gray', hex: '#6B7280' },
    ];

    // Toggle array filter value
    const toggleArrayFilter = (filterName, value) => {
        setFilters(prev => {
            const current = prev[filterName] || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [filterName]: updated };
        });
    };

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            fabric_type: [],
            pattern: [],
            color: [],
            priceMin: '',
            priceMax: '',
            widthMin: '',
            widthMax: '',
            unit_type: '',
            inStock: false,
            onSale: false,
        });
    };

    // Apply filters
    const applyFilters = useCallback(() => {
        // Build query params
        const params = new URLSearchParams();

        if (filters.fabric_type.length > 0) params.set('fabric_type', filters.fabric_type.join(','));
        if (filters.pattern.length > 0) params.set('pattern', filters.pattern.join(','));
        if (filters.color.length > 0) params.set('color', filters.color.join(','));
        if (filters.priceMin) params.set('price_min', filters.priceMin);
        if (filters.priceMax) params.set('price_max', filters.priceMax);
        if (filters.widthMin) params.set('width_min', filters.widthMin);
        if (filters.widthMax) params.set('width_max', filters.widthMax);
        if (filters.unit_type) params.set('unit_type', filters.unit_type);
        if (filters.inStock) params.set('in_stock', '1');
        if (filters.onSale) params.set('on_sale', '1');

        // Update URL
        const queryString = params.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);

        // Notify parent
        onFilterChange?.(filters);
        setIsOpen(false);
    }, [filters, pathname, router, onFilterChange]);

    // Count active filters
    const activeFilterCount =
        filters.fabric_type.length +
        filters.pattern.length +
        filters.color.length +
        (filters.priceMin || filters.priceMax ? 1 : 0) +
        (filters.widthMin || filters.widthMax ? 1 : 0) +
        (filters.unit_type ? 1 : 0) +
        (filters.inStock ? 1 : 0) +
        (filters.onSale ? 1 : 0);

    // Filter Section Component
    const FilterSection = ({ title, name, children }) => (
        <div className="border-b last:border-0">
            <button
                onClick={() => toggleSection(name)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <span className="font-medium text-sm">{title}</span>
                {expandedSections.includes(name) ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>
            {expandedSections.includes(name) && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );

    // Checkbox Item Component
    const CheckboxItem = ({ label, checked, onChange }) => (
        <label className="flex items-center gap-2 py-1 cursor-pointer hover:text-primary">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                ${checked ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm">{label}</span>
        </label>
    );

    // Color Swatch Component
    const ColorSwatch = ({ color, selected, onClick }) => (
        <button
            onClick={onClick}
            className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
                }`}
            style={{ backgroundColor: color.hex }}
            title={color.label}
        >
            {selected && (
                <Check className={`w-4 h-4 mx-auto ${color.value === 'white' ? 'text-gray-800' : 'text-white'
                    }`} />
            )}
        </button>
    );

    return (
        <>
            {/* Mobile Filter Button */}
            {showMobileButton && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    {labels.filters}
                    {activeFilterCount > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            )}

            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsOpen(false)} />
            )}

            {/* Filter Panel */}
            <div className={`
                lg:block lg:static lg:w-72 lg:bg-transparent
                ${isOpen ? 'fixed inset-y-0 left-0 w-80 bg-background z-50 overflow-y-auto' : 'hidden'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        <span className="font-semibold">{labels.filters}</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                {labels.clearAll}
                            </button>
                        )}
                        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter Sections */}
                <div className="divide-y">
                    {/* Fabric Type */}
                    <FilterSection title={labels.fabricType} name="fabric_type">
                        <div className="space-y-1">
                            {fabricTypes.map(type => (
                                <CheckboxItem
                                    key={type.value}
                                    label={type.label}
                                    checked={filters.fabric_type.includes(type.value)}
                                    onChange={() => toggleArrayFilter('fabric_type', type.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Pattern */}
                    <FilterSection title={labels.pattern} name="pattern">
                        <div className="space-y-1">
                            {patterns.map(p => (
                                <CheckboxItem
                                    key={p.value}
                                    label={p.label}
                                    checked={filters.pattern.includes(p.value)}
                                    onChange={() => toggleArrayFilter('pattern', p.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Color */}
                    <FilterSection title={labels.color} name="color">
                        <div className="flex flex-wrap gap-2">
                            {colors.map(color => (
                                <ColorSwatch
                                    key={color.value}
                                    color={color}
                                    selected={filters.color.includes(color.value)}
                                    onClick={() => toggleArrayFilter('color', color.value)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title={labels.priceRange} name="price">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={labels.min}
                                value={filters.priceMin}
                                onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                                type="number"
                                placeholder={labels.max}
                                value={filters.priceMax}
                                onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            />
                        </div>
                    </FilterSection>

                    {/* Width */}
                    <FilterSection title={labels.width} name="width">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={labels.min}
                                value={filters.widthMin}
                                onChange={(e) => setFilters(prev => ({ ...prev, widthMin: e.target.value }))}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                                type="number"
                                placeholder={labels.max}
                                value={filters.widthMax}
                                onChange={(e) => setFilters(prev => ({ ...prev, widthMax: e.target.value }))}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            />
                        </div>
                    </FilterSection>

                    {/* Sales Type */}
                    <FilterSection title={labels.salesType} name="unit_type">
                        <div className="space-y-1">
                            <CheckboxItem
                                label={labels.all}
                                checked={!filters.unit_type}
                                onChange={() => setFilters(prev => ({ ...prev, unit_type: '' }))}
                            />
                            <CheckboxItem
                                label={`📐 ${labels.metre}`}
                                checked={filters.unit_type === 'metre'}
                                onChange={() => setFilters(prev => ({ ...prev, unit_type: prev.unit_type === 'metre' ? '' : 'metre' }))}
                            />
                            <CheckboxItem
                                label={`📦 ${labels.piece}`}
                                checked={filters.unit_type === 'adet'}
                                onChange={() => setFilters(prev => ({ ...prev, unit_type: prev.unit_type === 'adet' ? '' : 'adet' }))}
                            />
                        </div>
                    </FilterSection>

                    {/* Quick Filters */}
                    <div className="p-4 space-y-2">
                        <CheckboxItem
                            label={`✅ ${labels.inStock}`}
                            checked={filters.inStock}
                            onChange={() => setFilters(prev => ({ ...prev, inStock: !prev.inStock }))}
                        />
                        <CheckboxItem
                            label={`🏷️ ${labels.onSale}`}
                            checked={filters.onSale}
                            onChange={() => setFilters(prev => ({ ...prev, onSale: !prev.onSale }))}
                        />
                    </div>
                </div>

                {/* Apply Button (Mobile) */}
                <div className="lg:hidden sticky bottom-0 p-4 bg-background border-t">
                    <button
                        onClick={applyFilters}
                        className="btn btn-primary w-full"
                    >
                        {labels.apply}
                    </button>
                </div>
            </div>
        </>
    );
}
