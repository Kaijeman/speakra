<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-2xl grid grid-cols-1 gap-8">
      <div class="mx-auto">
        <div class="flex flex-col items-center gap-2 mb-6">
          <Wordmark size="xl" />
          <div class="text-center">
            <h1 class="text-2xl font-semibold">Selamat Datang di Speakra</h1>
            <p class="text-slate-500">Analisis Kualitas Public Speaking Berbasis AI</p>
          </div>
        </div>
      </div>

      <div class="card p-6 max-w-xl mx-auto w-full">
        <h2 class="text-lg font-semibold mb-1">Masuk ke Akun Anda</h2>
        <p class="text-sm text-slate-500 mb-4">Masukkan email dan password untuk melanjutkan.</p>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6l8 6 8-6" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model.trim="email" type="email" class="field-input" placeholder="nama@email.com" autocomplete="email" />
          </div>

          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model="password" type="password" class="field-input" placeholder="Password" autocomplete="current-password" />
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            {{ loading ? 'Memverifikasi…' : 'Masuk' }}
          </button>
        </form>

        <p v-if="error" class="mt-3 text-sm text-red-500">{{ error }}</p>

        <p class="mt-4 text-sm text-slate-600">
          Belum punya akun?
          <router-link to="/register" class="text-indigo-600 hover:underline">Daftar sekarang</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { loginWithEmail } from '../services/auth'
import Wordmark from '../components/Wordmark.vue';

export default {
  name: 'LoginView',
  components: { Wordmark },
  data() {
    return { email: '', password: '', loading: false, error: '' }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      if (!this.email || !this.password) {
        this.error = 'Email dan password wajib diisi.'
        return
      }
      this.loading = true
      try {
        const res = await loginWithEmail(this.email, this.password)
        if (!res || !res.session) {
          this.error = 'Gagal melakukan sesi login.'
          return
        }
        this.$router.push('/')
      } catch (e) {
        this.error = e.message || 'Email atau password salah.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
