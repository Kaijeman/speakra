import { createRouter, createWebHistory } from 'vue-router'
import UploadEvaluationView from '../views/UploadEvaluationView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: UploadEvaluationView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
