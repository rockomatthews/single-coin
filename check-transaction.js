#!/usr/bin/env node

const { Connection, PublicKey } = require('@solana/web3.js');

// The transaction signature that timed out
const SIGNATURE = '4Dqqw3jkvoBGry4WaoESofccqdtmBxA46FJiVJ1sJBabajns14myjPNJcFUDHMMudwMrvG8jTiNR3EUdzmmwxDQk';

// Your mint address from the logs
const MINT_ADDRESS = 'G61MLDVC7EnqAEyp2cFhjxvJrzAPasLDJcErxukXDd1T';

async function checkTransaction() {
  console.log('Checking transaction status...\n');
  
  // Use Solana mainnet
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  try {
    // Check transaction status
    console.log(`Checking transaction: ${SIGNATURE}`);
    const status = await connection.getSignatureStatus(SIGNATURE);
    
    if (status.value) {
      console.log('Transaction Status:', status.value);
      console.log('Confirmation Status:', status.value.confirmationStatus);
      console.log('Slot:', status.value.slot);
      
      if (status.value.err) {
        console.log('Transaction Error:', status.value.err);
      } else {
        console.log('✅ Transaction succeeded!');
      }
    } else {
      console.log('❌ Transaction not found on chain');
    }
    
    // Check if the mint exists
    console.log(`\nChecking mint account: ${MINT_ADDRESS}`);
    try {
      const mintInfo = await connection.getAccountInfo(new PublicKey(MINT_ADDRESS));
      if (mintInfo) {
        console.log('✅ Token mint exists on chain!');
        console.log('Mint Account Size:', mintInfo.data.length);
        console.log('Owner Program:', mintInfo.owner.toString());
        
        // Check token supply
        const mintPubkey = new PublicKey(MINT_ADDRESS);
        const supply = await connection.getTokenSupply(mintPubkey);
        console.log('\nToken Supply:', supply.value.uiAmountString);
        console.log('Decimals:', supply.value.decimals);
      } else {
        console.log('❌ Mint account not found');
      }
    } catch (error) {
      console.log('Error checking mint:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTransaction(); 