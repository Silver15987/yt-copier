const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

class USBDetector {
  constructor() {
    this.pollInterval = 3000;
    this.drives = [];
    this.polling = false;
    this.pollTimer = null;
    this.onChange = null;
  }

  /**
   * Detect removable drives using PowerShell (Windows)
   * Falls back to basic detection on other platforms
   */
  async detectDrives() {
    if (process.platform === 'win32') {
      return this.detectDrivesWindows();
    } else if (process.platform === 'darwin') {
      return this.detectDrivesMac();
    } else {
      return this.detectDrivesLinux();
    }
  }

  detectDrivesWindows() {
    return new Promise((resolve) => {
      // Get ALL drives and filter in JS to avoid PowerShell escaping issues
      const psScript = `Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, VolumeName, Size, FreeSpace, DriveType | ConvertTo-Json`;

      exec(`powershell -Command "${psScript}"`, (error, stdout) => {
        if (error) {
          console.error('Error detecting drives:', error);
          resolve([]);
          return;
        }

        try {
          let drives = [];
          if (stdout.trim()) {
            const parsed = JSON.parse(stdout);
            // Handle single drive (object) vs multiple drives (array)
            const driveList = Array.isArray(parsed) ? parsed : [parsed];
            
            // Filter: DriveType 2 (Removable) or 3 (Local), exclude C:
            drives = driveList
              .filter(d => d.DeviceID && d.DeviceID !== 'C:' && (d.DriveType === 2 || d.DriveType === 3))
              .map(d => ({
                device: d.DeviceID,
                label: d.VolumeName || 'External Drive',
                path: d.DeviceID + '\\',
                size: d.Size || 0,
                freeSpace: d.FreeSpace || 0,
                isUSB: d.DriveType === 2,
                driveType: d.DriveType
              }));
          }
          console.log('Detected drives:', drives);
          resolve(drives);
        } catch (parseError) {
          console.error('Error parsing drive info:', parseError, stdout);
          resolve([]);
        }
      });
    });
  }

  detectDrivesMac() {
    return new Promise((resolve) => {
      exec('ls /Volumes', (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }

        const volumes = stdout.trim().split('\n').filter(v => v && v !== 'Macintosh HD');
        const drives = volumes.map(name => ({
          device: name,
          label: name,
          path: `/Volumes/${name}`,
          size: 0,
          freeSpace: 0,
          isUSB: true
        }));

        resolve(drives);
      });
    });
  }

  detectDrivesLinux() {
    return new Promise((resolve) => {
      exec('lsblk -o NAME,MOUNTPOINT,SIZE,FSTYPE -J', (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const drives = [];
          
          for (const device of data.blockdevices || []) {
            if (device.mountpoint && device.mountpoint.startsWith('/media')) {
              drives.push({
                device: `/dev/${device.name}`,
                label: path.basename(device.mountpoint),
                path: device.mountpoint,
                size: 0,
                freeSpace: 0,
                isUSB: true
              });
            }
          }
          
          resolve(drives);
        } catch {
          resolve([]);
        }
      });
    });
  }

  /**
   * Get free space for a drive path
   */
  async getFreeSpace(drivePath) {
    try {
      const stats = await fs.statfs(drivePath);
      return stats.bfree * stats.bsize;
    } catch {
      return 0;
    }
  }

  /**
   * Start polling for drive changes
   */
  startPolling(onChange) {
    if (this.polling) return;
    
    this.polling = true;
    this.onChange = onChange;
    
    const poll = async () => {
      if (!this.polling) return;
      
      const newDrives = await this.detectDrives();
      
      // Check if drives changed
      const changed = JSON.stringify(newDrives) !== JSON.stringify(this.drives);
      if (changed) {
        this.drives = newDrives;
        if (this.onChange) {
          this.onChange(newDrives);
        }
      }
      
      this.pollTimer = setTimeout(poll, this.pollInterval);
    };
    
    poll();
  }

  /**
   * Stop polling
   */
  stopPolling() {
    this.polling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Get current drives
   */
  getDrives() {
    return this.drives;
  }

  /**
   * Format bytes to human readable
   */
  formatSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown';
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

module.exports = USBDetector;
