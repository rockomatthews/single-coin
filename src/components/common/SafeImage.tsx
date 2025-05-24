'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function SafeImage({
  src,
  alt,
  fill = false,
  sizes,
  style,
  fallbackSrc = '/images/logo.png',
  onError,
  onLoad,
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      console.log('Image failed to load, falling back to:', fallbackSrc);
      setImageSrc(fallbackSrc);
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    if (imageSrc.startsWith('data:image/')) {
      console.log('✅ Uploaded image (base64) loaded successfully');
    } else if (imageSrc.startsWith('blob:')) {
      console.log('⚠️ Blob URL loaded (but will be replaced on refresh)');
    } else {
      console.log('✅ Image loaded successfully:', imageSrc.substring(0, 50) + '...');
    }
    onLoad?.();
  };

  // Filter out blob URLs and data URLs that might be problematic
  const isValidUrl = (url: string) => {
    // Always reject blob URLs (these are the problematic ones)
    if (url.startsWith('blob:')) {
      console.warn('Blob URL detected, using fallback:', url);
      return false;
    }
    
    // Allow data URLs (base64 encoded images from uploads) - these are good!
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // Allow http/https URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
    
    // Allow relative paths
    if (url.startsWith('/')) {
      return true;
    }
    
    // For any other format, allow it and let the browser handle it
    return true;
  };

  // Use fallback if the URL is invalid
  const sourceToUse = isValidUrl(imageSrc) ? imageSrc : fallbackSrc;

  return (
    <Image
      src={sourceToUse}
      alt={alt}
      fill={fill}
      sizes={sizes}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
} 