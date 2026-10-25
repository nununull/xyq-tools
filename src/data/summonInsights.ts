import type { KnowledgeGuide, KnowledgeSource } from '@/types/knowledgeGuide'

interface SummonWitness {
  id: string
  creature: string
  name: string
  rarity: '轶闻' | '秘闻'
  requirement: string
  caution?: string
}

interface SummonInsight {
  id: string
  name: string
  effect: string
  witnessIds: readonly string[]
  storyRequired?: boolean
}

const WITNESS_SOURCE: KnowledgeSource = {
  label: '见闻名称、难度与条件表（3DM）',
  url: 'https://ol.3dmgame.com/gl/100491.html',
}
const RELEASE_SOURCE: KnowledgeSource = {
  label: '叶子猪：绘梦山河见闻与心得资料（2020）',
  url: 'https://xyq.yzz.cn/special/hmsh/',
}
const EFFECT_SOURCE: KnowledgeSource = {
  label: '折花思梦：心得效果与等级表（2025，3DM 转载）',
  url: 'https://ol.3dmgame.com/gl/306649.html',
}
const CURRENT_RULES_SOURCE: KnowledgeSource = {
  label: '2026 百兽争鸣：见闻之卷与哒探规则',
  url: 'https://xyq.yzz.cn/special/2026/xzlp0701/',
}
const SCROLL_STORY = '完成“山河社稷·变化之始”任务，获得山河社稷图'

// 见闻条件只在这里维护；心得所需条数和具体条件均从见闻引用派生。
const WITNESSES: readonly SummonWitness[] = [
  { id: 'paopao-suxing', creature: '泡泡', name: '苏醒', rarity: '轶闻', requirement: '通过任意方式获得一只泡泡或泡泡灵仙。' },
  { id: 'jiaoren-xuanze', creature: '鲛人', name: '选择', rarity: '轶闻', requirement: '在暗雷战斗中累计击败 450 只碧水夜叉。', caution: '这是鲛人的见闻，但要求击败的是碧水夜叉，别刷错目标。' },
  { id: 'jiangshi-xunjia', creature: '僵尸', name: '寻家', rarity: '轶闻', requirement: '在暗雷战斗中累计击败 500 只僵尸。' },
  { id: 'jiangshi-wushirenfei', creature: '僵尸', name: '物是人非', rarity: '轶闻', requirement: '累计捕捉或放生 60 只僵尸。' },
  { id: 'hudie-pojian', creature: '蝴蝶仙子', name: '破茧', rarity: '轶闻', requirement: '累计放生 60 只蝴蝶仙子。', caution: '这里要求的是放生，不能用仅捕捉的次数代替。' },
  { id: 'hudie-yanjie', creature: '蝴蝶仙子', name: '眼界', rarity: '秘闻', requirement: '使用等级大于 50 级的蝴蝶仙子出战，累计获得 500 场战斗胜利。', caution: '等级要求针对出战的召唤兽，50 级本身不满足“大于 50 级”。' },
  { id: 'leiniaoren-jiaoliang', creature: '雷鸟人', name: '较量', rarity: '轶闻', requirement: '在丝绸之路累计获得 120 场战斗胜利。' },
  { id: 'leiniaoren-zhefu', creature: '雷鸟人', name: '蛰伏', rarity: '秘闻', requirement: '在暗雷战斗中累计击败 1200 只雷鸟人。', caution: '要求的是击败的怪物只数，与战斗场数不同。' },
  { id: 'ruishou-tianguan', creature: '古代瑞兽', name: '天官', rarity: '轶闻', requirement: '累计放生 60 只花妖。', caution: '这是古代瑞兽的见闻，但要求放生的是花妖。' },
  { id: 'ruishou-dirui', creature: '古代瑞兽', name: '地瑞', rarity: '秘闻', requirement: '使用等级大于 50 级的古代瑞兽出战，在大唐国境或大唐境外累计获得 300 场战斗胜利。', caution: '召唤兽等级、出战和指定场景要同时满足。' },
  { id: 'jiaolong-xunyan', creature: '蛟龙', name: '寻焰', rarity: '轶闻', requirement: '累计捕捉或放生 60 只蛟龙。' },
  { id: 'jiaolong-cilin', creature: '蛟龙', name: '赐鳞', rarity: '秘闻', requirement: '使用等级大于 50 级的蛟龙出战，累计获得 300 场战斗胜利。' },
  { id: 'furong-qunfangpu', creature: '芙蓉仙子', name: '群芳谱', rarity: '轶闻', requirement: '累计捕捉或放生 60 只星灵仙子。', caution: '这是芙蓉仙子的见闻，但要求捕捉或放生的是星灵仙子。' },
  { id: 'furong-daichungui', creature: '芙蓉仙子', name: '待春归', rarity: '秘闻', requirement: '携带等级大于 50 级的芙蓉仙子，累计获得 300 场战斗胜利。', caution: '此条公开资料写的是“携带”，与其他见闻中的“出战”分别核对。' },
  { id: 'shuxianfeng-songli', creature: '鼠先锋', name: '送礼', rarity: '轶闻', requirement: '在麒麟山累计获得 120 场战斗胜利。' },
]

const INSIGHTS: readonly SummonInsight[] = [
  { id: 'jianti', name: '健体', effect: '增加 3 点体质。', witnessIds: [], storyRequired: true },
  { id: 'zhongling', name: '钟灵', effect: '所有属性各增加 1 点；泡泡装备时，所有属性额外各增加 1 点。', witnessIds: ['paopao-suxing'] },
  { id: 'jiaoren', name: '鲛刃', effect: '增加 3 点攻击；鲛人装备时，额外增加 2 点攻击。', witnessIds: ['jiaoren-xuanze'] },
  { id: 'shibian', name: '尸变', effect: '提升 20 点防御，降低 20 点法防；僵尸装备时，额外提升 5 点防御。', witnessIds: ['jiangshi-xunjia', 'jiangshi-wushirenfei'] },
  { id: 'qingying', name: '轻盈', effect: '受到的物理和法术伤害结果降低 5 点；蝴蝶仙子装备时，额外提升 5% 物理躲避率。', witnessIds: ['hudie-pojian', 'hudie-yanjie'] },
  { id: 'yulei', name: '驭雷', effect: '使用奔雷咒或雷击时，法伤提升 5 点；雷鸟人装备时，再额外提升 5 点法伤。', witnessIds: ['leiniaoren-jiaoliang', 'leiniaoren-zhefu'] },
  { id: 'yutu', name: '驭土', effect: '使用落岩或泰山压顶时，法伤提升 10 点；古代瑞兽装备时，额外提升 3 点敏捷。', witnessIds: ['ruishou-tianguan', 'ruishou-dirui'] },
  { id: 'yushui', name: '驭水', effect: '使用水攻或水漫金山时，法伤提升 10 点；蛟龙装备时，额外提升 3 点法伤。', witnessIds: ['jiaolong-xunyan', 'jiaolong-cilin'] },
  { id: 'huagu', name: '花骨', effect: '提升 10 点法伤，降低 5 点法防；芙蓉仙子装备时，不降低法防。', witnessIds: ['furong-qunfangpu', 'furong-daichungui'] },
  { id: 'jucai', name: '聚财', effect: '提升 5 点敏捷；鼠先锋装备且玩家携带梦幻币大于 1000 万时，进入战斗再额外提升 10 点敏捷。', witnessIds: ['shuxianfeng-songli'] },
]

/** 查找心得引用的见闻，缺失引用直接报错，避免展示不完整的解锁要求。 */
function getWitness(id: string): SummonWitness {
  const witness = WITNESSES.find((entry) => entry.id === id)
  if (!witness) throw new Error(`心得引用的见闻不存在：${id}`)
  return witness
}

/** 由见闻列表派生卷内条目和关联心得，不另存一份完成条件。 */
function createWitnessGuide(witness: SummonWitness): KnowledgeGuide {
  const related = INSIGHTS.filter((insight) => insight.witnessIds.includes(witness.id)).map((insight) => insight.name)
  return {
    id: `witness-${witness.id}`,
    title: `${witness.creature}·${witness.name}`,
    topic: '见闻之卷',
    kind: 'mechanic',
    summary: `${witness.rarity} · ${witness.requirement}`,
    conditionLabel: '完成条件',
    condition: witness.requirement,
    stepsLabel: '完成要点',
    steps: [
      `在山河社稷图的见闻之卷中，选择${witness.creature}并核对“${witness.name}”的要求与进度。`,
      `此见闻关联心得“${related.join('、')}”；补齐对应心得需要的见闻后，再到心得之卷解锁。`,
    ],
    cautions: [witness.caution ?? '以对应见闻的进度提示核对结果，注意区分捕捉、放生、战斗场数和怪物只数。'],
    sources: [WITNESS_SOURCE, RELEASE_SOURCE],
  }
}

/** 心得要求及操作清单引用见闻原文，条数从实际引用数量确定性派生。 */
function createInsightGuide(insight: SummonInsight): KnowledgeGuide {
  const witnesses = insight.witnessIds.map(getWitness)
  const creatures = [...new Set(witnesses.map((witness) => witness.creature))]
  const requirement = insight.storyRequired ? SCROLL_STORY : `完成以下 ${witnesses.length} 条${creatures.join('、')}见闻。`
  return {
    id: `insight-${insight.id}`,
    title: insight.name,
    topic: '心得之卷',
    kind: 'mechanic',
    summary: insight.effect,
    conditionLabel: '解锁条件',
    condition: `人物等级至少 60 级；${requirement}`,
    stepsLabel: '所需见闻与解锁',
    steps: [
      ...(insight.storyRequired ? [SCROLL_STORY] : witnesses.map((witness) => `${witness.creature}·${witness.name}（${witness.rarity}）：${witness.requirement}`)),
      '满足条件后回到心得之卷，确认所需金钱与体力后解锁，再选择召唤兽装备。',
    ],
    cautions: ['同一只召唤兽只能装备一个心得；同一个心得同时只能指定给一只召唤兽。', '获得见闻、解锁心得和装备心得是不同操作，属性效果以装备后的对应召唤兽为准。'],
    sources: [EFFECT_SOURCE, RELEASE_SOURCE],
  }
}

export const SUMMON_SCROLL_HELP: KnowledgeGuide = {
  id: 'summon-scroll-help',
  title: '绘卷开启与哒探见闻（2026）',
  topic: '山河社稷图',
  kind: 'mechanic',
  summary: 'Alt+L 打开绘卷，先完成见闻，再解锁和装备心得。哒探见闻支持离线持续进行。',
  condition: `人物等级至少 50 级，${SCROLL_STORY}。`,
  steps: [
    '进入山河社稷图。原“幻兽之卷”已更名为“见闻之卷”，心得技能在“心得之卷”查看。',
    '需要哒探时，先核对消耗：仅哒哒为 3 仙玉/10 分钟，哒哒和哒妹为 20 仙玉/10 分钟，后者速度为 5 倍。',
    '每次哒探随机解锁一条参战等级不高于人物等级的召唤兽见闻；在哒探日志查看进展。',
  ],
  cautions: ['哒探随机解锁，不能保证指定解锁本页某一条见闻。', '下线仍会继续消耗；仙玉不足时会自动将点卡转换为仙玉。', '连续哒探会自动继续下一轮，当前见闻等级全部解锁后会转向其他见闻等级。'],
  sources: [CURRENT_RULES_SOURCE],
}

export const SUMMON_INSIGHTS: readonly KnowledgeGuide[] = [
  ...WITNESSES.map(createWitnessGuide),
  ...INSIGHTS.map(createInsightGuide),
]
