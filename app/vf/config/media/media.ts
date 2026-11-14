const rawBase = import.meta.env.BASE_URL || '/'
const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

const mediaConfig = {
  enabled: false,
  baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? `${normalizedBase}/media`,
  preload: false,
  compressionFormat: 'dds',
  versions: [
    {
      cols: 512,
      rows: 104,
      width: 2048,
      height: 624,
      layers: 1,
      layerSrcFormat: '/low/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers: 1,
      layerSrcFormat: '/mid/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers: 1,
      layerSrcFormat: '/high/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
  ],
}

export default mediaConfig

export const uncompressedSingleMediaVersionConfig = {
  cols: 1,
  rows: 1,
  virtualCols: 9,
  virtualRows: 6,
  tileWidth: 220,
  tileHeight: 330,
  width: 1980,
  height: 1980,
  layers: 216,
  virtualLayers: 1,
  layerIndexStart: 0,
  layerSrcFormat: '/single/{INDEX}.jpg',
  type: 'uncompressed-single',
}

export const mediaConfigWithUncompressedSingleVersion = {
  ...mediaConfig,
  versions: [
    ...mediaConfig.versions,
    ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
      ? [uncompressedSingleMediaVersionConfig]
      : []),
  ],
}
