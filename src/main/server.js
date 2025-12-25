const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class UploadServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.uploadDir = options.uploadDir;
    this.publicDir = options.publicDir;
    this.sessionToken = options.sessionToken;
    this.onFileUploaded = options.onFileUploaded || (() => {});
    this.onProgress = options.onProgress || (() => {});
    
    this.app = express();
    this.server = null;
    this.isRunning = false;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS for local network access
    this.app.use(cors({
      origin: true,
      credentials: true,
    }));
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Serve static files (mobile upload UI)
    if (this.publicDir) {
      this.app.use(express.static(this.publicDir));
    }
  }

  // Token validation middleware
  validateToken(req, res, next) {
    // Skip validation for static files and root
    if (req.path === '/' || req.path.startsWith('/upload.')) {
      return next();
    }
    
    const token = req.query.token || req.headers['x-session-token'];
    
    // For upload page, pass token through
    if (req.path === '/upload' && req.method === 'GET') {
      return next();
    }
    
    if (this.sessionToken && token !== this.sessionToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing session token' 
      });
    }
    
    next();
  }

  setupRoutes() {
    // Apply token validation
    this.app.use((req, res, next) => this.validateToken(req, res, next));
    
    // Configure multer for file uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        fs.ensureDirSync(this.uploadDir);
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        // Preserve original filename with timestamp prefix to avoid collisions
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}-${safeName}`);
      }
    });

    const upload = multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024 * 1024, // 10GB max
      },
      fileFilter: (req, file, cb) => {
        // Accept video files only
        const videoMimes = [
          'video/mp4', 'video/mkv', 'video/avi', 'video/mov',
          'video/wmv', 'video/flv', 'video/webm', 'video/x-matroska',
          'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
        ];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        
        if (videoMimes.includes(file.mimetype) || videoExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        }
      }
    });

    // Serve upload page at root
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.publicDir, 'upload.html'));
    });

    // Health check
    this.app.get('/status', (req, res) => {
      res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Get server info
    this.app.get('/info', (req, res) => {
      res.json({
        ip: this.getLocalIP(),
        port: this.port,
        uploadUrl: `http://${this.getLocalIP()}:${this.port}/upload`
      });
    });

    // Upload endpoint
    this.app.post('/upload', upload.array('files', 50), async (req, res) => {
      try {
        const uploadedFiles = [];
        const errors = [];

        for (const file of req.files || []) {
          try {
            const videoInfo = {
              id: uuidv4(),
              filename: file.originalname,
              savedAs: file.filename,
              path: file.path,
              size: file.size,
              mimeType: file.mimetype,
              uploadedAt: new Date().toISOString()
            };
            
            uploadedFiles.push(videoInfo);
            
            // Notify about the uploaded file
            this.onFileUploaded(videoInfo);
          } catch (err) {
            errors.push({ filename: file.originalname, error: err.message });
          }
        }

        res.json({
          success: true,
          uploaded: uploadedFiles,
          failed: errors,
          message: `Successfully uploaded ${uploadedFiles.length} file(s)`
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
          error: 'Upload failed', 
          message: error.message 
        });
      }
    });

    // Error handler for multer
    this.app.use((err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  start() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        return resolve({ ip: this.getLocalIP(), port: this.port });
      }

      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        this.isRunning = true;
        const ip = this.getLocalIP();
        console.log(`Upload server running at http://${ip}:${this.port}`);
        resolve({ ip, port: this.port });
      });

      this.server.on('error', (err) => {
        this.isRunning = false;
        reject(err);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.server || !this.isRunning) {
        return resolve();
      }

      this.server.close(() => {
        this.isRunning = false;
        console.log('Upload server stopped');
        resolve();
      });
    });
  }

  getInfo() {
    return {
      ip: this.getLocalIP(),
      port: this.port,
      running: this.isRunning,
      uploadUrl: `http://${this.getLocalIP()}:${this.port}`,
      token: this.sessionToken
    };
  }
}

module.exports = UploadServer;
