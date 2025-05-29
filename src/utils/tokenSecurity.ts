/**
 * GoPlus Security API Integration
 * Provides token security verification and scoring
 */

export interface TokenSecurityData {
  is_honeypot: string;
  honeypot_with_same_creator: string;
  fake_token: string;
  is_blacklisted: string;
  is_whitelisted: string;
  is_mintable: string;
  is_proxy: string;
  slippage_modifiable: string;
  personal_slippage_modifiable: string;
  trading_cooldown: string;
  transfer_pausable: string;
  can_take_back_ownership: string;
  owner_change_balance: string;
  hidden_owner: string;
  selfdestruct: string;
  external_call: string;
  gas_abuse: string;
  buy_tax: string;
  sell_tax: string;
  is_true_token: string;
  is_airdrop_scam: string;
  trust_list: string;
  other_potential_risks: string;
  note: string;
  holders: string;
  total_supply: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  lp_holders: any[];
  lp_total_supply: string;
  is_open_source: string;
  token_name: string;
  token_symbol: string;
}

export interface SecurityScore {
  score: number; // 0-100, higher is better
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_verified: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Check token security using GoPlus API
 */
export async function checkTokenSecurity(tokenAddress: string, chainId: string = '1'): Promise<TokenSecurityData | null> {
  try {
    const response = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`);
    
    if (!response.ok) {
      console.error('GoPlus API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.result?.[tokenAddress] || null;
  } catch (error) {
    console.error('Error checking token security:', error);
    return null;
  }
}

/**
 * Calculate security score based on GoPlus data
 */
export function calculateSecurityScore(securityData: TokenSecurityData): SecurityScore {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Critical issues (major score reduction)
  if (securityData.is_honeypot === '1') {
    score -= 50;
    issues.push('Honeypot detected - tokens may not be sellable');
  }
  
  if (securityData.fake_token === '1') {
    score -= 40;
    issues.push('Fake token detected');
  }
  
  if (securityData.is_blacklisted === '1') {
    score -= 60;
    issues.push('Token is blacklisted');
  }
  
  // High risk issues
  if (securityData.is_mintable === '1') {
    score -= 20;
    issues.push('Token is mintable - supply can be increased');
    recommendations.push('Consider revoking mint authority');
  }
  
  if (securityData.is_proxy === '1') {
    score -= 15;
    issues.push('Proxy contract detected');
  }
  
  if (securityData.slippage_modifiable === '1') {
    score -= 25;
    issues.push('Slippage can be modified by owner');
  }
  
  if (securityData.transfer_pausable === '1') {
    score -= 20;
    issues.push('Transfers can be paused');
  }
  
  if (securityData.can_take_back_ownership === '1') {
    score -= 15;
    issues.push('Ownership can be reclaimed');
  }
  
  if (securityData.hidden_owner === '1') {
    score -= 10;
    issues.push('Hidden owner detected');
  }
  
  // Medium risk issues
  if (securityData.trading_cooldown === '1') {
    score -= 10;
    issues.push('Trading cooldown present');
  }
  
  if (parseFloat(securityData.buy_tax) > 10) {
    score -= 15;
    issues.push(`High buy tax: ${securityData.buy_tax}%`);
  }
  
  if (parseFloat(securityData.sell_tax) > 10) {
    score -= 15;
    issues.push(`High sell tax: ${securityData.sell_tax}%`);
  }
  
  // Positive factors
  if (securityData.is_whitelisted === '1') {
    score += 10;
  }
  
  if (securityData.is_open_source === '1') {
    score += 5;
  }
  
  if (securityData.trust_list === '1') {
    score += 15;
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Determine risk level
  let risk_level: SecurityScore['risk_level'];
  if (score >= 80) risk_level = 'LOW';
  else if (score >= 60) risk_level = 'MEDIUM';
  else if (score >= 30) risk_level = 'HIGH';
  else risk_level = 'CRITICAL';
  
  // Determine verification status
  const is_verified = score >= 70 && 
                     securityData.is_honeypot !== '1' && 
                     securityData.fake_token !== '1' && 
                     securityData.is_blacklisted !== '1';
  
  return {
    score,
    risk_level,
    is_verified,
    issues,
    recommendations
  };
}

/**
 * Check if address is malicious
 */
export async function checkMaliciousAddress(address: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.gopluslabs.io/api/v1/address_security/${address}`);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.result?.is_malicious === '1';
  } catch (error) {
    console.error('Error checking malicious address:', error);
    return false;
  }
}

/**
 * Get supported blockchains
 */
export async function getSupportedChains(): Promise<any[]> {
  try {
    const response = await fetch('https://api.gopluslabs.io/api/v1/supported_chains');
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    return [];
  }
}

/**
 * Format security data for display
 */
export function formatSecurityDisplay(securityData: TokenSecurityData, score: SecurityScore) {
  return {
    securityScore: score.score,
    riskLevel: score.risk_level,
    isVerified: score.is_verified,
    keyMetrics: {
      isHoneypot: securityData.is_honeypot === '1',
      isMintable: securityData.is_mintable === '1',
      buyTax: parseFloat(securityData.buy_tax || '0'),
      sellTax: parseFloat(securityData.sell_tax || '0'),
      holderCount: parseInt(securityData.holders || '0'),
      isOpenSource: securityData.is_open_source === '1',
      creatorBalance: parseFloat(securityData.creator_percent || '0')
    },
    issues: score.issues,
    recommendations: score.recommendations
  };
} 