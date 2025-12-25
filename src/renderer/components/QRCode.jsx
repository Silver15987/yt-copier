import React, { useEffect, useState } from 'react';

function QRCode({ serverInfo }) {
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (serverInfo?.qrUrl) {
            generateQRCode(serverInfo.qrUrl);
        }
    }, [serverInfo?.qrUrl]);

    const generateQRCode = async (url) => {
        try {
            // Create a canvas and generate QR code
            const canvas = document.createElement('canvas');

            // Use the QRCode library from the window if available, 
            // otherwise generate a simple visual placeholder
            // We'll generate a simple data URL using canvas API

            // For proper QR code, we need to generate it
            // Using a simple approach with fetch to a QR code API as fallback
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            setQrDataUrl(qrApiUrl);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            setQrDataUrl(null);
        }
    };

    const handleCopy = async () => {
        if (serverInfo?.qrUrl) {
            try {
                await navigator.clipboard.writeText(serverInfo.qrUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <section className="mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* QR Code */}
                    <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="QR Code"
                                className="w-full h-full object-contain p-2"
                                onError={() => setQrDataUrl(null)}
                            />
                        ) : serverInfo?.qrUrl ? (
                            <div className="text-center p-4 animate-pulse">
                                <span className="text-4xl block mb-2">⏳</span>
                                <span className="text-xs text-gray-600">Loading QR...</span>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 p-4">
                                <span className="text-4xl mb-2 block">📱</span>
                                <span className="text-xs">Starting server...</span>
                            </div>
                        )}
                    </div>

                    {/* Connection Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                            {serverInfo?.running && (
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            )}
                            Scan to Upload
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Open your phone's browser and visit the URL below, or scan the QR code
                        </p>

                        <div className="space-y-3">
                            {serverInfo ? (
                                <>
                                    <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                                        <span className="text-slate-500 text-sm w-12">URL:</span>
                                        <code className="bg-slate-700/50 px-4 py-2 rounded-lg text-blue-400 text-sm font-mono break-all max-w-xs">
                                            {serverInfo.qrUrl || `http://${serverInfo.ip}:${serverInfo.port}`}
                                        </code>
                                    </div>

                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <span className="text-slate-500 text-sm w-12">IP:</span>
                                        <code className="bg-slate-700/50 px-3 py-1 rounded text-green-400 text-sm font-mono">
                                            {serverInfo.ip}
                                        </code>
                                    </div>

                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <span className="text-slate-500 text-sm w-12">Port:</span>
                                        <code className="bg-slate-700/50 px-3 py-1 rounded text-yellow-400 text-sm font-mono">
                                            {serverInfo.port}
                                        </code>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-500 text-sm">
                                    <span className="animate-pulse">Initializing server...</span>
                                </div>
                            )}
                        </div>

                        {/* Copy Button */}
                        {serverInfo?.qrUrl && (
                            <button
                                onClick={handleCopy}
                                className={`mt-4 px-4 py-2 rounded-lg text-sm transition-all ${copied
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                                    }`}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy URL'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default QRCode;
