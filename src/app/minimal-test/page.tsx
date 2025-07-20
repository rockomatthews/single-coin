'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

/**
 * MINIMAL TEST PAGE
 * This page does ABSOLUTELY NOTHING until the user clicks a button
 * No metadata upload, no validation, no complex preparation
 * Just: Connect wallet -> Click button -> Sign basic transaction
 */
export default function MinimalTestPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testMinimalTransaction = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setResult('Wallet not connected properly');
      return;
    }

    setLoading(true);
    setResult('Creating minimal transaction...');

    try {
      // THE SIMPLEST POSSIBLE TRANSACTION
      // No compute budget, no complex instructions, no metadata
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey('CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN'),
          lamports: 0.01 * LAMPORTS_PER_SOL
        })
      );

      transaction.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      setResult('Requesting signature... (should show no warnings)');

      // This is the moment of truth - should trigger no warnings
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      setResult(`✅ SUCCESS! Transaction signed without warnings: ${signature}`);

    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectPhantomConnection = async () => {
    setLoading(true);
    setResult('Testing direct Phantom connection...');

    try {
      // Test direct Phantom API access (like MetaMask redirect might use)
      if (!(window as any).phantom?.solana?.isPhantom) {
        setResult('❌ Phantom not found');
        return;
      }

      const phantom = (window as any).phantom.solana;
      
      if (!phantom.isConnected) {
        await phantom.connect();
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: phantom.publicKey,
          toPubkey: new PublicKey('CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN'),
          lamports: 0.001 * LAMPORTS_PER_SOL // Even smaller amount
        })
      );

      transaction.feePayer = phantom.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      setResult('Requesting signature via direct Phantom API...');

      const signedTransaction = await phantom.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      setResult(`✅ DIRECT API SUCCESS: ${signature}`);

    } catch (error) {
      setResult(`❌ Direct API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Minimal Transaction Test</h1>
      <p>This page tests the absolute minimum transaction to see if we can avoid Phantom warnings.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <WalletMultiButton />
      </div>

      {wallet.connected && (
        <div>
          <h3>Wallet Connected: {wallet.publicKey?.toBase58().slice(0, 8)}...</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={testMinimalTransaction}
              disabled={loading}
              style={{ 
                padding: '15px 30px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {loading ? 'Testing...' : 'Test Minimal Transaction (0.01 SOL)'}
            </button>

            <button 
              onClick={testDirectPhantomConnection}
              disabled={loading}
              style={{ 
                padding: '15px 30px', 
                backgroundColor: '#9C27B0', 
                color: 'white', 
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Testing...' : 'Test Direct Phantom API (0.001 SOL)'}
            </button>
          </div>

          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            minHeight: '100px'
          }}>
            <h4>Result:</h4>
            <p>{result || 'Click a button to test...'}</p>
          </div>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <h4>What This Tests:</h4>
            <ul>
              <li>✅ Zero preparation work before transaction</li>
              <li>✅ Simplest possible SOL transfer</li>
              <li>✅ No metadata uploads</li>
              <li>✅ No complex validation</li>
              <li>✅ No compute budget instructions</li>
              <li>✅ Direct Phantom API access (like MetaMask redirect)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}