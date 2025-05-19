# Pinata IPFS Setup Guide

This guide will help you set up Pinata IPFS storage for your Coinbull application, which is used to store token images and metadata.

## 1. Create a Pinata Account

If you don't already have a Pinata account:

1. Go to [https://www.pinata.cloud/](https://www.pinata.cloud/)
2. Sign up for a new account (they offer a free tier with generous limits)
3. Verify your email address

## 2. Create an API Key

To create an API key:

1. Log in to your Pinata account
2. Click on the "API Keys" tab in the sidebar
3. Click the "New Key" button in the top right
4. Give your key Admin privileges for full functionality
5. Name your key (e.g., "Coinbull")
6. Click "Create Key"

After creating the key, you'll be shown three pieces of information:
- API Key
- API Secret
- JWT

**Important:** Copy and save the JWT value, as it won't be displayed again.

## 3. Set Up Environment Variables

You need to set up two environment variables for Pinata:

- `PINATA_JWT` - Used by server-side code
- `NEXT_PUBLIC_PINATA_JWT` - Used by client-side code

Both should have the same value - the JWT token you copied from Pinata.

### In your .env.local file:

```
PINATA_JWT=your-jwt-token-here
NEXT_PUBLIC_PINATA_JWT=your-jwt-token-here
```

### Using the fix-env.sh script

If you've already set up `PINATA_JWT` but are missing `NEXT_PUBLIC_PINATA_JWT`, you can use our helper script:

```bash
./fix-env.sh
```

This script will check your `.env.local` file and add the missing `NEXT_PUBLIC_PINATA_JWT` variable with the same value as `PINATA_JWT`.

## 4. Verify Setup

To verify your Pinata setup:

1. Start the application and go to the `/api/health` endpoint
2. You should see the `storagePinata` field showing "connected"
3. Try creating a token to ensure that image and metadata uploads work correctly

## Troubleshooting

Common issues and their solutions:

### "PINATA_JWT environment variable is not set" error
- Make sure both `PINATA_JWT` and `NEXT_PUBLIC_PINATA_JWT` are set in your `.env.local` file
- If deploying to Vercel, ensure both environment variables are added in the project settings

### Uploads failing with authentication errors
- Check that your JWT token is valid and hasn't expired
- Create a new API key in Pinata if needed

### Images not displaying after upload
- Verify your `NEXT_PUBLIC_IPFS_GATEWAY` is set correctly
- The default value should be `https://gateway.pinata.cloud/ipfs/`

For additional help, refer to the [official Pinata documentation](https://docs.pinata.cloud/). 