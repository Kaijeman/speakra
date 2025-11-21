<template>
  <section class="max-w-xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="text-center">
        <input ref="fileEl" type="file" accept="audio/*" class="sr-only" @change="handleFileChange"/>

        <div v-if="selectedFile" class="mb-2 text-sm font-medium text-slate-700">
          {{ selectedFile.name }}
        </div>

        <div class="flex items-center justify-center gap-3">
          <button v-if="!selectedFile" type="button" class="btn-primary" @click="openFilePicker">
            <span class="inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M8 8l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Pilih File
            </span>
          </button>

          <template v-else>
            <button type="button" class="btn-soft" @click="openFilePicker">
              Ganti File
            </button>
            <button type="button" class="btn-soft" @click="clearSelectedFile">
              Hapus
            </button>
          </template>
        </div>

        <p class="text-xs text-slate-500 mt-2">
          Format: .wav / .mp3 / .ogg / .webm, maks 20MB.
        </p>
      </div>

      <div class="flex justify-center" v-if="selectedFile">
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Memproses…' : 'Analisis File' }}
        </button>
      </div>
    </form>

    <div v-if="error" class="mt-3 text-sm text-center text-red-500">
      {{ error }}
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'UploadPanel',
  emits: ['analysis-success', 'analysis-error'],
  data() {
    return {
      selectedFile: null,
      isLoading: false,
      error: '',
    }
  },
  methods: {
    openFilePicker() {
      this.$refs.fileEl?.click()
    },
    handleFileChange(e) {
      const file = e.target.files[0]
      this.error = ''
      if (!file) {
        this.selectedFile = null
        return
      }
      const max = 20 * 1024 * 1024
      if (file.size > max) {
        this.error = 'Ukuran file maksimal 20MB.'
        this.selectedFile = null
        return
      }
      this.selectedFile = file
    },
    clearSelectedFile() {
      this.selectedFile = null
      if (this.$refs.fileEl) {
        this.$refs.fileEl.value = ''
      }
    },
    async handleSubmit() {
      if (!this.selectedFile) {
        this.error = 'Silakan pilih file audio terlebih dahulu.'
        return
      }

      this.isLoading = true
      this.error = ''

      try {
        const fd = new FormData()
        fd.append('audio', this.selectedFile)

        const res = await api.post('/evaluations', fd)
        this.$emit('analysis-success', res.data)
      } catch (err) {
        console.error(err)
        const message =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          'Gagal menganalisis file'
        this.$emit('analysis-error', message)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>
