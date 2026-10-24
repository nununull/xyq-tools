import aolai from '@/assets/flag-guides/bell-three-aolai.png'
import changshou from '@/assets/flag-guides/bell-three-changshou.png'
import zhuzi from '@/assets/flag-guides/bell-three-zhuzi.png'
import type { FlagGuideVariant } from '@/types/flagGuide'

export const BELL_THREE_FLAG_VARIANT: FlagGuideVariant = {
  id: 'bell-three-flags',
  title: '三面省格版',
  description: '每张地图按上、中、下分三面旗，三张地图共九面，比四面版省三个道具格。',
  preparation: '傲来国、长寿村、朱紫国各准备三面旗，在背包中按上、中、下的顺序摆放。',
  tips: [
    '每张原图从左至右依次为上旗、中旗、下旗；根据任务纵坐标先选分区，再找附近落点。',
    '分区的纵坐标分界只用于判断选哪面旗，不是具体插旗坐标。原文没有完整的逐点坐标表，请先在游戏中核对位置。',
    '原文用于机缘和日常通用找点，尚未验证铃铛的覆盖效果，不保证每个目标都能落地直接点到。',
  ],
  source: {
    title: '机缘任务攻略 · 上中下三面导标旗方案',
    author: 'Q独行侠Q（3DM转载）',
    publishedAt: '2026-09-09',
    url: 'https://ol.3dmgame.com/gl/352698.html',
  },
  sheets: [
    {
      id: 'bell-three-aolai',
      title: '傲来国 · 上中下三面旗',
      image: aolai,
      imageDescription: '傲来国三面旗点位原图，从左至右依次为上、中、下旗。',
      notice: '按纵坐标 Y=120、Y=60 大致划分上、中、下区域。分界数值不是插旗坐标。',
      plans: [],
    },
    {
      id: 'bell-three-changshou',
      title: '长寿村 · 上中下三面旗',
      image: changshou,
      imageDescription: '长寿村三面旗点位原图，从左至右依次为上、中、下旗。',
      notice: '按纵坐标 Y=145、Y=65 大致划分上、中、下区域。分界数值不是插旗坐标。',
      plans: [],
    },
    {
      id: 'bell-three-zhuzi',
      title: '朱紫国 · 上中下三面旗',
      image: zhuzi,
      imageDescription: '朱紫国三面旗点位原图，从左至右依次为上、中、下旗。',
      notice: '按纵坐标 Y=75、Y=35 大致划分上、中、下区域；个别点有跨区调整，以原图位置为准。',
      plans: [],
    },
  ],
}
