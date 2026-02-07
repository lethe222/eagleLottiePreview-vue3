<template>
  <LottiePlayer
    :animation-data="animationData"
    :title="title"
    :is-zip="false"
    loading-text="加载中..."
    @loaded="onLoaded"
    @error="onError"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LottiePlayer from '../components/LottiePlayer.vue'

const animationData = ref(null)
const title = ref('加载中...')

const onLoaded = (info) => {
  console.log('动画加载完成:', info)
}

const onError = (error) => {
  console.error('动画加载失败:', error)
}

const loadAnimation = async () => {
  try {
    // 获取 URL 参数
    const urlParams = new URLSearchParams(window.location.search)
    const filePath = urlParams.get('path')

    if (!filePath) {
      throw new Error('未提供文件路径')
    }

    // 更新标题
    const filename = filePath.split('/').pop().replace('.json', '')
    title.value = filename

    // 加载 JSON 文件
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`无法加载文件: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    animationData.value = data
  } catch (error) {
    console.error('加载动画时出错:', error)
    onError(error)
  }
}

onMounted(() => {
  loadAnimation()
})
</script>

<style scoped>
/* 全局样式已在 LottiePlayer 组件中定义 */
</style>
