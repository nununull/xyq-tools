import type { AdventureGuide } from '@/types/adventureGuide'

export const ADVENTURE_GUIDES = [
  {
    id: 'nine-colored-deer-upper',
    title: '九色鹿·上',
    verifiedAt: '2026-08-30',
    sourceUrls: [],
    endings: [
      {
        id: 'beauty-or-demon',
        title: '妖女？佳人？',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '离开森林，寻找妖魔的轨迹', '杀死调达', '离开森林，前往皇宫', '立刻擒住女子'],
        }],
      },
      {
        id: 'slay-the-demon',
        title: '斩妖除魔',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '离开森林，寻找妖魔的轨迹', '杀死调达', '离开森林，前往皇宫', '暗中调查'],
        }],
      },
      {
        id: 'rage-to-the-crown',
        title: '怒发冲冠',
        paths: [{
          id: 'default',
          steps: ['告知有危险', '阻止九色鹿救人', '离开森林，前往皇宫', '刺杀妖魔女子'],
        }],
      },
      {
        id: 'deer-in-danger',
        title: '神鹿有难',
        paths: [{
          id: 'default',
          steps: ['离开河边', '阻止九色鹿救人', '离开森林，前往皇宫', '和平解决'],
        }],
      },
      {
        id: 'wicked-heart',
        title: '人心不古',
        paths: [{
          id: 'default',
          steps: ['告知有危险', '一起救人', '继续说服', '离开森林，前往皇宫', '调达会揭榜'],
        }],
      },
      {
        id: 'demon-revealed',
        title: '魔源现身',
        paths: [{
          id: 'default',
          steps: ['离开河边', '一起救人', '继续说服', '离开森林，前往皇宫', '调达不会揭榜'],
        }],
      },
    ],
  },
  {
    id: 'nine-colored-deer-lower',
    title: '九色鹿·下',
    verifiedAt: '2026-08-30',
    sourceUrls: [
      'http://xyq.17173.com/content/12162019/111410854.shtml',
      'https://ol.3dmgame.com/gl/99374.html',
      'https://www.163.com/dy/article/FJ2I5E0B0526GONF.html',
    ],
    endings: [
      {
        id: 'happy-reunion',
        title: '花好月圆',
        paths: [{
          id: 'lost-way-home',
          label: '迷途归路',
          steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「救调达」'],
        }],
      },
      {
        id: 'dream-of-nanke',
        title: '南柯一梦',
        paths: [
          {
            id: 'deer-entrustment',
            label: '神鹿之托',
            steps: ['九色鹿·上完成「妖女？佳人？」或「斩妖除魔」', '找到九色鹿', '选择「收下九色鹿的角」'],
          },
          {
            id: 'mutual-destruction-with-horn',
            label: '同类相残·持有鹿角',
            steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「不救调达」', '持有九色鹿的角'],
          },
        ],
      },
      {
        id: 'deer-sacrifice',
        title: '灵鹿献身',
        paths: [
          {
            id: 'stubborn-path',
            label: '执迷不返',
            steps: ['九色鹿·上完成「人心不古」', '找到国王和调达', '任意选择一个对话选项'],
          },
          {
            id: 'lone-army',
            label: '孤军深入',
            steps: ['九色鹿·上完成「妖女？佳人？」或「斩妖除魔」', '找到九色鹿', '选择「不收九色鹿的角」'],
          },
          {
            id: 'mutual-destruction-without-horn',
            label: '同类相残·没有鹿角',
            steps: ['九色鹿·上完成「神鹿有难」或「怒发冲冠」', '找到调达', '选择「不救调达」', '没有九色鹿的角'],
          },
        ],
      },
      {
        id: 'flowers-fall',
        title: '花落人亡',
        paths: [{
          id: 'fated-beauty',
          label: '红颜薄命',
          steps: ['九色鹿·上完成「魔源现身」', '找到神志不清的王妃', '选择「阻止王妃」'],
        }],
      },
      {
        id: 'parting-in-love',
        title: '爱别离',
        paths: [{
          id: 'courageous-red-lips',
          label: '义胆红唇',
          steps: ['九色鹿·上完成「魔源现身」', '找到神志不清的王妃', '选择「唤醒王妃」'],
        }],
      },
    ],
  },
] as const satisfies readonly AdventureGuide[]
