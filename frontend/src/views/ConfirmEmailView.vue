<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-2xl grid grid-cols-1 gap-8">
      <div class="mx-auto">
        <div class="flex flex-col items-center gap-2 mb-6">
          <Wordmark size="xl" />
          <div class="text-center">
            <h1 class="text-2xl font-semibold">
              {{ isError ? 'Verifikasi Gagal' : 'Email Terverifikasi' }}
            </h1>
            <p class="text-slate-500">
              {{ isError ? 'Tautan verifikasi tidak valid atau kedaluwarsa.' : 'Akun Anda telah berhasil dikonfirmasi.' }}
            </p>
          </div>
        </div>
      </div>

      <div class="card p-6 max-w-xl mx-auto w-full text-center">
        <div v-if="isProcessing" class="space-y-2">
          <div class="mx-auto h-10 w-10 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin"></div>
          <p class="text-sm text-slate-600">Memproses tautan verifikasi…</p>
        </div>

        <div v-else>
          <p class="text-sm text-slate-600">
            {{ isError
              ? (errorMessage || 'Silakan minta kirim ulang email verifikasi dan coba lagi.')
              : 'Silakan masuk untuk mulai menggunakan Speakra.' }}
          </p>

          <div class="mt-6 flex items-center justify-center gap-3">
            <router-link to="/login" class="btn-primary">
              Masuk ke Speakra
            </router-link>
            <router-link to="/register" class="btn-soft">
              Daftar ulang
            </router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabaseClient'
import Wordmark from '../components/Wordmark.vue';

export default {
  name: 'ConfirmEmailView',
  components: { Wordmark },
  data() {
    return {
      isProcessing: true,
      isError: false,
      errorMessage: '',
    }
  },
  async mounted() {
    try {
      const hash = window.location.hash?.startsWith('#')
        ? window.location.hash.substring(1)
        : ''
      const hp = new URLSearchParams(hash)
      const qp = new URLSearchParams(window.location.search)

      const errDesc = hp.get('error_description') || qp.get('error_description')
      if (errDesc) {
        this.isError = true
        this.errorMessage = errDesc
        this.isProcessing = false
        return
      }

      const access_token = hp.get('access_token') || qp.get('access_token')
      const refresh_token = hp.get('refresh_token') || qp.get('refresh_token')

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          this.isError = true
          this.errorMessage = error.message
        }
      }
    } catch (e) {
      this.isError = true
      this.errorMessage = e.message
    } finally {
      this.isProcessing = false
    }
  },
}
</script>
