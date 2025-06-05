import { Connection, Commitment, SignatureStatus } from '@solana/web3.js';

// Constants for confirmation strategy
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const CONFIRMATION_POLLING_INTERVAL = 2000; // Check every 2 seconds
const MAX_RETRIES = 30; // Max 30 retries = 60 seconds

/**
 * Enhanced transaction confirmation with better timeout handling
 */
export async function confirmTransactionWithRetry(
  connection: Connection,
  signature: string,
  commitment: Commitment = 'confirmed'
): Promise<SignatureStatus | null> {
  console.log(`Confirming transaction ${signature} with enhanced retry logic...`);
  
  const startTime = Date.now();
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Check transaction status
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value !== null) {
        // Transaction found
        if (status.value.err) {
          console.error('Transaction failed:', status.value.err);
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        
        // Check if confirmation level is met
        if (
          status.value.confirmationStatus === commitment ||
          status.value.confirmationStatus === 'finalized'
        ) {
          const elapsed = Date.now() - startTime;
          console.log(`✅ Transaction confirmed in ${elapsed}ms`);
          return status.value;
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, CONFIRMATION_POLLING_INTERVAL));
      retries++;
      
      // Log progress every 10 seconds
      if (retries % 5 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`Still waiting for confirmation... ${elapsed}s elapsed`);
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      // Continue retrying even if there's an error
    }
  }
  
  // Final check after all retries
  const finalStatus = await connection.getSignatureStatus(signature);
  if (finalStatus.value?.confirmationStatus === 'confirmed' || 
      finalStatus.value?.confirmationStatus === 'finalized') {
    console.log('✅ Transaction confirmed on final check');
    return finalStatus.value;
  }
  
  // Timeout reached
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.warn(`Transaction confirmation timeout after ${elapsed}s`);
  console.log(`Check transaction on Solscan: https://solscan.io/tx/${signature}`);
  
  throw new Error(
    `Transaction timeout after ${elapsed}s. ` +
    `The network is congested but your transaction may still succeed. ` +
    `Check: https://solscan.io/tx/${signature}`
  );
}

/**
 * Send and confirm transaction with enhanced retry logic
 */
export async function sendAndConfirmTransactionWithRetry(
  connection: Connection,
  signedTransaction: Buffer | Uint8Array | Array<number>,
  commitment: Commitment = 'confirmed'
): Promise<string> {
  // Send with retry on failure
  let signature: string;
  let sendRetries = 0;
  const maxSendRetries = 3;
  
  while (sendRetries < maxSendRetries) {
    try {
      signature = await connection.sendRawTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: commitment,
        maxRetries: 3,
      });
      console.log('Transaction sent:', signature);
      break;
    } catch (error) {
      sendRetries++;
      if (sendRetries >= maxSendRetries) {
        throw error;
      }
      console.warn(`Send attempt ${sendRetries} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Confirm with enhanced retry logic
  await confirmTransactionWithRetry(connection, signature!, commitment);
  return signature!;
} 