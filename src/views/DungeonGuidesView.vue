<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleAlert, ExternalLink, Search, ShieldCheck } from 'lucide-vue-next'
import GuideSelector from '@/components/guides/GuideSelector.vue'
import { DUNGEON_CATEGORIES, DUNGEON_GUIDE_EDITION, DUNGEON_GUIDES } from '@/data/dungeonGuides'
import type { DungeonCategory } from '@/types/dungeonGuide'
import '@/styles/dungeon-guides.css'

const query = ref('')
const category = ref<'all' | DungeonCategory>('all')
const destinyOnly = ref(false)
const selectedId = ref(DUNGEON_GUIDES[0]?.id ?? '')

/** 分类与数量从攻略库派生，增加副本无需另改筛选器。 */
const categoryOptions = computed(() => [
  { id: 'all' as const, label: '全部', count: DUNGEON_GUIDES.length },
  ...Object.entries(DUNGEON_CATEGORIES).map(([id, label]) => ({
    id: id as DungeonCategory,
    label,
    count: DUNGEON_GUIDES.filter((guide) => guide.category === id).length,
  })),
])

/** 筛选仅派生展示结果，天命轮换不会删减完整攻略库。 */
const filteredGuides = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('zh-CN')
  return DUNGEON_GUIDES.filter((guide) => {
    const searchableText = [
      guide.title,
      guide.summary,
      guide.entrance,
      ...guide.preparation,
      ...guide.cautions,
      ...guide.stages.flatMap((stage) => [stage.title, stage.detail, stage.warning ?? '']),
    ].join(' ').toLocaleLowerCase('zh-CN')

    return (category.value === 'all' || guide.category === category.value)
      && (!destinyOnly.value || guide.destiny)
      && searchableText.includes(keyword)
  })
})

/** 当前选项不在筛选结果中时展示首项，空结果时不残留旧攻略。 */
const activeGuide = computed(() =>
  filteredGuides.value.find(({ id }) => id === selectedId.value)
  ?? filteredGuides.value[0]
  ?? null,
)

/** 清空查询条件并恢复默认副本。 */
function resetFilters(): void {
  query.value = ''
  category.value = 'all'
  destinyOnly.value = false
  selectedId.value = DUNGEON_GUIDES[0]?.id ?? ''
}
</script>

<template>
  <div class="dungeon-guides-view">
    <header class="dungeon-hero">
      <p class="dungeon-eyebrow">
        电脑版 · 副本流程速查
      </p>
      <h1>副本攻略</h1>
      <p>天命会轮换，攻略都留着。先看怎么进，再看怎么打。</p>
    </header>

    <details class="dungeon-edition">
      <summary>
        <ShieldCheck
          :size="18"
          aria-hidden="true"
        />
        <span>天命轮换参考 <small>本期资料截止 {{ DUNGEON_GUIDE_EDITION.endsAt }}</small></span>
      </summary>
      <div class="dungeon-edition__content">
        <p>{{ DUNGEON_GUIDE_EDITION.note }}</p>
        <p>天命状态以游戏内副本界面为准；轮换不影响这里收录的普通、侠士、英雄和特殊副本。</p>
        <a
          v-for="source in DUNGEON_GUIDE_EDITION.sources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ source.label }}<ExternalLink
          :size="13"
          aria-hidden="true"
        /></a>
      </div>
    </details>

    <section
      class="dungeon-browser"
      aria-label="查找副本"
    >
      <div class="dungeon-browser__toolbar">
        <label class="dungeon-search">
          <Search
            :size="18"
            aria-hidden="true"
          />
          <span class="dungeon-sr-only">搜索副本名称或机制</span>
          <input
            v-model="query"
            type="search"
            placeholder="搜副本名称或机制，如：乌鸡、判官笔"
          >
        </label>
        <button
          class="dungeon-destiny-toggle"
          type="button"
          :aria-pressed="destinyOnly"
          @click="destinyOnly = !destinyOnly"
        >
          只看天命参考
        </button>
      </div>
      <div
        class="dungeon-categories"
        role="group"
        aria-label="副本分类"
      >
        <button
          v-for="option in categoryOptions"
          :key="option.id"
          type="button"
          :aria-pressed="category === option.id"
          @click="category = option.id"
        >
          {{ option.label }}<span>{{ option.count }}</span>
        </button>
      </div>
      <div class="dungeon-browser__result">
        <p
          role="status"
          aria-live="polite"
        >
          找到 <strong>{{ filteredGuides.length }}</strong> 个副本
        </p>
        <small>资料整理：{{ DUNGEON_GUIDE_EDITION.verifiedAt }}</small>
      </div>
      <GuideSelector
        v-if="filteredGuides.length"
        :model-value="activeGuide?.id ?? ''"
        :guides="filteredGuides"
        label="选择副本攻略"
        @update:model-value="selectedId = $event"
      />
    </section>

    <section
      v-if="activeGuide"
      :id="`guide-panel-${activeGuide.id}`"
      class="dungeon-detail"
      role="tabpanel"
      :aria-labelledby="`guide-tab-${activeGuide.id}`"
    >
      <header class="dungeon-detail__header">
        <div>
          <p class="dungeon-eyebrow">
            {{ DUNGEON_CATEGORIES[activeGuide.category] }}副本
          </p>
          <h2>{{ activeGuide.title }}</h2>
        </div>
        <span
          v-if="activeGuide.destiny"
          class="dungeon-destiny-label"
        >天命参考名单</span>
      </header>
      <p
        v-if="activeGuide.availability"
        class="dungeon-availability"
      >
        <CircleAlert
          :size="18"
          aria-hidden="true"
        />
        {{ activeGuide.availability }}
      </p>
      <p class="dungeon-detail__summary">
        {{ activeGuide.summary }}
      </p>
      <dl class="dungeon-facts">
        <div><dt>参与等级</dt><dd>≥ {{ activeGuide.minimumLevel }} 级</dd></div>
        <div><dt>队伍人数</dt><dd>{{ activeGuide.team }}</dd></div>
        <div><dt>副本入口</dt><dd>{{ activeGuide.entrance }}</dd></div>
      </dl>

      <div class="dungeon-detail__body">
        <aside
          class="dungeon-notes"
          aria-label="准备与提醒"
        >
          <section>
            <h3>开刷之前</h3>
            <ul>
              <li
                v-for="item in activeGuide.preparation"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </section>
          <section class="dungeon-notes__cautions">
            <h3>
              <CircleAlert
                :size="17"
                aria-hidden="true"
              />别踩这些坑
            </h3>
            <ul>
              <li
                v-for="item in activeGuide.cautions"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </section>
        </aside>
        <section
          class="dungeon-stages"
          aria-labelledby="dungeon-stages-heading"
        >
          <h3 id="dungeon-stages-heading">
            流程与关键机制
          </h3>
          <ol>
            <li
              v-for="(stage, index) in activeGuide.stages"
              :key="stage.title"
            >
              <span
                class="dungeon-stages__number"
                aria-hidden="true"
              >{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h4>{{ stage.title }}</h4>
                <p>{{ stage.detail }}</p>
                <p
                  v-if="stage.warning"
                  class="dungeon-stages__warning"
                >
                  <strong>注意：</strong>{{ stage.warning }}
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>
      <footer class="dungeon-sources">
        <strong>原始资料</strong>
        <a
          v-for="source in activeGuide.sources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ source.label }}<ExternalLink
          :size="13"
          aria-hidden="true"
        /></a>
        <p>这里整理通关要点，图示和细节可打开原文。开放条件、天命状态及奖励以游戏内提示为准。</p>
      </footer>
    </section>
    <section
      v-else
      class="dungeon-empty"
      aria-labelledby="dungeon-empty-title"
    >
      <CircleAlert
        :size="25"
        aria-hidden="true"
      />
      <h2 id="dungeon-empty-title">
        没找到这个副本
      </h2>
      <p>换个名字试试，或者清空筛选。</p>
      <button
        type="button"
        @click="resetFilters"
      >
        清空筛选
      </button>
    </section>
  </div>
</template>
