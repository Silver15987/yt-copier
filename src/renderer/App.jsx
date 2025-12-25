import React, { useState, useEffect, useCallback } from 'react';
import QRCode from './components/QRCode';
import VideoList from './components/VideoList';
import USBPanel from './components/USBPanel';
import ExportProgress from './components/ExportProgress';
import './styles/index.css';

const CATEGORIES = [
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Gym Videos',
    'Other',
];

function App() {
    const [serverInfo, setServerInfo] = useState(null);
    const [videos, setVideos] = useState([]);
    const [usbDrives, setUsbDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [isConnected, setIsConnected] = useState(false);

    // Initialize app
    useEffect(() => {
        if (window.electronAPI) {
            initializeApp();
            setupEventListeners();
        }
    }, []);

    const initializeApp = async () => {
        try {
            // Get server info
            const info = await window.electronAPI.getServerInfo();
            setServerInfo(info);
            setIsConnected(true);

            // Get videos
            const videoList = await window.electronAPI.getVideos();
            setVideos(videoList);

            // Get USB drives
            const drives = await window.electronAPI.getUSBDrives();
            setUsbDrives(drives);
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    };

    const setupEventListeners = () => {
        // Listen for new videos
        window.electronAPI.onVideoAdded((video) => {
            setVideos(prev => [video, ...prev]);
        });

        // Listen for USB changes
        window.electronAPI.onUSBChange((drives) => {
            setUsbDrives(drives);
            // Clear selection if selected drive was removed
            if (selectedDrive && !drives.find(d => d.device === selectedDrive.device)) {
                setSelectedDrive(null);
            }
        });

        // Listen for export progress
        window.electronAPI.onExportProgress((progress) => {
            setExportProgress(progress);
        });
    };

    // Classify video
    const handleClassify = async (videoId, category) => {
        try {
            await window.electronAPI.classifyVideo(videoId, category);
            setVideos(prev => prev.map(v =>
                v.id === videoId ? { ...v, category, manualOverride: true } : v
            ));
        } catch (error) {
            console.error('Failed to classify:', error);
        }
    };

    // Delete video
    const handleDelete = async (videoId) => {
        try {
            await window.electronAPI.deleteVideo(videoId);
            setVideos(prev => prev.filter(v => v.id !== videoId));
            setSelectedVideos(prev => prev.filter(id => id !== videoId));
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Toggle video selection
    const toggleVideoSelection = (videoId) => {
        setSelectedVideos(prev =>
            prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
        );
    };

    // Select all videos
    const selectAll = () => {
        const filteredVideos = filterCategory === 'all'
            ? videos
            : videos.filter(v => v.category === filterCategory);
        setSelectedVideos(filteredVideos.map(v => v.id));
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedVideos([]);
    };

    // Export to USB
    const handleExport = async () => {
        if (!selectedDrive || selectedVideos.length === 0) return;

        setIsExporting(true);
        setExportProgress({ completed: 0, total: selectedVideos.length, percent: 0 });

        try {
            const result = await window.electronAPI.exportToUSB(
                selectedDrive.device,
                selectedVideos
            );

            if (result.success) {
                // Update videos with export timestamp
                setVideos(prev => prev.map(v =>
                    selectedVideos.includes(v.id)
                        ? { ...v, exportedAt: new Date().toISOString() }
                        : v
                ));
                clearSelection();
            }

            setExportProgress(null);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Refresh data
    const handleRefresh = async () => {
        await initializeApp();
    };

    // Filter videos
    const filteredVideos = filterCategory === 'all'
        ? videos
        : videos.filter(v => v.category === filterCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl">📹</span>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Video Sorter Manager
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                        <span className="text-sm text-slate-400">
                            {isConnected ? 'Ready' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8 pb-32">
                {/* QR Panel */}
                <QRCode serverInfo={serverInfo} />

                {/* Video List */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span>📂</span>
                            Videos
                            <span className="bg-slate-700 text-slate-300 text-sm px-2 py-0.5 rounded-full">
                                {filteredVideos.length}
                            </span>
                        </h2>
                        <select
                            className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <VideoList
                        videos={filteredVideos}
                        selectedVideos={selectedVideos}
                        onToggleSelect={toggleVideoSelection}
                        onClassify={handleClassify}
                        onDelete={handleDelete}
                        categories={CATEGORIES}
                    />
                </section>

                {/* USB Panel */}
                <USBPanel
                    drives={usbDrives}
                    selectedDrive={selectedDrive}
                    onSelectDrive={setSelectedDrive}
                />

                {/* Export Progress */}
                {isExporting && exportProgress && (
                    <ExportProgress progress={exportProgress} />
                )}
            </main>

            {/* Action Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearSelection}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-colors"
                        >
                            Deselect
                        </button>
                        {selectedVideos.length > 0 && (
                            <span className="text-sm text-slate-400">
                                {selectedVideos.length} selected
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                            <span>🔄</span>
                            Refresh
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={selectedVideos.length === 0 || !selectedDrive || isExporting}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isExporting ? 'Exporting...' : 'Export to USB'}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
