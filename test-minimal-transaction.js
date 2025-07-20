// Quick test script to validate minimal transaction approach
// Run this in browser console on your app

async function testMinimalPhantomTransaction() {
  console.log('🧪 Testing minimal Phantom transaction...');
  
  // Check if Phantom is available
  if (!window.phantom?.solana?.isPhantom) {
    console.error('❌ Phantom not found');
    return;
  }

  const phantom = window.phantom.solana;
  
  try {
    // Connect if not already connected
    if (!phantom.isConnected) {
      console.log('Connecting to Phantom...');
      await phantom.connect();
    }
    
    console.log('✅ Phantom connected:', phantom.publicKey.toString());
    
    // Create the simplest possible transaction
    console.log('Creating minimal transaction...');
    
    const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
    
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: phantom.publicKey,
        toPubkey: new solanaWeb3.PublicKey('CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN'),
        lamports: 1000000 // 0.001 SOL
      })
    );
    
    transaction.feePayer = phantom.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    console.log('🎯 Requesting signature (should show NO warnings)...');
    
    // This is the critical test - should NOT show malicious warning
    const signedTransaction = await phantom.signTransaction(transaction);
    
    console.log('✅ Transaction signed successfully!');
    console.log('📝 If you saw NO malicious warning, the minimal approach works!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Instructions for user
console.log(`
🧪 MINIMAL TRANSACTION TEST

To test if the minimal approach works:

1. Open your browser console on the token creation page
2. Paste this entire script
3. Run: testMinimalPhantomTransaction()
4. Watch for Phantom warnings (or lack thereof)

If this test shows NO malicious warning, then we know the minimal approach works
and we need to refactor your app to do ZERO preparation before the first transaction.
`);

// Make function available globally
window.testMinimalPhantomTransaction = testMinimalPhantomTransaction;