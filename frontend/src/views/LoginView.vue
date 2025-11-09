<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <h1 class="text-2xl font-semibold mb-2">
        Masuk ke Speakra
      </h1>
      <p class="text-sm text-slate-400 mb-4">
        Masuk untuk mengakses dan melacak hasil analisis public speaking Anda.
      </p>

      <form @submit.prevent="handleLogin" class="space-y-3">
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model.trim="email"
            type="email"
            class="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
            autocomplete="email"
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-sm font-medium transition"
        >
          {{ loading ? 'Memverifikasi...' : 'Masuk' }}
        </button>
      </form>

      <p v-if="error" class="mt-3 text-sm text-red-400">
        {{ error }}
      </p>

      <p class="mt-4 text-xs text-slate-400">
        Belum punya akun?
        <router-link to="/register" class="text-indigo-400 hover:underline">
          Daftar sekarang
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { loginWithEmail } from '../services/auth'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: '',
    }
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
        const result = await loginWithEmail(this.email, this.password)

        if (!result || !result.session) {
          this.error = 'Gagal mendapatkan sesi login.'
          return
        }

        this.$router.push('/')
      } catch (err) {
        this.error = err.message || 'Email atau password salah.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
