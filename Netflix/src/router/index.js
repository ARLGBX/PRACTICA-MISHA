import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import AnimalDetail from '../pages/AnimalDetail.vue'
import Bookings from '../pages/Bookings.vue'
import Profile from '../pages/Profile.vue'
import Admin from '../pages/Admin.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/animal/:id', component: AnimalDetail, props: true },
  { path: '/bookings', component: Bookings },
  { path: '/profile', component: Profile },
  { path: '/admin', component: Admin },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
