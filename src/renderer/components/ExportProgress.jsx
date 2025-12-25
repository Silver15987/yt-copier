import React from 'react';

function ExportProgress({ progress }) {
    const { completed, total, percent, filename, type } = progress;

    return (
        <section className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-3xl animate-pulse">📤</span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">
                        Exporting Videos
                    </h3>

                    <p className="text-slate-400 text-sm mb-6">
                        {completed} of {total} files completed
                    </p>

                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-slate-400 mb-2">
                            <span>Progress</span>
                            <span>{percent}%</span>
                        </div>
                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    {/* Current file */}
                    {filename && (
                        <p className="text-xs text-slate-500 truncate">
                            {type === 'skipped' ? '⏭️ Skipped: ' : type === 'failed' ? '❌ Failed: ' : '📄 '}
                            {filename}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default ExportProgress;
