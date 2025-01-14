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
    // Parse existing query parameters
    const originalUrl = new URL(req.url, `https://${AUTH0_DOMAIN}`);
    
    // Log original URL for debugging
    console.log('Original URL:', originalUrl.toString());
    
    // Add your custom parameters
    originalUrl.searchParams.append('shell_param1', 'value1');
    originalUrl.searchParams.append('shell_param2', 'value2');
    originalUrl.searchParams.append('shell_client', 'proxy');
    
    // Update the request path with new parameters
    proxyReq.path = originalUrl.pathname + originalUrl.search;
    
    // Log modified URL for debugging
    console.log('Modified URL:', proxyReq.path);
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
    'shellcipm-proxy.onrender.com': `https://${AUTH0_DOMAIN}`
  }
});

// Apply proxy to all routes
app.use('/', proxy);

const PORT = process.env.PORT || 3002;
let server = app.listen(PORT, async function () {
    console.log("INFO", "Auth0 proxy server started", "Listening on port " + PORT);
});