import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import styles from './MenuQrCard.module.css';

const PUBLIC_SITE_ORIGIN = 'https://natra.pro.et';
const POSTER_WIDTH = 1200;
const POSTER_HEIGHT = 1350;
const QR_SIZE = 900;

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.closePath();
}

function drawPoster(qrCanvas, restaurantName) {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const qrX = (POSTER_WIDTH - QR_SIZE) / 2;
  const qrY = 70;
  ctx.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);

  const badgeSize = 250;
  const badgeX = (POSTER_WIDTH - badgeSize) / 2;
  const badgeY = qrY + (QR_SIZE - badgeSize) / 2;

  roundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 34);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1f1f1f';
  ctx.stroke();

  ctx.fillStyle = '#1f1f1f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 92px Astra, Arial, sans-serif';
  ctx.fillText('NATRA', POSTER_WIDTH / 2, badgeY + badgeSize / 2);

  ctx.fillStyle = '#1f1f1f';
  ctx.font = '700 48px Astra, Arial, sans-serif';
  ctx.fillText('Scan to view our menu', POSTER_WIDTH / 2, 1055);

  ctx.font = '600 38px Astra, Arial, sans-serif';
  const safeName = restaurantName?.trim() || 'Restaurant';
  ctx.fillText(safeName, POSTER_WIDTH / 2, 1150);

  return canvas;
}

export default function MenuQrCard({ restaurantId, restaurantName }) {
  const previewRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const buildQr = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setError('');
      await document.fonts?.ready;

      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(
        qrCanvas,
        `${PUBLIC_SITE_ORIGIN}/restaurant/${restaurantId}`,
        {
          width: QR_SIZE,
          margin: 3,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#1f1f1f',
            light: '#ffffff',
          },
        }
      );

      const poster = drawPoster(qrCanvas, restaurantName);
      const nextUrl = poster.toDataURL('image/png');

      setImageUrl(nextUrl);
      if (previewRef.current) previewRef.current.src = nextUrl;
    } catch {
      setError('Could not generate the menu QR code.');
    }
  }, [restaurantId, restaurantName]);

  useEffect(() => {
    buildQr();
  }, [buildQr]);

  const download = () => {
    if (!imageUrl) return;
    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = `${restaurantName?.trim() || 'restaurant'}-menu-qr.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const print = () => {
    if (!imageUrl) return;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    const title = restaurantName?.trim() || 'Restaurant';
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title} — Menu QR</title>
          <style>
            @page { size: auto; margin: 12mm; }
            html, body { margin: 0; padding: 0; background: #fff; }
            body { display: grid; place-items: center; min-height: 100vh; }
            img { display: block; width: min(100%, 1200px); height: auto; }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="${title} menu QR" />
          <script>window.onload = function () { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className={styles.card} aria-label="Menu QR code">
      <div>
        <h2 className={styles.title}>Menu QR</h2>
        <p className={styles.description}>
          Download or print a QR poster customers can scan to open your menu.
        </p>
      </div>

      {error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : imageUrl ? (
        <img ref={previewRef} className={styles.preview} src={imageUrl} alt="Menu QR poster preview" />
      ) : (
        <p className={styles.loading}>Generating QR…</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={download} disabled={!imageUrl}>
          Download QR
        </button>
        <button type="button" className={styles.secondaryButton} onClick={print} disabled={!imageUrl}>
          Print QR
        </button>
      </div>
    </section>
  );
}
