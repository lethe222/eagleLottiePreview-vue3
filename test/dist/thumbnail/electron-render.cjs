const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable hardware acceleration to avoid crashes in some environments
app.disableHardwareAcceleration();

const SRC = process.env.LOTTIE_SRC;
const DEST = process.env.LOTTIE_DEST;
const WIDTH = parseInt(process.env.LOTTIE_WIDTH || 512);
const HEIGHT = parseInt(process.env.LOTTIE_HEIGHT || 512);

if (!SRC || !DEST) {
  console.error("Missing required environment variables: LOTTIE_SRC, LOTTIE_DEST");
  app.exit(1);
}

// Ensure output directory exists
const destDir = path.dirname(DEST);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

app.on('ready', () => {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      backgroundThrottling: false,
      offscreen: true
    }
  });

  // Load Lottie Library
  let lottieLibPath;
  try {
    // Try local node_modules first
    lottieLibPath = require.resolve("lottie-web/build/player/lottie.min.js");
  } catch (e) {
    // Fallback to relative paths
    const possiblePaths = [
      path.resolve(__dirname, "../../node_modules/lottie-web/build/player/lottie.min.js"),
      path.resolve(__dirname, "../node_modules/lottie-web/build/player/lottie.min.js"),
      path.resolve(process.cwd(), "node_modules/lottie-web/build/player/lottie.min.js")
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        lottieLibPath = p;
        break;
      }
    }
  }
  
  let lottieLibContent = "";
  if (lottieLibPath && fs.existsSync(lottieLibPath)) {
    lottieLibContent = fs.readFileSync(lottieLibPath, "utf8");
  }

  // Read Lottie Data
  let lottieData = null;
  try {
    lottieData = fs.readFileSync(SRC, 'utf8');
  } catch (e) {
    console.error("Failed to read Lottie file:", e);
    app.exit(1);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        #lottie { width: ${WIDTH}px; height: ${HEIGHT}px; }
      </style>
    </head>
    <body>
      <div id="lottie"></div>
      <script>
        ${lottieLibContent}
        if (typeof lottie === 'undefined') {
           console.error("Lottie library not loaded");
           require('electron').ipcRenderer.send('error', 'Lottie library not loaded');
        }
      </script>
      <script>
        const { ipcRenderer } = require('electron');
        try {
          const animationData = ${lottieData};
          const anim = lottie.loadAnimation({
            container: document.getElementById("lottie"),
            renderer: "canvas",
            loop: false,
            autoplay: false,
            animationData: animationData,
            rendererSettings: {
              clearCanvas: true,
              preserveAspectRatio: "xMidYMid slice",
            },
          });

          anim.addEventListener("DOMLoaded", () => {
            const middleFrame = Math.floor(anim.totalFrames / 2);
            anim.goToAndStop(middleFrame, true);
            // Wait a bit for canvas to paint
            setTimeout(() => {
              ipcRenderer.send('ready');
            }, 100);
          });
          
          // Safety timeout
          setTimeout(() => {
             const middleFrame = Math.floor(anim.totalFrames / 2);
             anim.goToAndStop(middleFrame, true);
             ipcRenderer.send('ready');
          }, 2000);

        } catch (err) {
          ipcRenderer.send('error', err.toString());
        }
      </script>
    </body>
    </html>
  `;

  ipcMain.once('ready', async () => {
    try {
      // Capture the page
      const image = await win.webContents.capturePage();
      const buffer = image.toPNG();
      fs.writeFileSync(DEST, buffer);
      console.log("Screenshot saved to:", DEST);
      app.exit(0);
    } catch (err) {
      console.error("Capture failed:", err);
      app.exit(1);
    }
  });

  ipcMain.once('error', (event, msg) => {
    console.error("Render error:", msg);
    app.exit(1);
  });

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
});
