import React from 'react';

function USBPanel({ drives, selectedDrive, onSelectDrive }) {
    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return (
        <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💾</span>
                USB Drives
            </h2>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                {drives.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <span className="text-3xl mb-2 block">🔌</span>
                        <p className="text-sm">No USB drives detected</p>
                        <p className="text-xs mt-1">Insert a USB drive to export videos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drives.map((drive) => (
                            <button
                                key={drive.device}
                                onClick={() => onSelectDrive(drive)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDrive?.device === drive.device
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDrive?.device === drive.device
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-slate-600/50 text-slate-400'
                                        }`}>
                                        <span className="text-xl">💾</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {drive.label || 'USB Drive'}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {drive.device}
                                        </p>
                                    </div>
                                    {selectedDrive?.device === drive.device && (
                                        <span className="text-blue-400 text-lg">✓</span>
                                    )}
                                </div>

                                {/* Space indicator */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Free space</span>
                                        <span>{formatSize(drive.freeSpace)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                            style={{
                                                width: `${drive.size ? ((drive.size - drive.freeSpace) / drive.size) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default USBPanel;
