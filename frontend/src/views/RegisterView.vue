<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <h1 class="text-2xl font-semibold mb-2">
        Daftar Akun Speakra
      </h1>
      <p class="text-sm text-slate-400 mb-4">
        Buat akun untuk menyimpan dan mengakses riwayat analisis public speaking Anda.
      </p>

      <form @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="block text-sm mb-1">Nama</label>
          <input
            v-model.trim="name"
            type="text"
            class="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
            autocomplete="name"
          />
        </div>

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
            autocomplete="new-password"
          />
          <p class="text-xs text-slate-500 mt-1">
            Gunakan password yang kuat. Minimal 8 karakter disarankan.
          </p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-sm font-medium transition"
        >
          {{ loading ? 'Mendaftarkan akun...' : 'Daftar' }}
        </button>
      </form>

      <p v-if="error" class="mt-3 text-sm text-red-400">
        {{ error }}
      </p>
      <p v-if="success" class="mt-3 text-sm text-emerald-400">
        {{ success }}
      </p>

      <p class="mt-4 text-xs text-slate-400">
        Sudah punya akun?
        <router-link to="/login" class="text-indigo-400 hover:underline">
          Masuk di sini
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { registerWithEmail, loginWithEmail } from '../services/auth'

export default {
  name: 'RegisterView',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      loading: false,
      error: '',
      success: '',
    }
  },
  methods: {
    async handleRegister() {
      this.error = ''
      this.success = ''

      if (!this.name || !this.email || !this.password) {
        this.error = 'Nama, email, dan password wajib diisi.'
        return
      }

      this.loading = true
      try {
        // Supabase signUp (akan mengirim email konfirmasi jika diaktifkan)
        await registerWithEmail(this.name, this.email, this.password)

        // Jika project Supabase tidak mewajibkan email verification,
        // kamu bisa langsung login otomatis setelah register:
        const loginResult = await loginWithEmail(this.email, this.password)

        if (!loginResult || !loginResult.session) {
          // Jika butuh verifikasi email, arahkan user untuk cek email.
          this.success = 'Registrasi berhasil. Silakan cek email untuk verifikasi, lalu login.'
          return
        }

        // Jika login langsung berhasil, arahkan ke halaman utama
        this.$router.push('/')
      } catch (err) {
        this.error = err.message || 'Terjadi kesalahan saat registrasi.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
