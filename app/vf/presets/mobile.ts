import controls from '../config/controls'
import display from '../config/display'
import mediaConfig from '../config/media'
import { VOROFORCE_MODE } from '../consts'

export default {
  cells: 10000,
  multiThreading: {
    enabled: false,
    renderInParallel: false,
  },
  media: {
    ...mediaConfig,
    preload: 'first',
  },
  controls,
  revealScreenDelay: {
    default: 200,
    modes: {
      [VOROFORCE_MODE.preview]: 150,
      [VOROFORCE_MODE.select]: 150,
      [VOROFORCE_MODE.intro]: 200,
    },
  },
  display,
}
