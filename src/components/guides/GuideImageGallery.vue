<script setup lang="ts">
/* global Event, HTMLDetailsElement */
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Expand, Images } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import { getGuideImageCollection, getLocalGuideImages } from '@/data/guideImages'
import type { GuideImageScope } from '@/types/guideImage'

const props = defineProps<{ scope: GuideImageScope; guideId: string; title: string }>()
const previewIndex = ref<number | null>(null)
const galleryExpanded = ref(false)

/** 缩略图和放大原图共用同一份本站资源清单。 */
const images = computed(() => getLocalGuideImages(props.scope, props.guideId))
/** 仅展示实际留存的配图出处，不将来源链接作为图片加载地址。 */
const collection = computed(() => getGuideImageCollection(props.scope, props.guideId))
/** 预览内容始终根据当前攻略和索引派生，切换攻略后不会残留旧图。 */
const preview = computed(() => previewIndex.value === null ? null : images.value[previewIndex.value] ?? null)

/** 切换预览图片，到达两端后停止，避免越界和不明确的循环跳转。 */
function movePreview(direction: -1 | 1): void {
  if (previewIndex.value === null) return
  previewIndex.value = Math.max(0, Math.min(images.value.length - 1, previewIndex.value + direction))
}

/** 关闭预览后由公共弹窗组件恢复触发按钮焦点。 */
function closePreview(): void {
  previewIndex.value = null
}

/** 只有展开图库才渲染缩略图，折叠时不创建图片请求。 */
function toggleGallery(event: Event): void {
  galleryExpanded.value = (event.currentTarget as HTMLDetailsElement).open
}

watch(() => [props.scope, props.guideId], () => {
  closePreview()
  galleryExpanded.value = false
})
</script>

<template>
  <details
    v-if="images.length"
    :key="`${scope}/${guideId}`"
    class="guide-image-gallery"
    @toggle="toggleGallery"
  >
    <summary>
      <Images
        :size="18"
        aria-hidden="true"
      />
      <strong>查看本地配图</strong>
      <span>{{ images.length }} 张</span>
    </summary>
    <div
      v-if="galleryExpanded"
      class="guide-image-gallery__content"
    >
      <p class="guide-image-gallery__note">
        图片已随本站保存，按来源页顺序排列。点击放大查看原图。
      </p>
      <div class="guide-image-gallery__grid">
        <figure
          v-for="(image, index) in images"
          :key="image.file"
        >
          <button
            type="button"
            :aria-label="`放大查看${title}配图 ${index + 1}`"
            @click="previewIndex = index"
          >
            <img
              :src="image.thumbnailSrc"
              :alt="image.caption"
              :width="image.thumbnail.width"
              :height="image.thumbnail.height"
              loading="lazy"
              decoding="async"
            >
            <span><Expand
              :size="14"
              aria-hidden="true"
            />{{ index + 1 }}</span>
          </button>
          <figcaption>{{ image.caption }}</figcaption>
        </figure>
      </div>
      <p class="guide-image-gallery__note">
        配图保留原作者水印与标识，图中版本及奖励说明请结合当前游戏核对。
      </p>
    </div>
  </details>
  <p
    v-else-if="collection"
    class="guide-image-gallery__missing"
  >
    本地配图暂未齐备，当前仍可查看文字攻略。
  </p>

  <BaseModal
    :open="preview !== null"
    :title="`${title} · 配图 ${(previewIndex ?? 0) + 1} / ${images.length}`"
    description="原图保存在本站。可左右切换，或滚动查看完整图片。"
    size="wide"
    @close="closePreview"
  >
    <div
      v-if="preview"
      class="guide-image-preview"
      @keydown.left.prevent="movePreview(-1)"
      @keydown.right.prevent="movePreview(1)"
    >
      <div class="guide-image-preview__navigation">
        <button
          type="button"
          :disabled="previewIndex === 0"
          @click="movePreview(-1)"
        >
          <ChevronLeft
            :size="17"
            aria-hidden="true"
          />上一张
        </button>
        <span>{{ (previewIndex ?? 0) + 1 }} / {{ images.length }}</span>
        <button
          type="button"
          :disabled="previewIndex === images.length - 1"
          @click="movePreview(1)"
        >
          下一张<ChevronRight
            :size="17"
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        class="guide-image-preview__canvas"
        tabindex="0"
        role="region"
        aria-label="攻略原图，可滚动查看"
      >
        <img
          :src="preview.src"
          :alt="preview.caption"
          :width="preview.width"
          :height="preview.height"
        >
      </div>
      <p>{{ preview.caption }}</p>
      <div class="guide-image-preview__links">
        <a
          :href="preview.src"
          target="_blank"
          rel="noopener noreferrer"
        >打开本地原图</a>
        <a
          :href="preview.sourcePage"
          target="_blank"
          rel="noopener noreferrer"
        >原图出处</a>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.guide-image-gallery {
  margin: 1.5rem 0;
  overflow: hidden;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 0.625rem;
}
.guide-image-gallery summary {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 3rem;
  padding: 0.875rem 1rem;
  color: var(--mint-800);
  cursor: pointer;
}
.guide-image-gallery summary span {
  margin-left: auto;
  font-size: 0.8125rem;
}
.guide-image-gallery__content {
  padding: 0 1rem 1rem;
}
.guide-image-gallery__note,
.guide-image-gallery__missing {
  color: var(--text-muted);
  font-size: 0.8125rem;
  line-height: 1.8;
}
.guide-image-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
  gap: 1rem;
}
.guide-image-gallery figure {
  min-width: 0;
  margin: 0;
}
.guide-image-gallery figure button {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  background: var(--surface-soft);
  border-color: var(--border);
}
.guide-image-gallery figure img {
  display: block;
  width: 100%;
  height: 9rem;
  object-fit: contain;
}
.guide-image-gallery figure button > span {
  position: absolute;
  right: 0.375rem;
  bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.375rem;
  color: var(--text);
  font-size: 0.75rem;
  background: var(--surface-raised);
  border-radius: 0.25rem;
}
.guide-image-gallery figcaption {
  display: -webkit-box;
  margin-top: 0.375rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.guide-image-preview {
  min-width: 0;
}
.guide-image-preview__navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}
.guide-image-preview__navigation button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.guide-image-preview__navigation span {
  color: var(--text-muted);
  font-size: 0.8125rem;
  white-space: nowrap;
}
.guide-image-preview__canvas {
  max-height: 65dvh;
  overflow: auto;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
}
.guide-image-preview__canvas img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}
.guide-image-preview > p {
  color: var(--text-muted);
  font-size: 0.8125rem;
}
.guide-image-preview__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.guide-image-preview__links a {
  color: var(--mint-700);
  font-size: 0.8125rem;
}
@media (max-width: 40rem) {
  .guide-image-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .guide-image-gallery figure img {
    height: 7rem;
  }
  .guide-image-preview__navigation button {
    padding-inline: 0.5rem;
    font-size: 0.8125rem;
  }
}
</style>
