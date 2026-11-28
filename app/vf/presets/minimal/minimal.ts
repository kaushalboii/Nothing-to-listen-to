import { mediaConfigWithUncompressedSingleVersion } from '../../config/media'
import { CELL_LIMIT } from '../../consts'

export default {
  cells: CELL_LIMIT.min,
  media: mediaConfigWithUncompressedSingleVersion,
}
