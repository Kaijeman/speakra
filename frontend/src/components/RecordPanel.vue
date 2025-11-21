<template>
  <section class="max-w-xl mx-auto">
    <div class="flex items-center justify-center gap-3">
      <button
        class="btn-primary"
        @click="isRecording ? stopRecording() : startRecording()"
        :disabled="recBusy || isLoading"
      >
        <span class="inline-flex items-center gap-2">
          <svg v-if="!isRecording" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="7" y="6" width="10" height="12" rx="2" fill="currentColor" />
          </svg>
          {{ isRecording ? 'Stop Rekam' : 'Mulai Rekam' }}
        </span>
      </button>
      <span v-if="isRecording" class="text-sm text-slate-500">
        Merekam… {{ mmss(elapsedMs) }}
      </span>
    </div>

    <div v-if="recordedUrl" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p class="text-xs text-slate-500 mb-2">Pratinjau rekaman</p>
      <audio :src="recordedUrl" controls class="w-full"></audio>
      <div class="mt-3 flex items-center justify-center gap-3">
        <button class="btn-soft" type="button" @click="resetRecording">
          Hapus Rekaman
        </button>
        <button class="btn-primary" type="button" @click="submitWithRecording" :disabled="isLoading">
          {{ isLoading ? 'Memproses…' : 'Analisis Rekaman' }}
        </button>
      </div>
    </div>

    <p v-if="recError" class="mt-3 text-sm text-center text-red-500">
      {{ recError }}
    </p>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'RecordPanel',
  emits: ['analysis-success', 'analysis-error'],
  data() {
    return {
      isRecording: false,
      recBusy: false,
      mediaRecorder: null,
      recordedChunks: [],
      recordedBlob: null,
      recordedUrl: '',
      recError: '',
      elapsedMs: 0,
      timerId: null,
      isLoading: false,
    }
  },
  methods: {
    async startRecording() {
      this.recError = ''
      this.resetRecording()

      if (!navigator.mediaDevices?.getUserMedia) {
        this.recError = 'Browser tidak mendukung perekaman audio.'
        return
      }

      try {
        this.recBusy = true

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : ''

        this.mediaRecorder = new MediaRecorder(
          stream, 
          mimeType ? { mimeType } : undefined
        )

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data?.size) this.recordedChunks.push(e.data)
        }

        this.mediaRecorder.onstop = () => {
          this.recordedBlob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder.mimeType || 'audio/webm',
          })
          this.recordedUrl = URL.createObjectURL(this.recordedBlob)
        }

        this.mediaRecorder.start()
        this.isRecording = true
        this.elapsedMs = 0
        this.timerId = setInterval(() => {
          this.elapsedMs += 100
        }, 100)
      } catch (err) {
        console.error(err)
        this.recError = 'Izin mikrofon ditolak atau perangkat tidak tersedia.'
      } finally {
        this.recBusy = false
      }
    },
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        try {
          this.mediaRecorder.requestData?.()
        } catch (e) {
          console.warn(e)
        }
        this.mediaRecorder.stop()
        this.mediaRecorder.stream.getTracks().forEach((t) => t.stop())
        this.isRecording = false
        if (this.timerId) {
          clearInterval(this.timerId)
          this.timerId = null
        }
      }
    },
    resetRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.stopRecording()
      }
      this.recordedChunks = []
      this.recordedBlob = null
      if (this.recordedUrl) {
        URL.revokeObjectURL(this.recordedUrl)
      }
      this.recordedUrl = ''
      this.elapsedMs = 0
    },
    mmss(ms) {
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      const r = s % 60
      return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    },
    async ensureBlobFromChunks() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        await new Promise((resolve) => {
          const finalize = () => resolve()
          this.mediaRecorder.addEventListener('stop', finalize, { once: true })
          try {
            this.mediaRecorder.requestData?.()
          } catch (e) {
            console.warn(e)
          }
          this.mediaRecorder.stop()
        })
      }

      if (!this.recordedChunks?.length) {
        throw new Error('Rekaman kosong. Coba rekam ulang.')
      }

      const type = (this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0]
      return new Blob(this.recordedChunks, { type })
    },
    async submitWithRecording() {
      this.recError = ''
      this.isLoading = true
      try {
        const blob = await this.ensureBlobFromChunks()
        if (!blob || blob.size < 1024) {
          this.recError = 'Rekaman terlalu pendek atau kosong. Coba rekam ulang.'
          return
        }

        const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([blob], `speakra-recording.${ext}`, { type: blob.type })
        const fd = new FormData()
        fd.append('audio', file)

        const res = await api.post('/evaluations', fd)
        this.$emit('analysis-success', res.data)
      } catch (err) {
        console.error(err)
        const message =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          'Gagal menganalisis rekaman'
        this.$emit('analysis-error', message)
      } finally {
        this.isLoading = false
      }
    },
  },
  beforeUnmount() {
    if (this.timerId) clearInterval(this.timerId)
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl)
    if (this.mediaRecorder?.stream) {
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop())
    }
  },
}
</script>
