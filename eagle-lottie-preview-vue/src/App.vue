<template>
  <div class="dev-container">
    <div class="header">
      <h1>Eagle Lottie Preview - 开发预览</h1>
      <p>选择一个 Lottie 文件进行预览</p>
    </div>

    <div class="controls">
      <div class="file-input-group">
        <label for="json-file">选择 JSON 文件：</label>
        <input
          id="json-file"
          type="file"
          accept=".json"
          @change="handleJsonFile"
        />
      </div>

      <div class="file-input-group">
        <label for="zip-file">选择 ZIP 文件：</label>
        <input
          id="zip-file"
          type="file"
          accept=".zip"
          @change="handleZipFile"
        />
      </div>
    </div>

    <div v-if="animationData" class="viewer-container">
      <LottiePlayer
        :animation-data="animationData"
        :title="fileName"
        :is-zip="isZip"
        :loading-text="loadingText"
        @loaded="onLoaded"
        @error="onError"
      />
    </div>

    <div v-else class="placeholder">
      <p>👆 请选择一个 Lottie 文件或输入 URL 开始预览</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import LottiePlayer from "./components/LottiePlayer.vue";
import JSZip from "jszip";

const animationData = ref(null);
const fileName = ref("Lottie 动画");
const isZip = ref(false);
const loadingText = ref("加载中...");

const onLoaded = (info) => {
  console.log("动画加载完成:", info);
};

const onError = (error) => {
  console.error("动画加载失败:", error);
  alert(`加载失败: ${error.message}`);
};

// 处理 JSON 文件
const handleJsonFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    animationData.value = data;
    fileName.value = file.name.replace(".json", "");
    isZip.value = false;
  } catch (error) {
    console.error("读取 JSON 文件失败:", error);
    alert("读取 JSON 文件失败: " + error.message);
  }
};

// 处理 ZIP 文件
const handleZipFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    loadingText.value = "正在解压并加载动画...";

    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);

    // 提取所有文件
    const files = {};
    const promises = [];

    zipContent.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async("uint8array").then((content) => {
            files[relativePath] = content;
          }),
        );
      }
    });

    await Promise.all(promises);

    // 查找 JSON 文件
    const jsonFiles = Object.keys(files).filter((f) =>
      f.toLowerCase().endsWith(".json"),
    );
    if (jsonFiles.length === 0) {
      throw new Error("ZIP 文件中未找到 JSON 文件");
    }

    const jsonFilename = jsonFiles[0];
    const jsonContent = new TextDecoder().decode(files[jsonFilename]);
    let lottieData = JSON.parse(jsonContent);

    // 处理外部资源
    lottieData = await processLottieWithAssets(lottieData, files);

    animationData.value = lottieData;
    fileName.value = file.name.replace(".zip", "");
    isZip.value = true;
  } catch (error) {
    console.error("读取 ZIP 文件失败:", error);
    alert("读取 ZIP 文件失败: " + error.message);
  }
};

// 处理 Lottie 资源
const processLottieWithAssets = async (jsonData, files) => {
  if (!jsonData.assets || !Array.isArray(jsonData.assets)) {
    return jsonData;
  }

  const imageFiles = Object.keys(files).filter((filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
  });

  for (let asset of jsonData.assets) {
    if (asset.e === 1 || !asset.p) continue;

    const assetPath = asset.p;
    let matchedFile = null;

    // 尝试匹配文件
    const possiblePaths = [
      assetPath,
      "images/" + assetPath,
      asset.u ? asset.u + assetPath : null,
    ].filter(Boolean);

    for (const path of possiblePaths) {
      matchedFile = imageFiles.find(
        (f) =>
          f === path ||
          f.endsWith("/" + assetPath) ||
          f.split("/").pop() === assetPath,
      );
      if (matchedFile) break;
    }

    if (matchedFile && files[matchedFile]) {
      const mimeType = getMimeType(matchedFile);
      const base64 = await fileToBase64(files[matchedFile], mimeType);

      asset.e = 1;
      asset.p = base64;
      if (asset.u) asset.u = "";
    }
  }

  return jsonData;
};

const getMimeType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
  };
  return mimeTypes[ext] || "image/png";
};

const fileToBase64 = async (uint8Array, mimeType) => {
  return new Promise((resolve) => {
    const blob = new Blob([uint8Array], { type: mimeType });
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};
</script>

<style scoped>
.dev-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #fff;
}

.header {
  padding: 20px;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  text-align: center;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.header p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.controls {
  padding: 20px;
  background: #252525;
  border-bottom: 1px solid #3a3a3a;
}

.file-input-group {
  margin-bottom: 15px;
}

.file-input-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #ccc;
}

input[type="file"] {
  padding: 8px;
  border: 1px solid #444;
  background: #333;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:hover {
  background: #1d4ed8;
}

.viewer-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
}
</style>
