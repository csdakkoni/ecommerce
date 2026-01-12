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
        return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || url.includes('/video/') || url.includes('type=video');
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        // For images, use our new local optimization API
        // For videos, we'll use a similar path but handle differently if needed
        const isVideoFile = file.type.startsWith('video/');
        const endpoint = isVideoFile ? '/api/image/upload' : '/api/image/upload'; // Using same for now as handler handles both or we'll update it

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            return data.url; // This will be /api/image/filename
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const compressImageSize = async (file) => {
        // Client-side compression for very large images (> 12MB) to speed up upload phase
        // The server will still optimize further with Sharp
        if (!file.type.startsWith('image/') || file.size < 12 * 1024 * 1024) {
            return file;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIMENSION = 4096;

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.max(width / MAX_DIMENSION, height / MAX_DIMENSION);
                    width /= ratio;
                    height /= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Canvas conversion failed'));
                    }
                }, 'image/jpeg', 0.9); // High quality for initial upload
            };

            img.onerror = (error) => {
                reject(error);
                URL.revokeObjectURL(url);
            };

            img.src = url;
        });
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
            for (const originalFile of files) {
                const isVideoFile = originalFile.type.startsWith('video/');
                const isImageFile = originalFile.type.startsWith('image/');

                if (!isImageFile && !isVideoFile) {
                    alert('Sadece görsel ve video dosyaları yükleyebilirsiniz.');
                    continue;
                }

                let fileToUpload = originalFile;

                if (isImageFile) {
                    fileToUpload = await compressImageSize(originalFile);
                }

                try {
                    const url = await uploadFile(fileToUpload);
                    newMedia.push(url);
                    completed++;
                    setUploadProgress(Math.round((completed / files.length) * 100));
                } catch (err) {
                    console.error(`Error uploading ${originalFile.name}:`, err);
                    alert(`${originalFile.name} yüklenemedi: ${err.message}`);
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
        const newMedia = media.filter((_, i) => i !== index);
        onMediaChange(newMedia);
    };

    const imageCount = media.filter(m => !isVideo(m)).length;
    const videoCount = media.filter(m => isVideo(m)).length;

    return (
        <div className="space-y-4">
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
                        <span>Sisteme yükleniyor... {uploadProgress}%</span>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="flex gap-2">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Görsel/video sürükleyin veya <span className="text-primary underline">seçin</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            JPG, PNG, WebP, AVIF • MP4, WebM
                            <br />
                            <span className="text-blue-600 font-medium font-mono text-[10px]">LOCAL OPTIMIZATION ENGINE ACTIVE</span>
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

            {media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {media.map((url, index) => {
                        const isVideoItem = isVideo(url);
                        // For local preview, we can append low quality parameters if it's our API
                        const previewUrl = url.includes('/api/image/') ? `${url}?w=400&q=70` : url;

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
                                    </div>
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt={`Görsel ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {index === 0 && !isVideoItem && (
                                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                                        VİTRİN
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                <span>
                    {imageCount} GÖRSEL, {videoCount} VİDEO
                </span>
                <span>
                    {media.length} / {maxItems} DOSYA
                </span>
            </div>
        </div>
    );
}
