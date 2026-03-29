<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <main class="main">
      <button class="back-btn" @click="$router.back()">← Назад</button>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="!animal" class="not-found">
        <p>Животное не найдено</p>
        <button class="btn-primary" @click="$router.push('/')">На главную</button>
      </div>

      <template v-else>
        <div class="detail-grid">
          <div class="detail-img-wrap">
            <img
              :src="animal.imageUrl || 'https://placehold.co/600x450/1a3d2b/4caf50?text=' + encodeURIComponent(animal.name)"
              :alt="animal.name"
              class="detail-img"
              @error="e => e.target.src = 'https://placehold.co/600x450/1a3d2b/4caf50?text=' + encodeURIComponent(animal.name)"
            />
            <span :class="['badge-status', animal.available ? 'yes' : 'no']">
              {{ animal.available ? '✓ Доступен' : '✗ Недоступен' }}
            </span>
          </div>

          <div class="detail-info">
            <h1>{{ animal.name }}</h1>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Вид</span><span>{{ animal.species }}</span></div>
              <div class="info-item" v-if="animal.breed"><span class="info-label">Порода</span><span>{{ animal.breed }}</span></div>
              <div class="info-item"><span class="info-label">Возраст</span><span>{{ animal.age }} лет</span></div>
              <div class="info-item"><span class="info-label">Пол</span><span>{{ animal.gender }}</span></div>
              <div class="info-item"><span class="info-label">Категория</span><span>{{ animal.category }}</span></div>
              <div class="info-item"><span class="info-label">Рейтинг</span><span>⭐ {{ animal.rating ? animal.rating.toFixed(1) : '—' }} ({{ animal.reviewsCount || 0 }} отзывов)</span></div>
            </div>
            <p v-if="animal.description" class="description">{{ animal.description }}</p>
            <div class="price-row">
              <span class="price">{{ animal.price ? animal.price.toLocaleString('ru-RU') + ' ₽' : 'Бесплатно' }}</span>
            </div>

            <div class="booking-section">
              <h2>Забронировать</h2>
              <div v-if="!currentUser" class="auth-hint">
                <p>Войдите, чтобы сделать бронирование</p>
                <button class="btn-accent" @click="showAuth = true">Войти</button>
              </div>
              <form v-else-if="animal.available" @submit.prevent="submitBooking" class="booking-form">
                <div v-if="bookingSuccess" class="success-msg">✓ Бронирование создано! Ожидайте подтверждения.</div>
                <div v-if="bookingError" class="error-msg">{{ bookingError }}</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Тип</label>
                    <select v-model="bookingType" required>
                      <option value="visit">Визит</option>
                      <option value="adoption">Усыновление</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Дата</label>
                    <input type="date" v-model="bookingDate" :min="today" required />
                  </div>
                  <div class="form-group">
                    <label>Время</label>
                    <select v-model="bookingTime" required>
                      <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn-accent" :disabled="bookingLoading">
                  {{ bookingLoading ? 'Отправка...' : 'Забронировать' }}
                </button>
              </form>
              <div v-else class="unavailable-msg">
                <p>Это животное сейчас недоступно для бронирования</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <section class="reviews-section">
          <h2>Отзывы <span v-if="reviews.length">({{ reviews.length }})</span></h2>

          <div v-if="currentUser && !hasUserReview" class="add-review">
            <h3>Оставить отзыв</h3>
            <div class="star-input">
              <button
                v-for="s in 5"
                :key="s"
                type="button"
                :class="['star-btn', { active: s <= newRating }]"
                @click="newRating = s"
              >★</button>
            </div>
            <textarea v-model="newReviewText" rows="3" placeholder="Ваш отзыв..."></textarea>
            <button class="btn-accent" @click="submitReview" :disabled="newRating === 0 || !newReviewText.trim()">
              Опубликовать
            </button>
          </div>

          <div v-if="reviews.length === 0" class="no-reviews">Отзывов пока нет. Будьте первым!</div>

          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <span class="review-author">{{ review.userName || review.userEmail }}</span>
              <span class="review-stars">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
              <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            </div>
            <p class="review-text">{{ review.text }}</p>
            <div v-if="currentUser && review.userId === currentUser.uid" class="review-actions">
              <button class="btn-small" @click="startEditReview(review)">Изменить</button>
              <button class="btn-small danger" @click="deleteReview(review.id)">Удалить</button>
            </div>
            <div v-if="editingReviewId === review.id" class="edit-review">
              <div class="star-input">
                <button v-for="s in 5" :key="s" type="button" :class="['star-btn', { active: s <= editRating }]" @click="editRating = s">★</button>
              </div>
              <textarea v-model="editReviewText" rows="3"></textarea>
              <div class="edit-btns">
                <button class="btn-accent" @click="saveEditReview(review.id)">Сохранить</button>
                <button class="btn-secondary-sm" @click="editingReviewId = null">Отмена</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Similar animals -->
        <section v-if="similarAnimals.length" class="similar-section">
          <h2>Похожие животные</h2>
          <div class="similar-grid">
            <div
              v-for="a in similarAnimals"
              :key="a.id"
              class="similar-card"
              @click="$router.push('/animal/' + a.id)"
            >
              <img
                :src="a.imageUrl || 'https://placehold.co/200x150/1a3d2b/4caf50?text=' + encodeURIComponent(a.name)"
                :alt="a.name"
                class="similar-img"
                @error="e => e.target.src = 'https://placehold.co/200x150/1a3d2b/4caf50?text=' + encodeURIComponent(a.name)"
              />
              <div class="similar-body">
                <strong>{{ a.name }}</strong>
                <p>{{ a.species }}</p>
                <span class="similar-price">{{ a.price ? a.price.toLocaleString('ru-RU') + ' ₽' : 'Бесплатно' }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  doc, onSnapshot, collection, query, where, addDoc, updateDoc,
  deleteDoc, serverTimestamp, getDocs, limit, getDoc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import Header from '../components/Header.vue'
import AuthModal from './AuthModal.vue'

const props = defineProps({ id: String })

const currentUser = ref(null)
const isAdmin = ref(false)
const showAuth = ref(false)
const loading = ref(true)
const animal = ref(null)
const reviews = ref([])
const similarAnimals = ref([])

// booking
const bookingType = ref('visit')
const bookingDate = ref('')
const bookingTime = ref('10:00')
const bookingLoading = ref(false)
const bookingSuccess = ref(false)
const bookingError = ref('')
const timeSlots = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const today = new Date().toISOString().split('T')[0]

// reviews
const newRating = ref(0)
const newReviewText = ref('')
const editingReviewId = ref(null)
const editRating = ref(0)
const editReviewText = ref('')

const hasUserReview = computed(() =>
  currentUser.value && reviews.value.some(r => r.userId === currentUser.value.uid)
)

let unsubAnimal = null
let unsubReviews = null

const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
  } else {
    isAdmin.value = false
  }
})

onMounted(() => {
  loadAnimal()
  loadReviews()
})

onUnmounted(() => {
  if (unsubAnimal) unsubAnimal()
  if (unsubReviews) unsubReviews()
  unsubAuth()
})

watch(() => props.id, () => {
  if (unsubAnimal) unsubAnimal()
  if (unsubReviews) unsubReviews()
  loading.value = true
  animal.value = null
  reviews.value = []
  similarAnimals.value = []
  loadAnimal()
  loadReviews()
})

function loadAnimal() {
  unsubAnimal = onSnapshot(doc(db, 'animals', props.id), snap => {
    if (snap.exists()) {
      animal.value = { id: snap.id, ...snap.data() }
      loadSimilar()
    } else {
      animal.value = null
    }
    loading.value = false
  })
}

function loadReviews() {
  const q = query(collection(db, 'reviews'), where('animalId', '==', props.id))
  unsubReviews = onSnapshot(q, snap => {
    reviews.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.seconds || 0
        const tb = b.createdAt?.seconds || 0
        return tb - ta
      })
  })
}

async function loadSimilar() {
  if (!animal.value?.category) return
  const q = query(
    collection(db, 'animals'),
    where('category', '==', animal.value.category),
    limit(5)
  )
  const snap = await getDocs(q)
  similarAnimals.value = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => a.id !== props.id)
    .slice(0, 4)
}

async function submitBooking() {
  bookingError.value = ''
  bookingSuccess.value = false
  if (!bookingDate.value || !bookingTime.value) {
    bookingError.value = 'Заполните все поля'
    return
  }
  bookingLoading.value = true
  try {
    await addDoc(collection(db, 'bookings'), {
      userId: currentUser.value.uid,
      userEmail: currentUser.value.email,
      animalId: props.id,
      animalName: animal.value.name,
      animalCategory: animal.value.category || '',
      date: bookingDate.value,
      time: bookingTime.value,
      type: bookingType.value,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    bookingSuccess.value = true
    bookingDate.value = ''
    bookingTime.value = '10:00'
    bookingType.value = 'visit'
  } catch (e) {
    bookingError.value = 'Ошибка при создании бронирования'
  } finally {
    bookingLoading.value = false
  }
}

async function submitReview() {
  if (newRating.value === 0 || !newReviewText.value.trim()) return
  try {
    const snap = await getDoc(doc(db, 'userData', currentUser.value.uid))
    const uname = snap.exists() ? snap.data().displayName : currentUser.value.displayName
    await addDoc(collection(db, 'reviews'), {
      userId: currentUser.value.uid,
      userEmail: currentUser.value.email,
      userName: uname || currentUser.value.email,
      animalId: props.id,
      animalName: animal.value.name,
      text: newReviewText.value.trim(),
      rating: newRating.value,
      createdAt: serverTimestamp(),
    })
    await updateAnimalRating()
    newRating.value = 0
    newReviewText.value = ''
  } catch (e) {
    console.error(e)
  }
}

async function updateAnimalRating() {
  const q = query(collection(db, 'reviews'), where('animalId', '==', props.id))
  const snap = await getDocs(q)
  const allReviews = snap.docs.map(d => d.data())
  const avg = allReviews.reduce((s, r) => s + (r.rating || 0), 0) / (allReviews.length || 1)
  await updateDoc(doc(db, 'animals', props.id), {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: allReviews.length,
  })
}

function startEditReview(review) {
  editingReviewId.value = review.id
  editRating.value = review.rating
  editReviewText.value = review.text
}

async function saveEditReview(id) {
  await updateDoc(doc(db, 'reviews', id), {
    rating: editRating.value,
    text: editReviewText.value.trim(),
  })
  await updateAnimalRating()
  editingReviewId.value = null
}

async function deleteReview(id) {
  if (!confirm('Удалить отзыв?')) return
  await deleteDoc(doc(db, 'reviews', id))
  await updateAnimalRating()
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.page { min-height: 100vh; background: #0d1f13; }
.main { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }

.back-btn {
  background: none;
  color: #a5d6a7;
  font-size: 0.95rem;
  padding: 0.4rem 0;
  margin-bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
}
.back-btn:hover { color: #4caf50; }

.loading, .not-found { text-align: center; padding: 4rem; color: #a5d6a7; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.detail-img-wrap { position: relative; }
.detail-img {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  max-height: 450px;
}

.badge-status {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}
.badge-status.yes { background: #4caf50; color: #fff; }
.badge-status.no { background: #ef5350; color: #fff; }

.detail-info { display: flex; flex-direction: column; gap: 1.25rem; }
.detail-info h1 { font-size: 2rem; color: #fff; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.info-item { display: flex; flex-direction: column; gap: 0.15rem; }
.info-label { font-size: 0.8rem; color: #6a9a72; text-transform: uppercase; letter-spacing: 0.04em; }

.description { color: #a5d6a7; line-height: 1.7; }

.price-row { margin: 0.5rem 0; }
.price { font-size: 1.75rem; font-weight: 700; color: #4caf50; }

.booking-section {
  background: #0d1f13;
  border: 1px solid #2d7a4f;
  border-radius: 10px;
  padding: 1.25rem;
}
.booking-section h2 { font-size: 1.1rem; margin-bottom: 1rem; color: #a5d6a7; }

.auth-hint { text-align: center; }
.auth-hint p { color: #6a9a72; margin-bottom: 0.75rem; }

.btn-accent {
  background: #4caf50;
  color: #fff;
  padding: 0.55rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
}
.btn-accent:hover:not(:disabled) { background: #43a047; }
.btn-accent:disabled { opacity: 0.6; cursor: not-allowed; }

.booking-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.85rem; color: #a5d6a7; }
.form-group select, .form-group input { width: 100%; font-size: 0.9rem; padding: 0.45rem 0.6rem; }

.unavailable-msg { color: #ef9a9a; font-size: 0.9rem; }

.success-msg {
  background: rgba(76,175,80,0.15); border: 1px solid #4caf50;
  color: #a5d6a7; padding: 0.6rem 1rem; border-radius: 6px; font-size: 0.9rem;
}
.error-msg {
  background: rgba(239,83,80,0.15); border: 1px solid #ef5350;
  color: #ef9a9a; padding: 0.6rem 1rem; border-radius: 6px; font-size: 0.9rem;
}

.reviews-section { margin-bottom: 3rem; }
.reviews-section h2 { font-size: 1.4rem; margin-bottom: 1.5rem; }

.add-review {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.add-review h3 { font-size: 1rem; color: #a5d6a7; }

.star-input { display: flex; gap: 0.25rem; }
.star-btn {
  background: none;
  font-size: 1.5rem;
  color: #6a9a72;
  padding: 0;
  line-height: 1;
}
.star-btn.active { color: #ffa726; }
.star-btn:hover { color: #ffa726; }

.add-review textarea { width: 100%; resize: vertical; min-height: 80px; }

.no-reviews { color: #6a9a72; font-style: italic; padding: 1rem 0; }

.review-card {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}
.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.review-author { font-weight: 600; color: #4caf50; }
.review-stars { color: #ffa726; letter-spacing: 0.1em; }
.review-date { color: #6a9a72; font-size: 0.82rem; margin-left: auto; }
.review-text { color: #a5d6a7; line-height: 1.6; }

.review-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
.btn-small {
  padding: 0.25rem 0.75rem;
  background: #0d1f13;
  border: 1px solid #2d7a4f;
  color: #a5d6a7;
  border-radius: 4px;
  font-size: 0.82rem;
}
.btn-small:hover { border-color: #4caf50; color: #4caf50; }
.btn-small.danger:hover { border-color: #ef5350; color: #ef9a9a; }

.edit-review { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.edit-review textarea { width: 100%; resize: vertical; min-height: 70px; }
.edit-btns { display: flex; gap: 0.5rem; }
.btn-secondary-sm {
  padding: 0.4rem 1rem;
  background: #0d1f13;
  border: 1px solid #2d7a4f;
  color: #a5d6a7;
  border-radius: 6px;
  font-size: 0.9rem;
}

.similar-section { margin-bottom: 2rem; }
.similar-section h2 { font-size: 1.4rem; margin-bottom: 1.25rem; }
.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.similar-card {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.similar-card:hover { border-color: #4caf50; transform: translateY(-3px); }
.similar-img { width: 100%; height: 140px; object-fit: cover; }
.similar-body { padding: 0.75rem; }
.similar-body strong { display: block; margin-bottom: 0.2rem; }
.similar-body p { color: #a5d6a7; font-size: 0.85rem; }
.similar-price { color: #4caf50; font-weight: 600; font-size: 0.9rem; }

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr 1fr; }
}
</style>
