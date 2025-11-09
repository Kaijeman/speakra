import { createRouter, createWebHistory } from 'vue-router'
import UploadEvaluationView from '../views/UploadEvaluationView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { getAccessToken } from '../services/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: UploadEvaluationView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!getAccessToken()

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/login')
  }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return next('/')
  }

  next()
})

export default router
