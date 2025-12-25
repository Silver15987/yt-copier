const fs = require('fs-extra');
const path = require('path');

class MetadataStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      videos: [],
      exports: []
    };
    this.saveTimeout = null;
  }

  async load() {
    try {
      if (await fs.pathExists(this.filePath)) {
        const content = await fs.readFile(this.filePath, 'utf8');
        this.data = JSON.parse(content);
        console.log(`Loaded ${this.data.videos.length} videos from metadata`);
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
      // Start fresh if corrupted
      this.data = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        videos: [],
        exports: []
      };
    }
    return this.data;
  }

  async save() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      await fs.ensureDir(path.dirname(this.filePath));
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  // Debounced save to avoid excessive writes
  scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.save(), 1000);
  }

  // Video operations
  addVideo(video) {
    // Check for duplicates by id
    const existingIndex = this.data.videos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
      this.data.videos[existingIndex] = { ...this.data.videos[existingIndex], ...video };
    } else {
      this.data.videos.push(video);
    }
    this.scheduleSave();
    return video;
  }

  updateVideo(id, updates) {
    const index = this.data.videos.findIndex(v => v.id === id);
    if (index >= 0) {
      this.data.videos[index] = { ...this.data.videos[index], ...updates };
      this.scheduleSave();
      return this.data.videos[index];
    }
    return null;
  }

  deleteVideo(id) {
    const index = this.data.videos.findIndex(v => v.id === id);
    if (index >= 0) {
      const removed = this.data.videos.splice(index, 1);
      this.scheduleSave();
      return removed[0];
    }
    return null;
  }

  getVideo(id) {
    return this.data.videos.find(v => v.id === id);
  }

  getVideos(filter = {}) {
    let videos = [...this.data.videos];
    
    if (filter.category) {
      videos = videos.filter(v => v.category === filter.category);
    }
    
    if (filter.exported === true) {
      videos = videos.filter(v => v.exportedAt);
    } else if (filter.exported === false) {
      videos = videos.filter(v => !v.exportedAt);
    }
    
    // Sort by upload date (newest first)
    videos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    return videos;
  }

  // Export operations
  addExport(exportRecord) {
    this.data.exports.push(exportRecord);
    this.scheduleSave();
    return exportRecord;
  }

  getExports() {
    return [...this.data.exports].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  // Utility
  getStats() {
    const videos = this.data.videos;
    const categories = {};
    let totalSize = 0;
    
    for (const video of videos) {
      categories[video.category] = (categories[video.category] || 0) + 1;
      totalSize += video.size || 0;
    }
    
    return {
      totalVideos: videos.length,
      totalSize,
      byCategory: categories,
      lastUpdated: this.data.lastUpdated
    };
  }
}

module.exports = MetadataStore;
