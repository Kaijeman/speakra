<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-2xl grid grid-cols-1 gap-8">
      <div class="mx-auto">
        <div class="flex flex-col items-center gap-2 mb-6">
          <Wordmark size="xl" />
          <div class="text-center">
            <h1 class="text-2xl font-semibold">Daftar Akun Baru</h1>
            <p class="text-slate-500">Mulai perjalanan public speaking Anda</p>
          </div>
        </div>
      </div>

      <div class="card p-6 max-w-xl mx-auto w-full">
        <h2 class="text-lg font-semibold mb-1">Buat Akun Speakra</h2>
        <p class="text-sm text-slate-500 mb-4">Isi data di bawah untuk membuat akun baru</p>

        <form @submit.prevent="handleRegister" class="space-y-3">
          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="1.8"/><path d="M6 20a6 6 0 0 1 12 0" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model.trim="name" class="field-input" type="text" placeholder="Sagab Agoy" autocomplete="name" />
          </div>

          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6l8 6 8-6" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model.trim="email" class="field-input" type="email" placeholder="nama@email.com" autocomplete="email" />
          </div>

          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model="password" class="field-input" type="password" placeholder="Password" autocomplete="new-password" />
          </div>

          <div class="field">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            <input v-model="password2" class="field-input" type="password" placeholder="Konfirmasi password" autocomplete="new-password" />
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            {{ loading ? 'Mendaftarkan...' : 'Daftar' }}
          </button>
        </form>

        <p v-if="error" class="mt-3 text-sm text-red-500">{{ error }}</p>

        <div v-if="waiting" class="mt-4 p-3 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
          Menunggu verifikasi email.
        </div>

        <p class="mt-4 text-sm text-slate-600">
          Sudah punya akun?
          <router-link to="/login" class="text-indigo-600 hover:underline">Masuk di sini</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { registerWithEmail } from '../services/auth'
import Wordmark from '../components/Wordmark.vue'

export default {
  name: 'RegisterView',
  components: { Wordmark },
  data() {
    return { name: '', email: '', password: '', password2: '', loading: false, error: '', waiting: false }
  },
  methods: {
    async handleRegister() {
      this.error = ''; this.waiting = false
      if (!this.name || !this.email || !this.password) {
        this.error = 'Nama, email, dan password wajib diisi.'; return
      }
      if (this.password !== this.password2) {
        this.error = 'Password yang diberikan tidak sama.'; return
      }
      this.loading = true
      try {
        await registerWithEmail(this.name, this.email, this.password)
        this.waiting = true
        setTimeout(() => this.$router.push('/login'), 3000)
      } catch (e) {
        this.error = e.message || 'Terjadi kesalahan saat registrasi.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
