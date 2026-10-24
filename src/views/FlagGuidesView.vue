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
const previewSheet = ref<FlagSheet | null>(null)

/** 当前活动由静态攻略派生，页面只保存选中状态，不维护另一份业务数据。 */
const activeGuide = computed(() =>
  FLAG_GUIDES.find(({ id }) => id === activeGuideId.value) ?? null,
)

/** 每个活动优先展示自己的图文出处，其余活动沿用原有来源。 */
const activeSource = computed(() => activeGuide.value?.source ?? FLAG_GUIDE_SOURCE)

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
      <p>选活动，看示例图，照着坐标把旗定好。</p>
    </header>

    <details
      class="flag-basics"
      open
    >
      <summary>第一次定旗，先看怎么做</summary>
      <ol>
        <li><strong>学技能、备材料</strong><span>找方寸山觉岸学奇门遁甲：1 级可定长寿，2 级加傲来，3 级加长安；朱紫国还需完成插旗任务。备好空白导标旗和五色旗盒。</span></li>
        <li><strong>按坐标定位</strong><span>到表中位置，停稳后核对角色坐标，再右键空白导标旗，按界面提示记录当前点。</span></li>
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
      v-if="activeGuide"
      :id="`guide-panel-${activeGuide.id}`"
      class="flag-guides-view__panel"
      role="tabpanel"
      :aria-labelledby="`guide-tab-${activeGuide.id}`"
    >
      <header class="flag-guides-view__activity">
        <h2>{{ activeGuide.title }}</h2>
        <p>{{ activeGuide.description }}</p>
      </header>

      <div class="flag-guides-view__preparation">
        <strong>准备哪些旗</strong>
        <p>{{ activeGuide.preparation }}</p>
        <ul>
          <li
            v-for="tip in activeGuide.tips"
            :key="tip"
          >
            {{ tip }}
          </li>
        </ul>
      </div>

      <p class="flag-guides-view__legend">
        <strong>原文连点</strong>：作者标注传送后鼠标可直接落在目标上。原攻略未注明分辨率，请先试点；坐标为资料整理，尚未在游戏内实测。
      </p>

      <div class="flag-guides-view__sheets">
        <FlagSheetCard
          v-for="sheet in activeGuide.sheets"
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
      <p>示例图保留作者原图；表中序号是本面旗的定点顺序，不是原图红点编号。</p>
    </footer>

    <BaseModal
      :open="previewSheet !== null"
      :title="`${previewSheet?.title ?? ''} · 定旗示例图`"
      description="放大查看示例图，可横向和纵向滚动。关闭后对照坐标表定点。"
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
