'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
    Settings2, RefreshCw, Check, X
} from 'lucide-react';

const OPTION_TYPES = [
    { value: 'select', label: 'Dropdown (Seçim kutusu)', labelEn: 'Dropdown' },
    { value: 'radio', label: 'Radio (Tek seçim)', labelEn: 'Radio Buttons' },
    { value: 'color_swatch', label: 'Renk Seçici', labelEn: 'Color Swatches' },
    { value: 'size_grid', label: 'Boyut Grid', labelEn: 'Size Grid' },
];

/**
 * ProductVariantsManager Component
 * 
 * Admin component for managing product option groups, values, and variant combinations.
 * 
 * @param {string} productId - The product UUID
 * @param {boolean} hasVariants - Whether variants are enabled for this product
 * @param {Function} onHasVariantsChange - Callback when hasVariants toggle changes
 */
export default function ProductVariantsManager({ productId, hasVariants, onHasVariantsChange }) {
    const [optionGroups, setOptionGroups] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    // Fetch existing option groups, values, and variants
    useEffect(() => {
        if (productId && hasVariants) {
            fetchData();
        }
    }, [productId, hasVariants]);

    async function fetchData() {
        setLoading(true);
        await Promise.all([
            fetchOptionGroups(),
            fetchProductVariants()
        ]);
        setLoading(false);
    }

    async function fetchOptionGroups() {
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
            const sortedData = (data || []).map(group => ({
                ...group,
                values: (group.values || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            }));
            setOptionGroups(sortedData);
            // Expand first group by default if none are expanded
            if (sortedData.length > 0 && Object.keys(expandedGroups).length === 0) {
                setExpandedGroups({ [sortedData[0].id]: true });
            }
        }
    }

    async function fetchProductVariants() {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching variants:', error);
        } else {
            setVariants(data || []);
        }
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
            is_default: (group?.values || []).length === 0,
            is_available: true,
            sort_order: (group?.values || []).length || 0
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
                    ? { ...g, values: (g.values || []).filter(v => v.id !== valueId) }
                    : g
            ));
        }
        setSaving(false);
    };

    // --- Variant Combination Methods ---

    const generateCombinations = async () => {
        const groupsWithValues = optionGroups.filter(g => g.values && g.values.length > 0);
        if (groupsWithValues.length === 0) {
            alert('Lütfen önce seçeneklere değer ekleyin.');
            return;
        }

        if (!confirm('Mevcut olmayan tüm olası kombinasyonlar oluşturulacak. Devam edilsin mi?')) {
            return;
        }

        setGenerating(true);

        // Helper to create cartesian product
        const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

        const possibleCombinationsValues = cartesian(...groupsWithValues.map(g =>
            g.values.map(v => ({ group: g.name, value: v.value }))
        ));

        // Normalize combinations into objects
        const normalizedCombos = (Array.isArray(possibleCombinationsValues[0])
            ? possibleCombinationsValues
            : possibleCombinationsValues.map(c => [c])
        ).map(comboArr => {
            const obj = {};
            comboArr.forEach(c => obj[c.group] = c.value);
            return obj;
        });

        const newVariants = [];
        for (const combination of normalizedCombos) {
            // Check if combination already exists
            const exists = variants.find(v =>
                JSON.stringify(v.option_combination) === JSON.stringify(combination)
            );

            if (!exists) {
                newVariants.push({
                    product_id: productId,
                    option_combination: combination,
                    sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    stock: 0,
                    is_available: true
                });
            }
        }

        if (newVariants.length > 0) {
            const { data, error } = await supabase
                .from('product_variants')
                .insert(newVariants)
                .select();

            if (error) {
                console.error('Error creating variants:', error);
                alert('Varyantlar oluşturulurken hata oluştu.');
            } else {
                setVariants(prev => [...prev, ...data]);
            }
        } else {
            alert('Tüm olası kombinasyonlar zaten mevcut.');
        }

        setGenerating(false);
    };

    const updateVariant = async (variantId, updates) => {
        const { error } = await supabase
            .from('product_variants')
            .update(updates)
            .eq('id', variantId);

        if (error) {
            console.error('Error updating variant:', error);
        } else {
            setVariants(prev => prev.map(v =>
                v.id === variantId ? { ...v, ...updates } : v
            ));
        }
    };

    const deleteVariant = async (variantId) => {
        if (!confirm('Bu varyantı silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('product_variants')
            .delete()
            .eq('id', variantId);

        if (error) {
            console.error('Error deleting variant:', error);
        } else {
            setVariants(prev => prev.filter(v => v.id !== variantId));
        }
    };

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
                        Ürün Varyantları & Seçenekler
                    </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => onHasVariantsChange(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600"
                    />
                    <span className="text-sm font-medium">Varyantları Aktif Et</span>
                </label>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                Renk, ölçü ve kalite gibi seçenekleri yönetin. Bu seçeneklerden otomatik stok varyantları oluşturabilirsiniz.
            </p>

            {hasVariants && (
                <div className="space-y-8">
                    {/* Option Groups Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Seçenek Grupları</h4>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                        ) : (
                            <>
                                {optionGroups.map((group) => (
                                    <div key={group.id} className="border rounded-lg bg-background overflow-hidden shadow-sm">
                                        <div
                                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                                            onClick={() => toggleExpand(group.id)}
                                        >
                                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="font-bold flex items-center gap-2 text-sm uppercase">
                                                    {group.name}
                                                    {group.is_required && <span className="text-red-500">*</span>}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-medium">
                                                    {OPTION_TYPES.find(t => t.value === group.type)?.label} • {group.values?.length || 0} DEĞER
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteOptionGroup(group.id); }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>

                                        {expandedGroups[group.id] && (
                                            <div className="p-4 border-t bg-muted/5 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="lg:col-span-1">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Grup Adı (TR)</label>
                                                        <input
                                                            type="text" value={group.name}
                                                            onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                                                            className="input py-1.5 text-sm w-full"
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-1">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Grup Adı (EN)</label>
                                                        <input
                                                            type="text" value={group.name_en || ''}
                                                            onChange={(e) => updateOptionGroup(group.id, { name_en: e.target.value })}
                                                            className="input py-1.5 text-sm w-full"
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-1">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Görünüm</label>
                                                        <select
                                                            value={group.type}
                                                            onChange={(e) => updateOptionGroup(group.id, { type: e.target.value })}
                                                            className="input py-1.5 text-sm w-full"
                                                        >
                                                            {OPTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end gap-3 pb-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox" checked={group.is_required}
                                                                onChange={(e) => updateOptionGroup(group.id, { is_required: e.target.checked })}
                                                                className="rounded text-purple-600"
                                                            />
                                                            <span className="text-xs font-medium">Zorunlu</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox" checked={group.affects_price}
                                                                onChange={(e) => updateOptionGroup(group.id, { affects_price: e.target.checked })}
                                                                className="rounded text-purple-600"
                                                            />
                                                            <span className="text-xs font-medium">Fiyatı Etkiler</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="text-[10px] font-bold uppercase text-muted-foreground">Değerler & Fiyat Farkları</h5>
                                                        <button
                                                            onClick={() => addOptionValue(group.id)}
                                                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Değer Ekle
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {group.values?.map((val) => (
                                                            <div key={val.id} className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded border shadow-sm">
                                                                <input
                                                                    type="text" placeholder="TR" value={val.value}
                                                                    onChange={(e) => updateOptionValue(group.id, val.id, { value: e.target.value })}
                                                                    className="input py-1 text-xs flex-1 min-w-[100px]"
                                                                />
                                                                <input
                                                                    type="text" placeholder="EN" value={val.value_en || ''}
                                                                    onChange={(e) => updateOptionValue(group.id, val.id, { value_en: e.target.value })}
                                                                    className="input py-1 text-xs flex-1 min-w-[100px]"
                                                                />
                                                                {group.affects_price && (
                                                                    <>
                                                                        <div className="relative w-24">
                                                                            <input
                                                                                type="number" placeholder="+₺" value={val.price_modifier || ''}
                                                                                onChange={(e) => updateOptionValue(group.id, val.id, { price_modifier: parseFloat(e.target.value) || 0 })}
                                                                                className="input py-1 pr-5 text-xs w-full text-right"
                                                                            />
                                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">₺</span>
                                                                        </div>
                                                                        <div className="relative w-24">
                                                                            <input
                                                                                type="number" placeholder="+%" value={val.price_modifier_percent || ''}
                                                                                onChange={(e) => updateOptionValue(group.id, val.id, { price_modifier_percent: parseFloat(e.target.value) || 0 })}
                                                                                className="input py-1 pr-5 text-xs w-full text-right"
                                                                            />
                                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">%</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {group.type === 'color_swatch' && (
                                                                    <input
                                                                        type="color" value={val.hex_color || '#cccccc'}
                                                                        onChange={(e) => updateOptionValue(group.id, val.id, { hex_color: e.target.value })}
                                                                        className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                                                                    />
                                                                )}
                                                                <label className="flex items-center gap-1.5 px-2 cursor-pointer" title="Varsayılan">
                                                                    <input
                                                                        type="radio" name={`def-${group.id}`} checked={val.is_default}
                                                                        onChange={() => group.values.forEach(v => updateOptionValue(group.id, v.id, { is_default: v.id === val.id }))}
                                                                        className="w-3 h-3 text-purple-600"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Def</span>
                                                                </label>
                                                                <button
                                                                    onClick={() => deleteOptionValue(group.id, val.id)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={addOptionGroup}
                                    className="w-full py-2 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider"
                                >
                                    + Grup Ekle
                                </button>
                            </>
                        )}
                    </div>

                    {/* Variant Combinations Section */}
                    <div className="space-y-4 pt-8 border-t border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2. Varyant Kombinasyonları</h4>
                                <p className="text-[11px] text-muted-foreground">Stok takibi için kombinasyonlar oluşturun.</p>
                            </div>
                            <button
                                onClick={generateCombinations}
                                disabled={generating || optionGroups.length === 0}
                                className="btn btn-primary btn-sm flex items-center gap-2"
                            >
                                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Kombinasyonları Oluştur
                            </button>
                        </div>

                        {variants.length > 0 ? (
                            <div className="card overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground">Kombinasyon</th>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground">SKU</th>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground">Stok</th>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground">Özel Fiyat</th>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground text-center">Durum</th>
                                                <th className="p-3 font-bold uppercase tracking-wider text-muted-foreground text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {variants.map((v) => (
                                                <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(v.option_combination).map(([group, val]) => (
                                                                <span key={group} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-[2px] text-[9px] uppercase font-bold border border-purple-200 dark:border-purple-800">
                                                                    {group}: {val}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="text" value={v.sku || ''}
                                                            onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                                                            className="input py-1 px-2 text-[11px] w-28 bg-transparent hover:bg-white dark:hover:bg-zinc-800"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number" value={v.stock || 0}
                                                            onChange={(e) => updateVariant(v.id, { stock: parseInt(e.target.value) || 0 })}
                                                            className="input py-1 px-2 text-[11px] w-16 bg-transparent hover:bg-white dark:hover:bg-zinc-800 text-right font-medium"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="relative w-24">
                                                            <input
                                                                type="number" placeholder="Org." value={v.price_override || ''}
                                                                onChange={(e) => updateVariant(v.id, { price_override: parseFloat(e.target.value) || null })}
                                                                className="input py-1 pr-3 text-[11px] w-full bg-transparent hover:bg-white dark:hover:bg-zinc-800 text-right"
                                                            />
                                                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold italic">₺</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => updateVariant(v.id, { is_available: !v.is_available })}
                                                            className={`p-1.5 rounded transition-colors ${v.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                                                        >
                                                            {v.is_available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => deleteVariant(v.id)}
                                                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                                <Settings2 className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-medium">Henüz varyant kombinasyonu oluşturulmadı.</p>
                                <p className="text-xs mt-1">Seçenekleri tanımladıktan sonra "Kombinasyonları Oluştur" butonuna basarak stok varyantlarını üretebilirsiniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
