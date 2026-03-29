<template>
  <div class="profile-wrap">
    <h1>Личный кабинет</h1>

    <div class="tabs">
      <button :class="['tab', { active: tab === 'profile' }]" @click="tab = 'profile'">Профиль</button>
      <button :class="['tab', { active: tab === 'reviews' }]" @click="tab = 'reviews'">Мои отзывы</button>
      <button :class="['tab', { active: tab === 'stats' }]" @click="tab = 'stats'">Статистика</button>
    </div>

    <!-- Profile tab -->
    <div v-if="tab === 'profile'" class="tab-content">
      <div v-if="saveSuccess" class="success-msg">✓ Профиль обновлён</div>
      <div v-if="saveError" class="error-msg">{{ saveError }}</div>
      <form @submit.prevent="saveProfile" class="form">
        <div class="form-group">
          <label>Email</label>
          <input :value="currentUser.email" disabled />
        </div>
        <div class="form-group">
          <label>Имя</label>
          <input v-model="formName" type="text" placeholder="Ваше имя" />
        </div>
        <div class="form-group">
          <label>Телефон</label>
          <input v-model="formPhone" type="tel" placeholder="+7 (___) ___-__-__" />
        </div>
        <div class="form-group">
          <label>О себе</label>
          <textarea v-model="formBio" rows="4" placeholder="Расскажите о себе..."></textarea>
        </div>
        <button type="submit" class="btn-accent" :disabled="saving">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </form>
    </div>

    <!-- Reviews tab -->
    <div v-if="tab === 'reviews'" class="tab-content">
      <div v-if="reviewsLoading" class="loading"><div class="spinner"></div></div>
      <div v-else-if="userReviews.length === 0" class="empty">Вы ещё не оставляли отзывов</div>
      <div v-for="review in userReviews" :key="review.id" class="review-card">
        <div class="review-header">
          <router-link :to="'/animal/' + review.animalId" class="animal-link">{{ review.animalName }}</router-link>
          <span class="review-stars">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
          <span class="review-date">{{ formatDate(review.createdAt) }}</span>
        </div>
        <p class="review-text" v-if="editingId !== review.id">{{ review.text }}</p>
        <div v-if="editingId === review.id" class="edit-review">
          <div class="star-input">
            <button v-for="s in 5" :key="s" type="button" :class="['star-btn', { active: s <= editRating }]" @click="editRating = s">★</button>
          </div>
          <textarea v-model="editText" rows="3"></textarea>
          <div class="edit-btns">
            <button class="btn-accent sm" @click="saveEdit(review.id)">Сохранить</button>
            <button class="btn-outline sm" @click="editingId = null">Отмена</button>
          </div>
        </div>
        <div class="review-actions">
          <button class="btn-outline sm" @click="startEdit(review)">Изменить</button>
          <button class="btn-danger sm" @click="deleteReview(review.id, review.animalId)">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Stats tab -->
    <div v-if="tab === 'stats'" class="tab-content">
      <div v-if="statsLoading" class="loading"><div class="spinner"></div></div>
      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalReviews }}</div>
          <div class="stat-label">Отзывов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.avgRating || '—' }}</div>
          <div class="stat-label">Средний рейтинг</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalBookings }}</div>
          <div class="stat-label">Бронирований</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.completedBookings }}</div>
          <div class="stat-label">Завершённых</div>
        </div>
        <div class="stat-card wide">
          <div class="stat-label">Любимая категория</div>
          <div class="stat-value">{{ stats.favoriteCategory || '—' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  doc, getDoc, setDoc, collection, query, where,
  onSnapshot, updateDoc, deleteDoc, getDocs, serverTimestamp
} from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase/config'

const props = defineProps({ currentUser: Object })

const tab = ref('profile')
const formName = ref('')
const formPhone = ref('')
const formBio = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

const userReviews = ref([])
const reviewsLoading = ref(true)
const editingId = ref(null)
const editRating = ref(0)
const editText = ref('')

const stats = ref({ totalReviews: 0, avgRating: null, totalBookings: 0, completedBookings: 0, favoriteCategory: null })
const statsLoading = ref(true)

let unsubReviews = null

onMounted(() => {
  loadUserData()
  subscribeReviews()
  loadStats()
})

onUnmounted(() => {
  if (unsubReviews) unsubReviews()
})

async function loadUserData() {
  if (!props.currentUser) return
  const snap = await getDoc(doc(db, 'userData', props.currentUser.uid))
  if (snap.exists()) {
    const d = snap.data()
    formName.value = d.displayName || props.currentUser.displayName || ''
    formPhone.value = d.phone || ''
    formBio.value = d.bio || ''
  } else {
    formName.value = props.currentUser.displayName || ''
  }
}

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await setDoc(doc(db, 'userData', props.currentUser.uid), {
      uid: props.currentUser.uid,
      email: props.currentUser.email,
      displayName: formName.value,
      phone: formPhone.value,
      bio: formBio.value,
      role: 'user',
    }, { merge: true })
    if (formName.value) {
      await updateProfile(auth.currentUser, { displayName: formName.value })
    }
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = 'Ошибка при сохранении'
  } finally {
    saving.value = false
  }
}

function subscribeReviews() {
  if (!props.currentUser) return
  const q = query(collection(db, 'reviews'), where('userId', '==', props.currentUser.uid))
  unsubReviews = onSnapshot(q, snap => {
    userReviews.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    reviewsLoading.value = false
  })
}

function startEdit(review) {
  editingId.value = review.id
  editRating.value = review.rating
  editText.value = review.text
}

async function saveEdit(id) {
  await updateDoc(doc(db, 'reviews', id), { rating: editRating.value, text: editText.value })
  editingId.value = null
}

async function deleteReview(id, animalId) {
  if (!confirm('Удалить отзыв?')) return
  await deleteDoc(doc(db, 'reviews', id))
  await updateAnimalRating(animalId)
}

async function updateAnimalRating(animalId) {
  const q = query(collection(db, 'reviews'), where('animalId', '==', animalId))
  const snap = await getDocs(q)
  const all = snap.docs.map(d => d.data())
  const avg = all.length ? all.reduce((s, r) => s + (r.rating || 0), 0) / all.length : 0
  await updateDoc(doc(db, 'animals', animalId), {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: all.length,
  })
}

async function loadStats() {
  if (!props.currentUser) return
  statsLoading.value = true
  const [revSnap, bookSnap] = await Promise.all([
    getDocs(query(collection(db, 'reviews'), where('userId', '==', props.currentUser.uid))),
    getDocs(query(collection(db, 'bookings'), where('userId', '==', props.currentUser.uid))),
  ])
  const revs = revSnap.docs.map(d => d.data())
  const books = bookSnap.docs.map(d => d.data())
  const avg = revs.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : null
  const completed = books.filter(b => b.status === 'completed').length

  const catCount = {}
  books.forEach(b => {
    if (b.animalCategory) catCount[b.animalCategory] = (catCount[b.animalCategory] || 0) + 1
  })
  const favCat = Object.keys(catCount).sort((a, b) => catCount[b] - catCount[a])[0] || null

  stats.value = {
    totalReviews: revs.length,
    avgRating: avg ? avg.toFixed(1) : null,
    totalBookings: books.length,
    completedBookings: completed,
    favoriteCategory: favCat,
  }
  statsLoading.value = false
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.profile-wrap { padding-bottom: 2rem; }

h1 { font-size: 1.8rem; margin-bottom: 2rem; }

.tabs {
  display: flex;
  border-bottom: 2px solid #2d7a4f;
  margin-bottom: 2rem;
}
.tab {
  padding: 0.65rem 1.5rem;
  background: none;
  color: #a5d6a7;
  font-size: 0.95rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab.active { color: #4caf50; border-bottom-color: #4caf50; }

.tab-content { max-width: 600px; }

.form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.88rem; color: #a5d6a7; }
.form-group input, .form-group textarea { width: 100%; }
.form-group input:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-accent {
  background: #4caf50; color: #fff;
  padding: 0.55rem 1.5rem; border-radius: 6px;
  font-weight: 600; font-size: 0.95rem; width: fit-content;
}
.btn-accent:hover:not(:disabled) { background: #43a047; }
.btn-accent:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-accent.sm { padding: 0.35rem 0.9rem; font-size: 0.85rem; }

.btn-outline {
  background: transparent; border: 1px solid #2d7a4f;
  color: #a5d6a7; padding: 0.55rem 1.5rem; border-radius: 6px;
  font-size: 0.95rem; width: fit-content;
}
.btn-outline.sm { padding: 0.35rem 0.9rem; font-size: 0.85rem; }
.btn-outline:hover { border-color: #4caf50; color: #4caf50; }

.btn-danger {
  background: rgba(239,83,80,0.15); border: 1px solid #ef5350;
  color: #ef9a9a; padding: 0.55rem 1.5rem; border-radius: 6px;
  font-size: 0.95rem; width: fit-content;
}
.btn-danger.sm { padding: 0.35rem 0.9rem; font-size: 0.85rem; }
.btn-danger:hover { background: rgba(239,83,80,0.3); }

.loading { text-align: center; padding: 2rem; }
.empty { color: #6a9a72; font-style: italic; padding: 1rem 0; }

.review-card {
  background: #1a3d2b; border: 1px solid #2d7a4f;
  border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1rem;
}
.review-header {
  display: flex; align-items: center; gap: 0.75rem;
  flex-wrap: wrap; margin-bottom: 0.5rem;
}
.animal-link { color: #4caf50; font-weight: 600; }
.review-stars { color: #ffa726; }
.review-date { color: #6a9a72; font-size: 0.82rem; margin-left: auto; }
.review-text { color: #a5d6a7; line-height: 1.6; margin-bottom: 0.75rem; }

.edit-review { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.edit-review textarea { width: 100%; }
.edit-btns { display: flex; gap: 0.5rem; }

.star-input { display: flex; gap: 0.25rem; }
.star-btn { background: none; font-size: 1.3rem; color: #6a9a72; padding: 0; }
.star-btn.active { color: #ffa726; }
.star-btn:hover { color: #ffa726; }

.review-actions { display: flex; gap: 0.5rem; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.stat-card {
  background: #1a3d2b; border: 1px solid #2d7a4f;
  border-radius: 10px; padding: 1.25rem; text-align: center;
}
.stat-card.wide { grid-column: 1 / -1; }
.stat-value { font-size: 2rem; font-weight: 700; color: #4caf50; }
.stat-label { color: #a5d6a7; font-size: 0.88rem; margin-top: 0.25rem; }

.success-msg {
  background: rgba(76,175,80,0.15); border: 1px solid #4caf50;
  color: #a5d6a7; padding: 0.6rem 1rem; border-radius: 6px;
  font-size: 0.9rem; margin-bottom: 1rem;
}
.error-msg {
  background: rgba(239,83,80,0.15); border: 1px solid #ef5350;
  color: #ef9a9a; padding: 0.6rem 1rem; border-radius: 6px;
  font-size: 0.9rem; margin-bottom: 1rem;
}
</style>
