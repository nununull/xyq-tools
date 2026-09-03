import { ArrowLeftRight, ClipboardClock, Gem, Leaf, Map, ScrollText } from 'lucide-vue-next'
import type { Component } from 'vue'

export type ToolRouteName = 'sect-mission' | 'adventure-guides' | 'artifact-helper' | 'currency-converter' | 'synthesis-calculator' | 'growth-calculator'

export interface ToolCatalogItem {
  index: string
  routeName: ToolRouteName
  label: string
  description: string
  icon: Component
}

export const TOOL_CATALOG: readonly ToolCatalogItem[] = [
  {
    index: '01',
    routeName: 'sect-mission',
    label: '师门助手',
    description: '多账号计时、高价值提醒和商会检索，一页处理。',
    icon: ClipboardClock,
  },
  {
    index: '02',
    routeName: 'adventure-guides',
    label: '奇遇攻略',
    description: '九色鹿上下路线按结局速查，照着选就行。',
    icon: Map,
  },
  {
    index: '03',
    routeName: 'artifact-helper',
    label: '神器助手',
    description: '起转神器材料和口碑速查，接不接当场判断。',
    icon: ScrollText,
  },
  {
    index: '04',
    routeName: 'currency-converter',
    label: '金价换算',
    description: '人民币与梦幻币互换，扣掉手续费，到手多少一眼看清。',
    icon: ArrowLeftRight,
  },
  {
    index: '05',
    routeName: 'synthesis-calculator',
    label: '合成计算',
    description: '宝石、五色灵尘、星辉石，单颗合成与连续打段算清楚。',
    icon: Gem,
  },
  {
    index: '06',
    routeName: 'growth-calculator',
    label: '养成计算',
    description: '修炼、技能、等级与进阶，一张预算算清单开和五开的养成花费。',
    icon: Leaf,
  },
]
