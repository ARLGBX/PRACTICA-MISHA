<template>
  <div class="profile-wrap">
    <!-- Profile header card -->
    <div class="profile-header">
      <div class="profile-avatar">{{ userInitial }}</div>
      <div class="profile-meta">
        <div class="profile-name">{{ currentUser.displayName || 'Пользователь' }}</div>
        <div class="profile-email">{{ currentUser.email }}</div>
        <span class="profile-role">👤 Пользователь</span>
      </div>
    </div>

    <div class="tabs-bar">
      <button :class="['tab-btn', { active: tab === 'profile' }]" @click="tab = 'profile'">Профиль</button>
      <button :class="['tab-btn', { active: tab === 'reviews' }]" @click="tab = 'reviews'">Мои отзывы</button>
      <button :class="['tab-btn', { active: tab === 'stats' }]" @click="tab = 'stats'">Статистика</button>
    </div>

    <!-- Profile tab -->
    <div v-if="tab === 'profile'" class="tab-content">
      <div v-if="saveSuccess" class="alert success-alert">✓ Профиль обновлён</div>
      <div v-if="saveError" class="alert error-alert">{{ saveError }}</div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  doc, getDoc, setDoc, collection, query, where,
  onSnapshot, updateDoc, deleteDoc, getDocs, serverTimestamp
} from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase/config'

const props = defineProps({ currentUser: Object })

const userInitial = computed(() => {
  if (!props.currentUser) return '?'
  const name = props.currentUser.displayName || props.currentUser.email || ''
  return name.charAt(0).toUpperCase()
})

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
  reviewsLoading.value = true
  const q = query(collection(db, 'reviews'), where('userId', '==', props.currentUser.uid))
  unsubReviews = onSnapshot(q, snap => {
    userReviews.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    reviewsLoading.value = false
  }, () => {
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
.profile-wrap { padding-bottom: 3rem; }

.profile-header {
  display: flex; align-items: center; gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(17,42,28,0.6);
  border: 1.5px solid rgba(62,207,94,0.15);
  border-radius: 18px;
  margin-bottom: 2rem;
}
.profile-avatar {
  width: 70px; height: 70px;
  background: linear-gradient(135deg, #3ecf5e 0%, #1e8a38 100%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; font-weight: 900; color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 18px rgba(62,207,94,0.35);
}
.profile-meta { display: flex; flex-direction: column; gap: 0.2rem; }
.profile-name { font-size: 1.25rem; font-weight: 900; color: #eef8f0; }
.profile-email { font-size: 0.85rem; color: rgba(238,248,240,0.4); }
.profile-role {
  display: inline-flex; align-items: center;
  margin-top: 0.35rem;
  background: rgba(62,207,94,0.12);
  border: 1px solid rgba(62,207,94,0.25);
  color: #3ecf5e;
  padding: 0.2rem 0.65rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 800;
}

.tabs-bar {
  display: flex; border-bottom: 2px solid rgba(62,207,94,0.12); margin-bottom: 2rem;
}
.tab-btn {
  padding: 0.7rem 1.5rem; background: none;
  color: rgba(238,248,240,0.45); font-size: 0.93rem; font-weight: 800;
  border-bottom: 2.5px solid transparent; margin-bottom: -2px; transition: all 0.2s;
}
.tab-btn:hover { color: rgba(238,248,240,0.75); }
.tab-btn.active { color: #3ecf5e; border-bottom-color: #3ecf5e; }

.tab-content { max-width: 620px; }

.alert { padding: 0.65rem 1rem; border-radius: 10px; font-size: 0.88rem; font-weight: 600; margin-bottom: 1rem; }
.success-alert { background: rgba(62,207,94,0.12); border: 1px solid rgba(62,207,94,0.3); color: #86efac; }
.error-alert { background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3); color: #fca5a5; }

.form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.78rem; font-weight: 800; color: rgba(238,248,240,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input, .form-group textarea { width: 100%; }

.btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff; font-weight: 800; font-size: 0.95rem;
  padding: 0.65rem 1.75rem; border-radius: 11px;
  box-shadow: 0 3px 14px rgba(62,207,94,0.3); transition: all 0.2s;
  width: fit-content;
}
.btn-accent:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(62,207,94,0.45); }
.btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-accent.sm { padding: 0.35rem 0.9rem; font-size: 0.82rem; }

.btn-outline {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(255,255,255,0.04); border: 1.5px solid rgba(62,207,94,0.2);
  color: rgba(238,248,240,0.6); font-weight: 700; font-size: 0.95rem;
  padding: 0.65rem 1.5rem; border-radius: 11px; width: fit-content; transition: all 0.15s;
}
.btn-outline:hover { border-color: rgba(62,207,94,0.45); color: #eef8f0; }
.btn-outline.sm { padding: 0.35rem 0.9rem; font-size: 0.82rem; }

.btn-danger {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(240,82,82,0.1); border: 1px solid rgba(240,82,82,0.3);
  color: #f87171; font-weight: 700; font-size: 0.95rem;
  padding: 0.65rem 1.5rem; border-radius: 11px; width: fit-content; transition: all 0.15s;
}
.btn-danger:hover { background: rgba(240,82,82,0.2); }
.btn-danger.sm { padding: 0.35rem 0.9rem; font-size: 0.82rem; }

.loading { text-align: center; padding: 3rem; }
.empty { color: rgba(238,248,240,0.35); font-style: italic; padding: 2rem; text-align: center; }

.review-card {
  background: rgba(17,42,28,0.5); border: 1.5px solid rgba(62,207,94,0.1);
  border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 0.85rem;
  transition: border-color 0.2s;
}
.review-card:hover { border-color: rgba(62,207,94,0.25); }
.review-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.animal-link { color: #3ecf5e; font-weight: 800; font-size: 0.93rem; }
.review-stars { color: #f5c842; font-size: 0.95rem; }
.review-date { color: rgba(238,248,240,0.3); font-size: 0.78rem; margin-left: auto; }
.review-text { color: rgba(238,248,240,0.6); line-height: 1.7; margin-bottom: 0.75rem; font-size: 0.92rem; }

.edit-review { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.edit-review textarea { width: 100%; }
.edit-btns { display: flex; gap: 0.5rem; }

.star-input { display: flex; gap: 0.2rem; }
.star-btn { background: none; font-size: 1.4rem; color: rgba(238,248,240,0.2); padding: 0; transition: all 0.15s; }
.star-btn.active { color: #f5c842; }
.star-btn:hover { color: #f5c842; transform: scale(1.1); }

.review-actions { display: flex; gap: 0.5rem; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
.stat-card {
  background: rgba(17,42,28,0.6); border: 1.5px solid rgba(62,207,94,0.15);
  border-radius: 16px; padding: 1.4rem; text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}
.stat-card:hover { border-color: rgba(62,207,94,0.3); transform: translateY(-2px); }
.stat-card.wide { grid-column: 1 / -1; }
.stat-value { font-size: 2.2rem; font-weight: 900; background: linear-gradient(135deg, #3ecf5e, #a8f0b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.stat-label { color: rgba(238,248,240,0.4); font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.3rem; }
</style>
