import { ACHIEVEMENT_GUIDES } from '@/data/achievementGuides'
import { PRACTICAL_TIPS } from '@/data/practicalTips'
import { SUMMON_INSIGHTS } from '@/data/summonInsights'
import type { KnowledgeCollection, KnowledgeSection } from '@/types/knowledgeGuide'

export const KNOWLEDGE_REVIEWED_AT = '2026-10-25'

// 条目是内容的唯一来源，主题、搜索结果和数量均由页面单向派生。
export const KNOWLEDGE_COLLECTIONS: Readonly<Record<KnowledgeSection, KnowledgeCollection>> = {
  tips: {
    introduction: '遇到问题直接搜，先看结论，再看怎么操作。',
    searchPlaceholder: '搜问题或快捷键，如：NPC、Alt+Q、物品栏',
    guides: PRACTICAL_TIPS,
  },
  achievements: {
    introduction: '先确认达成条件，再按做法完成，顺手避开容易漏的细节。',
    searchPlaceholder: '搜成就或条件，如：大师起点、活力、钓鱼',
    guides: ACHIEVEMENT_GUIDES,
  },
  'summon-insights': {
    introduction: '机制讲清规则，心得讲清适用场景，选宠和养成都有个准头。',
    searchPlaceholder: '搜培养问题，如：须弥、内丹、进阶、炼妖',
    guides: SUMMON_INSIGHTS,
  },
}
