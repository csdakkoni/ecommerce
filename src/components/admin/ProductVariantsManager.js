'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';

const OPTION_TYPES = [
    { value: 'select', label: 'Dropdown (Seçim kutusu)', labelEn: 'Dropdown' },
    { value: 'radio', label: 'Radio (Tek seçim)', labelEn: 'Radio Buttons' },
    { value: 'color_swatch', label: 'Renk Seçici', labelEn: 'Color Swatches' },
    { value: 'size_grid', label: 'Boyut Grid', labelEn: 'Size Grid' },
];

/**
 * ProductVariantsManager Component
 * 
 * Admin component for managing product option groups and values.
 * 
 * @param {string} productId - The product UUID
 * @param {boolean} hasVariants - Whether variants are enabled for this product
 * @param {Function} onHasVariantsChange - Callback when hasVariants toggle changes
 */
export default function ProductVariantsManager({ productId, hasVariants, onHasVariantsChange }) {
    const [optionGroups, setOptionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    // Fetch existing option groups and values
    useEffect(() => {
        if (productId && hasVariants) {
            fetchOptionGroups();
        }
    }, [productId, hasVariants]);

    async function fetchOptionGroups() {
        setLoading(true);
        const { data, error } = await supabase
            .from('product_option_groups')
            .select(`
                *,
                values:product_option_values(*)
            `)
            .eq('product_id', productId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching option groups:', error);
        } else {
            // Sort values within each group
            const sortedData = (data || []).map(group => ({
                ...group,
                values: (group.values || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            }));
            setOptionGroups(sortedData);
            // Expand first group by default
            if (sortedData.length > 0) {
                setExpandedGroups({ [sortedData[0].id]: true });
            }
        }
        setLoading(false);
    }

    // Add new option group
    const addOptionGroup = async () => {
        setSaving(true);
        const newGroup = {
            product_id: productId,
            name: 'Yeni Seçenek',
            name_en: 'New Option',
            type: 'select',
            is_required: true,
            affects_price: true,
            sort_order: optionGroups.length
        };

        const { data, error } = await supabase
            .from('product_option_groups')
            .insert(newGroup)
            .select()
            .single();

        if (error) {
            console.error('Error adding option group:', error);
            alert('Seçenek grubu eklenirken hata oluştu');
        } else {
            const newGroupWithValues = { ...data, values: [] };
            setOptionGroups(prev => [...prev, newGroupWithValues]);
            setExpandedGroups(prev => ({ ...prev, [data.id]: true }));
        }
        setSaving(false);
    };

    // Update option group
    const updateOptionGroup = async (groupId, updates) => {
        setSaving(true);
        const { error } = await supabase
            .from('product_option_groups')
            .update(updates)
            .eq('id', groupId);

        if (error) {
            console.error('Error updating option group:', error);
        } else {
            setOptionGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, ...updates } : g
            ));
        }
        setSaving(false);
    };

    // Delete option group
    const deleteOptionGroup = async (groupId) => {
        if (!confirm('Bu seçenek grubunu silmek istediğinize emin misiniz? Tüm değerler de silinecek.')) {
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from('product_option_groups')
            .delete()
            .eq('id', groupId);

        if (error) {
            console.error('Error deleting option group:', error);
            alert('Silme işlemi başarısız');
        } else {
            setOptionGroups(prev => prev.filter(g => g.id !== groupId));
        }
        setSaving(false);
    };

    // Add new option value
    const addOptionValue = async (groupId) => {
        setSaving(true);
        const group = optionGroups.find(g => g.id === groupId);
        const newValue = {
            option_group_id: groupId,
            value: 'Yeni Değer',
            value_en: 'New Value',
            price_modifier: 0,
            price_modifier_percent: 0,
            is_default: group?.values?.length === 0,
            is_available: true,
            sort_order: group?.values?.length || 0
        };

        const { data, error } = await supabase
            .from('product_option_values')
            .insert(newValue)
            .select()
            .single();

        if (error) {
            console.error('Error adding option value:', error);
        } else {
            setOptionGroups(prev => prev.map(g =>
                g.id === groupId
                    ? { ...g, values: [...(g.values || []), data] }
                    : g
            ));
        }
        setSaving(false);
    };

    // Update option value
    const updateOptionValue = async (groupId, valueId, updates) => {
        setSaving(true);
        const { error } = await supabase
            .from('product_option_values')
            .update(updates)
            .eq('id', valueId);

        if (error) {
            console.error('Error updating option value:', error);
        } else {
            setOptionGroups(prev => prev.map(g =>
                g.id === groupId
                    ? {
                        ...g,
                        values: g.values.map(v =>
                            v.id === valueId ? { ...v, ...updates } : v
                        )
                    }
                    : g
            ));
        }
        setSaving(false);
    };

    // Delete option value
    const deleteOptionValue = async (groupId, valueId) => {
        setSaving(true);
        const { error } = await supabase
            .from('product_option_values')
            .delete()
            .eq('id', valueId);

        if (error) {
            console.error('Error deleting option value:', error);
        } else {
            setOptionGroups(prev => prev.map(g =>
                g.id === groupId
                    ? { ...g, values: g.values.filter(v => v.id !== valueId) }
                    : g
            ));
        }
        setSaving(false);
    };

    // Toggle group expansion
    const toggleExpand = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <div className="card p-6 border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                        Ürün Varyantları
                    </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => onHasVariantsChange(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600"
                    />
                    <span className="text-sm">Varyantları Aktif Et</span>
                </label>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                Ölçü, renk, kalite gibi seçenekler ekleyerek müşterilerinize özelleştirme imkanı sunun.
                Her seçenek fiyatı değiştirebilir.
            </p>

            {hasVariants && (
                <>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Yükleniyor...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {optionGroups.map((group, groupIndex) => (
                                <div
                                    key={group.id}
                                    className="border rounded-lg bg-background overflow-hidden"
                                >
                                    {/* Group Header */}
                                    <div
                                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                                        onClick={() => toggleExpand(group.id)}
                                    >
                                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                        <div className="flex-1">
                                            <div className="font-medium">{group.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {OPTION_TYPES.find(t => t.value === group.type)?.label || group.type}
                                                {' • '}
                                                {group.values?.length || 0} değer
                                                {group.affects_price && ' • Fiyatı etkiler'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteOptionGroup(group.id);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {expandedGroups[group.id] ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Group Content */}
                                    {expandedGroups[group.id] && (
                                        <div className="border-t p-4 space-y-4">
                                            {/* Group Settings */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Grup Adı (TR)</label>
                                                    <input
                                                        type="text"
                                                        value={group.name}
                                                        onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                                                        className="w-full border rounded-md p-2 text-sm bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Grup Adı (EN)</label>
                                                    <input
                                                        type="text"
                                                        value={group.name_en || ''}
                                                        onChange={(e) => updateOptionGroup(group.id, { name_en: e.target.value })}
                                                        className="w-full border rounded-md p-2 text-sm bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Tip</label>
                                                    <select
                                                        value={group.type}
                                                        onChange={(e) => updateOptionGroup(group.id, { type: e.target.value })}
                                                        className="w-full border rounded-md p-2 text-sm bg-background"
                                                    >
                                                        {OPTION_TYPES.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={group.is_required}
                                                            onChange={(e) => updateOptionGroup(group.id, { is_required: e.target.checked })}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">Zorunlu</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={group.affects_price}
                                                            onChange={(e) => updateOptionGroup(group.id, { affects_price: e.target.checked })}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">Fiyatı Etkiler</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Values */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-medium">Değerler</label>
                                                    <button
                                                        onClick={() => addOptionValue(group.id)}
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Değer Ekle
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {group.values?.map((value, valueIndex) => (
                                                        <div
                                                            key={value.id}
                                                            className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg"
                                                        >
                                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Değer (TR)"
                                                                    value={value.value}
                                                                    onChange={(e) => updateOptionValue(group.id, value.id, { value: e.target.value })}
                                                                    className="border rounded p-2 text-sm bg-background"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Value (EN)"
                                                                    value={value.value_en || ''}
                                                                    onChange={(e) => updateOptionValue(group.id, value.id, { value_en: e.target.value })}
                                                                    className="border rounded p-2 text-sm bg-background"
                                                                />
                                                                {group.affects_price && (
                                                                    <>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Fiyat Farkı (₺)"
                                                                                value={value.price_modifier || ''}
                                                                                onChange={(e) => updateOptionValue(group.id, value.id, { price_modifier: parseFloat(e.target.value) || 0 })}
                                                                                className="border rounded p-2 text-sm bg-background w-full pr-6"
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₺</span>
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="% Fark"
                                                                                value={value.price_modifier_percent || ''}
                                                                                onChange={(e) => updateOptionValue(group.id, value.id, { price_modifier_percent: parseFloat(e.target.value) || 0 })}
                                                                                className="border rounded p-2 text-sm bg-background w-full pr-6"
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {group.type === 'color_swatch' && (
                                                                    <input
                                                                        type="color"
                                                                        value={value.hex_color || '#cccccc'}
                                                                        onChange={(e) => updateOptionValue(group.id, value.id, { hex_color: e.target.value })}
                                                                        className="w-full h-9 rounded cursor-pointer"
                                                                        title="Renk seçin"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <label className="flex items-center gap-1 text-xs" title="Varsayılan">
                                                                    <input
                                                                        type="radio"
                                                                        name={`default-${group.id}`}
                                                                        checked={value.is_default}
                                                                        onChange={() => {
                                                                            // Set this as default, unset others
                                                                            group.values.forEach(v => {
                                                                                updateOptionValue(group.id, v.id, { is_default: v.id === value.id });
                                                                            });
                                                                        }}
                                                                        className="w-3 h-3"
                                                                    />
                                                                    <span>Varsayılan</span>
                                                                </label>
                                                                <button
                                                                    onClick={() => deleteOptionValue(group.id, value.id)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {(!group.values || group.values.length === 0) && (
                                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                                            Henüz değer eklenmemiş
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Group Button */}
                            <button
                                onClick={addOptionGroup}
                                disabled={saving}
                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Yeni Seçenek Grubu Ekle
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
