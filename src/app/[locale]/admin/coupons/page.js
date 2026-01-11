'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tag, Plus, Search, Trash2, Edit2, Copy, Check, X, Calendar, Percent, DollarSign } from 'lucide-react';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 0,
        max_uses: null,
        per_user_limit: 1,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        is_active: true,
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    async function fetchCoupons() {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCoupons(data);
        }
        setLoading(false);
    }

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'GROHN';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    const openCreateModal = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: 10,
            min_order_amount: 0,
            max_uses: null,
            per_user_limit: 1,
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: '',
            is_active: true,
        });
        generateCode();
        setShowModal(true);
    };

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_amount: coupon.min_order_amount || 0,
            max_uses: coupon.max_uses,
            per_user_limit: coupon.per_user_limit || 1,
            valid_from: coupon.valid_from?.split('T')[0] || '',
            valid_until: coupon.valid_until?.split('T')[0] || '',
            is_active: coupon.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const couponData = {
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            min_order_amount: parseFloat(formData.min_order_amount) || 0,
            max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
            per_user_limit: parseInt(formData.per_user_limit) || 1,
            valid_from: formData.valid_from || null,
            valid_until: formData.valid_until || null,
            is_active: formData.is_active,
        };

        if (editingCoupon) {
            await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id);
        } else {
            await supabase.from('coupons').insert(couponData);
        }

        setShowModal(false);
        fetchCoupons();
    };

    const toggleActive = async (coupon) => {
        await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
        fetchCoupons();
    };

    const deleteCoupon = async (id) => {
        if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
        await supabase.from('coupons').delete().eq('id', id);
        fetchCoupons();
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const formatDiscount = (coupon) => {
        if (coupon.discount_type === 'percentage') {
            return `%${coupon.discount_value}`;
        }
        return `${coupon.discount_value} ₺`;
    };

    const getCouponStatus = (coupon) => {
        if (!coupon.is_active) return { label: 'Pasif', color: 'bg-gray-100 text-gray-700' };

        const now = new Date();
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return { label: 'Süresi Doldu', color: 'bg-red-100 text-red-700' };
        }
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700' };
        }
        if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
            return { label: 'Limit Doldu', color: 'bg-orange-100 text-orange-700' };
        }
        return { label: 'Aktif', color: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="w-7 h-7" />
                        Kuponlar
                    </h1>
                    <p className="text-muted-foreground">İndirim kuponlarını yönetin</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Kupon
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Kupon kodu ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Coupons Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
            ) : filteredCoupons.length === 0 ? (
                <div className="card p-12 text-center">
                    <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Henüz kupon yok</h3>
                    <p className="text-muted-foreground mb-4">İlk kuponunuzu oluşturun</p>
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Kupon Oluştur
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map(coupon => {
                        const status = getCouponStatus(coupon);
                        return (
                            <div key={coupon.id} className="card p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <code className="text-lg font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">
                                            {coupon.code}
                                        </code>
                                        <button
                                            onClick={() => copyCode(coupon.code)}
                                            className="p-1 hover:bg-muted rounded"
                                            title="Kopyala"
                                        >
                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Discount */}
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    {coupon.discount_type === 'percentage' ? (
                                        <Percent className="w-8 h-8 text-primary" />
                                    ) : (
                                        <DollarSign className="w-8 h-8 text-primary" />
                                    )}
                                    <div>
                                        <p className="text-2xl font-bold">{formatDiscount(coupon)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {coupon.discount_type === 'percentage' ? 'Yüzde indirim' : 'Sabit indirim'}
                                        </p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                    {coupon.min_order_amount > 0 && (
                                        <p className="text-muted-foreground">
                                            Min. sepet: <span className="font-medium text-foreground">{coupon.min_order_amount} ₺</span>
                                        </p>
                                    )}
                                    <p className="text-muted-foreground">
                                        Kullanım: <span className="font-medium text-foreground">
                                            {coupon.uses_count || 0} / {coupon.max_uses || '∞'}
                                        </span>
                                    </p>
                                    {coupon.valid_until && (
                                        <p className="text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(coupon.valid_until).toLocaleDateString('tr-TR')} tarihine kadar
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <button
                                        onClick={() => toggleActive(coupon)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${coupon.is_active
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                    >
                                        {coupon.is_active ? 'Devre Dışı' : 'Aktifleştir'}
                                    </button>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(coupon)}
                                            className="p-2 hover:bg-muted rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteCoupon(coupon.id)}
                                            className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Code */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Kupon Kodu</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="input flex-1 uppercase"
                                        required
                                    />
                                    <button type="button" onClick={generateCode} className="btn btn-outline">
                                        Oluştur
                                    </button>
                                </div>
                            </div>

                            {/* Discount Type & Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">İndirim Tipi</label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="percentage">Yüzde (%)</option>
                                        <option value="fixed">Sabit (₺)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        İndirim {formData.discount_type === 'percentage' ? '(%)' : '(₺)'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Min Order Amount */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Minimum Sepet Tutarı (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.min_order_amount}
                                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                    className="input w-full"
                                    placeholder="0 = limit yok"
                                />
                            </div>

                            {/* Usage Limits */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Toplam Kullanım Limiti</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.max_uses || ''}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        className="input w-full"
                                        placeholder="Sınırsız"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Kişi Başı Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.per_user_limit}
                                        onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            {/* Validity Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span className="font-medium">Kupon aktif</span>
                            </label>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingCoupon ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
