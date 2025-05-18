# Setting up Neon PostgreSQL with Vercel

This guide explains how to connect your Coinbull application to a Neon PostgreSQL database when deploying on Vercel.

## Using Vercel's Neon Integration (Recommended)

Vercel offers a built-in integration with Neon that automatically manages the database connection for you.

### Steps:

1. **Deploy your project to Vercel**
   - Push your repository to GitHub/GitLab/Bitbucket
   - Connect it to Vercel and deploy

2. **Add the Neon Integration**
   - In your Vercel project dashboard, go to the "Integrations" tab
   - Search for "Neon PostgreSQL" and click on it
   - Click "Add Integration"
   - Follow the prompts to connect your Neon account or create a new one
   - Select or create the database you want to use

3. **Verify Environment Variables**
   - After connecting, Vercel will automatically add the `DATABASE_URL` environment variable
   - Verify it's available in your project's Environment Variables settings

4. **Initialize the Database**
   - After deployment, visit `/api/db-init` on your Vercel app URL to initialize the database tables
   - You should see a success message confirming the tables were created

## Manual Setup

If you prefer to set up the connection manually:

1. **Create a Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Create a new database
   - Create a role with access to the database

2. **Get the Connection String**
   - In Neon dashboard, go to the "Connection Details" tab
   - Copy the connection string that includes your username, password, and database name
   - It should look like: `postgres://username:password@endpoint.neon.tech/dbname`

3. **Add to Vercel**
   - In your Vercel project, go to "Settings" > "Environment Variables"
   - Add a new variable named `DATABASE_URL` with the connection string as value
   - Deploy or redeploy your application

4. **Initialize the Database**
   - Visit `/api/db-init` on your Vercel app URL to initialize the database tables

## Troubleshooting Database Connections

### Connection Issues

If you encounter connection issues, check:

1. **Connection String Format**
   - Ensure the connection string is correctly formatted
   - For Neon, add `?sslmode=require` at the end if not already present

2. **Firewall Settings**
   - Neon allows connections from anywhere by default, but check if any restrictions are in place

3. **Connection Pooling**
   - For serverless environments like Vercel, enable connection pooling in Neon
   - Update your connection string to use the pooled connection endpoint

### Database Initialization Failures

If the database initialization fails:

1. **Check Logs**
   - In Vercel, go to "Deployments" > [latest deployment] > "Functions" > "api/db-init"
   - Review the logs for specific error messages

2. **Permissions**
   - Ensure the database user has permissions to create tables
   - Try running the SQL manually through Neon's SQL editor to test

3. **Environment Variable**
   - Verify the `DATABASE_URL` environment variable is correctly set in Vercel
   - Check for any typos or formatting issues

## Using in Development

For local development:

1. Add the same `DATABASE_URL` to your `.env.local` file
2. Run the development server with `npm run dev`
3. Test the database connection by visiting `http://localhost:3000/api/db-init` 