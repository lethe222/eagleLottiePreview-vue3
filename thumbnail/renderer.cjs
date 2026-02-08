const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

// 调试日志开关（设置为 true 启用桌面日志文件）
const ENABLE_DEBUG_LOG = false;

// 缓存变量
let cachedBrowserPath = null;
let cachedLottieScript = null;
let cachedLottiePath = null;

// 1. 自动查找浏览器（带缓存）
function findBrowser() {
    if (cachedBrowserPath) return cachedBrowserPath;

    const platform = os.platform();
    if (platform === 'win32') {
        const commonPaths = [
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            path.join(os.homedir(), "AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe"),
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ];
        for (const p of commonPaths) {
            if (fs.existsSync(p)) {
                cachedBrowserPath = p;
                return p;
            }
        }
    } else if (platform === 'darwin') {
        const commonPaths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
        ];
        for (const p of commonPaths) {
            if (fs.existsSync(p)) {
                cachedBrowserPath = p;
                return p;
            }
        }
    }
    return null;
}

// 2. 查找并缓存 lottie-web 库
function getLottieScript() {
    if (cachedLottieScript) return cachedLottieScript;

    if (!cachedLottiePath) {
        const possiblePaths = [
            path.resolve(__dirname, '../node_modules/lottie-web/build/player/lottie.min.js'),
            path.resolve(__dirname, '../../node_modules/lottie-web/build/player/lottie.min.js'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                cachedLottiePath = p;
                break;
            }
        }

        if (!cachedLottiePath) {
            try {
                cachedLottiePath = require.resolve('lottie-web/build/player/lottie.min.js');
            } catch (e) {
                throw new Error('无法找到 lottie-web 库');
            }
        }
    }

    // 读取并缓存脚本内容
    cachedLottieScript = fs.readFileSync(cachedLottiePath, 'utf8');
    return cachedLottieScript;
}

// 3. 渲染中间帧（优化版）
async function renderMiddleFrame(lottieData, width, height) {
    let browser = null;
    try {
        const browserPath = findBrowser();
        if (!browserPath) throw new Error("未找到 Edge 或 Chrome 浏览器");

        const lottieScript = getLottieScript();
        const lottieJson = JSON.stringify(lottieData);

        // 优化的浏览器启动参数
        browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-translate',
                '--disable-default-apps',
                '--no-first-run',
                '--no-default-browser-check',
                '--single-process',
                '--no-zygote'
            ],
            timeout: 8000
        });

        const page = await browser.newPage();
        await page.setViewport({ width, height });

        // 设置 HTML 内容
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
<style>body{margin:0;overflow:hidden}</style>
<script>${lottieScript}</script>
</head>
<body>
<div id="lottie" style="width:${width}px;height:${height}px"></div>
<script>
try{
const data=${lottieJson};
const anim=lottie.loadAnimation({
container:document.getElementById('lottie'),
renderer:'svg',
loop:false,
autoplay:false,
animationData:data
});
anim.addEventListener('DOMLoaded',()=>{
anim.goToAndStop(Math.floor(anim.totalFrames/2),true);
window.lottieRendered=true;
});
anim.addEventListener('error',()=>{window.lottieError='Load Error'});
}catch(e){window.lottieError=e.message}
</script>
</body>
</html>`;

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

        // 等待渲染完成（减少超时时间）
        await page.waitForFunction('window.lottieRendered === true || window.lottieError', { timeout: 3000 });

        // 检查是否有错误
        const hasError = await page.evaluate(() => window.lottieError);
        if (hasError) {
            throw new Error(`Lottie 渲染错误: ${hasError}`);
        }

        const buffer = await page.screenshot({ type: 'png', omitBackground: true });
        await browser.close();

        return buffer;

    } catch (err) {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                // 忽略关闭错误
            }
        }
        console.error(`[Lottie Error] ${err.message}`);

        // 调试日志（可选）
        if (ENABLE_DEBUG_LOG) {
            const logPath = path.join(os.homedir(), 'Desktop', 'eagle_lottie_error.txt');
            try {
                const logEntry = `[${new Date().toLocaleString()}] 失败: ${err.message}\n堆栈: ${err.stack}\n---\n`;
                fs.appendFileSync(logPath, logEntry);
            } catch (e) {
                // 忽略日志写入错误
            }
        }

        throw err;
    }
}

// 超时配置
const TIMEOUTS = {
    BROWSER_LAUNCH: 8000,
    PAGE_LOAD: 3000,
    RENDER: 3000,
};

module.exports = { renderMiddleFrame, TIMEOUTS };
