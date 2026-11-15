import type { TranslationKey } from '@shared/i18n';
import type { BodyTarget } from './HeatmapBody';
export const organLabels:Record<BodyTarget,{name:TranslationKey,description:TranslationKey,region:TranslationKey}>={
  cerebro:{name:'brain',description:'brainDesc',region:'regionCranial'},
  pulmoes:{name:'lungs',description:'lungsDesc',region:'regionThorax'},
  coracao:{name:'heart',description:'heartDesc',region:'regionThorax'},
  figado:{name:'liver',description:'liverDesc',region:'regionAbdomen'},
  estomago:{name:'stomach',description:'stomachDesc',region:'regionAbdomen'},
  medula:{name:'marrow',description:'marrowDesc',region:'regionSkeleton'},
};
