<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold">Riwayat Analisis</h2>
        <p class="text-sm text-slate-500">
          Lihat kembali hasil analisis public speaking yang pernah Anda lakukan.
        </p>
      </div>
      <button type="button" class="btn-soft text-xs" @click="reloadHistory" :disabled="isLoadingHistory">
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
      <div v-for="item in historyItems" :key="item.id" class="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4 flex flex-col gap-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div class="text-sm font-semibold">
              Skor {{ formatNumber(item.score) }}
            </div>
            <div class="text-xs text-slate-500">
              {{ formatDateTime(item.created_at) }} •
              {{ item.audio_path || 'Tanpa nama' }}
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
</template>

<script>
import api from '../services/api'

export default {
  name: 'HistoryPanel',
  data() {
    return {
      historyItems: [],
      isLoadingHistory: false,
      historyError: '',
      historyLoaded: false,
    }
  },
  async mounted() {
    await this.loadHistory()
  },
  methods: {
    async loadHistory() {
      if (this.historyLoaded) return
      this.isLoadingHistory = true
      this.historyError = ''
      try {
        const res = await api.get('/evaluations', {
          params: { page: 1, limit: 10 },
        })
        this.historyItems = res.data?.items || []
        this.historyLoaded = true
      } catch (err) {
        console.error(err)
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
