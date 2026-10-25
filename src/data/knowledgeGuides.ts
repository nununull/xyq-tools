import { ACHIEVEMENT_GUIDES } from '@/data/achievementGuides'
import { PRACTICAL_TIPS } from '@/data/practicalTips'
import { SUMMON_INSIGHTS, SUMMON_SCROLL_HELP } from '@/data/summonInsights'
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
    introduction: '山河社稷图双卷速查：见闻之卷查完成条件，心得之卷查技能效果和解锁要求。',
    searchPlaceholder: '搜召唤兽、见闻或心得，如：泡泡、苏醒、钟灵、花骨',
    help: SUMMON_SCROLL_HELP,
    note: '本页先收录已核对的常见见闻与心得，并非游戏全量清单。完成条件按所列图文整理，心得效果和等级参考 2025 实操表，哒探规则参考 2026 资料片；人物等级会影响可见与可用内容，操作前核对游戏内当前说明。',
    guides: SUMMON_INSIGHTS,
  },
}
