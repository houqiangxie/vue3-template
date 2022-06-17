import gonggongweisheng from '@/assets/images/marker/gonggongweisheng.png';
import dizhi from '@/assets/images/marker/dizhi.png';
import senfang from '@/assets/images/marker/senfang.png';
import weihua from '@/assets/images/marker/weihua.png';
import dizhen from '@/assets/images/marker/dizhen.png';
import defaultIcon from '@/assets/images/marker/point.png';
import sanfangI from '@/assets/images/mapIcon/sanfangI.png';
import sanfangII from '@/assets/images/mapIcon/sanfangII.png';
import sanfangIII from '@/assets/images/mapIcon/sanfangIII.png';

const eventMarkerUrlMap = new Map([
  ['公共卫生', dizhi],
  ['地质', gonggongweisheng],
  ['森防', senfang],
  ['危化', weihua],
  ['地震', dizhen],
  ['其他', defaultIcon],
  ['三防1', sanfangI],
  ['三防2', sanfangII],
  ['三防3', sanfangIII],
]);

export default {
  eventMarkerUrlMap,
  defaultIcon,
  sanfangI,
};
