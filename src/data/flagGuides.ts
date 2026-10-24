import compassionAolai from '@/assets/flag-guides/compassion-aolai.jpg'
import compassionChangshou from '@/assets/flag-guides/compassion-changshou.jpg'
import compassionZhuzi from '@/assets/flag-guides/compassion-zhuzi.jpg'
import dreamChangan from '@/assets/flag-guides/dream-changan.jpg'
import healingChangan from '@/assets/flag-guides/healing-changan.jpg'
import literaryChangan from '@/assets/flag-guides/literary-changan.jpg'
import palaceThiefChangan from '@/assets/flag-guides/palace-thief-changan.jpg'
import relicChangan from '@/assets/flag-guides/relic-changan.jpg'
import relicChangshou from '@/assets/flag-guides/relic-changshou.jpg'
import { BELL_FLAG_GUIDE } from '@/data/bellFlagGuide'
import type { FlagGuide, FlagPoint, FlagSheet } from '@/types/flagGuide'

export const FLAG_GUIDE_SOURCE = {
  title: '日常活动旗子：妙手、慈心、文韵墨香、剑陵、衣冠等',
  author: '无极无极666666',
  publishedAt: '2022-09-03',
  url: 'https://www.bilibili.com/read/cv18430916/',
} as const

export const FLAG_BASICS_SOURCE = {
  title: '传送道具的若干经验分享',
  url: 'https://xyq.netease.com/article-7576-1.html',
} as const

export const FLAG_SKILL_SOURCE = {
  title: '奇门遁甲与各场景定旗条件',
  url: 'https://xyq.17173.com/content/12052021/141116321.shtml',
} as const

const RELIC_NOTICE = '图中黄字是碑的坐标，不是插旗坐标。定旗请用下方表格，避免落地后角色挡住碑。'
const CHANGAN_BOOKSTORE: FlagPoint = { name: '书店', coordinates: [521, 74] }
const CHANGAN_SONG: FlagPoint = { name: '歌字处', coordinates: [218, 37] }

// 剑陵与衣冠使用同一套定旗方案，共享点位，避免两份攻略分别维护。
const RELIC_SHEETS: readonly FlagSheet[] = [
  {
    id: 'relic-changan',
    title: '长安城 · 两面旗',
    image: relicChangan,
    imageDescription: '长安城碑位分布原图，黄字标注碑的位置。',
    notice: RELIC_NOTICE,
    plans: [
      {
        title: '长安第一面',
        points: [
          { name: '碑位附近', coordinates: [239, 228], directClick: true },
          { name: '碑位附近', coordinates: [174, 241], directClick: true },
          { name: '碑位附近', coordinates: [162, 245], directClick: true },
          { name: '碑位附近', coordinates: [109, 161], directClick: true },
          { name: '碑位附近', coordinates: [147, 62], directClick: true },
          { name: '碑位附近', coordinates: [94, 22], directClick: true },
          { name: '碑位附近', coordinates: [35, 142] },
        ],
      },
      {
        title: '长安第二面',
        points: [
          { name: '碑位附近', coordinates: [304, 192], directClick: true },
          { name: '碑位附近', coordinates: [330, 263], directClick: true },
          { name: '碑位附近', coordinates: [416, 205], directClick: true },
          { name: '碑位附近', coordinates: [426, 251], directClick: true },
          { name: '碑位附近', coordinates: [483, 250], directClick: true },
          { name: '碑位附近', coordinates: [505, 184], directClick: true },
        ],
      },
    ],
  },
  {
    id: 'relic-changshou',
    title: '长寿村 · 一面旗',
    image: relicChangshou,
    imageDescription: '长寿村碑位分布原图，黄字标注碑的位置。',
    notice: RELIC_NOTICE,
    plans: [{
      title: '长寿旗',
      points: [
        { name: '碑位附近', coordinates: [28, 34], directClick: true },
        { name: '碑位附近', coordinates: [35, 159], directClick: true },
        { name: '碑位附近', coordinates: [61, 145], directClick: true },
        { name: '碑位附近', coordinates: [92, 103], directClick: true },
        { name: '碑位附近', coordinates: [116, 45], directClick: true },
      ],
    }],
  },
]

export const FLAG_GUIDES: readonly FlagGuide[] = [
  {
    id: 'compassion',
    title: '慈心渡鬼',
    description: '按傲来、长寿、朱紫分开定，任务点和常用出口一起备好。',
    preparation: '傲来国、长寿村、朱紫国各一面合成旗。先做常用地图也可以。',
    tips: ['朱紫国这面旗也可供周六降妖伏魔使用，但不等于覆盖铃铛的全部点位。'],
    sheets: [
      {
        id: 'compassion-aolai',
        title: '傲来国',
        image: compassionAolai,
        imageDescription: '傲来国任务点与出口定旗示意图。',
        plans: [{
          title: '傲来旗',
          points: [
            { name: '慈心任务点', coordinates: [43, 125], directClick: true },
            { name: '慈心任务点', coordinates: [63, 111], directClick: true },
            { name: '慈心任务点', coordinates: [45, 82], directClick: true },
            { name: '慈心任务点', coordinates: [69, 45], directClick: true },
            { name: '东海湾出口', coordinates: [163, 21], directClick: true },
            { name: '慈心任务点', coordinates: [181, 24], directClick: true },
            { name: '花果山出口', coordinates: [214, 143] },
          ],
        }],
      },
      {
        id: 'compassion-changshou',
        title: '长寿村',
        image: compassionChangshou,
        imageDescription: '长寿村任务点与郊外出口定旗示意图。',
        plans: [{
          title: '长寿旗',
          points: [
            { name: '慈心任务点', coordinates: [34, 30], directClick: true },
            { name: '慈心任务点', coordinates: [30, 75], directClick: true },
            { name: '慈心任务点', coordinates: [86, 100] },
            { name: '慈心任务点', coordinates: [136, 129], directClick: true },
            { name: '慈心任务点', coordinates: [66, 139], directClick: true },
            { name: '慈心任务点', coordinates: [99, 184], directClick: true },
            { name: '长寿郊外出口', coordinates: [144, 5] },
          ],
        }],
      },
      {
        id: 'compassion-zhuzi',
        title: '朱紫国',
        image: compassionZhuzi,
        imageDescription: '朱紫国七个任务点定旗示意图。',
        plans: [{
          title: '朱紫旗',
          points: [
            { name: '慈心任务点', coordinates: [41, 96], directClick: true },
            { name: '慈心任务点', coordinates: [41, 67], directClick: true },
            { name: '慈心任务点', coordinates: [86, 54] },
            { name: '慈心任务点', coordinates: [108, 28], directClick: true },
            { name: '慈心任务点', coordinates: [102, 109], directClick: true },
            { name: '慈心任务点', coordinates: [121, 110] },
            { name: '慈心任务点', coordinates: [188, 88] },
          ],
        }],
      },
    ],
  },
  BELL_FLAG_GUIDE,
  {
    id: 'literary',
    title: '文韵墨香',
    description: '长安常用任务点集中到一面旗，补点单独看，别漏掉衙门和大雁塔。',
    preparation: '长安一面主旗；衙门和大雁塔右侧可复用下方「寻梦追忆」的补充点位。',
    tips: ['本图展示主旗。需要补充点时切换「寻梦追忆」，查看第五、六个点，另放一面长安旗。'],
    sheets: [{
      id: 'literary-changan',
      title: '长安城',
      image: literaryChangan,
      imageDescription: '文韵墨香长安城主旗点位示意图。',
      plans: [{
        title: '文韵墨香主旗',
        points: [
          { name: '礼部侍郎附近', coordinates: [235, 114], directClick: true },
          { name: '殷丞相附近', coordinates: [160, 140] },
          { name: '秦府附近', coordinates: [87, 78] },
          { name: '陈员外附近', coordinates: [160, 35] },
          { name: '王武附近', coordinates: [382, 123] },
          CHANGAN_BOOKSTORE,
          { name: '福寿店', coordinates: [519, 236] },
        ],
      }],
    }],
  },
  {
    id: 'healing',
    title: '妙手仁心',
    description: '先定领任务的位置，再备长安常用点。这套是常用点方案，不是所有 NPC 的全覆盖。',
    preparation: '长安一面合成旗，收录七个常用点。',
    tips: ['孙医仙对应的是插旗位置；不要把目标 NPC 本身的坐标直接替换进来。'],
    sheets: [{
      id: 'healing-changan',
      title: '长安城',
      image: healingChangan,
      imageDescription: '妙手仁心领任务与长安常用点定旗示意图。',
      plans: [{
        title: '妙手仁心常用旗',
        points: [
          { name: '孙医仙附近', coordinates: [257, 98], directClick: true },
          CHANGAN_SONG,
          { name: '大宝附近', coordinates: [150, 3] },
          { name: '赵姨娘附近', coordinates: [375, 8] },
          { name: '大雁塔附近', coordinates: [441, 240], directClick: true },
          { name: '紫衣盗附近', coordinates: [548, 191] },
          { name: '长安东侧常用点', coordinates: [536, 112] },
        ],
      }],
    }],
  },
  {
    id: 'dream',
    title: '寻梦追忆',
    description: '前四个是寻梦常用点，后两个留给文韵墨香补点，一面旗兼顾两个活动。',
    preparation: '长安一面合成旗，本方案使用六个点位。',
    tips: ['第五、六点是文韵墨香补充点；只做寻梦追忆时，先看前四点。'],
    sheets: [{
      id: 'dream-changan',
      title: '长安城',
      image: dreamChangan,
      imageDescription: '寻梦追忆与文韵墨香补充点定旗示意图。',
      plans: [{
        title: '寻梦与文墨补充旗',
        points: [
          { name: '沈剑如附近', coordinates: [136, 104], directClick: true },
          { name: '神秘人附近', coordinates: [427, 213], directClick: true },
          { name: '国子监', coordinates: [277, 203] },
          CHANGAN_SONG,
          { name: '大雁塔右侧', coordinates: [472, 247], note: '文韵墨香补充点' },
          { name: '长安衙门', coordinates: [10, 64], note: '文韵墨香补充点' },
        ],
      }],
    }],
  },
  {
    id: 'palace-thief',
    title: '皇宫飞贼',
    description: '领飞贼的位置与长安常用入口放在一起，兼顾平时跑任务。',
    preparation: '长安一面合成旗，按下面七点制作。',
    tips: ['节日活动点只是备用位置，活动 NPC 可能变化，不能保证每次都在原处。'],
    sheets: [{
      id: 'palace-thief-changan',
      title: '长安城',
      image: palaceThiefChangan,
      imageDescription: '皇宫飞贼与长安常用点定旗示意图。',
      plans: [{
        title: '飞贼与长安常用旗',
        points: [
          { name: '大唐官府入口', coordinates: [311, 273] },
          { name: '化生寺入口', coordinates: [508, 273] },
          { name: '战神山附近', coordinates: [346, 77], directClick: true },
          CHANGAN_BOOKSTORE,
          { name: '御林军左统领附近', coordinates: [110, 224], directClick: true },
          { name: '节日活动备用点', coordinates: [237, 115], note: '活动 NPC 位置可能变化' },
          { name: '点卡交易公证官附近', coordinates: [41, 96] },
        ],
      }],
    }],
  },
  {
    id: 'sword-tomb',
    title: '剑陵魔影',
    description: '先认碑的位置，再用专门的偏移坐标定旗，落地后更方便点碑。',
    preparation: '长安两面、长寿一面；与衣冠古丘共用这一套。',
    tips: ['等系统公布碑位后再选对应旗点。图上碑位和表中插旗位置有意错开。'],
    sheets: RELIC_SHEETS,
  },
  {
    id: 'ancient-clothing',
    title: '衣冠古丘',
    description: '与剑陵魔影共用碑位旗，已经做好那套就直接复用。',
    preparation: '长安两面、长寿一面；与剑陵魔影共用，无需重复制作。',
    tips: ['看图认碑，按表定旗。图中黄字不能当成插旗坐标照抄。'],
    sheets: RELIC_SHEETS,
  },
]
