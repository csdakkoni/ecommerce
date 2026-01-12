'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Image as ImageIcon, Video, Loader2, Play } from 'lucide-react';

export default function MediaUploader({
    media = [],
    onMediaChange,
    maxItems = 8,
    // bucketName prop is no longer used but kept for compatibility
    bucketName = 'products'
}) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Cloudinary Configuration
    const CLOUD_NAME = 'dcwdrwemm';
    const UPLOAD_PRESET = 'eticaret';
    const FOLDER_NAME = 'products'; // Optional: Organize files in a folder

    const isVideo = (url) => {
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || url.includes('/video/upload/');
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', FOLDER_NAME);

        // Determine correct endpoint based on file type
        const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
        const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
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
        let hasError = false;

        try {
            for (const file of files) {
                const isVideoFile = file.type.startsWith('video/');
                const isImageFile = file.type.startsWith('image/');

                if (!isImageFile && !isVideoFile) {
                    alert('Sadece görsel ve video dosyaları yükleyebilirsiniz.');
                    continue;
                }

                // Cloudinary limitleri daha esnek ama yine de çok büyük dosyaları uyaralım
                // Free plan: Image ~10MB, Video ~100MB
                const maxSize = isVideoFile ? 95 * 1024 * 1024 : 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert(`${file.name}: Dosya boyutu çok büyük. (Max: ${isVideoFile ? '95MB' : '10MB'})`);
                    continue;
                }

                try {
                    const url = await uploadFile(file);
                    newMedia.push(url);
                    completed++;
                    setUploadProgress(Math.round((completed / files.length) * 100));
                } catch (err) {
                    console.error(`Error uploading ${file.name}:`, err);
                    alert(`${file.name} yüklenemedi: ${err.message}`);
                    hasError = true;
                }
            }

            if (completed > 0) {
                onMediaChange(newMedia);
            }
        } catch (error) {
            console.error('Upload process error:', error);
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

    const removeMedia = (index) => {
        // Cloudinary delete requires API signature (backend), so we only remove from UI/DB for now.
        // Unused files will remain in Cloudinary (free storage is generous)
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
                        <span>Buluta yükleniyor... {uploadProgress}%</span>
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
                            Görsel (JPG, PNG, WebP) • Video (MP4, WebM)
                            <br />
                            <span className="text-green-600 font-medium">Cloudinary Optimizasyonu Aktif</span>
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
                            <div key={index} className="relative group aspect-square bg-muted rounded-lg overflow-hidden border">
                                {isVideoItem ? (
                                    <div className="relative w-full h-full bg-black">
                                        <video
                                            src={url}
                                            className="w-full h-full object-cover opacity-80"
                                            muted
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-10 h-10 text-white/80" />
                                        </div>
                                        <span className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-medium z-10">
                                            VIDEO
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={url}
                                        alt={`Ürün görseli ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                                        title="Kaldır"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
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
