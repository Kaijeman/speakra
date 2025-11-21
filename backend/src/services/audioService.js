import fs from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export async function bufferToTempFile(buffer, ext = '.bin') {
  const { file } = await import('tmp-promise')
  const tmp = await file({ postfix: ext })
  await fs.writeFile(tmp.path, buffer)
  return { path: tmp.path, cleanup: tmp.cleanup }
}

export async function convertToWav(buffer, mime) {
  const inExt = mime?.includes('webm') ? '.webm'
              : mime?.includes('ogg')  ? '.ogg'
              : mime?.includes('mpeg') ? '.mp3'
              : mime?.includes('wav')  ? '.wav'
              : '.bin'

  const { path: inPath, cleanup: cleanIn } = await bufferToTempFile(buffer, inExt)
  const { file } = await import('tmp-promise')
  const outTmp = await file({ postfix: '.wav' })

  await new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', resolve)
      .save(outTmp.path)
  })

  const outBuf = await fs.readFile(outTmp.path)
  await fs.unlink(outTmp.path).catch(() => {})
  await cleanIn().catch(() => {})
  return outBuf
}
