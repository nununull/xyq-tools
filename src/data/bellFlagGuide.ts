import aolaiNorthwest from '@/assets/flag-guides/bell-aolai-northwest.png'
import aolaiNortheast from '@/assets/flag-guides/bell-aolai-northeast.png'
import aolaiSouthwest from '@/assets/flag-guides/bell-aolai-southwest.png'
import aolaiSoutheast from '@/assets/flag-guides/bell-aolai-southeast.png'
import changshouNorthwest from '@/assets/flag-guides/bell-changshou-northwest.png'
import changshouNortheast from '@/assets/flag-guides/bell-changshou-northeast.png'
import changshouSouthwest from '@/assets/flag-guides/bell-changshou-southwest.png'
import changshouSoutheast from '@/assets/flag-guides/bell-changshou-southeast.png'
import zhuziNorthwest from '@/assets/flag-guides/bell-zhuzi-northwest.png'
import zhuziNortheast from '@/assets/flag-guides/bell-zhuzi-northeast.png'
import zhuziSouthwest from '@/assets/flag-guides/bell-zhuzi-southwest.png'
import zhuziSoutheast from '@/assets/flag-guides/bell-zhuzi-southeast.png'
import type { FlagGuide, FlagPoint, FlagSheet } from '@/types/flagGuide'

/** 从一份坐标表生成整面旗的展示数据，图片与表格共用同一个分区定义。 */
function createBellSheet(
  id: string,
  title: string,
  image: string,
  coordinates: readonly FlagPoint['coordinates'][],
  notice?: string,
): FlagSheet {
  return {
    id,
    title,
    image,
    imageDescription: `${title}分区插旗示意图。`,
    notice,
    plans: [{
      title,
      points: coordinates.map((point) => ({ name: '分区覆盖点', coordinates: point })),
    }],
  }
}

export const BELL_FLAG_GUIDE: FlagGuide = {
  id: 'demon-subduing',
  title: '降妖伏魔（铃铛）',
  description: '傲来、长寿、朱紫按四个分区分别定旗。看任务坐标选最近落点，再去找怪。',
  preparation: '三张地图各做左上、右上、左下、右下四面旗，按地图和分区在背包中排好。',
  tips: [
    '这套用于扩大找怪覆盖范围。怪物位置会变化，并非每个目标都能落地直接点到。',
    '建邺城、宝象国、西梁女国不在这套普通定旗方案内，需另配飞行符等传送方式。',
    '图与坐标均采用同一作者的分区方案；不要和慈心渡鬼的少量固定点混成一面旗。',
  ],
  source: {
    title: '效率插旗法，铃铛提升10环不是梦！',
    author: '晟恺说梦幻',
    publishedAt: '2021-02-02',
    url: 'https://www.sohu.com/a/448189373_120969720',
  },
  sheets: [
    createBellSheet('bell-aolai-northwest', '傲来国 · 左上旗', aolaiNorthwest, [
      [7, 140], [41, 127], [69, 108], [65, 82], [23, 96], [26, 70], [62, 48],
    ]),
    createBellSheet('bell-aolai-northeast', '傲来国 · 右上旗', aolaiNortheast, [
      [213, 140], [126, 130], [104, 105], [175, 100], [199, 79], [133, 87], [126, 76],
    ]),
    createBellSheet('bell-aolai-southwest', '傲来国 · 左下旗', aolaiSouthwest, [
      [24, 57], [6, 43], [15, 27], [45, 26], [55, 11], [64, 45], [98, 51],
    ]),
    createBellSheet('bell-aolai-southeast', '傲来国 · 右下旗', aolaiSoutheast, [
      [99, 15], [120, 40], [131, 21], [143, 62], [187, 51], [188, 29], [167, 10],
    ]),
    createBellSheet('bell-changshou-northwest', '长寿村 · 左上旗', changshouNorthwest, [
      [24, 179], [34, 157], [89, 186], [74, 169], [52, 134], [19, 123], [12, 103],
    ]),
    createBellSheet('bell-changshou-northeast', '长寿村 · 右上旗', changshouNortheast, [
      [108, 204], [98, 184], [136, 165], [101, 142], [80, 125], [129, 112], [100, 111],
    ]),
    createBellSheet('bell-changshou-southwest', '长寿村 · 左下旗', changshouSouthwest, [
      [35, 84], [35, 59], [18, 38], [18, 21], [50, 43], [53, 13], [80, 25],
    ]),
    createBellSheet('bell-changshou-southeast', '长寿村 · 右下旗', changshouSoutheast, [
      [91, 67], [127, 69], [88, 49], [136, 49], [115, 28], [145, 4], [81, 6],
    ]),
    createBellSheet('bell-zhuzi-northwest', '朱紫国 · 左上旗', zhuziNorthwest, [
      [6, 113], [6, 83], [39, 95], [70, 102], [42, 79], [37, 57], [76, 57],
    ]),
    createBellSheet('bell-zhuzi-northeast', '朱紫国 · 右上旗', zhuziNortheast, [
      [110, 114], [88, 91], [91, 65], [124, 65], [152, 58], [143, 96], [183, 86],
    ]),
    createBellSheet('bell-zhuzi-southwest', '朱紫国 · 左下旗', zhuziSouthwest, [
      [3, 39], [6, 4], [47, 29], [70, 18], [91, 50], [100, 9],
    ], '原图有七个红点，但正文只列出六组坐标。表格仅收录原文明确给出的六点，额外红点的坐标不作猜测。'),
    createBellSheet('bell-zhuzi-southeast', '朱紫国 · 右下旗', zhuziSoutheast, [
      [110, 56], [98, 41], [123, 9], [146, 37], [152, 13], [182, 43], [186, 23],
    ]),
  ],
}
