<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <div class="page-top">
      <div class="page-top-inner">
        <h1 class="page-title">📅 Мои заявки на постой</h1>
        <p class="page-sub">Управляйте заявками на размещение ваших питомцев и отслеживайте их статус</p>
      </div>
    </div>

    <main class="main">

      <div v-if="!currentUser && !authLoading" class="auth-gate">
        <div class="auth-gate-icon">🔐</div>
        <h2>Требуется авторизация</h2>
        <p>Войдите, чтобы просматривать свои заявки на постой</p>
        <button class="btn-accent" @click="showAuth = true">Войти</button>
      </div>

      <template v-else-if="currentUser">
        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-mini">
            <span class="stat-num">{{ activeBookings.length }}</span>
            <span class="stat-lbl">Активных</span>
          </div>
          <div class="stat-mini">
            <span class="stat-num">{{ historyBookings.length }}</span>
            <span class="stat-lbl">В истории</span>
          </div>
          <div class="stat-mini">
            <span class="stat-num">{{ bookings.filter(b => b.status === 'confirmed').length }}</span>
            <span class="stat-lbl">Подтверждено</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-bar">
          <button :class="['tab-btn', { active: activeTab === 'active' }]" @click="activeTab = 'active'">
            Активные
            <span v-if="activeBookings.length" class="tab-badge">{{ activeBookings.length }}</span>
          </button>
          <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
            История
            <span v-if="historyBookings.length" class="tab-badge history">{{ historyBookings.length }}</span>
          </button>
        </div>

        <!-- Error -->
        <Transition name="alert">
          <div v-if="cancelError" class="alert-error-bar">⚠️ {{ cancelError }}</div>
        </Transition>

        <!-- Loading -->
        <div v-if="loading" class="loading-wrap">
          <div class="spinner"></div>
        </div>

        <!-- Active bookings -->
        <div v-else-if="activeTab === 'active'">
          <div v-if="activeBookings.length === 0" class="empty-state">
            <div class="empty-emoji">🗓️</div>
            <h3>Нет активных заявок</h3>
            <p>Найдите подходящее место и оставьте заявку на постой вашего питомца</p>
            <button class="btn-accent" @click="$router.push('/')">🐾 Найти место</button>
          </div>
          <div v-else class="bookings-list">
            <BookingCard v-for="b in activeBookings" :key="b.id" :booking="b" @cancel="cancelBooking(b.id)" />
          </div>
        </div>

        <!-- History -->
        <div v-else>
          <div v-if="historyBookings.length === 0" class="empty-state">
            <div class="empty-emoji">📋</div>
            <h3>История пуста</h3>
            <p>Здесь появятся завершённые и отменённые бронирования</p>
          </div>
          <div v-else class="bookings-list">
            <BookingCard v-for="b in historyBookings" :key="b.id" :booking="b" />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
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
const cancelError = ref('')

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
  cancelError.value = ''
  try {
    await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' })
  } catch (err) {
    cancelError.value = 'Ошибка при отмене бронирования. Попробуйте позже.'
    console.error(err)
  }
}
</script>

<style scoped>
.page { min-height: 100vh; }

.page-top {
  background: linear-gradient(180deg, rgba(62,207,94,0.06) 0%, transparent 100%);
  padding: 2.5rem 1.75rem 1.75rem;
}
.page-top-inner { max-width: 900px; margin: 0 auto; }
.page-title { font-size: 1.85rem; font-weight: 900; color: #eef8f0; margin-bottom: 0.35rem; }
.page-sub { color: rgba(238,248,240,0.4); font-size: 0.95rem; }

.main { max-width: 900px; margin: 0 auto; padding: 0 1.75rem 4rem; }

/* Auth gate */
.auth-gate {
  text-align: center; padding: 5rem 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.auth-gate-icon { font-size: 3rem; }
.auth-gate h2 { color: #eef8f0; font-size: 1.3rem; }
.auth-gate p { color: rgba(238,248,240,0.4); }

.btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff; font-weight: 800; font-size: 0.95rem;
  padding: 0.65rem 1.5rem; border-radius: 11px;
  box-shadow: 0 3px 14px rgba(62,207,94,0.3);
  margin-top: 0.5rem; transition: all 0.2s;
}
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(62,207,94,0.45); }

/* Stats row */
.stats-row {
  display: flex; gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}
.stat-mini {
  flex: 1; min-width: 100px;
  background: rgba(17,42,28,0.6);
  border: 1.5px solid rgba(62,207,94,0.15);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.2rem;
}
.stat-num { font-size: 1.65rem; font-weight: 900; background: linear-gradient(135deg, #3ecf5e, #a8f0b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.stat-lbl { font-size: 0.78rem; font-weight: 700; color: rgba(238,248,240,0.4); text-transform: uppercase; letter-spacing: 0.06em; }

/* Tabs */
.tabs-bar {
  display: flex; gap: 0;
  border-bottom: 2px solid rgba(62,207,94,0.12);
  margin-bottom: 1.75rem;
}
.tab-btn {
  padding: 0.7rem 1.5rem;
  background: none;
  color: rgba(238,248,240,0.45);
  font-size: 0.95rem; font-weight: 800;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -2px;
  display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.2s;
}
.tab-btn:hover { color: rgba(238,248,240,0.75); }
.tab-btn.active { color: #3ecf5e; border-bottom-color: #3ecf5e; }
.tab-badge {
  background: rgba(62,207,94,0.2);
  border: 1px solid rgba(62,207,94,0.3);
  color: #3ecf5e;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}
.tab-badge.history { background: rgba(238,248,240,0.06); border-color: rgba(238,248,240,0.1); color: rgba(238,248,240,0.45); }

/* Alert */
.alert-error-bar {
  background: rgba(240,82,82,0.1);
  border: 1px solid rgba(240,82,82,0.3);
  color: #fca5a5;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.9rem; font-weight: 600;
}
.alert-enter-active, .alert-leave-active { transition: all 0.2s ease; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(-6px); }

.loading-wrap { text-align: center; padding: 4rem; }

/* Empty state */
.empty-state {
  text-align: center; padding: 4rem 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.empty-emoji { font-size: 3rem; }
.empty-state h3 { font-size: 1.2rem; color: #eef8f0; }
.empty-state p { color: rgba(238,248,240,0.4); font-size: 0.93rem; }

/* Bookings list */
.bookings-list { display: flex; flex-direction: column; gap: 1rem; }
</style>
