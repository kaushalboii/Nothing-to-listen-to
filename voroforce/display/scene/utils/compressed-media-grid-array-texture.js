import { Texture } from 'ogl'

export class CompressedMediaGridArrayTexture extends Texture {
  constructor(gl, args) {
    let ext
    let internalFormat
    if (args.compressionFormat === 'etc') {
      ext = gl.getExtension('WEBGL_compressed_texture_etc')
      if (!ext) {
        console.warn('ETC texture compression not supported')
      }
      internalFormat = ext?.COMPRESSED_RGB_ETC1_WEBGL
    } else if (args.compressionFormat === 'ktx') {
      ext = gl.getExtension('WEBGL_compressed_texture_etc')
      if (!ext) {
        console.warn('ETC texture compression not supported')
      }
      internalFormat = ext?.COMPRESSED_RGB8_ETC2
    } else {
      ext = gl.getExtension('WEBGL_compressed_texture_s3tc')
      if (!ext) {
        console.warn('S3TC texture compression not supported')
      }
      internalFormat = ext?.COMPRESSED_RGB_S3TC_DXT1_EXT
    }

    if (!ext || !internalFormat) {
      super(gl, {
        ...args,
        target: gl.TEXTURE_2D_ARRAY,
        internalFormat: gl.RGBA8,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      })
      this.width = args.width || 1980
      this.height = args.height || 1980
      this.length = args.length || 1
      this.compressedTexExt = null
      this.internalFormat = gl.RGBA8
      this.bind()
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      let allocated = false
      try {
        gl.texStorage3D(
          gl.TEXTURE_2D_ARRAY,
          1,
          gl.RGBA8,
          this.width,
          this.height,
          this.length,
        )
        allocated = true
      } catch (e) {
        console.warn('[CompressedMediaGridArrayTexture] texStorage3D failed, trying texImage3D:', e)
      }
      if (!allocated) {
        try {
          gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            gl.RGBA8,
            this.width,
            this.height,
            this.length,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
          )
        } catch (e) {
          console.error('[CompressedMediaGridArrayTexture] Texture allocation failed:', e)
        }
      }
      return
    }

    super(gl, {
      ...args,
      target: gl.TEXTURE_2D_ARRAY,
      internalFormat,

      // These are the key parameters for bilinear filtering
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,

      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,

      // If using mipmaps
      // generateMipmaps: true, // For some compressed formats
      // minFilter: gl.LINEAR_MIPMAP_LINEAR, // Trilinear filtering with mipmaps
    })

    this.width = args.width || 1980
    this.height = args.height || 1980
    this.length = args.length || 1
    this.compressedTexExt = ext
    this.internalFormat = internalFormat

    this.bind()

    // Initialize the texture storage with aligned dimensions
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1, // mipmap levels
      internalFormat,
      this.width,
      this.height,
      this.length, // (number of layers)
    )
  }

  bind() {
    // Already bound to active texture unit
    if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id)
      return
    this.gl.bindTexture(this.target, this.texture)
    this.glState.textureUnits[this.glState.activeTextureUnit] = this.id
  }

  pendingLayerUpdates = []

  update(textureUnit = 0) {
    // Make sure that texture is bound to its texture unit
    if (
      this.pendingLayerUpdates.length > 0 ||
      this.glState.textureUnits[textureUnit] !== this.id
    ) {
      // set active texture unit to perform texture functions
      this.gl.renderer.activeTexture(textureUnit)
      this.bind()

      if (this.flipY !== this.glState.flipY) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY)
        this.glState.flipY = this.flipY
      }

      if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
        this.gl.pixelStorei(
          this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
          this.premultiplyAlpha,
        )
        this.glState.premultiplyAlpha = this.premultiplyAlpha
      }

      if (this.unpackAlignment !== this.glState.unpackAlignment) {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment)
        this.glState.unpackAlignment = this.unpackAlignment
      }

      if (this.minFilter !== this.state.minFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MIN_FILTER,
          this.minFilter,
        )
        this.state.minFilter = this.minFilter
      }

      if (this.magFilter !== this.state.magFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MAG_FILTER,
          this.magFilter,
        )
        this.state.magFilter = this.magFilter
      }

      if (this.wrapS !== this.state.wrapS) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS)
        this.state.wrapS = this.wrapS
      }

      if (this.wrapT !== this.state.wrapT) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT)
        this.state.wrapT = this.wrapT
      }

      if (this.wrapR !== this.state.wrapR) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR)
        this.state.wrapR = this.wrapR
      }

      if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
        this.gl.texParameterf(
          this.target,
          this.gl.renderer.getExtension('EXT_texture_filter_anisotropic')
            .TEXTURE_MAX_ANISOTROPY_EXT,
          this.anisotropy,
        )
        this.state.anisotropy = this.anisotropy
      }
    }

    if (this.generateMipmaps) {
      this.gl.generateMipmap(this.target)
    }

    this.pendingLayerUpdates.forEach(({ index, bytes }) => {
      if (this.compressedTexExt && this.internalFormat !== this.gl.RGBA8) {
        this.gl.compressedTexSubImage3D(
          this.gl.TEXTURE_2D_ARRAY,
          0,
          0,
          0,
          index,
          this.width,
          this.height,
          1,
          this.internalFormat,
          bytes,
        )
      } else {
        // Standard WebGL 2 texSubImage3D for uncompressed JPEG atlas (mobile fallback)
        const w = bytes.naturalWidth || bytes.width || this.width || 1980
        const h = bytes.naturalHeight || bytes.height || this.height || 1980
        const gl = this.gl

        // Explicitly bind this texture to TEXTURE_2D_ARRAY to ensure gl operations hit it
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)
        this.glState.flipY = false
        this.glState.premultiplyAlpha = false
        this.glState.unpackAlignment = 4

        let success = false
        try {
          if (typeof ImageBitmap !== 'undefined' && bytes instanceof ImageBitmap) {
            gl.texSubImage3D(
              gl.TEXTURE_2D_ARRAY,
              0,
              0,
              0,
              index,
              w,
              h,
              1,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              bytes,
            )
            if (gl.getError() === gl.NO_ERROR) {
              success = true
            }
          }
        } catch (err) {
          console.warn('[CompressedMediaGridArrayTexture] Direct ImageBitmap upload failed:', err)
        }

        if (!success) {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')
            ctx.drawImage(bytes, 0, 0, w, h)
            const imgData = ctx.getImageData(0, 0, w, h)
            gl.texSubImage3D(
              gl.TEXTURE_2D_ARRAY,
              0,
              0,
              0,
              index,
              w,
              h,
              1,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              new Uint8Array(imgData.data.buffer),
            )
            console.log('[CompressedMediaGridArrayTexture] Uploaded via canvas pixel buffer')
          } catch (e2) {
            console.error('[CompressedMediaGridArrayTexture] All upload methods failed:', e2)
          }
        }
      }
    })

    this.pendingLayerUpdates = []
    this.needsUpdate = false
  }

  prepareLayerUpdate(index, bytes) {
    this.pendingLayerUpdates.push({
      index,
      bytes,
    })
    this.needsUpdate = true
  }
}
