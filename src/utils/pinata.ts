/**
 * Pinata IPFS integration utilities
 */

// Base URL for Pinata API
const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * Upload metadata or file to Pinata IPFS
 * @param data The JSON data or file to upload 
 * @param filename Optional filename when uploading files
 * @returns IPFS CID (Content Identifier)
 */
export async function uploadToPinata(data: any, filename?: string): Promise<string> {
  // Check for both environment variable versions - client and server side
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error('Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT environment variable');
  }

  try {
    // For uploading JSON metadata
    if (typeof data === 'object' && !filename) {
      const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pinataJWT}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload to Pinata: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      return `ipfs://${json.IpfsHash}`;
    } 
    // For uploading files (like images)
    else {
      // Create FormData
      const formData = new FormData();
      
      // If data is a string URL, fetch the image first
      if (typeof data === 'string' && data.startsWith('http')) {
        const imageResponse = await fetch(data);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBlob = await imageResponse.blob();
        formData.append('file', imageBlob, filename || 'image.png');
      } 
      // If data is already a Blob/File
      else if (data instanceof Blob || data instanceof File) {
        formData.append('file', data, filename || 'image.png');
      }
      // If data is a base64 string
      else if (typeof data === 'string' && data.startsWith('data:')) {
        const blob = await fetch(data).then(r => r.blob());
        formData.append('file', blob, filename || 'image.png');
      }
      // If data is a blob URL
      else if (typeof data === 'string' && data.startsWith('blob:')) {
        console.log('Handling blob URL:', data);
        try {
          const blobResponse = await fetch(data);
          if (!blobResponse.ok) {
            throw new Error(`Failed to fetch blob: ${blobResponse.status}`);
          }
          const blob = await blobResponse.blob();
          formData.append('file', blob, filename || 'image.png');
          console.log('Successfully converted blob URL to blob');
        } catch (blobError) {
          console.error('Error handling blob URL:', blobError);
          throw new Error(`Failed to process blob URL: ${blobError instanceof Error ? blobError.message : String(blobError)}`);
        }
      }
      else {
        throw new Error(`Unsupported file format: ${typeof data} ${data.substring ? data.substring(0, 20) : ''}`);
      }

      // Add metadata to the FormData
      formData.append('pinataMetadata', JSON.stringify({
        name: filename || 'Redbull Coins Token Image'
      }));

      console.log('Uploading to Pinata with JWT:', pinataJWT.substring(0, 5) + '...');
      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinata error response:', errorText);
        throw new Error(`Failed to upload to Pinata: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const json = await response.json();
      console.log('Pinata upload successful, hash:', json.IpfsHash);
      return `ipfs://${json.IpfsHash}`;
    }
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
}

/**
 * Get an HTTP gateway URL for an IPFS hash or URI
 * @param ipfsUriOrHash IPFS URI (ipfs://...) or CID hash
 * @returns HTTP URL for the IPFS content
 */
export function getIpfsGatewayUrl(ipfsUriOrHash: string): string {
  // Default gateway is ipfs.io, but other options are available:
  // - https://gateway.pinata.cloud/ipfs/
  // - https://cloudflare-ipfs.com/ipfs/
  // - https://ipfs.io/ipfs/
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  
  // Extract the hash if it's an ipfs:// URI
  const hash = ipfsUriOrHash.startsWith('ipfs://')
    ? ipfsUriOrHash.replace('ipfs://', '')
    : ipfsUriOrHash;
    
  return `${gateway}${hash}`;
}

/**
 * Alias for uploadToPinata for backward compatibility
 */
export const uploadMetadata = uploadToPinata; 