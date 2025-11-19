<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-slate-200">
      <div class="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Wordmark subtitle="Analisis Kualitas Public Speaking" size="lg" />
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden sm:block text-sm text-slate-600">
            {{ userName || 'User' }}
          </div>
          <div class="h-9 w-9 rounded-full bg-linear-to-br from-blue-600 to-violet-600 grid place-items-center text-white text-xs font-semibold">
            {{ userInitials }}
          </div>
          <button
            type="button"
            @click="handleLogout"
            class="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <main class="grow mx-auto max-w-6xl px-4 py-6 w-full">
      <div class="flex justify-center mb-4">
        <div class="segmented w-full max-w-md">
          <button
            class="segmented-btn"
            :data-active="mainTab==='analysis'"
            @click="mainTab='analysis'"
          >
            Analisis
          </button>
          <button
            class="segmented-btn"
            :data-active="mainTab==='history'"
            @click="mainTab='history'"
          >
            Riwayat
          </button>
        </div>
      </div>

      <div v-show="mainTab==='analysis'" class="card p-6">
        <h2 class="text-lg font-semibold">Rekam atau Upload Public Speaking Anda</h2>
        <p class="text-sm text-slate-500">
          Pilih untuk merekam langsung atau upload file audio yang sudah ada
        </p>

        <div class="flex justify-center">
          <div class="segmented w-full max-w-xl mt-6 mb-6">
            <button class="segmented-btn" :data-active="activeTab==='record'" @click="activeTab='record'">
              <span class="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" stroke="currentColor" stroke-width="1.8" />
                  <path d="M5 11v1a7 7 0 0 0 14 0v-1" stroke="currentColor" stroke-width="1.8" />
                  <path d="M12 19v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                Rekam Langsung
              </span>
            </button>
            <button class="segmented-btn" :data-active="activeTab==='upload'" @click="activeTab='upload'">
              <span class="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16V4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M8 8l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                Upload File
              </span>
            </button>
          </div>
        </div>

        <section v-show="activeTab==='record'" class="max-w-xl mx-auto">
          <div class="flex items-center justify-center gap-3">
            <button class="btn-primary" @click="isRecording ? stopRecording() : startRecording()" :disabled="recBusy">
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
            <span v-if="isRecording" class="text-sm text-slate-500">Merekam… {{ mmss(elapsedMs) }}</span>
          </div>

          <div v-if="recordedUrl" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs text-slate-500 mb-2">Pratinjau rekaman</p>
            <audio :src="recordedUrl" controls class="w-full"></audio>
            <div class="mt-3 flex items-center justify-center gap-3">
              <button class="btn-soft" @click="resetRecording">Hapus Rekaman</button>
              <button class="btn-primary" @click="submitWithRecording" :disabled="isLoading">Analisis Rekaman</button>
            </div>
          </div>

          <p v-if="recError" class="mt-3 text-sm text-center text-red-500">{{ recError }}</p>
        </section>

        <section v-show="activeTab==='upload'" class="max-w-xl mx-auto">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="text-center">
              <input ref="fileEl" type="file" accept="audio/*" class="sr-only" @change="handleFileChange" />

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
                  <button type="button" class="btn-soft" @click="openFilePicker">Ganti File</button>
                  <button type="button" class="btn-soft" @click="clearSelectedFile">Hapus</button>
                </template>
              </div>

              <p class="text-xs text-slate-500 mt-2">Format: .wav / .mp3 / .ogg / .webm, maks 20MB.</p>
            </div>

            <div class="flex justify-center" v-if="selectedFile">
              <button type="submit" class="btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Memproses…' : 'Analisis File' }}
              </button>
            </div>
          </form>

          <div v-if="error" class="mt-3 text-sm text-center text-red-500">{{ error }}</div>
        </section>

        <div v-if="result" class="mt-6 border-t border-slate-200 pt-4">
          <h3 class="text-base font-semibold mb-3 text-center">Hasil Analisis</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div class="rounded-lg border border-slate-200 p-3">
              <div class="text-xs text-slate-500">Skor</div>
              <div class="text-xl font-semibold">{{ formatNumber(result.analysis.score) }}</div>
            </div>
            <div class="rounded-lg border border-slate-200 p-3">
              <div class="text-xs text-slate-500">Kefasihan</div>
              <div class="text-base font-semibold">{{ toPercent(result.analysis.fluency) }}</div>
            </div>
            <div class="rounded-lg border border-slate-200 p-3">
              <div class="text-xs text-slate-500">Kejelasan</div>
              <div class="text-base font-semibold">{{ toPercent(result.analysis.clarity) }}</div>
            </div>
            <div class="rounded-lg border border-slate-200 p-3">
              <div class="text-xs text-slate-500">Kecepatan</div>
              <div class="text-base font-semibold">{{ toPercent(result.analysis.speed) }}</div>
            </div>
          </div>
          <div class="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
            {{ result.analysis.feedback }}
          </div>
        </div>
      </div>

      <div v-show="mainTab==='history'" class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold">Riwayat Analisis</h2>
            <p class="text-sm text-slate-500">
              Lihat kembali hasil analisis public speaking yang pernah Anda lakukan.
            </p>
          </div>
          <button
            type="button"
            class="btn-soft text-xs"
            @click="reloadHistory"
            :disabled="isLoadingHistory"
          >
            Muat ulang
          </button>
        </div>

        <div v-if="isLoadingHistory" class="py-8 text-center text-sm text-slate-500">
          Memuat riwayat...
        </div>
        <p v-else-if="historyError" class="text-sm text-red-500">
          {{ historyError }}
        </p>
        <div v-else-if="historyItems.length === 0" class="py-8 text-center text-sm text-slate-500">
          Belum ada analisis yang tersimpan.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in historyItems"
            :key="item.id"
            class="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4 flex flex-col gap-2"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div class="text-sm font-semibold">
                  Skor {{ formatNumber(item.score) }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ formatDateTime(item.created_at) }} • {{ item.audio_path || 'Tanpa nama' }}
                </div>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 bg-white">
                  <span>Kefasihan</span>
                  <span class="font-semibold">{{ toPercent(item.fluency) }}</span>
                </span>
                <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 bg-white">
                  <span>Kejelasan</span>
                  <span class="font-semibold">{{ toPercent(item.clarity) }}</span>
                </span>
                <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 bg-white">
                  <span>Kecepatan</span>
                  <span class="font-semibold">{{ toPercent(item.speed) }}</span>
                </span>
              </div>
            </div>
            <p v-if="item.feedback" class="text-xs text-slate-600">
              {{ item.feedback }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <footer class="border-t border-slate-200 bg-white/60 backdrop-blur">
      <div class="mx-auto max-w-6xl px-4 py-3 text-sm text-slate-600 text-center">
        © {{ year }} Speakra - Tingkatkan kemampuan public speaking Anda
      </div>
    </footer>
  </div>
</template>

<script>
import api from '../services/api'
import { supabase } from '../lib/supabaseClient'
import { logout as logoutService } from '../services/auth'
import Wordmark from '../components/Wordmark.vue';

export default {
  name: 'UploadEvaluationView',
  components: { Wordmark },
  data() {
    return {
      mainTab: 'analysis',
      activeTab: 'record',

      selectedFile: null,
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
      error: '',
      result: null,
      userName: '',
      year: new Date().getFullYear(),

      historyItems: [],
      isLoadingHistory: false,
      historyError: '',
      historyLoaded: false,
    }
  },
  computed: {
    userInitials() {
      const n = this.userName?.trim() || 'U'
      return n.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U'
    }
  },
  watch: {
    mainTab(newVal) {
      if (newVal === 'history' && !this.historyLoaded) {
        this.loadHistory()
      }
    }
  },
  async mounted() {
    const { data } = await supabase.auth.getUser()
    this.userName = data?.user?.user_metadata?.name || 'User'
  },
  methods: {
    async handleLogout() {
      try {
        await logoutService()
        this.$router.push('/login')
      } catch (e) {
        console.error('Gagal logout:', e)
      }
    },
    async startRecording() {
      this.recError = ''
      this.resetRecording()
      if (!navigator.mediaDevices?.getUserMedia) {
        this.recError = 'Browser tidak mendukung perekaman audio.'; return
      }
      try {
        this.recBusy = true
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
          : (MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '')
        this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        this.mediaRecorder.ondataavailable = (e) => { if (e.data?.size) this.recordedChunks.push(e.data) }
        this.mediaRecorder.onstop = () => {
          this.recordedBlob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' })
          this.recordedUrl = URL.createObjectURL(this.recordedBlob)
        }
        this.mediaRecorder.start()
        this.isRecording = true
        this.elapsedMs = 0
        this.timerId = setInterval(() => { this.elapsedMs += 100 }, 100)
      } catch {
        this.recError = 'Izin mikrofon ditolak atau perangkat tidak tersedia.'
      } finally {
        this.recBusy = false
      }
    },
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        try { this.mediaRecorder.requestData?.() } catch {}
        this.mediaRecorder.stop()
        this.mediaRecorder.stream.getTracks().forEach(t => t.stop())
        this.isRecording = false
        clearInterval(this.timerId); this.timerId = null
      }
    },
    resetRecording() {
      if (this.mediaRecorder && this.isRecording) this.stopRecording()
      this.recordedChunks = []; this.recordedBlob = null
      if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl)
      this.recordedUrl = ''; this.elapsedMs = 0
    },
    mmss(ms) {
      const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const r = s % 60
      return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`
    },

    openFilePicker() {
      this.$refs.fileEl?.click()
    },
    handleFileChange(e) {
      const file = e.target.files[0]
      this.error = ''; this.result = null
      if (!file) { this.selectedFile = null; return }
      const max = 20 * 1024 * 1024
      if (file.size > max) { this.error = 'Ukuran file maksimal 20MB.'; this.selectedFile = null; return }
      this.selectedFile = file
    },
    clearSelectedFile() {
      this.selectedFile = null
      if (this.$refs.fileEl) this.$refs.fileEl.value = ''
    },

    async submitFormData(formData) {
      this.isLoading = true; this.error = ''; this.result = null
      try {
        const res = await api.post('/evaluations', formData) // <- tanpa Content-Type
        this.result = res.data
      } catch (err) {
        this.error = err.response?.data?.error || err.response?.data?.detail || err.message || 'Terjadi kesalahan'
      } finally {
        this.isLoading = false
      }
    },
    async submitWithRecording() {
      this.error = ''
      try {
        const blob = await this.ensureBlobFromChunks()
        if (!blob || blob.size < 1024) {
          this.error = 'Rekaman terlalu pendek atau kosong. Coba rekam ulang.'
          return
        }
        const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([blob], `speakra-recording.${ext}`, { type: blob.type })
        const fd = new FormData()
        fd.append('audio', file)
        await this.submitFormData(fd)
      } catch (e) {
        this.error = e.message || 'Gagal menyiapkan rekaman.'
      }
    },
    async handleSubmit() {
      if (!this.selectedFile) { this.error = 'Silakan pilih file audio terlebih dahulu.'; return }
      const fd = new FormData(); fd.append('audio', this.selectedFile)
      await this.submitFormData(fd)
    },
    async ensureBlobFromChunks() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        await new Promise((resolve) => {
          const finalize = () => resolve()
          this.mediaRecorder.addEventListener('stop', finalize, { once: true })
          try { this.mediaRecorder.requestData?.() } catch {}
          this.mediaRecorder.stop()
        })
      }
      if (!this.recordedChunks?.length) {
        throw new Error('Rekaman kosong. Coba rekam ulang.')
      }
      const type = (this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0]
      return new Blob(this.recordedChunks, { type })
    },

    toPercent(v) { if (v == null) return '-'; return `${Math.round(v * 100)}%` },
    formatNumber(v) { if (v == null) return '-'; return Number(v).toFixed(1) },

    async loadHistory() {
      this.isLoadingHistory = true
      this.historyError = ''
      try {
        const res = await api.get('/evaluations', {
          params: { page: 1, limit: 10 },
        })
        this.historyItems = res.data?.items || []
        this.historyLoaded = true
      } catch (err) {
        this.historyError =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          'Gagal memuat riwayat'
      } finally {
        this.isLoadingHistory = false
      }
    },
    async reloadHistory() {
      this.historyLoaded = false
      await this.loadHistory()
    },
    formatDateTime(iso) {
      if (!iso) return '-'
      const d = new Date(iso)
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
  beforeUnmount() {
    if (this.timerId) clearInterval(this.timerId)
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl)
    if (this.mediaRecorder?.stream) this.mediaRecorder.stream.getTracks().forEach(t => t.stop())
  }
}
</script>
