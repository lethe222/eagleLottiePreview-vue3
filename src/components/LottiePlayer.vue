<template>
  <div class="lottie-player">
    <div class="title-area">
      <div class="title">{{ title }}</div>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <div>{{ loadingText }}</div>
    </div>

    <div v-if="isZip" class="zip-badge">ZIP</div>
    <div v-if="originalWidth && originalHeight" class="dimensions-info">
      <div>尺寸：{{ originalWidth }} × {{ originalHeight }}</div>
      <div v-if="frameRate">帧率： {{ frameRate }}fps</div>
      <div v-if="fileSizeKB">体积： {{ fileSizeKB }}KB</div>
    </div>

    <div class="lottie-container">
      <div
        ref="animationContainer"
        class="lottie-animation"
        :style="{ backgroundColor }"
      ></div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>

    <div class="controls">
      <div class="timeline">
        <div class="progress-container" @click="seekToPosition">
          <div class="progress-bar" :style="{ width: progressWidth }"></div>
        </div>
        <div class="frame-counter">{{ frameCounterText }}</div>
      </div>
      <div class="buttons">
        <div class="button-group">
          <button class="control-button" @click="gotoPrevFrame">
            <!-- 上一帧 -->
            <svg
              width="24"
              height="24"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M28.5 25.8388C28.5 27.5158 26.5601 28.4481 25.2506 27.4005L15.4522 19.5617C14.4514 18.7611 14.4514 17.2389 15.4522 16.4383L25.2506 8.59951C26.5601 7.55189 28.5 8.48424 28.5 10.1612V25.8388Z"
                stroke="white"
                stroke-width="3"
              />
              <path
                d="M7.5 28.5V7.5"
                stroke="white"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            class="control-button play-pause-button"
            @click="togglePlayPause"
          >
            <!-- 播放按钮 -->
            <svg
              v-if="!isPlaying"
              width="24"
              height="24"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 9.995C7.5 7.6215 10.1257 6.18797 12.1223 7.47146L24.5745 15.4765C26.4115 16.6574 26.4115 19.3426 24.5745 20.5235L12.1223 28.5285C10.1257 29.812 7.5 28.3785 7.5 26.005V9.995Z"
                stroke="white"
                stroke-width="3"
              />
            </svg>
            <!-- 暂停按钮 -->
            <svg
              v-else
              width="24"
              height="24"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 6H10.5C9.67157 6 9 6.67157 9 7.5V28.5C9 29.3284 9.67157 30 10.5 30H13.5C14.3284 30 15 29.3284 15 28.5V7.5C15 6.67157 14.3284 6 13.5 6Z"
                stroke="white"
                stroke-width="2.25"
              />
              <path
                d="M25.5 6H22.5C21.6716 6 21 6.67157 21 7.5V28.5C21 29.3284 21.6716 30 22.5 30H25.5C26.3284 30 27 29.3284 27 28.5V7.5C27 6.67157 26.3284 6 25.5 6Z"
                stroke="white"
                stroke-width="2.25"
              />
            </svg>
          </button>
          <button class="control-button" @click="gotoNextFrame">
            <!-- 下一帧 -->
            <svg
              width="24"
              height="24"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 10.1612C7.5 8.48424 9.43986 7.55189 10.7494 8.59951L20.5478 16.4383C21.5486 17.2389 21.5486 18.7611 20.5478 19.5617L10.7494 27.4005C9.43986 28.4481 7.5 27.5158 7.5 25.8388V10.1612Z"
                stroke="#FFF8F8"
                stroke-width="3"
              />
              <path
                d="M28.5 7.5V28.5"
                stroke="#FFF8F8"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
        <div class="button-group">
          <div class="bg-color-selector">
            <button
              v-for="color in bgColors"
              :key="color.value"
              :class="[
                'color-btn',
                { active: backgroundColor === color.value },
              ]"
              :style="{ backgroundColor: color.value }"
              :title="color.label"
              @click="backgroundColor = color.value"
            ></button>
          </div>
          <button class="control-button speed-button" @click="cycleSpeed">
            {{ speedText }}
          </button>
          <button
            class="control-button fullscreen-button"
            @click="toggleFullscreen"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import lottie from "lottie-web";

const props = defineProps({
  animationData: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    default: "Lottie 动画",
  },
  isZip: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: "加载中...",
  },
});

const emit = defineEmits(["loaded", "error"]);

// Refs
const animationContainer = ref(null);
const animation = ref(null);
const isPlaying = ref(false);
const isLoading = ref(true);
const errorMessage = ref("");
const currentFrame = ref(0);
const totalFrames = ref(0);
const speedMultiplier = ref(1);
const progressWidth = ref("0%");
const originalWidth = ref(0);
const originalHeight = ref(0);
const backgroundColor = ref("#000000");
const frameRate = ref(0);
const fileSizeKB = ref(0);

const bgColors = [
  { label: "黑色", value: "#000000" },
  { label: "白色", value: "#ffffff" },
  { label: "红色", value: "#ef4444" },
  { label: "绿色", value: "#22c55e" },
  { label: "蓝色", value: "#3b82f6" },
];

// Computed
const frameCounterText = computed(() => {
  if (totalFrames.value === 0) return "0 / 0";
  const displayFrame = currentFrame.value + 1;
  return `${displayFrame} / ${totalFrames.value}`;
});

const speedText = computed(() => `${speedMultiplier.value}x`);

// Methods
const updateProgress = (frame, total) => {
  if (!total || total <= 1) {
    progressWidth.value = "100%";
    return;
  }
  const clampedFrame = Math.max(0, Math.min(frame, total - 1));
  const progress = (clampedFrame / (total - 1)) * 100;
  progressWidth.value = `${progress}%`;
};

const updateFrameCounter = () => {
  if (animation.value && totalFrames.value > 0) {
    currentFrame.value = Math.round(animation.value.currentFrame);
  }
};

const resizeAnimation = () => {
  if (
    !originalWidth.value ||
    !originalHeight.value ||
    !animationContainer.value
  )
    return;

  const container = animationContainer.value.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const scaleX = containerWidth / originalWidth.value;
  const scaleY = containerHeight / originalHeight.value;
  const scale = Math.min(scaleX, scaleY);

  const finalWidth = originalWidth.value * scale;
  const finalHeight = originalHeight.value * scale;

  animationContainer.value.style.width = `${finalWidth}px`;
  animationContainer.value.style.height = `${finalHeight}px`;
};

const gotoPrevFrame = () => {
  if (!animation.value) return;
  const newFrame = Math.max(0, animation.value.currentFrame - 1);
  animation.value.goToAndStop(newFrame, true);
  updateFrameCounter();

  if (isPlaying.value) {
    isPlaying.value = false;
  }
};

const gotoNextFrame = () => {
  if (!animation.value) return;
  const maxFrame = totalFrames.value - 1;
  const newFrame = Math.min(
    maxFrame,
    Math.floor(animation.value.currentFrame) + 1,
  );
  animation.value.goToAndStop(newFrame, true);
  updateFrameCounter();

  if (isPlaying.value) {
    isPlaying.value = false;
  }
};

const togglePlayPause = () => {
  if (!animation.value) return;

  if (isPlaying.value) {
    animation.value.pause();
  } else {
    animation.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

const cycleSpeed = () => {
  const speeds = [0.5, 1, 1.5, 2];
  const currentIndex = speeds.indexOf(speedMultiplier.value);
  const nextIndex = (currentIndex + 1) % speeds.length;
  speedMultiplier.value = speeds[nextIndex];

  if (animation.value) {
    animation.value.setSpeed(speedMultiplier.value);
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`全屏错误: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const seekToPosition = (e) => {
  if (!animation.value || totalFrames.value === 0) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const clickPos = (e.clientX - rect.left) / rect.width;
  const seekFrame = clickPos * (totalFrames.value - 1);

  animation.value.goToAndStop(seekFrame, true);
  updateFrameCounter();
  updateProgress(seekFrame, totalFrames.value);
};

const handleKeydown = (event) => {
  if (!animation.value || totalFrames.value <= 0) return;

  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      gotoPrevFrame();
      break;
    case "ArrowRight":
      event.preventDefault();
      gotoNextFrame();
      break;
    case " ":
    case "Spacebar":
      event.preventDefault();
      togglePlayPause();
      break;
  }
};

const captureMidFrameThumbnail = () => {
  if (!animation.value || totalFrames.value === 0) return;

  try {
    // 生成静态缩略图（类似 eagle 版本）
    const width = originalWidth.value;
    const height = originalHeight.value;

    // 创建 canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // 透明背景
    ctx.clearRect(0, 0, width, height);

    // 绘制播放按钮（圆形 + 三角形）
    const centerX = width / 2;
    const centerY = height / 2;
    const buttonSize = Math.min(width, height) * 0.3;

    // 绘制半透明白色圆圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, buttonSize, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制播放三角形
    const triangleSize = buttonSize * 0.6;
    ctx.beginPath();
    ctx.moveTo(centerX - triangleSize / 2, centerY - triangleSize / 2);
    ctx.lineTo(centerX - triangleSize / 2, centerY + triangleSize / 2);
    ctx.lineTo(centerX + triangleSize / 2, centerY);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();

    // 转换为 blob URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        console.log("静态缩略图已生成:", { width, height, url });
        emit("thumbnail-captured", { url, width, height });
      }
    }, "image/png");
  } catch (error) {
    console.error("生成缩略图失败:", error);
  }
};

const loadAnimation = (data) => {
  try {
    if (!data || !animationContainer.value) return;

    originalWidth.value = data.w || 1920;
    originalHeight.value = data.h || 1080;
    frameRate.value = data.fr || 0;

    try {
      const jsonString = typeof data === "string" ? data : JSON.stringify(data);
      const byteLength = new TextEncoder().encode(jsonString).length;
      fileSizeKB.value = Math.max(1, Math.round(byteLength / 1024));
    } catch {
      fileSizeKB.value = 0;
    }

    animation.value = lottie.loadAnimation({
      container: animationContainer.value,
      renderer: "svg",
      loop: true,
      autoplay: false,
      animationData: data,
      rendererSettings: {
        progressiveLoad: false,
        hideOnTransparent: true,
      },
    });

    isPlaying.value = true;

    animation.value.addEventListener("DOMLoaded", () => {
      totalFrames.value = Math.floor(animation.value.totalFrames);

      // 强制从第 0 帧开始播放，解决初次播放进度条不准确的问题
      animation.value.goToAndPlay(0, true);

      resizeAnimation();
      isLoading.value = false;

      emit("loaded", {
        totalFrames: totalFrames.value,
        width: originalWidth.value,
        height: originalHeight.value,
      });

      // 自动截取中间帧作为缩略图
      captureMidFrameThumbnail();
    });

    animation.value.addEventListener("error", (error) => {
      errorMessage.value = `加载 Lottie 动画时出错: ${error.message || "未知错误"}`;
      isLoading.value = false;
      emit("error", error);
    });

    animation.value.addEventListener("enterFrame", () => {
      if (
        animation.value.currentFrame !== undefined &&
        animation.value.totalFrames
      ) {
        updateProgress(animation.value.currentFrame, totalFrames.value);
        updateFrameCounter();
      }
    });

    animation.value.addEventListener("loopComplete", () => {
      updateProgress(0, totalFrames.value);
    });
  } catch (error) {
    console.error("加载 Lottie 动画时出错:", error);
    errorMessage.value = `加载 Lottie 动画时出错: ${error.message || "未知错误"}`;
    isLoading.value = false;
    emit("error", error);
  }
};

// Lifecycle
onMounted(() => {
  window.addEventListener("resize", resizeAnimation);
  document.addEventListener("keydown", handleKeydown);

  if (props.animationData) {
    loadAnimation(props.animationData);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeAnimation);
  document.removeEventListener("keydown", handleKeydown);

  if (animation.value) {
    animation.value.destroy();
  }
});

watch(
  () => props.animationData,
  (newData) => {
    if (newData) {
      if (animation.value) {
        animation.value.destroy();
      }
      loadAnimation(newData);
    }
  },
);
</script>

<style scoped>
.lottie-player {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  color: #fff;
  font-family: Arial, sans-serif;
  background-color: transparent;
}

.title-area {
  position: absolute;
  top: 10px;
  left: 10px;
  text-align: center;
  z-index: 50;
  pointer-events: none;
}

.title {
  font-size: 20px;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.zip-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #2563eb;
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  z-index: 50;
}

.dimensions-info {
  position: absolute;
  top: 40px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.bg-color-selector {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.color-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background-color 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.color-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.color-btn.active {
  border-color: #fbbf24;
  transform: scale(1.2);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.5);
}

.lottie-container {
  width: 100%;
  height: calc(100% - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lottie-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.3s ease;
}

.lottie-animation :deep(> div) {
  width: 100% !important;
  height: 100% !important;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 5px;
  color: #ff5555;
  text-align: center;
  z-index: 100;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  flex-direction: column;
}

.timeline {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.progress-container {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  position: relative;
  cursor: pointer;
  margin: 0 15px;
  border-radius: 3px;
}

.progress-bar {
  height: 100%;
  background: white;
  width: 0%;
  position: absolute;
  border-radius: 3px;
}

.progress-bar::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.frame-counter {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 60px;
  text-align: center;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.buttons {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-button {
  background: transparent;
  border: none;
  color: rgb(255, 255, 255);
  font-size: 24px;
  cursor: pointer;
  opacity: 0.8;
  padding: 6px;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.2s,
    background-color 0.2s;
  border-radius: 8px;
}

.control-button:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.15);
}

.speed-button,
.fullscreen-button {
  font-size: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 0 10px;
  height: 36px;
  width: auto;
}

.fullscreen-button {
  width: 36px;
  padding: 0;
}
</style>
