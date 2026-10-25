import type { KnowledgeGuide, KnowledgeSource } from '@/types/knowledgeGuide'

const PET_MECHANICS_SOURCE: KnowledgeSource = {
  label: '叶子猪：玩家实测召唤兽机制与培养（2020 长文）',
  url: 'https://xyq.yzz.cn/skill/202005/1611821_all.shtml',
}
const INNER_PILL_SOURCE: KnowledgeSource = {
  label: '叶子猪资料站：召唤兽内丹规则',
  url: 'https://xyq.yzz.cn/special/cwdz/neidan.html',
}

export const SUMMON_INSIGHTS: readonly KnowledgeGuide[] = [
  {
    id: 'physical-pet-checklist',
    title: '买任务攻宠，先看技能还是资质？',
    topic: '选宠搭配',
    kind: 'experience',
    summary: '先确定任务场景，再把技能、攻击资质、成长和成品面板放在一起比较。',
    condition: '日常任务使用的物理攻宠选购，优先考虑稳定完成任务。',
    steps: ['列出所刷任务需要的输出、续航和生存能力，再选对应技能组合。', '对比同等级、相近加点与装备的成品宠，把后续培养费用一起计入预算。'],
    cautions: ['这是一套选购思路，红书数量无法单独证明实战强弱。', '全力、血攻和耐攻用途不同，别跨场景直接套用排行。'],
    sources: [PET_MECHANICS_SOURCE],
  },
  {
    id: 'magic-pet-speed',
    title: '须弥法宠，为什么还要看速度？',
    topic: '选宠搭配',
    kind: 'experience',
    summary: '清场法宠需要配合队伍出手顺序，速度资质、敏捷分配和装备都值得一起看。',
    condition: '用于常规清场的须弥法宠，希望与人物和其他召唤兽配速。',
    steps: ['先决定希望法宠在队伍中的出手位置，再看同等级成品速度。', '对照常刷任务调整配速，同时保留能站场的气血和防御。'],
    cautions: ['配速目标取决于队伍和任务，没有适用于所有等级的固定速度。'],
    sources: [PET_MECHANICS_SOURCE],
  },
  {
    id: 'inner-pill-upgrade',
    title: '内丹怎么从一层升到五层？',
    topic: '内丹培养',
    kind: 'mechanic',
    summary: '学习后初始为一层；进入领悟状态，再使用同名内丹逐层提升，最高五层。',
    condition: '已学习目标内丹，备好同名内丹，并确认需要提升的技能。',
    steps: ['先检查目标内丹是否处于领悟状态。', '按内丹界面提示使用同名内丹提升一层，继续领悟并重复到目标层数。'],
    cautions: ['升层用同名内丹；不要把学习新内丹误当成升级。'],
    sources: [INNER_PILL_SOURCE],
  },
  {
    id: 'inner-pill-replace',
    title: '内丹格子满了，还能随便学新的吗？',
    topic: '内丹培养',
    kind: 'mechanic',
    summary: '格子满后学习新内丹存在覆盖已有内丹的风险，先检查当前配置。',
    condition: '准备更换内丹，或召唤兽的内丹格子已经学满。',
    steps: ['打开目标召唤兽的内丹界面，记录现有内丹及层数。', '结合新内丹类型核对覆盖规则，确认损失可接受再操作。'],
    cautions: ['高级内丹优先覆盖高级内丹；低级内丹可能覆盖已有高级或低级内丹。', '覆盖和升层是两种操作，已有高层内丹不要拿来试手。'],
    sources: [INNER_PILL_SOURCE],
  },
  {
    id: 'advanced-pet-preparation',
    title: '进阶前，先检查哪些条件？',
    topic: '进阶炼妖',
    kind: 'mechanic',
    summary: '先学满内丹格，并将低级内丹提升到五层，再按游戏提示触发进阶。',
    condition: '普通可进阶召唤兽；低参战等级召唤兽还需核对自身等级要求。',
    steps: ['检查内丹数量和低级内丹层数，补齐未满足的条件。', '通过野外战斗触发提示后，按进阶界面安排易经丹和后续培养。'],
    cautions: ['清灵仙露、额外培养与加速都有成本，先算完整预算再开始。', '具体可进阶条件和消耗以当前召唤兽界面为准。'],
    sources: [PET_MECHANICS_SOURCE],
  },
  {
    id: 'breeding-skill-count',
    title: '两只多技能胚子，为什么合不出技能之和？',
    topic: '进阶炼妖',
    kind: 'mechanic',
    summary: '炼妖技能具有随机性，重复技能、必带技能和冲突技能都会影响结果。',
    condition: '计划用普通召唤兽胚子炼妖，正在估算技能与成本。',
    steps: ['分别列出两只胚子的技能，检查重复、必带与冲突关系。', '将洗炼、垫书、胚子和失败结果一起纳入预算，再决定是否合成。'],
    cautions: ['理论技能上限是可能性，不是保底数量。', '结果可能出现大海龟、泡泡或属性较少的野生宝宝，不能按成品价格倒推稳赚。'],
    sources: [{ label: '召唤兽炼妖与培养规则（3DM）', url: 'https://ol.3dmgame.com/gl/283459.html' }],
  },
]
