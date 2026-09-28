import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import styles from './MenuQrCard.module.css';

const PUBLIC_SITE_ORIGIN = 'https://natra.pro.et';

const POSTER_WIDTH = 1600;
const POSTER_HEIGHT = 1800;

const QR_SIZE = 1200;
const QR_TOP = 285;

function circle(ctx, centerX, centerY, radius) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
}

function drawCenteredText(
  ctx,
  text,
  y,
  maxWidth,
  initialSize,
  weight = 700
) {
  let fontSize = initialSize;

  while (fontSize > 28) {
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    fontSize -= 2;
  }

  ctx.fillText(text, POSTER_WIDTH / 2, y);
}

function drawPoster(qrCanvas, restaurantName) {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas is not available.');
  }

  const safeName = restaurantName?.trim() || 'Restaurant';

  // Pure white background.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  // Restaurant name — normal font.
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawCenteredText(
    ctx,
    safeName,
    125,
    POSTER_WIDTH - 180,
    76,
    700
  );

  // Divider.
  ctx.fillRect(560, 205, 480, 5);

  // QR code.
  const qrX = (POSTER_WIDTH - QR_SIZE) / 2;

  ctx.drawImage(
    qrCanvas,
    qrX,
    QR_TOP,
    QR_SIZE,
    QR_SIZE
  );

  // NATRA circular center badge.
  // The white area fully protects the QR underneath.
  const centerX = POSTER_WIDTH / 2;
  const centerY = QR_TOP + QR_SIZE / 2;

  const outerRadius = 190;
  const innerRadius = 158;

  // White protection circle.
  ctx.fillStyle = '#ffffff';

  circle(
    ctx,
    centerX,
    centerY,
    outerRadius + 28
  );

  ctx.fill();

  // White circular badge.
  circle(
    ctx,
    centerX,
    centerY,
    innerRadius
  );

  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Black circular border.
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#000000';

  circle(
    ctx,
    centerX,
    centerY,
    innerRadius
  );

  ctx.stroke();

  // NATRA — bold, normal font, completely inside the circle.
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 54px Astra, Arial, sans-serif';

  ctx.fillText(
    'NATRA',
    centerX,
    centerY
  );

  // Bottom instruction — normal font.
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawCenteredText(
    ctx,
    'Scan to view our menu',
    1570,
    POSTER_WIDTH - 180,
    58,
    700
  );

  return canvas;
}

export default function MenuQrCard({
  restaurantId,
  restaurantName,
}) {
  const previewRef = useRef(null);

  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const buildQr = useCallback(async () => {
    if (!restaurantId) {
      setImageUrl('');
      return;
    }

    try {
      setError('');

      const qrCanvas = document.createElement('canvas');

      await QRCode.toCanvas(
        qrCanvas,
        `${PUBLIC_SITE_ORIGIN}/restaurant/${restaurantId}`,
        {
          width: QR_SIZE,
          margin: 4,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        }
      );

      const poster = drawPoster(
        qrCanvas,
        restaurantName
      );

      const nextUrl = poster.toDataURL('image/png');

      setImageUrl(nextUrl);

      if (previewRef.current) {
        previewRef.current.src = nextUrl;
      }
    } catch (err) {
      console.error(
        'Menu QR generation failed:',
        err
      );

      setError(
        'Could not generate the menu QR code.'
      );
    }
  }, [restaurantId, restaurantName]);

  useEffect(() => {
    buildQr();
  }, [buildQr]);

  const download = () => {
    if (!imageUrl) return;

    const safeName =
      restaurantName?.trim()
        ? restaurantName
            .trim()
            .replace(/[^\w\- ]+/g, '')
            .replace(/\s+/g, '-')
        : 'restaurant';

    const anchor = document.createElement('a');

    anchor.href = imageUrl;
    anchor.download = `${safeName}-menu-qr.png`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const print = () => {
    if (!imageUrl) return;

    const printWindow = window.open(
      '',
      '_blank',
      'noopener,noreferrer'
    );

    if (!printWindow) return;

    const title =
      restaurantName?.trim() || 'Restaurant';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title} — Menu QR</title>

          <style>
            @page {
              size: auto;
              margin: 10mm;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              display: grid;
              place-items: center;
              min-height: 100vh;
            }

            img {
              display: block;
              width: min(100%, 1600px);
              height: auto;
            }
          </style>
        </head>

        <body>
          <img
            src="${imageUrl}"
            alt="${title} menu QR"
          />

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <section
      className={styles.card}
      aria-label="Menu QR code"
    >
      <h2 className={styles.title}>
        Menu QR
      </h2>

      {error ? (
        <p
          className={styles.error}
          role="alert"
        >
          {error}
        </p>
      ) : imageUrl ? (
        <img
          ref={previewRef}
          className={styles.preview}
          src={imageUrl}
          alt="Menu QR poster preview"
        />
      ) : (
        <p className={styles.loading}>
          Generating QR…
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={download}
          disabled={!imageUrl}
        >
          Download QR
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={print}
          disabled={!imageUrl}
        >
          Print QR
        </button>
      </div>
    </section>
  );
}
