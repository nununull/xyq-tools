<script setup lang="ts">
import { ChevronDown, CircleAlert, ExternalLink, Expand } from 'lucide-vue-next'
import { KNOWLEDGE_REVIEWED_AT } from '@/data/knowledgeGuides'
import type { KnowledgeGuide } from '@/types/knowledgeGuide'

const props = defineProps<{ guide: KnowledgeGuide; initiallyOpen: boolean }>()

/** 记录实际展开的条目，保留排查页面交互所需的内容标识。 */
function logExpansion(event: { target: unknown }): void {
  if (event.target instanceof globalThis.HTMLDetailsElement && event.target.open) globalThis.console.info(JSON.stringify({ msg: '速查条目已展开', guideId: props.guide.id, title: props.guide.title }))
}
</script>

<template>
  <details
    :id="guide.id"
    class="knowledge-card"
    :open="initiallyOpen"
    @toggle="logExpansion"
  >
    <summary>
      <span class="knowledge-card__heading">
        <span class="knowledge-card__meta">
          <span>{{ guide.topic }}</span>
          <span :class="{ 'knowledge-card__experience': guide.kind === 'experience' }">
            {{ guide.kind === 'experience' ? '经验建议' : '机制速查' }}
          </span>
        </span>
        <h2>{{ guide.title }}</h2>
        <span class="knowledge-card__answer">{{ guide.summary }}</span>
      </span>
      <ChevronDown
        :size="20"
        class="knowledge-card__chevron"
        aria-hidden="true"
      />
    </summary>

    <div class="knowledge-card__body">
      <p class="knowledge-card__condition">
        <strong>适用条件</strong>{{ guide.condition }}
      </p>
      <div class="knowledge-card__instructions">
        <section :aria-labelledby="`${guide.id}-steps`">
          <h3 :id="`${guide.id}-steps`">
            {{ guide.kind === 'experience' ? '怎么取舍' : '具体做法' }}
          </h3>
          <ol>
            <li
              v-for="step in guide.steps"
              :key="step"
            >
              {{ step }}
            </li>
          </ol>
        </section>
        <section
          class="knowledge-card__cautions"
          :aria-labelledby="`${guide.id}-cautions`"
        >
          <h3 :id="`${guide.id}-cautions`">
            <CircleAlert
              :size="17"
              aria-hidden="true"
            />注意这些细节
          </h3>
          <ul>
            <li
              v-for="caution in guide.cautions"
              :key="caution"
            >
              {{ caution }}
            </li>
          </ul>
        </section>
      </div>

      <figure
        v-if="guide.image"
        class="knowledge-card__image"
      >
        <a
          :href="guide.image.src"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`查看${guide.title}原图`"
        >
          <img
            :src="guide.image.src"
            :alt="guide.image.alt"
            :width="guide.image.width"
            :height="guide.image.height"
            loading="lazy"
            decoding="async"
          >
          <span><Expand
            :size="14"
            aria-hidden="true"
          />查看原图</span>
        </a>
        <figcaption>{{ guide.image.alt }} · 图片保存在本站，出处见下方。</figcaption>
      </figure>

      <footer class="knowledge-card__footer">
        <span>资料核对：{{ KNOWLEDGE_REVIEWED_AT }}</span>
        <a
          v-for="source in guide.sources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ source.label }}<ExternalLink
            :size="13"
            aria-hidden="true"
          />
        </a>
      </footer>
    </div>
  </details>
</template>
