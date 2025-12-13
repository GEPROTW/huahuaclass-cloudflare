
import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { db } from '../services/db';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string; // Optional label shown outside
    placeholderLabel?: string; // Text shown when empty
    className?: string; // Wrapper class for dimensions/aspect ratio
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    value, 
    onChange, 
    label, 
    placeholderLabel = "點擊上傳圖片", 
    className = "h-40" 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Check size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("檔案過大 (限制 5MB)");
            setTimeout(() => setError(null), 3000);
            return;
        }
        // Validation: Type
        if (!file.type.startsWith('image/')) {
            setError("請上傳圖片格式");
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const url = await db.uploadImage(file);
            onChange(url);
        } catch (err: any) {
            console.error(err);
            setError("上傳失敗");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering upload click
        onChange('');
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>}
            
            <div 
                className={`relative group rounded-xl border-2 border-dashed transition-all overflow-hidden bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer
                ${value ? 'border-slate-200' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}
                ${isUploading ? 'opacity-70 pointer-events-none' : ''}
                ${className}`}
                onClick={() => !value && fileInputRef.current?.click()}
            >
                {/* File Input (Hidden) */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                        
                        {/* Hover Overlay for Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                            <p className="text-white text-xs font-medium">編輯圖片</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors border border-white/30"
                                    title="更換圖片"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={handleRemove}
                                    className="p-2 bg-red-500/80 text-white hover:bg-red-600 rounded-full backdrop-blur-sm transition-colors border border-white/30"
                                    title="移除圖片"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-4 flex flex-col items-center justify-center w-full h-full">
                        {isUploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                <span className="text-sm text-blue-600 font-medium">上傳中...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <span className="text-sm text-slate-500 font-medium group-hover:text-blue-600">{placeholderLabel}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Error Message Overlay */}
                {error && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
