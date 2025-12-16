import React, { useState, useRef, useCallback } from "react";
import { toast } from "./Toast";

interface EnhancedImageUploadProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  disabled: boolean;
}

interface ImagePreview {
  file: File;
  url: string;
  dimensions: { width: number; height: number };
  size: number;
  format: string;
}

const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  onUpload,
  uploading,
  disabled
}) => {
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, and WebP files are allowed');
    }

    // File size validation (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Minimum file size (to avoid tiny images)
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      errors.push('File is too small. Please select a valid image');
    }

    return errors;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File) => {
    const errors = validateFile(file);
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      const dimensions = await getImageDimensions(file);
      const url = URL.createObjectURL(file);
      
      // Additional dimension validation
      if (dimensions.width < 100 || dimensions.height < 100) {
        toast.error('Image must be at least 100x100 pixels');
        return;
      }

      if (dimensions.width > 8000 || dimensions.height > 8000) {
        toast.warning('Very large image detected. It will be automatically resized for optimal performance.');
      }

      const preview: ImagePreview = {
        file,
        url,
        dimensions,
        size: file.size,
        format: file.type.split('/')[1].toUpperCase()
      };

      setPreview(preview);
      setValidationErrors([]);
      
    } catch (error) {
      toast.error('Failed to process image. Please try another file.');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (preview && !uploading && !disabled) {
      onUpload(preview.file);
    }
  };

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOptimalDimensions = (width: number, height: number) => {
    const aspectRatio = width / height;
    const thumbnailRatio = 16 / 9; // YouTube thumbnail ratio
    
    if (Math.abs(aspectRatio - thumbnailRatio) < 0.1) {
      return { status: 'perfect', message: 'Perfect for thumbnails!' };
    } else if (aspectRatio > 1.5 && aspectRatio < 2) {
      return { status: 'good', message: 'Good aspect ratio for thumbnails' };
    } else {
      return { status: 'warning', message: 'Consider using 16:9 aspect ratio for best results' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? "border-blue-400 bg-blue-50/10"
            : disabled
            ? "border-gray-600 bg-gray-800/50"
            : "border-gray-600 hover:border-gray-500 bg-slate-700/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-white">
              {dragActive ? "Drop your image here" : "Upload your image"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports JPEG, PNG, WebP • Max 10MB • Min 100x100px
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-300 font-medium">Upload Error</p>
              <ul className="text-red-400 text-sm mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {/* Image Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={preview.url}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-slate-600"
              />
            </div>

            {/* Image Info */}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-medium text-white">{preview.file.name}</h4>
                <p className="text-sm text-gray-400">
                  {preview.format} • {formatFileSize(preview.size)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Dimensions:</span>
                  <span className="text-white ml-1">
                    {preview.dimensions.width} × {preview.dimensions.height}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Aspect Ratio:</span>
                  <span className="text-white ml-1">
                    {(preview.dimensions.width / preview.dimensions.height).toFixed(2)}:1
                  </span>
                </div>
              </div>

              {/* Optimization Suggestions */}
              <div className="mt-3">
                {(() => {
                  const optimization = getOptimalDimensions(preview.dimensions.width, preview.dimensions.height);
                  return (
                    <div className={`flex items-center space-x-2 text-sm ${
                      optimization.status === 'perfect' ? 'text-green-400' :
                      optimization.status === 'good' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d={optimization.status === 'perfect' ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                      <span>{optimization.message}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 space-y-2">
              <button
                onClick={handleUpload}
                disabled={uploading || disabled}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Upload</span>
                  </>
                )}
              </button>
              
              <button
                onClick={clearPreview}
                disabled={uploading}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upload Tips
        </h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use high-resolution images (1920×1080 or higher) for best quality</li>
          <li>• 16:9 aspect ratio works best for YouTube thumbnails</li>
          <li>• Clear, well-lit photos produce better results</li>
          <li>• Avoid images with complex backgrounds for easier editing</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedImageUpload;