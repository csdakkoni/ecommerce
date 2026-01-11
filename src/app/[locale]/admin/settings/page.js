'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Save, Store, Truck, Share2, Bell, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        general: {
            site_name: 'Grohn Fabrics',
            tagline: 'Doğanın Dokusu',
            email: '',
            phone: '',
        },
        shipping: {
            free_shipping_threshold: 500,
            default_shipping_cost: 29.90,
            express_shipping_cost: 59.90,
        },
        social: {
            instagram: '',
            facebook: '',
            twitter: '',
            whatsapp: '',
        },
        notifications: {
            email_new_order: true,
            email_low_stock: true,
            low_stock_threshold: 5,
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('key, value');

        if (!error && data) {
            const settingsObj = { ...settings };
            data.forEach(({ key, value }) => {
                if (settingsObj[key]) {
                    settingsObj[key] = { ...settingsObj[key], ...value };
                }
            });
            setSettings(settingsObj);
        }
        setLoading(false);
    }

    const handleSave = async () => {
        setSaving(true);

        for (const [key, value] of Object.entries(settings)) {
            await supabase
                .from('settings')
                .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }

        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const updateSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const tabs = [
        { id: 'general', label: 'Genel', icon: Store },
        { id: 'shipping', label: 'Kargo', icon: Truck },
        { id: 'social', label: 'Sosyal Medya', icon: Share2 },
        { id: 'notifications', label: 'Bildirimler', icon: Bell },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-7 h-7" />
                        Site Ayarları
                    </h1>
                    <p className="text-muted-foreground">Mağaza ayarlarını yönetin</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary flex items-center gap-2"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>

            {/* Success Message */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    ✓ Ayarlar başarıyla kaydedildi
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto pb-px">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="card p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Genel Bilgiler</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Site Adı</label>
                                    <input
                                        type="text"
                                        value={settings.general.site_name}
                                        onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Slogan</label>
                                    <input
                                        type="text"
                                        value={settings.general.tagline}
                                        onChange={(e) => updateSetting('general', 'tagline', e.target.value)}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">E-posta</label>
                                    <input
                                        type="email"
                                        value={settings.general.email}
                                        onChange={(e) => updateSetting('general', 'email', e.target.value)}
                                        className="input w-full"
                                        placeholder="info@grohnfabrics.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Telefon</label>
                                    <input
                                        type="tel"
                                        value={settings.general.phone}
                                        onChange={(e) => updateSetting('general', 'phone', e.target.value)}
                                        className="input w-full"
                                        placeholder="+90 212 555 0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shipping Settings */}
                {activeTab === 'shipping' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Kargo Ayarları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Ücretsiz Kargo Limiti (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.shipping.free_shipping_threshold}
                                        onChange={(e) => updateSetting('shipping', 'free_shipping_threshold', parseFloat(e.target.value))}
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Bu tutarın üzerindeki siparişlerde ücretsiz kargo</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Standart Kargo (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.shipping.default_shipping_cost}
                                        onChange={(e) => updateSetting('shipping', 'default_shipping_cost', parseFloat(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Hızlı Kargo (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.shipping.express_shipping_cost}
                                        onChange={(e) => updateSetting('shipping', 'express_shipping_cost', parseFloat(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Media Settings */}
                {activeTab === 'social' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Sosyal Medya Hesapları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Instagram</label>
                                    <input
                                        type="url"
                                        value={settings.social.instagram}
                                        onChange={(e) => updateSetting('social', 'instagram', e.target.value)}
                                        className="input w-full"
                                        placeholder="https://instagram.com/grohnfabrics"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Facebook</label>
                                    <input
                                        type="url"
                                        value={settings.social.facebook}
                                        onChange={(e) => updateSetting('social', 'facebook', e.target.value)}
                                        className="input w-full"
                                        placeholder="https://facebook.com/grohnfabrics"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Twitter / X</label>
                                    <input
                                        type="url"
                                        value={settings.social.twitter}
                                        onChange={(e) => updateSetting('social', 'twitter', e.target.value)}
                                        className="input w-full"
                                        placeholder="https://twitter.com/grohnfabrics"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={settings.social.whatsapp}
                                        onChange={(e) => updateSetting('social', 'whatsapp', e.target.value)}
                                        className="input w-full"
                                        placeholder="+905551234567"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Ülke kodu ile birlikte</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Bildirim Ayarları</h3>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium">Yeni Sipariş Bildirimi</p>
                                        <p className="text-sm text-muted-foreground">Yeni sipariş geldiğinde e-posta gönder</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.email_new_order}
                                        onChange={(e) => updateSetting('notifications', 'email_new_order', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium">Düşük Stok Uyarısı</p>
                                        <p className="text-sm text-muted-foreground">Stok azaldığında e-posta gönder</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.email_low_stock}
                                        onChange={(e) => updateSetting('notifications', 'email_low_stock', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <label className="text-sm font-medium mb-2 block">Düşük Stok Eşiği</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.notifications.low_stock_threshold}
                                        onChange={(e) => updateSetting('notifications', 'low_stock_threshold', parseInt(e.target.value))}
                                        className="input w-32"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Stok bu sayının altına düştüğünde uyarı ver
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
