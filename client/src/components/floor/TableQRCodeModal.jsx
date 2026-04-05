import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TableQRCodeModal({ isOpen, onClose, table, qrToken }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !table) return null;

  const scanUrl = `${window.location.origin}/scan/${qrToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('table-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `QR-Table-${table.tableNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-body">
      <div className="bg-white rounded-3xl shadow-glass-lg w-full max-w-sm overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-stone-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cafe-50 border border-cafe-100 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-cafe-600" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-stone-900">Table {table.tableNumber}</h3>
              <p className="text-xs text-stone-400 font-medium">Scan to order directly</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-card">
            <QRCodeSVG
              id="table-qr-svg"
              value={scanUrl}
              size={220}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1A1814"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-display font-bold text-stone-800">
              Scan with phone camera
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Customers can scan this QR code to order from their phone
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
            <input
              type="text"
              readOnly
              value={scanUrl}
              className="flex-1 text-xs text-stone-600 bg-transparent outline-none truncate font-mono"
            />
            <button
              onClick={handleCopyLink}
              className="shrink-0 p-2 rounded-lg text-stone-500 hover:bg-white hover:text-cafe-600 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex-1 py-3 px-4 bg-stone-900 text-white text-sm font-display font-semibold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 text-sm font-display font-semibold rounded-xl hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
