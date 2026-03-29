<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <main class="main">
      <h1>Мои бронирования</h1>

      <div v-if="!currentUser && !authLoading" class="auth-required">
        <p>Войдите, чтобы просмотреть бронирования</p>
        <button class="btn-accent" @click="showAuth = true">Войти</button>
      </div>

      <template v-else-if="currentUser">
        <div class="tabs">
          <button :class="['tab', { active: activeTab === 'active' }]" @click="activeTab = 'active'">
            Активные
            <span v-if="activeBookings.length" class="tab-count">{{ activeBookings.length }}</span>
          </button>
          <button :class="['tab', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
            История
            <span v-if="historyBookings.length" class="tab-count">{{ historyBookings.length }}</span>
          </button>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>

        <div v-else>
          <div v-if="activeTab === 'active'">
            <div v-if="activeBookings.length === 0" class="empty">
              <p>🗓️ У вас нет активных бронирований</p>
              <button class="btn-accent" @click="$router.push('/')">Найти питомца</button>
            </div>
            <div v-for="b in activeBookings" :key="b.id" class="booking-card">
              <BookingCard :booking="b" @cancel="cancelBooking(b.id)" />
            </div>
          </div>

          <div v-if="activeTab === 'history'">
            <div v-if="historyBookings.length === 0" class="empty">
              <p>📋 История бронирований пуста</p>
            </div>
            <div v-for="b in historyBookings" :key="b.id" class="booking-card">
              <BookingCard :booking="b" />
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import Header from '../components/Header.vue'
import AuthModal from './AuthModal.vue'
import BookingCard from '../components/BookingCard.vue'

const currentUser = ref(null)
const isAdmin = ref(false)
const showAuth = ref(false)
const loading = ref(true)
const authLoading = ref(true)
const bookings = ref([])
const activeTab = ref('active')

let unsubBookings = null

const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  authLoading.value = false
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
    subscribeBookings(user.uid)
  } else {
    loading.value = false
    if (unsubBookings) unsubBookings()
  }
})

function subscribeBookings(uid) {
  const q = query(collection(db, 'bookings'), where('userId', '==', uid))
  unsubBookings = onSnapshot(q, snap => {
    bookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    loading.value = false
  })
}

onUnmounted(() => {
  unsubAuth()
  if (unsubBookings) unsubBookings()
})

const activeBookings = computed(() =>
  bookings.value.filter(b => b.status === 'pending' || b.status === 'confirmed')
)
const historyBookings = computed(() =>
  bookings.value.filter(b => b.status === 'completed' || b.status === 'cancelled')
)

async function cancelBooking(id) {
  if (!confirm('Отменить бронирование?')) return
  await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #0d1f13; }
.main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

h1 { font-size: 1.8rem; margin-bottom: 2rem; color: #fff; }

.auth-required { text-align: center; padding: 4rem; }
.auth-required p { color: #a5d6a7; margin-bottom: 1rem; font-size: 1.1rem; }

.btn-accent {
  background: #4caf50; color: #fff;
  padding: 0.55rem 1.5rem; border-radius: 6px;
  font-weight: 600; font-size: 0.95rem;
}
.btn-accent:hover { background: #43a047; }

.tabs { display: flex; gap: 0; margin-bottom: 2rem; border-bottom: 2px solid #2d7a4f; }
.tab {
  padding: 0.65rem 1.5rem;
  background: none;
  color: #a5d6a7;
  font-size: 0.95rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tab.active { color: #4caf50; border-bottom-color: #4caf50; }
.tab-count {
  background: #4caf50; color: #fff;
  border-radius: 10px; padding: 0.1rem 0.5rem;
  font-size: 0.75rem; font-weight: 700;
}

.loading { text-align: center; padding: 3rem; color: #a5d6a7; }

.empty {
  text-align: center;
  padding: 3rem;
  color: #6a9a72;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-size: 1.05rem;
}
</style>
