const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());

// Auth0 tenant domain from environment variables
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;

// SSL certificate options - for development
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Middleware to modify the authorize endpoint URL
const modifyAuthorizeUrl = (proxyReq, req, res) => {
  if (req.url.startsWith('/authorize')) {
    const originalUrl = new URL(req.url, `https://${AUTH0_DOMAIN}`);
    // Add your additional parameters here
    originalUrl.searchParams.append('custom_param1', 'value1');
    originalUrl.searchParams.append('custom_param2', 'value2');
    proxyReq.path = originalUrl.pathname + originalUrl.search;
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: `https://${AUTH0_DOMAIN}`,
  changeOrigin: true,
  secure: true,
  ws: true,
  xfwd: true,
  onProxyReq: modifyAuthorizeUrl,
  logLevel: 'debug',
  router: {
    'localhost:3002': `https://${AUTH0_DOMAIN}`
  }
});

// Apply proxy to all routes
app.use('/', proxy);

const PORT = process.env.PORT || 3002;

/*
https.createServer(options, app).listen(PORT, () => {
  console.log(`Auth0 proxy server running on port ${PORT}`);
});
*/
let server = app.listen(PORT, async function () {
    console.log("INFO", "Auth0 proxy server started", "Listening on port " + PORT);
});