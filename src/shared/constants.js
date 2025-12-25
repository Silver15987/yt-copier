// Shared constants used across main and renderer processes

const CATEGORIES = [
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Gym Videos',
  'Other',
];

const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
];

const SERVER_CONFIG = {
  DEFAULT_PORT: 3000,
  POLL_INTERVAL: 3000, // USB polling interval in ms
};

const IPC_CHANNELS = {
  // Server
  SERVER_INFO: 'server:info',
  SERVER_START: 'server:start',
  SERVER_STOP: 'server:stop',
  
  // Videos
  VIDEOS_LIST: 'videos:list',
  VIDEO_CLASSIFY: 'video:classify',
  VIDEO_DELETE: 'video:delete',
  VIDEO_ADDED: 'video:added',
  VIDEOS_BULK_CLASSIFY: 'videos:bulkClassify',
  
  // USB
  USB_LIST: 'usb:list',
  USB_CHANGED: 'usb:changed',
  
  // Export
  EXPORT_START: 'export:start',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETE: 'export:complete',
  
  // Upload
  UPLOAD_PROGRESS: 'upload:progress',
};

module.exports = {
  CATEGORIES,
  VIDEO_EXTENSIONS,
  SERVER_CONFIG,
  IPC_CHANNELS,
};
