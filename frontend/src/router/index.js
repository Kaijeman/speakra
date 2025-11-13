import { createRouter, createWebHistory } from 'vue-router'
import UploadEvaluationView from '../views/UploadEvaluationView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { supabase } from '../lib/supabaseClient'

const routes = [
  { path: '/', name: 'home', component: UploadEvaluationView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach( async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  if (to.meta.requiresAuth && !isLoggedIn) return '/login'
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) return '/'
})

export default router
