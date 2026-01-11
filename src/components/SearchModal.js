'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, X, Package } from 'lucide-react';

export default function SearchModal({ isOpen, onClose }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const searchProducts = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('id, name, slug, price, images, fabric_type')
                .eq('is_active', true)
                .or(`name.ilike.%${query}%,fabric_type.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(8);

            if (!error) {
                setResults(data || []);
            }
            setLoading(false);
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (product) => {
        router.push(`/products/${product.id}`);
        onClose();
        setQuery('');
        setResults([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center border-b px-4">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Kumaş ara..."
                        className="flex-1 px-4 py-4 bg-transparent outline-none text-lg"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-center text-muted-foreground">Aranıyor...</div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            "{query}" için sonuç bulunamadı.
                        </div>
                    )}

                    {results.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
                        >
                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                {product.images && product.images[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.fabric_type || 'Kumaş'}</p>
                            </div>
                            <div className="font-semibold">{product.price} ₺</div>
                        </button>
                    ))}
                </div>

                {/* Keyboard hint */}
                <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground text-center border-t">
                    ESC ile kapatın
                </div>
            </div>
        </div>
    );
}
