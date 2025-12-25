const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import modules
const UploadServer = require('./server');
const FileManager = require('./fileManager');
const MetadataStore = require('./metadata');
const USBDetector = require('./usbDetector');
const ExportManager = require('./exportManager');
const SessionManager = require('./security');
const { classifyVideo, manualClassify } = require('./classifier');

let mainWindow = null;
let uploadServer = null;
let fileManager = null;
let metadataStore = null;
let usbDetector = null;
let exportManager = null;
let sessionManager = null;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

async function initializeApp() {
  // Initialize session manager
  sessionManager = new SessionManager();
  sessionManager.generateToken();

  // Initialize file manager
  fileManager = new FileManager();
  const paths = await fileManager.initialize();

  // Initialize metadata store
  metadataStore = new MetadataStore(paths.metadata);
  await metadataStore.load();

  // Initialize USB detector
  usbDetector = new USBDetector();
  usbDetector.startPolling((drives) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('usb:changed', drives);
    }
  });

  // Initialize export manager
  exportManager = new ExportManager();

  // Initialize upload server
  uploadServer = new UploadServer({
    port: 3000,
    uploadDir: paths.raw,
    publicDir: path.join(__dirname, '../../public'),
    sessionToken: sessionManager.getToken(),
    onFileUploaded: async (fileInfo) => {
      // Classify the uploaded video
      const classification = classifyVideo(fileInfo.filename);
      
      // Create video record
      const video = {
        id: fileInfo.id,
        filename: fileInfo.filename,
        savedAs: fileInfo.savedAs,
        originalPath: fileInfo.path,
        category: classification.category,
        autoClassified: classification.autoClassified,
        confidence: classification.confidence,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        uploadedAt: fileInfo.uploadedAt,
        classifiedAt: new Date().toISOString(),
        exportedAt: null
      };

      // Save to metadata
      metadataStore.addVideo(video);

      // Notify renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('video:added', video);
      }
    }
  });

  // Start the server
  await uploadServer.start();
  console.log('Application initialized successfully');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'default',
    title: 'Video Sorter Manager'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup IPC handlers
function setupIPC() {
  // Server operations
  ipcMain.handle('server:info', async () => {
    if (!uploadServer) return null;
    const info = uploadServer.getInfo();
    return {
      ...info,
      qrUrl: sessionManager.getUploadURL(info.ip, info.port)
    };
  });

  ipcMain.handle('server:start', async () => {
    if (uploadServer) {
      return uploadServer.start();
    }
  });

  ipcMain.handle('server:stop', async () => {
    if (uploadServer) {
      return uploadServer.stop();
    }
  });

  // Video operations
  ipcMain.handle('videos:list', async () => {
    if (!metadataStore) return [];
    return metadataStore.getVideos();
  });

  ipcMain.handle('video:classify', async (event, { id, category }) => {
    if (!metadataStore) return null;
    
    const classification = manualClassify(category);
    const updated = metadataStore.updateVideo(id, classification);
    
    return updated;
  });

  ipcMain.handle('video:delete', async (event, id) => {
    if (!metadataStore || !fileManager) return false;
    
    const video = metadataStore.getVideo(id);
    if (video) {
      await fileManager.deleteVideo(video.originalPath);
      metadataStore.deleteVideo(id);
      return true;
    }
    return false;
  });

  ipcMain.handle('videos:bulkClassify', async (event, { ids, category }) => {
    if (!metadataStore) return [];
    
    const classification = manualClassify(category);
    const updated = [];
    
    for (const id of ids) {
      const video = metadataStore.updateVideo(id, classification);
      if (video) updated.push(video);
    }
    
    return updated;
  });

  // USB operations
  ipcMain.handle('usb:list', async () => {
    if (!usbDetector) return [];
    return usbDetector.getDrives();
  });

  // Export operations
  ipcMain.handle('export:start', async (event, { driveId, videoIds }) => {
    if (!exportManager || !metadataStore) {
      return { success: false, error: 'Export manager not initialized' };
    }

    // Get videos to export
    const allVideos = metadataStore.getVideos();
    const videosToExport = videoIds 
      ? allVideos.filter(v => videoIds.includes(v.id))
      : allVideos;

    // Find the drive
    const drives = usbDetector.getDrives();
    const drive = drives.find(d => d.device === driveId || d.path === driveId);
    
    if (!drive) {
      return { success: false, error: 'USB drive not found' };
    }

    // Export with progress
    const result = await exportManager.exportVideos(
      videosToExport.map(v => ({
        ...v,
        path: v.originalPath
      })),
      drive.path,
      (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('export:progress', progress);
        }
      }
    );

    // Update exported videos
    if (result.success) {
      const now = new Date().toISOString();
      for (const copied of result.copied) {
        const video = allVideos.find(v => v.filename === copied.filename);
        if (video) {
          metadataStore.updateVideo(video.id, { exportedAt: now });
        }
      }

      // Record export
      metadataStore.addExport({
        id: require('uuid').v4(),
        timestamp: now,
        destination: drive.path,
        driveLabel: drive.label,
        videoCount: result.copied.length,
        totalSize: result.totalSize,
        status: 'completed'
      });
    }

    // Notify completion
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('export:complete', result);
    }

    return result;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  setupIPC();
  createWindow();
  await initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup
  if (uploadServer) uploadServer.stop();
  if (usbDetector) usbDetector.stopPolling();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (uploadServer) uploadServer.stop();
  if (usbDetector) usbDetector.stopPolling();
});
