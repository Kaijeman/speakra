<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
    <div class="w-full max-w-xl bg-slate-900/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-slate-800">
      <h1 class="text-2xl font-semibold mb-2">
        Speakra – Analisis Kualitas Public Speaking
      </h1>
      <p class="text-sm text-slate-400 mb-4">
        Unggah rekaman suara Anda untuk dianalisis secara otomatis oleh Speakra.
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">
            File Audio
          </label>
          <input
            type="file"
            accept="audio/*"
            @change="handleFileChange"
            class="block w-full text-sm text-slate-200
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:bg-indigo-600 file:text-white
                   hover:file:bg-indigo-500
                   cursor-pointer bg-slate-900/70 border border-slate-700 rounded-md"
          />
          <p class="text-xs text-slate-500 mt-1">
            Format disarankan: .wav / .mp3, maksimal 20MB.
          </p>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !selectedFile"
          class="w-full py-2.5 rounded-md text-sm font-medium
                 bg-indigo-600 hover:bg-indigo-500
                 disabled:bg-slate-700 disabled:text-slate-400
                 transition"
        >
          {{ isLoading ? 'Memproses rekaman...' : 'Analisis dengan Speakra' }}
        </button>
      </form>

      <div v-if="error" class="mt-4 text-sm text-red-400">
        {{ error }}
      </div>

      <div v-if="result" class="mt-6 border-t border-slate-800 pt-4 space-y-2">
        <h2 class="text-lg font-semibold">
          Hasil Analisis
        </h2>
        <p class="text-sm text-slate-400">
          ID Evaluasi: {{ result.evaluation_id }}
        </p>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-slate-900/80 rounded-md p-3 border border-slate-800">
            <div class="text-xs text-slate-500">Skor Keseluruhan</div>
            <div class="text-xl font-semibold">
              {{ formatNumber(result.analysis.score) }}
            </div>
          </div>
          <div class="bg-slate-900/80 rounded-md p-3 border border-slate-800">
            <div class="text-xs text-slate-500">Kefasihan</div>
            <div class="text-base font-semibold">
              {{ toPercent(result.analysis.fluency) }}
            </div>
          </div>
          <div class="bg-slate-900/80 rounded-md p-3 border border-slate-800">
            <div class="text-xs text-slate-500">Kejelasan</div>
            <div class="text-base font-semibold">
              {{ toPercent(result.analysis.clarity) }}
            </div>
          </div>
          <div class="bg-slate-900/80 rounded-md p-3 border border-slate-800">
            <div class="text-xs text-slate-500">Kepercayaan Diri</div>
            <div class="text-base font-semibold">
              {{ toPercent(result.analysis.confidence) }}
            </div>
          </div>
        </div>
        <div class="mt-3 bg-slate-900/80 rounded-md p-3 border border-slate-800 text-sm text-slate-200 whitespace-pre-line">
          {{ result.analysis.feedback }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'UploadEvaluationView',
  data() {
    return {
      selectedFile: null,
      isLoading: false,
      error: '',
      result: null,
    }
  },
  methods: {
    handleFileChange(event) {
      const file = event.target.files[0]
      this.error = ''
      this.result = null

      if (!file) {
        this.selectedFile = null
        return
      }

      const maxSize = 20 * 1024 * 1024
      if (file.size > maxSize) {
        this.error = 'Ukuran file maksimal 20MB.'
        this.selectedFile = null
        return
      }

      this.selectedFile = file
    },
    async handleSubmit() {
      if (!this.selectedFile) {
        this.error = 'Silakan pilih file audio terlebih dahulu.'
        return
      }

      this.isLoading = true
      this.error = ''
      this.result = null

      try {
        const formData = new FormData()
        formData.append('audio', this.selectedFile)

        const response = await api.post('/evaluations', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        this.result = response.data
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          'Terjadi kesalahan saat menghubungi server Speakra.'
        this.error = msg
      } finally {
        this.isLoading = false
      }
    },
    toPercent(value) {
      if (value == null) return '-'
      return `${Math.round(value * 100)}%`
    },
    formatNumber(value) {
      if (value == null) return '-'
      return Number(value).toFixed(1)
    },
  },
}
</script>
