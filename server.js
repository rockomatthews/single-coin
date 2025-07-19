// Custom server to handle EPIPE errors gracefully
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    console.log('EPIPE error caught and ignored:', error.message);
    return;
  }
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Handle client disconnections gracefully
    req.on('error', (error) => {
      if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
        console.log('Client disconnected during request');
        return;
      }
      console.error('Request error:', error);
    });

    res.on('error', (error) => {
      if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
        console.log('Client disconnected during response');
        return;
      }
      console.error('Response error:', error);
    });

    handle(req, res);
  });

  server.on('error', (error) => {
    if (error.code === 'EPIPE') {
      console.log('Server EPIPE error ignored');
      return;
    }
    console.error('Server error:', error);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});