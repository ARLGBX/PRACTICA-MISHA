<template>
  <div class="watchlist">
    <nav class="navbar">...</nav>

    <div class="watchlist-container">
      <h1>Смотреть позже</h1>

      <div v-if="watchlist.length === 0" class="empty">
        <p>У вас нет фильмов в списке "Смотреть позже"</p>
        <router-link to="/" class="btn-primary">На главную</router-link>
      </div>

      <div v-else class="watchlist-grid">
        <div v-for="item in watchlist" :key="item.movieId" class="watchlist-card">
          <img :src="item.poster" class="card-poster">
          <div class="card-info">
            <h3>{{ item.title }}</h3>
            <div class="card-meta">{{ item.year }} · {{ item.duration }} мин</div>
            <div class="card-actions">
              <button @click="watchNow(item.movieId)" class="btn-watch">Смотреть</button>
              <button @click="removeFromWatchlist(item.movieId)" class="btn-remove">Удалить</button>
            </div>
          </div>
        </div>
      </div>

      <div class="watchlist-actions">
        <button @click="clearAll" class="btn-clear">Очистить все</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const watchlist = ref([])

onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
  if (currentUser) loadWatchlist()
})

const loadWatchlist = async () => {
  const q = query(collection(db, 'watchlist'), where('userId', '==', user.value.uid))
  const snapshot = await getDocs(q)
  watchlist.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const removeFromWatchlist = async (movieId) => {
  const q = query(collection(db, 'watchlist'), where('userId', '==', user.value.uid), where('movieId', '==', movieId))
  const snapshot = await getDocs(q)
  snapshot.forEach(async (doc) => await deleteDoc(doc.ref))
  await loadWatchlist()
}

const watchNow = (movieId) => router.push(`/movie/${movieId}`)

const clearAll = async () => {
  const q = query(collection(db, 'watchlist'), where('userId', '==', user.value.uid))
  const snapshot = await getDocs(q)
  snapshot.forEach(async (doc) => await deleteDoc(doc.ref))
  await loadWatchlist()
}
</script>