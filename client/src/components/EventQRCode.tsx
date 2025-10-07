import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface EventQRCodeProps {
  joinCode: string;
  eventName: string;
  size?: number;
}

const EventQRCode: React.FC<EventQRCodeProps> = ({ joinCode, eventName, size = 256 }) => {
  const [showModal, setShowModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showModal && canvasRef.current) {
      generateQRCode();
    }
  }, [showModal, joinCode]);

  const generateQRCode = async () => {
    try {
      // Create QR code data that could include app deep link or just the join code
      const qrData = joinCode; // You could also use a deep link like: `myapp://join/${joinCode}`
      
      const canvas = canvasRef.current;
      if (canvas) {
        await QRCode.toCanvas(canvas, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }

      // Also generate data URL for potential sharing
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    alert('Join code copied to clipboard!');
  };

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `${eventName}-qr-code.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  return (
    <>
      <span
        onClick={() => setShowModal(true)}
        style={{
          cursor: 'pointer',
          textDecoration: 'underline',
          color: '#007bff',
          fontFamily: 'monospace',
          fontSize: '14px',
          letterSpacing: '1px'
        }}
        title="Click to show QR code"
      >
        {joinCode}
      </span>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Join Event: {eventName}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <canvas ref={canvasRef} style={{ border: '1px solid #ddd' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                Join Code:
              </p>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                margin: '4px 0',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}>
                {joinCode}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyCode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Copy Code
              </button>

              <button
                onClick={handleDownloadQR}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Download QR
              </button>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '16px',
              marginBottom: 0
            }}>
              Scan this QR code with your mobile device to join the event
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default EventQRCode;
