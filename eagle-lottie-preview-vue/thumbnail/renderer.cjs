const fs = require("fs");
const os = require("os");

const TIMEOUTS = {
  JSDOM_RENDER: 8000,
  PUPPETEER_RENDER: 20000,
  SVG_RENDER: 5000,
  TOTAL: 35000,
};

function withTimeout(promise, ms, errorMsg = "操作超时") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms),
    ),
  ]);
}

async function renderWithJSDOM(lottieData, width, height, timeout) {
  const { JSDOM } = require("jsdom");
  const { createCanvas } = require("canvas");

  const dom = new JSDOM(`<!DOCTYPE html><div id="lottie"></div>`);
  const { window } = dom;

  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.HTMLElement = window.HTMLElement;

  delete require.cache[require.resolve("lottie-web")];
  const lottie = require("lottie-web");

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, width, height);

  const container = window.document.getElementById("lottie");

  const animation = lottie.loadAnimation({
    container: container,
    renderer: "canvas",
    loop: false,
    autoplay: false,
    animationData: lottieData,
    rendererSettings: {
      context: ctx,
      scaleMode: "centerCrop",
      clearCanvas: false,
      progressiveLoad: false,
      hideOnTransparent: true,
    },
  });

  const totalFrames = animation.totalFrames;
  const middleFrame = Math.floor(totalFrames / 2);

  animation.goToAndStop(middleFrame, true);

  await new Promise((resolve) => setTimeout(resolve, 200));

  animation.destroy();

  delete global.window;
  delete global.document;
  delete global.navigator;
  delete global.HTMLElement;

  return canvas.toBuffer("image/png");
}

async function renderWithPuppeteer(lottieData, width, height, timeout) {
  const puppeteer = require("puppeteer");
  const path = require("path");

  let executablePath = undefined;
  if (os.platform() === "win32") {
    const commonPaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }
  }

  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    timeout: timeout,
  };

  if (executablePath) {
    console.log(`Windows 环境: 使用本地 Chrome -> ${executablePath}`);
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
          #lottie { width: ${width}px; height: ${height}px; }
        </style>
      </head>
      <body>
        <div id="lottie"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.13.0/lottie.min.js"></script>
        <script>
          window.lottieData = ${JSON.stringify(lottieData)};
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.evaluate(() => {
      const anim = lottie.loadAnimation({
        container: document.getElementById("lottie"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: window.lottieData,
      });
      const middleFrame = Math.floor(anim.totalFrames / 2);
      anim.goToAndStop(middleFrame, true);
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const screenshot = await page.screenshot({
      type: "png",
      omitBackground: true,
    });

    return screenshot;
  } finally {
    await browser.close();
  }
}

async function renderWithSVG(lottieData, width, height, timeout) {
  const { createCanvas, loadImage } = require("canvas");

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  const bgColor = lottieData.bg || "#ffffff";
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  if (lottieData.layers && lottieData.layers.length > 0) {
    const firstLayer = lottieData.layers[0];
    if (firstLayer.ty === 2 && firstLayer.refId) {
      const asset = lottieData.assets?.find((a) => a.id === firstLayer.refId);
      if (asset && asset.p && asset.p.startsWith("data:image")) {
        try {
          const img = await loadImage(asset.p);
          const scale = Math.min(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } catch (e) {
          console.log("SVG 渲染图片失败:", e.message);
        }
      }
    }
  }

  return canvas.toBuffer("image/png");
}

function generatePlayButtonPNG(width, height) {
  const { createCanvas } = require("canvas");

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.beginPath();
  const triangleSize = radius * 0.5;
  ctx.moveTo(centerX - triangleSize * 0.4, centerY - triangleSize * 0.6);
  ctx.lineTo(centerX - triangleSize * 0.4, centerY + triangleSize * 0.6);
  ctx.lineTo(centerX + triangleSize * 0.6, centerY);
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer("image/png");
}

async function renderMiddleFrame(lottieData, width, height) {
  console.log(`开始渲染缩略图: ${width}x${height}`);

  try {
    console.log("尝试方案 1: JSDOM + Canvas");
    const buffer = await withTimeout(
      renderWithJSDOM(lottieData, width, height, TIMEOUTS.JSDOM_RENDER),
      TIMEOUTS.JSDOM_RENDER,
      "JSDOM 渲染超时",
    );
    console.log("✅ JSDOM 渲染成功");
    return buffer;
  } catch (e1) {
    console.log("❌ JSDOM 渲染失败:", e1.message);

    try {
      console.log("尝试方案 2: Puppeteer");
      const buffer = await withTimeout(
        renderWithPuppeteer(
          lottieData,
          width,
          height,
          TIMEOUTS.PUPPETEER_RENDER,
        ),
        TIMEOUTS.PUPPETEER_RENDER,
        "Puppeteer 渲染超时",
      );
      console.log("✅ Puppeteer 渲染成功");
      return buffer;
    } catch (e2) {
      console.log("❌ Puppeteer 渲染失败:", e2.message);

      try {
        console.log("尝试方案 3: SVG 静态渲染");
        const buffer = await withTimeout(
          renderWithSVG(lottieData, width, height, TIMEOUTS.SVG_RENDER),
          TIMEOUTS.SVG_RENDER,
          "SVG 渲染超时",
        );
        console.log("✅ SVG 渲染成功");
        return buffer;
      } catch (e3) {
        console.log("❌ SVG 渲染失败:", e3.message);
        console.log("使用方案 4: 播放按钮（最终兜底）");
        return generatePlayButtonPNG(width, height);
      }
    }
  }
}

module.exports = {
  renderMiddleFrame,
  generatePlayButtonPNG,
  TIMEOUTS,
};
