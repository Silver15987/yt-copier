import React from 'react';

function VideoList({ videos, selectedVideos, onToggleSelect, onClassify, onDelete, categories }) {
    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (videos.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="text-center py-16 text-slate-500">
                    <span className="text-5xl mb-4 block">📹</span>
                    <p className="text-lg mb-2">No videos yet</p>
                    <p className="text-sm">Scan the QR code above to upload videos from your phone</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors ${selectedVideos.includes(video.id) ? 'bg-blue-500/10' : ''
                            }`}
                    >
                        {/* Checkbox */}
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedVideos.includes(video.id)}
                                onChange={() => onToggleSelect(video.id)}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                            />
                        </label>

                        {/* Thumbnail placeholder */}
                        <div className="w-16 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🎬</span>
                        </div>

                        {/* Video info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate" title={video.filename}>
                                {video.filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span>{formatSize(video.size)}</span>
                                <span>•</span>
                                <span>{formatDate(video.uploadedAt)}</span>
                                {video.exportedAt && (
                                    <>
                                        <span>•</span>
                                        <span className="text-green-400">✓ Exported</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Category dropdown */}
                        <select
                            value={video.category || 'Other'}
                            onChange={(e) => onClassify(video.id, e.target.value)}
                            className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-32"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Delete button */}
                        <button
                            onClick={() => onDelete(video.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete video"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VideoList;
