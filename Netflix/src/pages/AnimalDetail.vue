<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <div v-if="loading" class="loading-page">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <div v-else-if="!animal" class="not-found">
      <div class="not-found-emoji">🐾</div>
      <h2>Место не найдено</h2>
      <p>Возможно, оно уже занято или было удалено</p>
      <button class="btn-back" @click="$router.push('/')">На главную</button>
    </div>

    <template v-else>
      <!-- Hero section -->
      <div class="detail-hero">
        <button class="back-btn" @click="$router.back()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Назад
        </button>
        <div class="detail-grid">
          <div class="detail-img-wrap">
            <img
              :src="animal.imageUrl || 'https://placehold.co/600x450/0f2318/3ecf5e?text=' + encodeURIComponent(animal.name)"
              :alt="animal.name"
              class="detail-img"
              @error="e => e.target.src = 'https://placehold.co/600x450/0f2318/3ecf5e?text=' + encodeURIComponent(animal.name)"
            />
            <div class="img-overlay"></div>
            <span :class="['avail-badge-lg', animal.available ? 'yes' : 'no']">
              <span class="avail-dot-lg"></span>
              {{ animal.available ? 'Свободно' : 'Занято' }}
            </span>
          </div>

          <div class="detail-info">
            <div class="info-category">{{ animal.category }}</div>
            <h1 class="info-name">{{ animal.name }}</h1>
            <div class="info-rating" v-if="animal.reviewsCount">
              <span class="stars-row">{{ '★'.repeat(Math.round(animal.rating || 0)) }}{{ '☆'.repeat(5 - Math.round(animal.rating || 0)) }}</span>
              <span class="rating-val">{{ animal.rating ? animal.rating.toFixed(1) : '—' }}</span>
              <span class="rating-cnt">({{ animal.reviewsCount }} отзывов)</span>
            </div>

            <div class="info-tags">
              <span class="tag"><span class="tag-icon">🦴</span>{{ animal.species }}</span>
              <span v-if="animal.breed" class="tag"><span class="tag-icon">📋</span>{{ animal.breed }}</span>
              <span class="tag"><span class="tag-icon">🎂</span>{{ animal.age }} лет</span>
              <span class="tag"><span class="tag-icon">⚧</span>{{ animal.gender }}</span>
            </div>

            <p v-if="animal.description" class="info-desc">{{ animal.description }}</p>

            <div class="price-block">
              <span class="price-label">Стоимость в сутки</span>
              <span class="price-val">{{ animal.price ? animal.price.toLocaleString('ru-RU') + ' ₽/сут' : 'Уточняйте' }}</span>
            </div>

            <!-- Booking widget -->
            <div class="booking-widget">
              <div class="widget-head">
                <h2>📅 Оставить питомца</h2>
              </div>

              <div v-if="!currentUser" class="widget-auth">
                <p>Войдите, чтобы оставить заявку</p>
                <button class="btn-accent" @click="showAuth = true">Войти</button>
              </div>

              <form v-else-if="animal.available" @submit.prevent="submitBooking" class="booking-form">
                <Transition name="alert">
                  <div v-if="bookingSuccess" class="alert success-alert">
                    ✓ Заявка принята! Ожидайте подтверждения.
                  </div>
                </Transition>
                <Transition name="alert">
                  <div v-if="bookingError" class="alert error-alert">{{ bookingError }}</div>
                </Transition>

                <div class="form-row3">
                  <div class="fg">
                    <label>Тип постоя</label>
                    <select v-model="bookingType" required>
                      <option value="visit">⏰ Краткосрочный (до 7 дней)</option>
                      <option value="adoption">📦 Долгосрочный (от 7 дней)</option>
                    </select>
                  </div>
                  <div class="fg">
                    <label>Дата заезда</label>
                    <input type="date" v-model="bookingDate" :min="today" required />
                  </div>
                  <div class="fg">
                    <label>Время заезда</label>
                    <select v-model="bookingTime" required>
                      <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn-accent wide" :disabled="bookingLoading">
                  <span v-if="bookingLoading" class="spinner-sm"></span>
                  <span v-else>🐾 Оставить питомца</span>
                </button>
              </form>

              <div v-else class="widget-unavailable">
                <span class="unavail-emoji">😔</span>
                <p>Все места для постоя заняты</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-main">
        <!-- Reviews -->
        <section class="section">
          <div class="section-head">
            <h2>Отзывы <span v-if="reviews.length" class="section-count">{{ reviews.length }}</span></h2>
            <div v-if="reviews.length" class="avg-rating">
              <span class="avg-stars">★</span>
              <span class="avg-val">{{ avgRating }}</span>
            </div>
          </div>

          <div v-if="currentUser && !hasUserReview" class="add-review-card">
            <h3>Оставить отзыв</h3>
            <div class="star-picker">
              <button
                v-for="s in 5"
                :key="s"
                type="button"
                :class="['star-btn', { active: s <= newRating, hover: s <= hoverRating }]"
                @mouseenter="hoverRating = s"
                @mouseleave="hoverRating = 0"
                @click="newRating = s"
              >★</button>
              <span v-if="newRating" class="rating-label">{{ ratingLabels[newRating] }}</span>
            </div>
            <textarea v-model="newReviewText" rows="3" placeholder="Поделитесь впечатлениями..."></textarea>
            <button class="btn-accent" @click="submitReview" :disabled="newRating === 0 || !newReviewText.trim()">
              Опубликовать отзыв
            </button>
          </div>

          <div v-if="reviews.length === 0" class="empty-reviews">
            <span>💬</span>
            <p>Отзывов пока нет. Будьте первым!</p>
          </div>

          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-head">
              <div class="reviewer-avatar">{{ (review.userName || review.userEmail || '?').charAt(0).toUpperCase() }}</div>
              <div class="reviewer-info">
                <span class="reviewer-name">{{ review.userName || review.userEmail }}</span>
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </div>
              <span class="review-stars-display">{{ '★'.repeat(review.rating) }}<span class="empty-stars">{{ '★'.repeat(5 - review.rating) }}</span></span>
            </div>
            <p class="review-text" v-if="editingReviewId !== review.id">{{ review.text }}</p>
            <div v-if="editingReviewId === review.id" class="edit-review-wrap">
              <div class="star-picker">
                <button v-for="s in 5" :key="s" type="button" :class="['star-btn', { active: s <= editRating }]" @click="editRating = s">★</button>
              </div>
              <textarea v-model="editReviewText" rows="3"></textarea>
              <div class="edit-actions">
                <button class="btn-accent sm" @click="saveEditReview(review.id)">Сохранить</button>
                <button class="btn-ghost sm" @click="editingReviewId = null">Отмена</button>
              </div>
            </div>
            <div v-if="currentUser && review.userId === currentUser.uid" class="review-own-actions">
              <button class="btn-ghost xs" @click="startEditReview(review)">✏️ Изменить</button>
              <button class="btn-ghost xs danger" @click="deleteReview(review.id)">🗑️ Удалить</button>
            </div>
          </div>
        </section>

        <!-- Similar animals -->
        <section v-if="similarAnimals.length" class="section">
          <div class="section-head">
            <h2>Похожие места</h2>
          </div>
          <div class="similar-grid">
            <div
              v-for="a in similarAnimals"
              :key="a.id"
              class="similar-card"
              @click="$router.push('/animal/' + a.id)"
            >
              <img
                :src="a.imageUrl || 'https://placehold.co/300x200/0f2318/3ecf5e?text=' + encodeURIComponent(a.name)"
                :alt="a.name"
                class="similar-img"
                @error="e => e.target.src = 'https://placehold.co/300x200/0f2318/3ecf5e?text=' + encodeURIComponent(a.name)"
              />
              <div class="similar-overlay"></div>
              <div class="similar-info">
                <strong>{{ a.name }}</strong>
                <span>{{ a.species }}</span>
                <span class="similar-price">{{ a.price ? a.price.toLocaleString('ru-RU') + ' ₽/сут' : 'Уточняйте' }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
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

const bookingType = ref('visit')
const bookingDate = ref('')
const bookingTime = ref('10:00')
const bookingLoading = ref(false)
const bookingSuccess = ref(false)
const bookingError = ref('')
const timeSlots = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const today = new Date().toISOString().split('T')[0]

const newRating = ref(0)
const hoverRating = ref(0)
const newReviewText = ref('')
const editingReviewId = ref(null)
const editRating = ref(0)
const editReviewText = ref('')

const ratingLabels = { 1: 'Плохо', 2: 'Неплохо', 3: 'Хорошо', 4: 'Отлично', 5: 'Превосходно' }

const hasUserReview = computed(() =>
  currentUser.value && reviews.value.some(r => r.userId === currentUser.value.uid)
)
const avgRating = computed(() => {
  if (!reviews.value.length) return '—'
  const s = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0)
  return (s / reviews.value.length).toFixed(1)
})

let unsubAnimal = null, unsubReviews = null
const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
  } else isAdmin.value = false
})

onMounted(() => { loadAnimal(); loadReviews() })
onUnmounted(() => {
  if (unsubAnimal) unsubAnimal()
  if (unsubReviews) unsubReviews()
  unsubAuth()
})
watch(() => props.id, () => {
  if (unsubAnimal) unsubAnimal()
  if (unsubReviews) unsubReviews()
  loading.value = true; animal.value = null; reviews.value = []; similarAnimals.value = []
  loadAnimal(); loadReviews()
})

function loadAnimal() {
  unsubAnimal = onSnapshot(doc(db, 'animals', props.id), snap => {
    if (snap.exists()) { animal.value = { id: snap.id, ...snap.data() }; loadSimilar() }
    else animal.value = null
    loading.value = false
  })
}
function loadReviews() {
  const q = query(collection(db, 'reviews'), where('animalId', '==', props.id))
  unsubReviews = onSnapshot(q, snap => {
    reviews.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  })
}
async function loadSimilar() {
  if (!animal.value?.category) return
  const q = query(collection(db, 'animals'), where('category', '==', animal.value.category), limit(5))
  const snap = await getDocs(q)
  similarAnimals.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.id !== props.id).slice(0, 4)
}
async function submitBooking() {
  bookingError.value = ''; bookingSuccess.value = false
  if (!bookingDate.value || !bookingTime.value) { bookingError.value = 'Заполните все поля'; return }
  bookingLoading.value = true
  try {
    await addDoc(collection(db, 'bookings'), {
      userId: currentUser.value.uid, userEmail: currentUser.value.email,
      animalId: props.id, animalName: animal.value.name,
      animalCategory: animal.value.category || '',
      date: bookingDate.value, time: bookingTime.value,
      type: bookingType.value, status: 'pending', createdAt: serverTimestamp(),
    })
    bookingSuccess.value = true
    bookingDate.value = ''; bookingTime.value = '10:00'; bookingType.value = 'visit'
  } catch (e) { bookingError.value = 'Ошибка при создании бронирования' }
  finally { bookingLoading.value = false }
}
async function submitReview() {
  if (!newRating.value || !newReviewText.value.trim()) return
  try {
    const snap = await getDoc(doc(db, 'userData', currentUser.value.uid))
    const uname = snap.exists() ? snap.data().displayName : currentUser.value.displayName
    await addDoc(collection(db, 'reviews'), {
      userId: currentUser.value.uid, userEmail: currentUser.value.email,
      userName: uname || currentUser.value.email,
      animalId: props.id, animalName: animal.value.name,
      text: newReviewText.value.trim(), rating: newRating.value, createdAt: serverTimestamp(),
    })
    await updateAnimalRating()
    newRating.value = 0; newReviewText.value = ''
  } catch (e) { console.error(e) }
}
async function updateAnimalRating() {
  const q = query(collection(db, 'reviews'), where('animalId', '==', props.id))
  const snap = await getDocs(q)
  const all = snap.docs.map(d => d.data())
  const avg = all.reduce((s, r) => s + (r.rating || 0), 0) / (all.length || 1)
  await updateDoc(doc(db, 'animals', props.id), { rating: Math.round(avg * 10) / 10, reviewsCount: all.length })
}
function startEditReview(review) {
  editingReviewId.value = review.id; editRating.value = review.rating; editReviewText.value = review.text
}
async function saveEditReview(id) {
  await updateDoc(doc(db, 'reviews', id), { rating: editRating.value, text: editReviewText.value.trim() })
  await updateAnimalRating(); editingReviewId.value = null
}
async function deleteReview(id) {
  if (!confirm('Удалить отзыв?')) return
  await deleteDoc(doc(db, 'reviews', id)); await updateAnimalRating()
}
function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ru-RU')
}
</script>


<style scoped>
.page { min-height: 100vh; }

.loading-page { text-align: center; padding: 6rem 2rem; color: rgba(238,248,240,0.45); }
.not-found {
  text-align: center; padding: 6rem 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.not-found-emoji { font-size: 3.5rem; }
.not-found h2 { color: #eef8f0; }
.not-found p { color: rgba(238,248,240,0.4); }
.btn-back {
  margin-top: 0.5rem;
  background: rgba(62,207,94,0.1);
  border: 1.5px solid rgba(62,207,94,0.3);
  color: #3ecf5e; font-weight: 700;
  padding: 0.6rem 1.5rem; border-radius: 10px;
}

.detail-hero {
  background: linear-gradient(180deg, rgba(62,207,94,0.05) 0%, transparent 100%);
  padding: 2rem 1.75rem 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.back-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(62,207,94,0.18);
  color: rgba(238,248,240,0.6); padding: 0.45rem 0.9rem; border-radius: 9px;
  font-size: 0.88rem; font-weight: 700; margin-bottom: 1.75rem; transition: all 0.2s;
}
.back-btn:hover { color: #eef8f0; border-color: rgba(62,207,94,0.4); background: rgba(255,255,255,0.07); }

.detail-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 2.5rem; align-items: start; }

.detail-img-wrap { position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.detail-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
.img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,18,10,0.5) 0%, transparent 50%); pointer-events: none; }
.avail-badge-lg {
  position: absolute; top: 1rem; left: 1rem;
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.9rem; border-radius: 999px;
  font-size: 0.85rem; font-weight: 800; backdrop-filter: blur(10px);
}
.avail-badge-lg.yes { background: rgba(62,207,94,0.9); color: #fff; }
.avail-badge-lg.no { background: rgba(240,82,82,0.9); color: #fff; }
.avail-dot-lg { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.avail-badge-lg.yes .avail-dot-lg { animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

.detail-info { display: flex; flex-direction: column; gap: 1.1rem; }
.info-category { font-size: 0.72rem; font-weight: 800; color: #3ecf5e; text-transform: uppercase; letter-spacing: 0.1em; }
.info-name { font-size: 2.2rem; font-weight: 900; color: #eef8f0; line-height: 1.1; }
.info-rating { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.stars-row { color: #f5c842; letter-spacing: 0.05em; }
.rating-val { font-weight: 800; color: #eef8f0; }
.rating-cnt { color: rgba(238,248,240,0.4); font-size: 0.82rem; }

.info-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tag { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.8rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(62,207,94,0.18); border-radius: 999px; font-size: 0.83rem; font-weight: 700; color: rgba(238,248,240,0.7); }
.tag-icon { font-size: 0.85rem; }
.info-desc { color: rgba(238,248,240,0.55); line-height: 1.75; font-size: 0.95rem; }

.price-block { display: flex; flex-direction: column; gap: 0.2rem; padding: 1rem 1.25rem; background: rgba(62,207,94,0.06); border: 1.5px solid rgba(62,207,94,0.18); border-radius: 14px; }
.price-label { font-size: 0.75rem; font-weight: 700; color: rgba(238,248,240,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
.price-val { font-size: 1.9rem; font-weight: 900; background: linear-gradient(135deg, #3ecf5e, #a8f0b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.booking-widget { background: rgba(17,42,28,0.8); backdrop-filter: blur(10px); border: 1.5px solid rgba(62,207,94,0.2); border-radius: 18px; padding: 1.4rem; }
.widget-head h2 { font-size: 1.05rem; font-weight: 800; margin-bottom: 1rem; color: #eef8f0; }
.widget-auth { text-align: center; padding: 0.5rem 0; }
.widget-auth p { color: rgba(238,248,240,0.45); margin-bottom: 0.85rem; font-size: 0.9rem; }

.booking-form { display: flex; flex-direction: column; gap: 0.85rem; }
.form-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.65rem; }
.fg { display: flex; flex-direction: column; gap: 0.3rem; }
.fg label { font-size: 0.78rem; font-weight: 700; color: rgba(238,248,240,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
.fg select, .fg input { font-size: 0.88rem; padding: 0.5rem 0.6rem; width: 100%; }

.btn-accent { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%); color: #fff; font-weight: 800; font-size: 0.95rem; padding: 0.65rem 1.5rem; border-radius: 11px; box-shadow: 0 3px 14px rgba(62,207,94,0.3); transition: all 0.2s; }
.btn-accent:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(62,207,94,0.45); }
.btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-accent.wide { width: 100%; }
.btn-accent.sm { padding: 0.4rem 1rem; font-size: 0.85rem; }

.spinner-sm { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.widget-unavailable { text-align: center; padding: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
.unavail-emoji { font-size: 1.75rem; }
.widget-unavailable p { color: rgba(240,82,82,0.8); font-size: 0.9rem; font-weight: 600; }

.alert { padding: 0.65rem 1rem; border-radius: 10px; font-size: 0.88rem; font-weight: 600; }
.success-alert { background: rgba(62,207,94,0.12); border: 1px solid rgba(62,207,94,0.3); color: #86efac; }
.error-alert { background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3); color: #fca5a5; }
.alert-enter-active, .alert-leave-active { transition: all 0.2s ease; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(-6px); }

.detail-main { max-width: 1200px; margin: 0 auto; padding: 0 1.75rem 4rem; }
.section { margin-bottom: 3rem; }
.section-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(62,207,94,0.12); }
.section-head h2 { font-size: 1.4rem; font-weight: 900; color: #eef8f0; }
.section-count { background: rgba(62,207,94,0.15); border: 1px solid rgba(62,207,94,0.3); color: #3ecf5e; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 800; }
.avg-rating { margin-left: auto; display: flex; align-items: center; gap: 0.35rem; }
.avg-stars { color: #f5c842; font-size: 1.1rem; }
.avg-val { font-size: 1rem; font-weight: 800; color: #eef8f0; }

.add-review-card { background: rgba(17,42,28,0.6); border: 1.5px solid rgba(62,207,94,0.18); border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; }
.add-review-card h3 { font-size: 1rem; font-weight: 800; color: rgba(238,248,240,0.75); }
.star-picker { display: flex; align-items: center; gap: 0.2rem; }
.star-btn { background: none; font-size: 1.6rem; color: rgba(238,248,240,0.2); padding: 0; line-height: 1; transition: all 0.15s; }
.star-btn.active, .star-btn.hover { color: #f5c842; transform: scale(1.1); }
.rating-label { font-size: 0.82rem; font-weight: 700; color: rgba(238,248,240,0.5); margin-left: 0.5rem; }
.add-review-card textarea { width: 100%; resize: vertical; min-height: 80px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(62,207,94,0.15); border-radius: 10px; }

.empty-reviews { text-align: center; padding: 3rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(238,248,240,0.35); font-size: 0.95rem; }
.empty-reviews span { font-size: 2.5rem; }

.review-card { background: rgba(17,42,28,0.5); border: 1.5px solid rgba(62,207,94,0.1); border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 0.85rem; transition: border-color 0.2s; }
.review-card:hover { border-color: rgba(62,207,94,0.25); }
.review-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.7rem; }
.reviewer-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #3ecf5e, #1e8a38); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; color: #fff; flex-shrink: 0; }
.reviewer-info { display: flex; flex-direction: column; }
.reviewer-name { font-weight: 700; font-size: 0.9rem; color: #eef8f0; }
.review-date { font-size: 0.78rem; color: rgba(238,248,240,0.35); }
.review-stars-display { margin-left: auto; color: #f5c842; font-size: 0.95rem; letter-spacing: 0.04em; }
.empty-stars { color: rgba(238,248,240,0.15); }
.review-text { color: rgba(238,248,240,0.65); line-height: 1.7; font-size: 0.93rem; }
.edit-review-wrap { display: flex; flex-direction: column; gap: 0.6rem; margin: 0.5rem 0; }
.edit-review-wrap textarea { width: 100%; }
.edit-actions { display: flex; gap: 0.5rem; }
.review-own-actions { display: flex; gap: 0.5rem; margin-top: 0.65rem; padding-top: 0.65rem; border-top: 1px solid rgba(62,207,94,0.08); }

.btn-ghost { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(238,248,240,0.5); border-radius: 8px; font-weight: 700; padding: 0.45rem 1rem; font-size: 0.88rem; transition: all 0.15s; }
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: #eef8f0; }
.btn-ghost.danger:hover { border-color: rgba(240,82,82,0.4); color: #f87171; }
.btn-ghost.sm { padding: 0.35rem 0.85rem; font-size: 0.82rem; }
.btn-ghost.xs { padding: 0.25rem 0.65rem; font-size: 0.78rem; }

.similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.similar-card { position: relative; border-radius: 14px; overflow: hidden; cursor: pointer; border: 1.5px solid rgba(62,207,94,0.12); aspect-ratio: 3/2; transition: all 0.25s; }
.similar-card:hover { border-color: rgba(62,207,94,0.4); transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.45); }
.similar-img { width: 100%; height: 100%; object-fit: cover; }
.similar-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,18,10,0.88) 0%, transparent 55%); }
.similar-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.15rem; }
.similar-info strong { font-size: 0.95rem; font-weight: 800; color: #eef8f0; }
.similar-info span { font-size: 0.78rem; color: rgba(238,248,240,0.55); }
.similar-price { background: linear-gradient(135deg, #3ecf5e, #a8f0b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800 !important; font-size: 0.88rem !important; }

@media (max-width: 800px) {
  .detail-hero { padding: 1.25rem 1rem 1.5rem; }
  .detail-grid { grid-template-columns: 1fr; }
  .form-row3 { grid-template-columns: 1fr; }
  .detail-main { padding: 0 1rem 3rem; }
}
</style>
