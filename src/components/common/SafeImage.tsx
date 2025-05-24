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
    console.log('Image loaded successfully:', imageSrc);
    onLoad?.();
  };

  // Filter out blob URLs and data URLs that might be problematic
  const isValidUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      console.warn('Blob URL detected, using fallback:', url);
      return false;
    }
    
    if (url.startsWith('data:') && url.length > 100000) {
      console.warn('Large data URL detected, using fallback');
      return false;
    }
    
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