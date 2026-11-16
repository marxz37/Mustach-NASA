/** One vector asset for both applications and their favicons. */
import markSvg from './brand/radiance-mark.svg?raw';

export { default as radianceMarkUrl } from './brand/radiance-mark.svg';

/** Direct image, with the same paths and transparency, independent of CSS mask support. */
export const radianceMonochromeMarkUrl = `data:image/svg+xml,${encodeURIComponent(
  markSvg.replaceAll('#18ADF4', '#B8DEEF').replaceAll('#FFD557', '#B8DEEF'),
)}`;
