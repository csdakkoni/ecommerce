'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Building2, X } from 'lucide-react';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        tax_number: '',
        notes: '',
        is_active: true,
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    async function fetchSuppliers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

        if (!error && data) {
            setSuppliers(data);
        }
        setLoading(false);
    }

    const openCreateModal = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            contact_name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            tax_number: '',
            notes: '',
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name || '',
            contact_name: supplier.contact_name || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            city: supplier.city || '',
            tax_number: supplier.tax_number || '',
            notes: supplier.notes || '',
            is_active: supplier.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingSupplier) {
            await supabase.from('suppliers').update(formData).eq('id', editingSupplier.id);
        } else {
            await supabase.from('suppliers').insert(formData);
        }

        setShowModal(false);
        fetchSuppliers();
    };

    const deleteSupplier = async (id) => {
        if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
        await supabase.from('suppliers').delete().eq('id', id);
        fetchSuppliers();
    };

    const toggleActive = async (supplier) => {
        await supabase.from('suppliers').update({ is_active: !supplier.is_active }).eq('id', supplier.id);
        fetchSuppliers();
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.city?.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = suppliers.filter(s => s.is_active).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="w-7 h-7" />
                        Tedarikçiler
                    </h1>
                    <p className="text-muted-foreground">
                        {activeCount} aktif tedarikçi
                    </p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Tedarikçi
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Tedarikçi ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Suppliers Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="card p-12 text-center">
                    <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Henüz tedarikçi yok</h3>
                    <p className="text-muted-foreground mb-4">İlk tedarikçinizi ekleyin</p>
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Tedarikçi Ekle
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map(supplier => (
                        <div
                            key={supplier.id}
                            className={`card p-5 ${!supplier.is_active ? 'opacity-60' : ''}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{supplier.name}</h3>
                                        {supplier.contact_name && (
                                            <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${supplier.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {supplier.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm mb-4">
                                {supplier.phone && (
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        {supplier.phone}
                                    </p>
                                )}
                                {supplier.email && (
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {supplier.email}
                                    </p>
                                )}
                                {(supplier.city || supplier.address) && (
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {supplier.city}{supplier.address ? `, ${supplier.address}` : ''}
                                    </p>
                                )}
                            </div>

                            {/* Tax Number */}
                            {supplier.tax_number && (
                                <p className="text-xs text-muted-foreground mb-4">
                                    Vergi No: <span className="font-mono">{supplier.tax_number}</span>
                                </p>
                            )}

                            {/* Notes */}
                            {supplier.notes && (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mb-4 line-clamp-2">
                                    {supplier.notes}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t">
                                <button
                                    onClick={() => toggleActive(supplier)}
                                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${supplier.is_active
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                >
                                    {supplier.is_active ? 'Devre Dışı' : 'Aktifleştir'}
                                </button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(supplier)}
                                        className="p-2 hover:bg-muted rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteSupplier(supplier.id)}
                                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Firma Adı *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Yetkili Kişi</label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">E-posta</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Şehir</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Vergi No</label>
                                    <input
                                        type="text"
                                        value={formData.tax_number}
                                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Adres</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input w-full"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Notlar</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="input w-full"
                                    rows={2}
                                    placeholder="Tedarikçi hakkında notlar..."
                                />
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span className="font-medium">Tedarikçi aktif</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingSupplier ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
