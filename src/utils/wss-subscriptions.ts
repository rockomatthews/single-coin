import { ethers } from 'ethers';

export interface WssConfig {
  wssUrl: string;
  addresses: {
    serviceWallet?: string;
    factory?: string;
    positionManager?: string;
  };
}

export type SubscriptionHandle = {
  close: () => void;
};

export function subscribePolygonWss(config: WssConfig, onEvent: (evt: any) => void): SubscriptionHandle {
  const provider = new ethers.WebSocketProvider(config.wssUrl);

  // Track service wallet incoming transfers (native MATIC)
  if (config.addresses.serviceWallet) {
    provider.on('block', async (bn) => {
      try {
        const block = await provider.getBlock(bn);
        if (!block?.transactions) return;
        for (const txHash of block.transactions) {
          try {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.to && tx.to.toLowerCase() === config.addresses.serviceWallet!.toLowerCase()) {
              onEvent({ type: 'serviceWalletIncoming', hash: tx.hash, value: tx.value?.toString?.(), from: tx.from });
            }
          } catch {}
        }
      } catch {}
    });
  }

  // Uniswap V3 Factory PoolCreated events
  if (config.addresses.factory) {
    const poolCreatedTopic = ethers.id('PoolCreated(address,address,uint24,int24,address)');
    provider.on({ address: config.addresses.factory, topics: [poolCreatedTopic] }, (log) => {
      onEvent({ type: 'PoolCreated', log });
    });
  }

  // NFPM IncreaseLiquidity/Mint events
  if (config.addresses.positionManager) {
    const increaseLiquidity = ethers.id('IncreaseLiquidity(uint256,uint128,uint256,uint256)');
    const mintTopic = ethers.id('Mint(address,address,int24,int24,uint128,uint256,uint256)');
    provider.on({ address: config.addresses.positionManager, topics: [increaseLiquidity] }, (log) => {
      onEvent({ type: 'IncreaseLiquidity', log });
    });
    provider.on({ address: config.addresses.positionManager, topics: [mintTopic] }, (log) => {
      onEvent({ type: 'Mint', log });
    });
  }

  return {
    close: () => {
      try { provider.destroy(); } catch {}
    }
  };
}
