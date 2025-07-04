'use client';

import React, { useState, useRef } from 'react';
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
  const [useUnoptimizedImage, setUseUnoptimizedImage] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 2; // Limit retries to prevent infinite loops

  const handleError = () => {
    // Prevent infinite retry loops
    if (retryCountRef.current >= maxRetries) {
      console.log('Max retries reached, using fallback image');
      if (imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
        setHasError(true);
        setUseUnoptimizedImage(false);
        onError?.();
      }
      return;
    }

    if (!hasError) {
      console.log('Image failed to load:', imageSrc);
      retryCountRef.current += 1;
      
      // For IPFS images, try unoptimized version first before falling back to default
      if (imageSrc.includes('ipfs') && !useUnoptimizedImage) {
        console.log('Trying unoptimized IPFS image (attempt', retryCountRef.current, 'of', maxRetries, ')');
        setUseUnoptimizedImage(true);
        return;
      }
      
      // If unoptimized also failed or it's not an IPFS image, use fallback
      if (imageSrc !== fallbackSrc) {
        console.log('Image failed to load, falling back to:', fallbackSrc);
        setImageSrc(fallbackSrc);
        setHasError(true);
        setUseUnoptimizedImage(false);
        onError?.();
      }
    }
  };

  const handleLoad = () => {
    // Reset retry count on successful load
    retryCountRef.current = 0;
    
    if (imageSrc.startsWith('data:image/')) {
      console.log('✅ Uploaded image (base64) loaded successfully');
    } else if (imageSrc.startsWith('blob:')) {
      console.log('⚠️ Blob URL loaded (but will be replaced on refresh)');
    } else if (imageSrc.includes('ipfs')) {
      console.log('✅ IPFS image loaded successfully:', imageSrc.substring(0, 50) + '...');
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

  // For IPFS images that are having optimization issues, use unoptimized version
  const shouldUseUnoptimized = useUnoptimizedImage || 
    (sourceToUse.includes('ipfs') && hasError) ||
    sourceToUse.startsWith('data:image/');

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
      unoptimized={shouldUseUnoptimized}
      priority={sourceToUse === fallbackSrc} // Prioritize fallback images
    />
  );
} 