import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import fetch from 'node-fetch'

/**
 * Create a sticker from buffer or URL
 * @param {Buffer|string} img - Image buffer or URL
 * @param {string} url - URL if img is not provided
 * @param {string} packname - Sticker pack name
 * @param {string} author - Sticker author
 * @returns {Promise<Buffer>} Sticker buffer
 */
export async function sticker(img, url, packname = global.packname || 'NEXUS-MD', author = global.author || 'Bot') {
  let buffer
  if (Buffer.isBuffer(img)) {
    buffer = img
  } else if (url) {
    const res = await fetch(url)
    buffer = await res.buffer()
  } else {
    throw new Error('No image buffer or URL provided')
  }
  
  const sticker = new Sticker(buffer, {
    pack: packname,
    author: author,
    type: StickerTypes.DEFAULT,
    quality: 80,
  })
  
  return await sticker.toBuffer()
}

/**
 * Create a cropped sticker
 */
export async function stickerCrop(img, url, packname = global.packname || 'NEXUS-MD', author = global.author || 'Bot') {
  let buffer
  if (Buffer.isBuffer(img)) {
    buffer = img
  } else if (url) {
    const res = await fetch(url)
    buffer = await res.buffer()
  } else {
    throw new Error('No image buffer or URL provided')
  }
  
  const sticker = new Sticker(buffer, {
    pack: packname,
    author: author,
    type: StickerTypes.CROPPED,
    quality: 80,
  })
  
  return await sticker.toBuffer()
}

export default { sticker, stickerCrop }
