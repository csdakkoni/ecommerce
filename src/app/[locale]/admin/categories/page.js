'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', name_en: '', description_en: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (!error) {
            setCategories(data || []);
        }
        setLoading(false);
    }

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                name_en: category.name_en || '',
                description_en: category.description_en || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', name_en: '', description_en: '' });
        }
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'name' && !editingCategory) {
            const slug = value.toLowerCase()
                .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
                .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/ /g, '-').replace(/[^\w-]+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingCategory) {
            // Update
            const { error } = await supabase
                .from('categories')
                .update(formData)
                .eq('id', editingCategory.id);

            if (error) {
                alert('Hata: ' + error.message);
            }
        } else {
            // Insert
            const { error } = await supabase
                .from('categories')
                .insert([formData]);

            if (error) {
                alert('Hata: ' + error.message);
            }
        }

        setShowModal(false);
        fetchCategories();
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            fetchCategories();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Kategoriler</h2>
                    <p className="text-muted-foreground">Ürün kategorilerini yönetin.</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Kategori
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Henüz kategori bulunmuyor.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Kategori Adı</th>
                                <th className="p-4 font-medium text-sm">Slug</th>
                                <th className="p-4 font-medium text-sm">Açıklama</th>
                                <th className="p-4 font-medium text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id} className="border-b hover:bg-muted/30">
                                    <td className="p-4 font-medium">{category.name}</td>
                                    <td className="p-4 text-muted-foreground font-mono text-sm">{category.slug}</td>
                                    <td className="p-4 text-muted-foreground text-sm">{category.description || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(category)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold">
                                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Kategori Adı</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="Örn: Premium İpek"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug</label>
                                <input
                                    type="text"
                                    name="slug"
                                    required
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background text-muted-foreground"
                                    placeholder="premium-ipek"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Açıklama</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="Kategori açıklaması..."
                                />
                            </div>

                            {/* i18n Fields */}
                            <div className="border-t pt-4 mt-4">
                                <p className="text-xs text-blue-600 font-semibold mb-3">🌍 İngilizce İçerik</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category Name (EN)</label>
                                        <input
                                            type="text"
                                            name="name_en"
                                            value={formData.name_en}
                                            onChange={handleChange}
                                            className="w-full border rounded-md p-3 bg-background"
                                            placeholder="English category name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description (EN)</label>
                                        <textarea
                                            name="description_en"
                                            value={formData.description_en}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full border rounded-md p-3 bg-background"
                                            placeholder="English description..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCategory ? 'Güncelle' : 'Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
