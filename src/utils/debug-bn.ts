/**
 * Debug utilities for BN (Big Number) handling in Raydium integration
 */
import BN from 'bn.js';

/**
 * Analyze and debug BN creation to identify potential issues
 */
export function debugBN(value: number | string, source: string, decimals = 9): void {
  console.log(`\n=== BN Debug for ${source} ===`);
  
  try {
    // Check the input type
    console.log(`Input type: ${typeof value}`);
    console.log(`Input value: ${value}`);
    
    // If number, convert to different formats
    if (typeof value === 'number') {
      // Check if it's an integer
      const isInteger = Number.isInteger(value);
      console.log(`Is integer: ${isInteger}`);
      
      // Standard toString conversion
      const standardStr = value.toString();
      console.log(`Standard toString: ${standardStr}`);
      
      // Fixed precision string
      const fixedStr = value.toFixed(decimals);
      console.log(`toFixed(${decimals}): ${fixedStr}`);
      
      // Convert to raw value with decimals
      const rawValue = Math.floor(value * Math.pow(10, decimals));
      console.log(`Raw value (${value} * 10^${decimals}): ${rawValue}`);
      
      // Safe string conversion
      const safeStr = rawValue.toString();
      console.log(`Safe string for BN: ${safeStr}`);
      
      // Create BN with different methods
      try {
        const bn1 = new BN(value); // Direct way - problematic with floating point
        console.log(`BN from direct value: ${bn1.toString()}`);
      } catch (error) {
        console.log(`BN from direct value error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      try {
        const bn2 = new BN(standardStr); // String conversion - may work for integers
        console.log(`BN from standard toString: ${bn2.toString()}`);
      } catch (error) {
        console.log(`BN from standard toString error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      try {
        const bn3 = new BN(safeStr); // Safe conversion - should work
        console.log(`BN from safe string: ${bn3.toString()}`);
      } catch (error) {
        console.log(`BN from safe string error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } 
    // If already a string, try direct conversion
    else if (typeof value === 'string') {
      // Check if it's a valid number
      const numValue = parseFloat(value);
      const isFinite = Number.isFinite(numValue);
      console.log(`Is finite number: ${isFinite}`);
      
      // Check if it's an integer string
      const isInteger = /^\d+$/.test(value);
      console.log(`Is integer string: ${isInteger}`);
      
      // Try BN conversion
      try {
        const bn = new BN(value);
        console.log(`BN from string: ${bn.toString()}`);
      } catch (error) {
        console.log(`BN from string error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    console.error('Error in BN debugging:', error);
  }
  
  console.log('=== End BN Debug ===\n');
}

/**
 * Safely create a BN from a number with specified decimal places
 */
export function safeCreateBN(value: number, decimals = 9): BN {
  // Convert to raw value with decimals
  const rawValue = Math.floor(value * Math.pow(10, decimals));
  
  // Convert to string to avoid precision issues
  const safeStr = rawValue.toString();
  
  // Create BN from safe string
  return new BN(safeStr);
}

/**
 * Test BN handling for common values used in Raydium
 */
export function testBNHandling(): void {
  console.log('=== Testing BN Handling ===');
  
  // Test small decimal
  debugBN(0.01, 'Small SOL amount', 9);
  
  // Test large integer
  debugBN(1000000000, 'Token supply', 9);
  
  // Test string representation
  debugBN('1000000000', 'String token supply');
  
  // Test safe creation
  const bn = safeCreateBN(0.01, 9);
  console.log('Safe creation result:', bn.toString());
  
  console.log('=== BN Testing Complete ===');
} 