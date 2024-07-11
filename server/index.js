const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const { createProxyMiddleware } = require('http-proxy-middleware');


// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), './index.html'));
});

// Proxy middleware options
const proxyOptions = {
    target: 'http://localhost:8080', // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    pathRewrite: { '^/api': '' }, // Rewrite path
    onProxyRes: function (proxyRes, req, res) {
        // Add CORS headers to the response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    }
};

// Use the proxy for /api calls
app.use('/api', createProxyMiddleware(proxyOptions));

app.get('*', (req, res) => {
    // Construct the absolute path to the requested file
    const filePath = path.join(process.cwd(), req.path);

    // Send the file, but first check if the path is safe
    if (filePath.indexOf(process.cwd()) !== 0) {
        // If the requested file is not within the directory, deny access
        return res.status(403).send('Access Denied');
    } else {
        res.sendFile(filePath, (err) => {
            if (err) {
                // If there's an error (e.g., file not found), send a 404
                res.status(404).send('File not found');
            }
        });
    }
});




app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});