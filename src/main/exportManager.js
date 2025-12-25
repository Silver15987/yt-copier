const fs = require('fs-extra');
const path = require('path');

class ExportManager {
  constructor() {
    this.isExporting = false;
    this.currentExport = null;
    this.aborted = false;
  }

  /**
   * Export videos to a USB drive
   * @param {Array} videos - Array of video objects with path, filename, category
   * @param {string} destinationPath - USB drive path (e.g., 'E:\')
   * @param {Function} onProgress - Progress callback
   * @returns {Object} Export result
   */
  async exportVideos(videos, destinationPath, onProgress = () => {}) {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.isExporting = true;
    this.aborted = false;
    
    const result = {
      success: true,
      copied: [],
      skipped: [],
      failed: [],
      totalSize: 0,
      startTime: new Date().toISOString(),
      endTime: null
    };

    try {
      // Verify destination exists
      if (!await fs.pathExists(destinationPath)) {
        throw new Error(`Destination not found: ${destinationPath}`);
      }

      // Check available space
      const stats = await this.getDriveSpace(destinationPath);
      const requiredSpace = videos.reduce((sum, v) => sum + (v.size || 0), 0);
      
      if (stats.free < requiredSpace) {
        throw new Error(
          `Insufficient space. Need ${this.formatSize(requiredSpace)}, ` +
          `available ${this.formatSize(stats.free)}`
        );
      }

      const total = videos.length;
      let completed = 0;

      for (const video of videos) {
        if (this.aborted) {
          result.success = false;
          break;
        }

        try {
          // Create category folder
          const categoryFolder = path.join(destinationPath, video.category || 'Other');
          await fs.ensureDir(categoryFolder);

          const destFile = path.join(categoryFolder, video.filename);

          // Check for duplicates (same filename and size)
          if (await this.isDuplicate(video, destFile)) {
            result.skipped.push({
              filename: video.filename,
              reason: 'Duplicate (same file exists)'
            });
            completed++;
            onProgress({
              type: 'skipped',
              filename: video.filename,
              completed,
              total,
              percent: Math.round((completed / total) * 100)
            });
            continue;
          }

          // Copy file
          await fs.copy(video.path, destFile, { overwrite: false });
          
          result.copied.push({
            filename: video.filename,
            category: video.category,
            size: video.size
          });
          result.totalSize += video.size || 0;
          
          completed++;
          onProgress({
            type: 'copied',
            filename: video.filename,
            completed,
            total,
            percent: Math.round((completed / total) * 100)
          });

        } catch (fileError) {
          result.failed.push({
            filename: video.filename,
            error: fileError.message
          });
          completed++;
          onProgress({
            type: 'failed',
            filename: video.filename,
            error: fileError.message,
            completed,
            total,
            percent: Math.round((completed / total) * 100)
          });
        }
      }

      result.endTime = new Date().toISOString();
      result.success = result.failed.length === 0 && !this.aborted;

    } catch (error) {
      result.success = false;
      result.error = error.message;
    } finally {
      this.isExporting = false;
      this.currentExport = null;
    }

    return result;
  }

  /**
   * Check if a file is a duplicate (same filename and size)
   */
  async isDuplicate(video, destPath) {
    try {
      if (!await fs.pathExists(destPath)) {
        return false;
      }
      
      const destStats = await fs.stat(destPath);
      return destStats.size === video.size;
    } catch {
      return false;
    }
  }

  /**
   * Get drive space info
   */
  async getDriveSpace(drivePath) {
    try {
      // On Windows, use PowerShell to get drive space
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        return new Promise((resolve) => {
          const drive = drivePath.charAt(0);
          exec(
            `powershell -Command "(Get-PSDrive ${drive}).Free, (Get-PSDrive ${drive}).Used"`,
            (error, stdout) => {
              if (error) {
                resolve({ free: 0, used: 0, total: 0 });
                return;
              }
              const [free, used] = stdout.trim().split('\n').map(Number);
              resolve({ free: free || 0, used: used || 0, total: (free || 0) + (used || 0) });
            }
          );
        });
      }
      
      // Fallback
      return { free: Infinity, used: 0, total: Infinity };
    } catch {
      return { free: Infinity, used: 0, total: Infinity };
    }
  }

  /**
   * Abort current export
   */
  abort() {
    this.aborted = true;
  }

  /**
   * Format bytes to human readable
   */
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

  /**
   * Get export status
   */
  getStatus() {
    return {
      isExporting: this.isExporting,
      currentExport: this.currentExport
    };
  }
}

module.exports = ExportManager;
