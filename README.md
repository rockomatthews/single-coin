# Coinbull - Solana Meme Coin Creator

Coinbull is a web application that allows users to create verified Solana meme coins that display correctly in wallets with custom images, links, and descriptions.

## Setup and Installation

### Required Environment Variables

This application requires several environment variables to function properly:

- **NEXT_PUBLIC_SOLANA_RPC_URL**: Your QuickNode RPC endpoint (or other Solana RPC provider)
- **NEXT_PUBLIC_SOLANA_NETWORK**: 'mainnet' or 'devnet'
- **NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS**: Your Solana wallet address to receive platform fees
- **DATABASE_URL**: Connection string for your Neon database
- **PINATA_JWT**: Your Pinata JWT token for IPFS storage (server-side)
- **NEXT_PUBLIC_PINATA_JWT**: Your Pinata JWT token for IPFS storage (client-side)
- **NEXT_PUBLIC_IPFS_GATEWAY**: IPFS gateway URL (default: https://gateway.pinata.cloud/ipfs/)

### Logo Image
Important: Before running the application, place the bull logo image file named `logo.png` in the `public/images` directory.

## Quick Start

The easiest way to run the application is using the provided shell script:

```bash
./run.sh
```

This script will:
1. Create a template `.env.local` file if one doesn't exist
2. Clear the `.next` cache directory
3. Install dependencies if needed
4. Start the development server

After running the script for the first time, edit the `.env.local` file with your actual API keys and configuration values.

## Deployment on Vercel

This application is optimized for deployment on Vercel, which offers seamless integration with Neon Postgres database.

### Vercel Deployment Steps

1. **Fork or push your repository to GitHub/GitLab/Bitbucket**

2. **Connect your repository to Vercel**
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "New Project" and import your repository
   - Select "Next.js" as the framework preset

3. **Configure environment variables**
   - In the Vercel project settings, add all required environment variables
   - For the database, use the Vercel Neon Postgres integration:
     - Go to "Integrations" tab
     - Search for and add "Neon PostgreSQL"
     - Follow the setup instructions to connect your Neon database

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Your app should be live at a Vercel-provided URL

5. **Add custom domain (optional)**
   - In the project settings, go to "Domains"
   - Add and configure your custom domain

### Updating Your Deployment

Vercel automatically redeploys your application when you push changes to your repository. For environment variable changes, you'll need to trigger a new deployment manually from the Vercel dashboard.

## Features

- Create verified SPL tokens with metadata that show up properly in Phantom wallet
- Upload images and add social links to your tokens
- Set token distribution between your wallet and liquidity pools
- Store created tokens in a database for easy management
- View and manage your created tokens
- Get direct links to add liquidity to your tokens via Raydium

## Tech Stack

- **Frontend**: Next.js, Material UI, React
- **Blockchain**: Solana, Metaplex
- **Database**: NEON Serverless Postgres
- **Authentication**: Solana wallet authentication
- **Storage**: Arweave for images, NFT.Storage for metadata

## Manual Installation

If you prefer to set up manually:

1. Clone the repository
```bash
git clone https://github.com/yourusername/coinbull.git
cd coinbull
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the required variables listed above.

4. Add the logo image
Place the bull logo image file named `logo.png` in the `public/images` directory.

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your Solana wallet
2. Navigate to "Create Token" page
3. Fill in token details (name, symbol, supply, etc.)
4. Upload an image for your token
5. Add optional social links
6. Set your token distribution (how much you keep vs. liquidity)
7. Create your token
8. View your created tokens in the "My Tokens" page

## Fee Structure

Token creation incurs a fee based on the percentage of tokens you choose to keep:
- Base fee is 0.05 SOL
- Fee increases exponentially as you retain a higher percentage of tokens
- Example fees: 10% retention = ~0.055 SOL, 50% = ~0.075 SOL, 90% = ~0.32 SOL, 99% = ~0.87 SOL
- Fees are sent to the wallet specified in NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS

## Database Schema

The application uses a Postgres database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS user_tokens (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  token_address TEXT NOT NULL UNIQUE,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_image TEXT,
  decimals INTEGER NOT NULL,
  supply BIGINT NOT NULL,
  retained_amount BIGINT NOT NULL,
  liquidity_amount BIGINT NOT NULL,
  retention_percentage INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

## Resources

- [Solana Documentation](https://solana.com/docs)
- [Metaplex Documentation](https://developers.metaplex.com/)
- [NEON Database Documentation](https://neon.tech/docs)
- [QuickNode Documentation](https://www.quicknode.com/docs/solana)
- [Arweave Documentation](https://arwiki.wiki/#/en/main)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
