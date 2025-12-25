const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const { CATEGORIES } = require('../shared/constants');

class FileManager {
  constructor() {
    this.appDataPath = path.join(app.getPath('userData'), 'VideoSorter');
    this.paths = {
      root: this.appDataPath,
      raw: path.join(this.appDataPath, 'imports', 'raw'),
      processed: path.join(this.appDataPath, 'processed'),
      thumbnails: path.join(this.appDataPath, 'thumbnails'),
      metadata: path.join(this.appDataPath, 'metadata.json')
    };
  }

  async initialize() {
    // Create all required directories
    await fs.ensureDir(this.paths.raw);
    await fs.ensureDir(this.paths.processed);
    await fs.ensureDir(this.paths.thumbnails);
    
    // Create category folders
    for (const category of CATEGORIES) {
      await fs.ensureDir(path.join(this.paths.processed, category));
    }

    console.log('File manager initialized at:', this.appDataPath);
    return this.paths;
  }

  getPath(type) {
    return this.paths[type] || this.appDataPath;
  }

  getCategoryPath(category) {
    return path.join(this.paths.processed, category);
  }

  async getVideoPath(filename) {
    return path.join(this.paths.raw, filename);
  }

  async moveToCategory(sourcePath, category, filename) {
    const destDir = path.join(this.paths.processed, category);
    await fs.ensureDir(destDir);
    
    const destPath = path.join(destDir, filename);
    
    // Check if file already exists in destination
    if (await fs.pathExists(destPath)) {
      // Add timestamp to avoid collision
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      const newFilename = `${base}_${Date.now()}${ext}`;
      const newDestPath = path.join(destDir, newFilename);
      await fs.copy(sourcePath, newDestPath);
      return newDestPath;
    }
    
    await fs.copy(sourcePath, destPath);
    return destPath;
  }

  async deleteVideo(filePath) {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch {
      return null;
    }
  }

  async listRawVideos() {
    const files = await fs.readdir(this.paths.raw);
    const videos = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(ext)) {
        const filePath = path.join(this.paths.raw, file);
        const stats = await this.getFileStats(filePath);
        videos.push({
          filename: file,
          path: filePath,
          ...stats
        });
      }
    }
    
    return videos;
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

module.exports = FileManager;
