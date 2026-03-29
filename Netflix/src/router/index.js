import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import MovieDetail from '../pages/MovieDetail.vue'
import Profile from '../pages/Profile.vue'
import Admin from '../pages/Admin.vue'
import GenerateReviews from '../pages/GenerateReviews.vue'
import Watchlist from '../pages/Watchlist.vue'

const routes = [
    {
        path: '/watchlist',
        name: 'Watchlist',
        component: Watchlist
    },
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/movie/:id',
        name: 'MovieDetail',
        component: MovieDetail,
        props: true
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile
    },
    {
        path: '/admin',
        name: 'Admin',
        component: Admin
    },
    {
        path: '/generate-reviews',
        name: 'GenerateReviews',
        component: GenerateReviews
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router