import { ClipboardClock, Map, ScrollText } from 'lucide-vue-next'
import type { Component } from 'vue'

export type ToolRouteName = 'sect-mission' | 'adventure-guides' | 'artifact-helper'

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
]
