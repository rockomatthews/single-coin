// Utility functions for fetching and parsing token metadata

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  external_url?: string;
  
  // Root-level social links (NEW - where we now put them)
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  
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
  
  // NEW: Check root-level social links FIRST (this is where we now put them)
  if (metadata.website) links.website = metadata.website;
  if (metadata.twitter) links.twitter = metadata.twitter;
  if (metadata.telegram) links.telegram = metadata.telegram;
  if (metadata.discord) links.discord = metadata.discord;
  
  // Check external_url for website (if no root-level website)
  if (!links.website && metadata.external_url) {
    links.website = metadata.external_url;
  }
  
  // FALLBACK: Check nested properties.links (for older tokens)
  if (metadata.properties?.links) {
    if (!links.website && metadata.properties.links.website) links.website = metadata.properties.links.website;
    if (!links.twitter && metadata.properties.links.twitter) links.twitter = metadata.properties.links.twitter;
    if (!links.telegram && metadata.properties.links.telegram) links.telegram = metadata.properties.links.telegram;
    if (!links.discord && metadata.properties.links.discord) links.discord = metadata.properties.links.discord;
  }
  
  // FALLBACK: Check attributes for social links (for very old tokens)
  if (metadata.attributes) {
    metadata.attributes.forEach(attr => {
      const traitType = attr.trait_type.toLowerCase();
      if (!links.website && (traitType.includes('website') || traitType.includes('site'))) {
        links.website = attr.value;
      } else if (!links.twitter && traitType.includes('twitter')) {
        links.twitter = attr.value;
      } else if (!links.telegram && traitType.includes('telegram')) {
        links.telegram = attr.value;
      } else if (!links.discord && traitType.includes('discord')) {
        links.discord = attr.value;
      }
    });
  }
  
  return links;
} 