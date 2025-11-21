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
          <button type="button" @click="handleLogout" class="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
            Keluar
          </button>
        </div>
      </div>
    </header>

    <main class="grow mx-auto max-w-6xl px-4 py-6 w-full">
      <div class="flex justify-center mb-4">
        <div class="segmented w-full max-w-md">
          <button class="segmented-btn" :data-active="mainTab==='analysis'" @click="mainTab='analysis'">
            Analisis
          </button>
          <button class="segmented-btn" :data-active="mainTab==='history'" @click="mainTab='history'">
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

        <RecordPanel v-if="activeTab === 'record'" @analysis-success="handleAnalysisSuccess" @analysis-error="handleAnalysisError"/>

        <UploadPanel v-if="activeTab === 'upload'" @analysis-success="handleAnalysisSuccess" @analysis-error="handleAnalysisError"/>

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
        <div v-if="error" class="mt-3 text-sm text-center text-red-500">
          {{ error }}
        </div>
      </div>

      <HistoryPanel v-if="mainTab === 'history'" />
    </main>

    <footer class="border-t border-slate-200 bg-white/60 backdrop-blur">
      <div class="mx-auto max-w-6xl px-4 py-3 text-sm text-slate-600 text-center">
        © {{ year }} Speakra - Tingkatkan kemampuan public speaking Anda
      </div>
    </footer>
  </div>
</template>

<script>
import { supabase } from '../lib/supabaseClient'
import { logout as logoutService } from '../services/auth'
import Wordmark from '../components/Wordmark.vue'
import RecordPanel from '../components/RecordPanel.vue'
import UploadPanel from '../components/UploadPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'

export default {
  name: 'UploadEvaluationView',
  components: { 
    Wordmark,
    RecordPanel,
    UploadPanel,
    HistoryPanel,
  },
  data() {
    return {
      mainTab: 'analysis',
      activeTab: 'record',
      result: null,
      error: '',
      userName: '',
      year: new Date().getFullYear(),
    }
  },
  computed: {
    userInitials() {
      const n = this.userName?.trim() || 'U'
      return n.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U'
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
    handleAnalysisSuccess(analysisRaw) {
      this.result = analysisRaw
      this.error = ''
    },
    handleAnalysisError(message) {
      this.error =
        message ||
        'Gagal menganalisis audio. Coba lagi beberapa saat atau gunakan file lain.'
      this.result = null
    },
    toPercent(v) { 
      if (v == null) return '-' 
      return `${Math.round(v * 100)}%` 
    },
    formatNumber(v) { 
      if (v == null) return '-'
      return Number(v).toFixed(1) 
    },
  },
}
</script>
