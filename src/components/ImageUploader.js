'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ImageUploader({
    images = [],
    onImagesChange,
    maxImages = 5,
    bucketName = 'products'
}) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) return;
        if (images.length + files.length > maxImages) {
            alert(`En fazla ${maxImages} görsel yükleyebilirsiniz.`);
            return;
        }

        setUploading(true);
        const newImages = [...images];

        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    alert('Sadece görsel dosyaları yükleyebilirsiniz.');
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                    continue;
                }

                const url = await uploadImage(file);
                newImages.push(url);
            }
            onImagesChange(newImages);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Görsel yüklenirken hata oluştu: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileSelect(files);
    }, [images, onImagesChange]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const removeImage = async (index) => {
        const imageUrl = images[index];
        // Extract file path from URL for deletion
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        try {
            await supabase.storage
                .from(bucketName)
                .remove([fileName]);
        } catch (error) {
            console.error('Delete error:', error);
        }

        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Yükleniyor...</span>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Görselleri sürükleyin veya <span className="text-primary underline">seçin</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            PNG, JPG, WebP (Max 5MB)
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                        />
                    </label>
                )}
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-square bg-muted rounded-lg overflow-hidden">
                            <img
                                src={url}
                                alt={`Ürün görseli ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Ana Görsel
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Counter */}
            <p className="text-xs text-muted-foreground text-right">
                {images.length} / {maxImages} görsel
            </p>
        </div>
    );
}
