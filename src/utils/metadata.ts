// Utility functions for fetching and parsing token metadata

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    links?: {
      website?: string;
      twitter?: string;
      telegram?: string;
      discord?: string;
    };
  };
}

/**
 * Fetch metadata from IPFS URI
 */
export async function fetchMetadataFromIPFS(metadataUri: string): Promise<TokenMetadata | null> {
  try {
    console.log('Fetching metadata from:', metadataUri);
    
    // Convert IPFS URI to HTTP gateway URL if needed
    let fetchUrl = metadataUri;
    if (metadataUri.startsWith('ipfs://')) {
      fetchUrl = metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.error('Failed to fetch metadata:', response.status, response.statusText);
      return null;
    }
    
    const metadata = await response.json();
    console.log('Fetched metadata:', metadata);
    
    return metadata;
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    return null;
  }
}

/**
 * Extract social links from metadata
 */
export function extractSocialLinks(metadata: TokenMetadata) {
  const links = {
    website: '',
    twitter: '',
    telegram: '',
    discord: ''
  };
  
  // Check external_url for website
  if (metadata.external_url) {
    links.website = metadata.external_url;
  }
  
  // Check properties.links
  if (metadata.properties?.links) {
    if (metadata.properties.links.website) links.website = metadata.properties.links.website;
    if (metadata.properties.links.twitter) links.twitter = metadata.properties.links.twitter;
    if (metadata.properties.links.telegram) links.telegram = metadata.properties.links.telegram;
    if (metadata.properties.links.discord) links.discord = metadata.properties.links.discord;
  }
  
  // Check attributes for social links
  if (metadata.attributes) {
    metadata.attributes.forEach(attr => {
      const traitType = attr.trait_type.toLowerCase();
      if (traitType.includes('website') || traitType.includes('site')) {
        links.website = attr.value;
      } else if (traitType.includes('twitter')) {
        links.twitter = attr.value;
      } else if (traitType.includes('telegram')) {
        links.telegram = attr.value;
      } else if (traitType.includes('discord')) {
        links.discord = attr.value;
      }
    });
  }
  
  return links;
} 