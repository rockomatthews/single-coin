'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createMinimalTransaction } from '../utils/minimal-transaction';

/**
 * MINIMAL TOKEN CREATION COMPONENT
 * Does NOTHING until user clicks "Pay Fee" - no prep work, no metadata, no validation
 * This should behave like the MetaMask redirect scenario
 */
export default function MinimalTokenCreation() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [status, setStatus] = useState<string>('Ready');

  const handleMinimalPayment = async () => {
    try {
      setStatus('Requesting signature...');
      
      // NO preparation work - just ask for signature immediately
      const signature = await createMinimalTransaction(
        connection,
        wallet,
        'CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN', // Your fee recipient
        0.01 // Minimal fee
      );
      
      setStatus(`Payment successful: ${signature}`);
      
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!wallet.connected) {
    return <div>Please connect your wallet first</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Minimal Transaction Test</h3>
      <p>This test does ZERO preparation work before asking for signature</p>
      <button 
        onClick={handleMinimalPayment}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none',
          cursor: 'pointer' 
        }}
      >
        Pay 0.01 SOL (Minimal Test)
      </button>
      <p>Status: {status}</p>
    </div>
  );
}