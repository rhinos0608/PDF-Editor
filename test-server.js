const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Serve the built HTML file
  const filePath = path.join(__dirname, 'dist', 'renderer', 'index.html');
  
  if (req.url === '/') {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Index file not found');
    }
  } else {
    // Serve static assets
    const assetPath = path.join(__dirname, 'dist', 'renderer', req.url);
    if (fs.existsSync(assetPath)) {
      const ext = path.extname(assetPath);
      const contentType = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(assetPath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
