'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Image as ImageIcon, Video, Loader2, Play } from 'lucide-react';

export default function MediaUploader({
    media = [],
    onMediaChange,
    maxItems = 8,
    bucketName = 'products'
}) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const isVideo = (url) => {
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    const uploadFile = async (file) => {
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
        if (media.length + files.length > maxItems) {
            alert(`En fazla ${maxItems} dosya yükleyebilirsiniz.`);
            return;
        }

        setUploading(true);
        const newMedia = [...media];
        let completed = 0;

        try {
            for (const file of files) {
                const isVideoFile = file.type.startsWith('video/');
                const isImageFile = file.type.startsWith('image/');

                if (!isImageFile && !isVideoFile) {
                    alert('Sadece görsel ve video dosyaları yükleyebilirsiniz.');
                    continue;
                }

                // Size limits
                const maxSize = isVideoFile ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB video, 5MB image
                if (file.size > maxSize) {
                    alert(`${isVideoFile ? 'Video' : 'Görsel'} boyutu ${isVideoFile ? '50MB' : '5MB'}'dan küçük olmalıdır.`);
                    continue;
                }

                const url = await uploadFile(file);
                newMedia.push(url);
                completed++;
                setUploadProgress(Math.round((completed / files.length) * 100));
            }
            onMediaChange(newMedia);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Dosya yüklenirken hata oluştu: ' + error.message);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileSelect(files);
    }, [media, onMediaChange]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const removeMedia = async (index) => {
        const mediaUrl = media[index];
        const urlParts = mediaUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        try {
            await supabase.storage
                .from(bucketName)
                .remove([fileName]);
        } catch (error) {
            console.error('Delete error:', error);
        }

        const newMedia = media.filter((_, i) => i !== index);
        onMediaChange(newMedia);
    };

    const imageCount = media.filter(m => !isVideo(m)).length;
    const videoCount = media.filter(m => isVideo(m)).length;

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Yükleniyor... {uploadProgress}%</span>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="flex gap-2">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Görsel veya video sürükleyin veya <span className="text-primary underline">seçin</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Görsel: PNG, JPG, WebP (Max 5MB) • Video: MP4, WebM (Max 50MB)
                        </span>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                        />
                    </label>
                )}
            </div>

            {/* Media Preview Grid */}
            {media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {media.map((url, index) => {
                        const isVideoItem = isVideo(url);
                        return (
                            <div key={index} className="relative group aspect-square bg-muted rounded-lg overflow-hidden">
                                {isVideoItem ? (
                                    <div className="relative w-full h-full">
                                        <video
                                            src={url}
                                            className="w-full h-full object-cover"
                                            muted
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Play className="w-10 h-10 text-white" />
                                        </div>
                                        <span className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                                            VIDEO
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={url}
                                        alt={`Ürün görseli ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {index === 0 && !isVideoItem && (
                                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        Ana Görsel
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Counter */}
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                    {imageCount} görsel, {videoCount} video
                </span>
                <span>
                    {media.length} / {maxItems} dosya
                </span>
            </div>
        </div>
    );
}
