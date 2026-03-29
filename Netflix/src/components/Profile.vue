<template>
  <div class="profile-content">
    <div class="profile-sidebar">
      <div class="user-avatar">
        <div class="avatar-circle">
          {{ user?.email?.[0]?.toUpperCase() || 'U' }}
        </div>
        <h3>{{ editProfile.displayName || user?.email?.split('@')[0] || 'Пользователь' }}</h3>
        <p class="user-email">{{ user?.email }}</p>
      </div>

      <div class="profile-nav">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['nav-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
        </button>
      </div>
    </div>

    <div class="profile-main">
      <!-- Вкладка профиля -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <h2>Редактировать профиль</h2>
        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-group">
            <label>Имя пользователя</label>
            <input
                type="text"
                v-model="editProfile.displayName"
                placeholder="Ваше имя"
                class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
                type="email"
                v-model="editProfile.email"
                disabled
                class="form-input disabled"
            />
          </div>

          <div class="form-group">
            <label>Дата рождения</label>
            <input
                type="date"
                v-model="editProfile.birthDate"
                class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Любимые жанры</label>
            <div class="genres-checkbox">
              <label v-for="genre in genres" :key="genre" class="genre-checkbox">
                <input
                    type="checkbox"
                    :value="genre"
                    v-model="editProfile.favoriteGenres"
                />
                {{ genre }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>О себе</label>
            <textarea
                v-model="editProfile.bio"
                rows="4"
                placeholder="Расскажите о себе..."
                class="form-input"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Вкладка отзывов -->
      <div v-if="activeTab === 'reviews'" class="tab-content">
        <h2>Мои отзывы</h2>

        <div v-if="loadingReviews" class="loading">Загрузка...</div>
        <div v-else-if="userReviews.length === 0" class="empty-state">
          <p>У вас пока нет отзывов</p>
        </div>

        <div v-else class="reviews-list">
          <div v-for="review in userReviews" :key="review.id" class="review-card">
            <div class="review-header">
              <div class="movie-info">
                <div>
                  <h4>{{ review.movieTitle || 'Фильм' }}</h4>
                  <div class="review-date">{{ formatDate(review.createdAt) }}</div>
                </div>
              </div>
              <div class="review-actions">
                <button @click="editReview(review)" class="icon-btn edit">✏️</button>
                <button @click="deleteReview(review.id)" class="icon-btn delete">🗑️</button>
              </div>
            </div>
            <p class="review-text">{{ review.text }}</p>
            <div class="review-likes">
              👍 {{ review.likes || 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка статистики -->
      <div v-if="activeTab === 'stats'" class="tab-content">
        <h2>Моя статистика</h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalReviews }}</div>
            <div class="stat-label">Отзывов написано</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">{{ stats.totalRatings }}</div>
            <div class="stat-label">Фильмов оценено</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">{{ stats.averageRating || 0 }}</div>
            <div class="stat-label">Средняя оценка</div>
          </div>
        </div>

        <div class="favorite-genres" v-if="stats.favoriteGenres.length > 0">
          <h3>Любимые жанры</h3>
          <div class="genres-tags">
            <span v-for="genre in stats.favoriteGenres" :key="genre" class="genre-tag">
              {{ genre }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, deleteDoc,
  orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { updateProfile as updateFirebaseProfile } from 'firebase/auth'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const activeTab = ref('profile')
const saving = ref(false)
const loadingReviews = ref(false)

const tabs = [
  { id: 'profile', name: 'Профиль', icon: '👤' },
  { id: 'reviews', name: 'Мои отзывы', icon: '💬' },
  { id: 'stats', name: 'Статистика', icon: '📊' }
]

const genres = ['Боевик', 'Комедия', 'Драма', 'Фантастика', 'Ужасы', 'Триллер', 'Мелодрама', 'Документальный']


const editProfile = ref({
  displayName: '',
  email: '',
  birthDate: '',
  favoriteGenres: [],
  bio: ''
})


const userReviews = ref([])


const stats = ref({
  totalReviews: 0,
  totalRatings: 0,
  averageRating: 0,
  favoriteGenres: []
})


const formatDate = (timestamp) => {
  if (!timestamp) return 'Недавно'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ru-RU')
}


const loadProfile = async () => {
  if (!props.user) return

  try {
    const userDataRef = doc(db, 'userData', props.user.uid)
    const userDataDoc = await getDoc(userDataRef)

    if (userDataDoc.exists()) {
      const data = userDataDoc.data()
      editProfile.value = {
        displayName: data.displayName || props.user.displayName || '',
        email: props.user.email || '',
        birthDate: data.birthDate || '',
        favoriteGenres: data.favoriteGenres || [],
        bio: data.bio || ''
      }
    } else {
      editProfile.value = {
        displayName: props.user.displayName || '',
        email: props.user.email || '',
        birthDate: '',
        favoriteGenres: [],
        bio: ''
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
  }
}


const updateProfile = async () => {
  if (!props.user) {
    alert('Ошибка: пользователь не авторизован')
    return
  }

  saving.value = true
  try {
    const userDataRef = doc(db, 'userData', props.user.uid)
    await setDoc(userDataRef, {
      displayName: editProfile.value.displayName,
      birthDate: editProfile.value.birthDate,
      favoriteGenres: editProfile.value.favoriteGenres,
      bio: editProfile.value.bio,
      updatedAt: serverTimestamp()
    }, { merge: true })

    if (editProfile.value.displayName && editProfile.value.displayName !== props.user.displayName) {
      await updateFirebaseProfile(props.user, {
        displayName: editProfile.value.displayName
      })
    }

    alert('Профиль успешно обновлен!')
  } catch (error) {
    console.error('Ошибка обновления профиля:', error)
    alert('Ошибка при обновлении профиля: ' + error.message)
  } finally {
    saving.value = false
  }
}


const loadUserReviews = async () => {
  if (!props.user) return

  loadingReviews.value = true
  try {
    const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', props.user.uid),
        orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(reviewsQuery)
    userReviews.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    stats.value.totalReviews = userReviews.value.length
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error)
  } finally {
    loadingReviews.value = false
  }
}


const loadUserRatings = async () => {
  if (!props.user) return

  try {
    const ratingsQuery = query(
        collection(db, 'userRatings'),
        where('userId', '==', props.user.uid)
    )

    const snapshot = await getDocs(ratingsQuery)
    const ratings = snapshot.docs.map(doc => doc.data().rating)

    stats.value.totalRatings = ratings.length
    if (ratings.length > 0) {
      const sum = ratings.reduce((a, b) => a + b, 0)
      stats.value.averageRating = (sum / ratings.length).toFixed(1)
    }

    const genreCount = {}
    userReviews.value.forEach(review => {
      if (review.movieGenres && Array.isArray(review.movieGenres)) {
        review.movieGenres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      }
    })

    const sortedGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(g => g[0])

    stats.value.favoriteGenres = sortedGenres
  } catch (error) {
    console.error('Ошибка загрузки оценок:', error)
  }
}


const deleteReview = async (reviewId) => {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return

  try {
    await deleteDoc(doc(db, 'reviews', reviewId))
    userReviews.value = userReviews.value.filter(r => r.id !== reviewId)
    stats.value.totalReviews = userReviews.value.length
    alert('Отзыв удален')
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error)
    alert('Ошибка при удалении отзыва')
  }
}


const editReview = (review) => {
  const newText = prompt('Редактировать отзыв:', review.text)
  if (newText && newText.trim()) {
    updateDoc(doc(db, 'reviews', review.id), {
      text: newText.trim(),
      updatedAt: serverTimestamp()
    }).then(() => {
      review.text = newText.trim()
      alert('Отзыв обновлен')
    }).catch(error => console.error('Ошибка:', error))
  }
}

watch(() => props.user, (newUser) => {
  if (newUser) {
    loadProfile()
    loadUserReviews()
    loadUserRatings()
  }
})

onMounted(() => {
  if (props.user) {
    loadProfile()
    loadUserReviews()
    loadUserRatings()
  }
})
</script>

<style scoped>
.profile-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  gap: 40px;
  min-height: calc(100vh - 80px);
}

.profile-sidebar {
  width: 300px;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 30px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.user-avatar {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  margin: 0 auto 15px;
  color: white;
}

.user-avatar h3 {
  margin: 10px 0 5px;
  font-size: 18px;
  color: white;
}

.user-avatar .user-email {
  color: #aaa;
  font-size: 12px;
  margin-top: 5px;
  word-break: break-all;
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  width: 100%;
  text-align: left;
}

.nav-btn:hover {
  background: #333;
  color: white;
}

.nav-btn.active {
  background: #e50914;
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.profile-main {
  flex: 1;
}

.tab-content h2 {
  font-size: 28px;
  margin-bottom: 30px;
  color: white;
}

.profile-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background: #333;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
}

.form-input.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.genres-checkbox {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.genre-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: white;
}

.genre-checkbox input {
  cursor: pointer;
}

.form-actions {
  margin-top: 30px;
}

.btn-primary {
  padding: 12px 24px;
  background: #e50914;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #f40612;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  border-left: 3px solid #e50914;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
}

.movie-info h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: white;
}

.review-date {
  color: #666;
  font-size: 12px;
}

.review-text {
  color: #ddd;
  line-height: 1.6;
  margin: 10px 0;
}

.review-likes {
  color: #aaa;
  font-size: 13px;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 6px;
  transition: all 0.3s;
  color: white;
}

.icon-btn.edit:hover {
  background: #4a4a4a;
}

.icon-btn.delete:hover {
  background: #e50914;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: #1a1a1a;
  padding: 25px;
  text-align: center;
  border-radius: 12px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #e50914;
  margin-bottom: 10px;
}

.stat-label {
  color: #aaa;
  font-size: 14px;
}

.favorite-genres h3 {
  margin-bottom: 15px;
  font-size: 20px;
  color: white;
}

.genres-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.genre-tag {
  padding: 6px 12px;
  background: #333;
  border-radius: 20px;
  font-size: 14px;
  color: white;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: #aaa;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    padding: 20px;
  }

  .profile-sidebar {
    width: 100%;
    position: static;
    padding: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>