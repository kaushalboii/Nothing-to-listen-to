import controls from '../config/controls'
import display from '../config/display'
import { mediaConfigWithUncompressedSingleVersion } from '../config/media'
import { CELL_LIMIT, VOROFORCE_MODE } from '../consts'

export default {
  cells: CELL_LIMIT.xs,
  fpsCap: 60,
  idleFpsCap: 30,
  adaptiveFPS: true,
  multiThreading: {
    enabled: false,
    renderInParallel: false,
  },
  media: {
    ...mediaConfigWithUncompressedSingleVersion,
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
