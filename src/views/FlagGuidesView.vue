<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import FlagSheetCard from '@/components/guides/FlagSheetCard.vue'
import GuideSelector from '@/components/guides/GuideSelector.vue'
import { FLAG_BASICS_SOURCE, FLAG_GUIDES, FLAG_GUIDE_SOURCE, FLAG_SKILL_SOURCE } from '@/data/flagGuides'
import type { FlagSheet } from '@/types/flagGuide'
import '@/styles/flag-guides.css'

const activeGuideId = ref(FLAG_GUIDES[0]?.id ?? '')
const activeVariantId = ref('')
const previewSheet = ref<FlagSheet | null>(null)

/** 当前活动由静态攻略派生，页面只保存选中状态，不维护另一份业务数据。 */
const activeGuide = computed(() =>
  FLAG_GUIDES.find(({ id }) => id === activeGuideId.value) ?? null,
)

/** 有多套方案时读取选中方案，首次进入默认展示第一套，单方案活动沿用自身内容。 */
const activeContent = computed(() =>
  activeGuide.value?.variants?.find(({ id }) => id === activeVariantId.value)
  ?? activeGuide.value?.variants?.[0]
  ?? activeGuide.value,
)

/** 图文出处随当前展示方案派生，避免三面图引用到四面版来源。 */
const activeSource = computed(() => activeContent.value?.source ?? FLAG_GUIDE_SOURCE)

/** 仅有参考图的方案不显示坐标表相关提示。 */
const hasCoordinateTables = computed(() =>
  activeContent.value?.sheets.some(({ plans }) => plans.length > 0) ?? false,
)

/** 只打开原始示例图供查看，不提供点位修改和保存能力。 */
function openPreview(sheet: FlagSheet): void {
  previewSheet.value = sheet
}
</script>

<template>
  <div class="flag-guides-view">
    <header class="flag-guides-view__header">
      <p class="flag-guides-view__eyebrow">
        活动定旗攻略
      </p>
      <h1>一步棋</h1>
      <p>选活动，看定旗图、坐标和方案说明。</p>
    </header>

    <details
      class="flag-basics"
      open
    >
      <summary>第一次定旗，先看怎么做</summary>
      <ol>
        <li><strong>学技能、备材料</strong><span>找方寸山觉岸学奇门遁甲：1 级可定长寿，2 级加傲来，3 级加长安；朱紫国还需完成插旗任务。备好空白导标旗和五色旗盒。</span></li>
        <li><strong>按方案定位</strong><span>有坐标表时按坐标核对位置，再右键空白导标旗记录当前点；只有点位图的方案先参考分布，具体坐标需在游戏中核对。</span></li>
        <li><strong>同地图合成</strong><span>将同一地图已定点的导标旗放入五色旗盒合成；可合点数以旗盒界面为准。</span></li>
        <li><strong>先试一个点</strong><span>传送后试着点 NPC 或出口，再做完整套。连点效果还要核对游戏分辨率和飞行状态。</span></li>
      </ol>
      <a
        :href="FLAG_BASICS_SOURCE.url"
        target="_blank"
        rel="noopener noreferrer"
      >定旗与传送道具基础参考 <ExternalLink
        :size="13"
        aria-hidden="true"
      /></a>
      <a
        :href="FLAG_SKILL_SOURCE.url"
        target="_blank"
        rel="noopener noreferrer"
      >奇门遁甲与定旗条件参考 <ExternalLink
        :size="13"
        aria-hidden="true"
      /></a>
    </details>

    <GuideSelector
      v-model="activeGuideId"
      :guides="FLAG_GUIDES"
      label="选择定旗活动"
    />

    <section
      v-if="activeGuide && activeContent"
      :id="`guide-panel-${activeGuide.id}`"
      class="flag-guides-view__panel"
      role="tabpanel"
      :aria-labelledby="`guide-tab-${activeGuide.id}`"
    >
      <header class="flag-guides-view__activity">
        <h2>{{ activeGuide.title }}</h2>
        <p>{{ activeContent.description }}</p>
      </header>

      <div
        v-if="activeGuide.variants"
        class="flag-guide-variants"
        role="group"
        aria-label="选择定旗方案"
      >
        <button
          v-for="variant in activeGuide.variants"
          :key="variant.id"
          type="button"
          :aria-pressed="variant.id === activeContent.id"
          @click="activeVariantId = variant.id"
        >
          {{ variant.title }}
        </button>
      </div>

      <div class="flag-guides-view__preparation">
        <strong>准备哪些旗</strong>
        <p>{{ activeContent.preparation }}</p>
        <ul>
          <li
            v-for="tip in activeContent.tips"
            :key="tip"
          >
            {{ tip }}
          </li>
        </ul>
      </div>

      <p
        v-if="hasCoordinateTables"
        class="flag-guides-view__legend"
      >
        <strong>原文连点</strong>：作者标注传送后鼠标可直接落在目标上。原攻略未注明分辨率，请先试点；坐标为资料整理，尚未在游戏内实测。
      </p>
      <p
        v-else
        class="flag-guides-view__legend"
      >
        <strong>点位示意</strong>：本方案只提供原始点位图，具体限制见上方说明。
      </p>

      <div class="flag-guides-view__sheets">
        <FlagSheetCard
          v-for="sheet in activeContent.sheets"
          :key="sheet.id"
          :sheet="sheet"
          @preview="openPreview"
        />
      </div>
    </section>
    <p
      v-else
      role="status"
    >
      暂时没有可查看的活动攻略。
    </p>

    <footer class="flag-guides-view__source">
      <strong>图文出处</strong>
      <a
        :href="activeSource.url"
        target="_blank"
        rel="noopener noreferrer"
      >{{ activeSource.title }} <ExternalLink
        :size="13"
        aria-hidden="true"
      /></a>
      <span>{{ activeSource.author }} · {{ activeSource.publishedAt }}</span>
      <p>{{ hasCoordinateTables ? '示例图保留作者原图；表中序号是本面旗的定点顺序，不是原图红点编号。' : '示例图保留作者原图；红点为位置参考，未补写原文缺少的坐标。' }}</p>
    </footer>

    <BaseModal
      :open="previewSheet !== null"
      :title="`${previewSheet?.title ?? ''} · 定旗示例图`"
      description="放大查看示例图，可横向和纵向滚动。关闭后对照本页方案说明。"
      size="wide"
      @close="previewSheet = null"
    >
      <template v-if="previewSheet">
        <p
          v-if="previewSheet.notice"
          class="flag-preview__notice"
        >
          {{ previewSheet.notice }}
        </p>
        <div
          class="flag-preview"
          tabindex="0"
          role="region"
          :aria-label="`${previewSheet.title}原图，可滚动查看`"
        >
          <img
            :src="previewSheet.image"
            :alt="previewSheet.imageDescription"
          >
        </div>
      </template>
    </BaseModal>
  </div>
</template>
