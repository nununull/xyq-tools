<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BookOpen, Search, SearchX } from 'lucide-vue-next'
import KnowledgeGuideCard from '@/components/guides/KnowledgeGuideCard.vue'
import { TOOL_CATALOG } from '@/config/toolCatalog'
import { KNOWLEDGE_COLLECTIONS } from '@/data/knowledgeGuides'
import type { KnowledgeSection } from '@/types/knowledgeGuide'
import '@/styles/knowledge-guides.css'

const props = defineProps<{ section: KnowledgeSection }>()
const query = ref('')
const topic = ref('all')

/** 标题沿用导航目录，介绍和条目从当前分类的权威数据源派生。 */
const title = computed(() => TOOL_CATALOG.find(({ routeName }) => routeName === props.section)?.label)
const collection = computed(() => KNOWLEDGE_COLLECTIONS[props.section])

/** 主题与数量只统计条目实际提供的内容，避免另行维护筛选清单。 */
const topics = computed(() => [
  { label: '全部', value: 'all', count: collection.value.guides.length },
  ...Array.from(new Set(collection.value.guides.map((guide) => guide.topic))).map((label) => ({
    label,
    value: label,
    count: collection.value.guides.filter((guide) => guide.topic === label).length,
  })),
])

/** 关键词覆盖条件、操作与提醒，多个关键词同时匹配且与主题筛选取交集。 */
const filteredGuides = computed(() => {
  const keywords = query.value.trim().toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean)
  return collection.value.guides.filter((guide) => {
    const text = [guide.title, guide.topic, guide.summary, guide.condition, ...guide.steps, ...guide.cautions]
      .join(' ').toLocaleLowerCase('zh-CN')
    return (topic.value === 'all' || guide.topic === topic.value) && keywords.every((keyword) => text.includes(keyword))
  })
})

/** 在搜索提交或输入结束时记录完整查询条件，避免逐字打印。 */
function logSearch(): void {
  globalThis.console.info(JSON.stringify({ msg: '速查内容已筛选', section: props.section, query: query.value, topic: topic.value, count: filteredGuides.value.length }))
}

/** 切换当前主题后统一记录筛选上下文。 */
function selectTopic(value: string): void {
  topic.value = value
  logSearch()
}

/** 清空搜索与主题，恢复当前分类全部条目。 */
function resetFilters(): void {
  query.value = ''
  topic.value = 'all'
  logSearch()
}

/** 共用页面切换分类时清除旧筛选，防止旧分类条件造成假空态。 */
watch(() => props.section, () => {
  query.value = ''
  topic.value = 'all'
  globalThis.console.info(JSON.stringify({ msg: '速查分类已打开', section: props.section, count: collection.value.guides.length }))
}, { immediate: true })
</script>

<template>
  <div
    :key="section"
    class="knowledge-view"
  >
    <header class="knowledge-hero">
      <p class="knowledge-eyebrow">
        <BookOpen
          :size="16"
          aria-hidden="true"
        />电脑版 · 实用速查
      </p>
      <h1>{{ title }}</h1>
      <p>{{ collection.introduction }}</p>
    </header>

    <div
      v-if="collection.help"
      class="knowledge-help"
    >
      <KnowledgeGuideCard
        :guide="collection.help"
        :initially-open="false"
      />
    </div>

    <section
      class="knowledge-browser"
      :aria-label="`查找${title}`"
    >
      <div class="knowledge-browser__toolbar">
        <label class="knowledge-search">
          <Search
            :size="18"
            aria-hidden="true"
          />
          <span class="knowledge-sr-only">搜索{{ title }}</span>
          <input
            v-model="query"
            type="search"
            :placeholder="collection.searchPlaceholder"
            @change="logSearch"
            @search="logSearch"
          >
        </label>
        <button
          class="knowledge-reset"
          type="button"
          :disabled="query === '' && topic === 'all'"
          @click="resetFilters"
        >
          重置筛选
        </button>
      </div>
      <div
        class="knowledge-topics"
        role="group"
        aria-label="按主题筛选"
      >
        <button
          v-for="option in topics"
          :key="option.value"
          type="button"
          :aria-pressed="topic === option.value"
          @click="selectTopic(option.value)"
        >
          {{ option.label }}<span>{{ option.count }}</span>
        </button>
      </div>
    </section>

    <div class="knowledge-result">
      <p
        role="status"
        aria-live="polite"
      >
        找到 <strong>{{ filteredGuides.length }}</strong> 条内容<span> / 共 {{ collection.guides.length }} 条</span>
      </p>
      <span>先看结论，展开查看做法和出处</span>
    </div>

    <div
      v-if="filteredGuides.length"
      class="knowledge-list"
    >
      <KnowledgeGuideCard
        v-for="(guide, index) in filteredGuides"
        :key="guide.id"
        :guide="guide"
        :initially-open="index === 0"
      />
    </div>
    <section
      v-else
      class="knowledge-empty"
      aria-labelledby="knowledge-empty-title"
    >
      <SearchX
        :size="30"
        aria-hidden="true"
      />
      <h2 id="knowledge-empty-title">
        没有找到相关内容
      </h2>
      <p>换个关键词，或清空筛选查看当前分类的全部条目。</p>
      <button
        type="button"
        @click="resetFilters"
      >
        查看全部内容
      </button>
    </section>

    <p class="knowledge-note">
      {{ collection.note ?? '按所列公开资料整理，原文年份见出处。操作条件与费用请结合当前游戏界面核对；标为“经验建议”的内容需结合自己的队伍取舍。' }}
    </p>
  </div>
</template>
