import homeDesignExport from '@/assets/knowledge-guides/home-design-export.png'
import homeDesignImport from '@/assets/knowledge-guides/home-design-import.png'
import type { KnowledgeGuide, KnowledgeSource } from '@/types/knowledgeGuide'

const HOME_SOURCE: KnowledgeSource = {
  label: '梦幻西游电脑版：简单成就速成篇（2023 图文）',
  url: 'https://www.sohu.com/a/724819170_99983688',
}
const LEISURE_SOURCE: KnowledgeSource = {
  label: '梦幻收藏控：休闲玩法成就实操（2023 图文）',
  url: 'https://www.toutiao.com/article/7278701938064114212/',
}

export const ACHIEVEMENT_GUIDES: readonly KnowledgeGuide[] = [
  {
    id: 'home-design-start',
    title: '大师起点：导出一份家园设计图纸',
    topic: '家园设计',
    kind: 'mechanic',
    summary: '完成室内设计相关前置后，向管家打开设计界面并导出图纸。',
    condition: '拥有房屋，完成南极仙翁处的“设计洞天福地”剧情，能使用室内设计功能。',
    steps: ['找管家进入室内设计。', '导出当前设计，并记下本机图纸文件的保存位置。'],
    cautions: ['“洞天福地”指前置剧情，房屋风水无需为此重新更换。'],
    sources: [HOME_SOURCE],
    image: { src: homeDesignExport, alt: '家园室内设计导出图纸的操作位置，原攻略截图', width: 609, height: 590 },
  },
  {
    id: 'home-design-import',
    title: '坐享其成：导入并应用家园图纸',
    topic: '家园设计',
    kind: 'mechanic',
    summary: '在室内设计界面导入已经保存的图纸，应用设计方案。',
    condition: '已解锁室内设计，并准备好本机可读取的图纸文件。',
    steps: ['向管家打开室内设计，选择导入图纸。', '找到文件并导入，按界面提示应用方案。'],
    cautions: ['先导出自己的布局留底；导入前看清方案对家具和布局的影响。'],
    sources: [HOME_SOURCE],
    image: { src: homeDesignImport, alt: '家园室内设计导入图纸的操作位置，原攻略截图', width: 644, height: 800 },
  },
  {
    id: 'first-spell-certification',
    title: '法宠认证：完成一次认证操作',
    topic: '日常养成',
    kind: 'mechanic',
    summary: '携带有可认证法术的召唤兽，找花果山的老马猴完成法术认证。',
    condition: '准备带“水攻”的巨蛙等符合认证条件的召唤兽，并核对界面要求的费用。',
    steps: ['在召唤兽技能页确认有可认证的法术，带着目标召唤兽前往花果山。', '找老马猴（37,45）打开认证界面，选对召唤兽和法术，确认费用后完成认证。'],
    cautions: ['认证会改变技能配置，别误选已有的成品召唤兽。', '费用随具体召唤兽条件而变，以确认界面为准。'],
    sources: [HOME_SOURCE],
  },
  {
    id: 'care-for-summon',
    title: '精心照顾：通过巫医照顾召唤兽',
    topic: '日常养成',
    kind: 'mechanic',
    summary: '带一只普通召唤兽找巫医，完成医治操作。',
    condition: '携带可医治的召唤兽，准备巫医所需费用。',
    steps: ['将暂时不用的贵重召唤兽存好，带普通召唤兽前往巫医。', '核对费用后完成医治，再查看成就提示。'],
    cautions: ['优先用已有普通召唤兽，没必要为这一项专门购买贵重宠。'],
    sources: [HOME_SOURCE],
  },
  {
    id: 'no-vitality-hotel',
    title: '一点活力都没给：零活力时住店',
    topic: '日常养成',
    kind: 'mechanic',
    summary: '活力为零、人物气血或魔法未满时，到长安酒店住店。',
    condition: '活力为 0，人物有需要恢复的气血或魔法，备好住店费用。',
    steps: ['顺着平时烹饪、炼药等操作消耗活力至 0。', '状态未满时及时到长安酒店住店，核对成就记录。'],
    cautions: ['途中恢复了活力就要重新核对条件，避免白跑。'],
    sources: [HOME_SOURCE],
  },
  {
    id: 'fishing-release',
    title: '钓鱼放生：钓到鱼后选择放生',
    topic: '休闲玩法',
    kind: 'mechanic',
    summary: '购买鱼竿参与钓鱼，钓上鱼后选择放生，完成相关放生成就条件。',
    condition: '能够参与钓鱼玩法，并准备购买鱼竿的费用。',
    steps: ['到傲来国或长寿村找捕鱼人购买鱼竿，到可钓鱼水边开始。', '成功钓到鱼后选择放生，再到成就界面查看对应记录。'],
    cautions: ['看准钓上鱼后的选项；未成功钓起就离开不算放生。'],
    sources: [LEISURE_SOURCE],
  },
]
