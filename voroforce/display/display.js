import Renderer from './renderer'
import Scene from './scene'
import { setupDevTools } from './utils/dev-tools'

export default class Display {
  constructor(store) {
    this.initGlobals(store)
    this.initProperties()
    this.initComponents()
  }

  initGlobals(store) {
    this.store = store
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.display
  }

  initProperties() {
    this.canvas = this.store.get('canvas')
    this.cells = this.store.get('cells')
    this.dimensions = this.store.get('dimensions')
  }

  initComponents() {
    this.initRenderer()
    this.initScene()
    this.initDevTools()
  }

  initRenderer() {
    this.renderer = new Renderer(this)
    this.gl = this.renderer.gl
    this.handleRendererCompatibility()
  }

  handleRendererCompatibility() {
    const media = this.globalConfig.media
    if (!media?.enabled) return

    // S3TC (DDS) is supported on desktop GPUs (Nvidia / AMD / Intel).
    // On mobile devices (Android / iOS) where S3TC is not available, we use
    // the universal JPEG texture atlas (/media/low/jpg/0.jpg) which is supported
    // everywhere without requiring proprietary compressed texture extensions.
    // Note: KTX (ETC) is excluded because .ktx files are not distributed in media assets.
    if (!this.gl.getExtension('WEBGL_compressed_texture_s3tc')) {
      media.compressedFormatsSupported = false
      media.compressionFormat = 'jpg'
      console.log(
        '[Voroforce] S3TC not supported on this device/browser. Using JPEG media grid atlas.',
      )
      return
    }

    media.compressedFormatsSupported = true
    media.compressionFormat = 'dds'
  }

  initScene() {
    this.scene = new Scene(this)
  }

  initDevTools() {
    this.handleDevTools = ({ value: devTools }) => {
      if (!devTools) return
      setupDevTools(devTools, this, this.config)
    }
    this.store.addEventListener('devTools', this.handleDevTools)
  }

  resize(dimensions) {
    this.renderer.resize(dimensions)
    this.scene.resize(dimensions)
  }

  update() {
    if (this.renderer?.contextLost) return
    this.scene.update()
    this.renderer.update()
  }

  getPositionCellIndices(position) {
    return this.scene.getPositionCellIndices(position)
  }

  dispose() {
    this.renderer.dispose()
    this.scene.dispose()
    this.store.removeEventListener('devTools', this.handleDevTools)
  }
}
