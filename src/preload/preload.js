const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Server operations
  getServerInfo: () => ipcRenderer.invoke('server:info'),
  startServer: () => ipcRenderer.invoke('server:start'),
  stopServer: () => ipcRenderer.invoke('server:stop'),

  // Video operations
  getVideos: () => ipcRenderer.invoke('videos:list'),
  classifyVideo: (id, category) => ipcRenderer.invoke('video:classify', { id, category }),
  deleteVideo: (id) => ipcRenderer.invoke('video:delete', id),
  bulkClassify: (ids, category) => ipcRenderer.invoke('videos:bulkClassify', { ids, category }),

  // USB operations
  getUSBDrives: () => ipcRenderer.invoke('usb:list'),
  exportToUSB: (driveId, videoIds) => ipcRenderer.invoke('export:start', { driveId, videoIds }),

  // Event listeners
  onVideoAdded: (callback) => {
    ipcRenderer.on('video:added', (event, video) => callback(video));
    return () => ipcRenderer.removeListener('video:added', callback);
  },
  onUploadProgress: (callback) => {
    ipcRenderer.on('upload:progress', (event, progress) => callback(progress));
    return () => ipcRenderer.removeListener('upload:progress', callback);
  },
  onExportProgress: (callback) => {
    ipcRenderer.on('export:progress', (event, progress) => callback(progress));
    return () => ipcRenderer.removeListener('export:progress', callback);
  },
  onUSBChange: (callback) => {
    ipcRenderer.on('usb:changed', (event, drives) => callback(drives));
    return () => ipcRenderer.removeListener('usb:changed', callback);
  },
});
