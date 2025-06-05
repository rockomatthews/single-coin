# How to Delete All Tokens from Production Database

## ⚠️ WARNING: This will permanently delete ALL tokens from your production database!

### Option 1: Using curl command

Replace `YOUR_VERCEL_URL` with your actual Vercel deployment URL and run this command:

```bash
curl -X DELETE \
  "https://YOUR_VERCEL_URL.vercel.app/api/delete-all-tokens" \
  -H "Authorization: Bearer delete-tokens-2024" \
  -H "Content-Type: application/json"
```

For example, if your app is deployed at `coinbull.vercel.app`:

```bash
curl -X DELETE \
  "https://coinbull.vercel.app/api/delete-all-tokens" \
  -H "Authorization: Bearer delete-tokens-2024" \
  -H "Content-Type: application/json"
```

### Option 2: Using your browser (for GET request)

If you want to test with a browser first, you can modify the API route to accept GET requests temporarily. But for security, DELETE is recommended.

### Expected Response

On success, you should see:
```json
{
  "success": true,
  "message": "Successfully deleted X tokens",
  "deletedCount": X,
  "deletedTokens": [...]
}
```

### To Change the Secret Key

If you want to use a different secret key, edit line 11 in:
`coinbull/src/app/api/delete-all-tokens/route.ts`

Change:
```typescript
const secretKey = 'delete-tokens-2024'; // You can change this
```

To your preferred secret, then redeploy to Vercel before using the new key. 