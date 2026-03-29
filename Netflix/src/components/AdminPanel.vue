<template>
  <div class="admin-panel">
    <div class="admin-sidebar">
      <div class="admin-logo">
        <h2>🎬 Admin Panel</h2>
      </div>
      <div class="admin-nav">
        <button
            v-for="item in navItems"
            :key="item.id"
            :class="['nav-item', { active: activeSection === item.id }]"
            @click="activeSection = item.id"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </button>
      </div>
    </div>

    <div class="admin-content">
      <!-- Статистика -->
      <div v-if="activeSection === 'dashboard'" class="dashboard">
        <h1>Дашборд</h1>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalMovies }}</div>
            <div class="stat-label">Фильмов</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">Пользователей</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalReviews }}</div>
            <div class="stat-label">Отзывов</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalRatings }}</div>
            <div class="stat-label">Оценок</div>
          </div>
        </div>

        <div class="recent-activity">
          <h3>Последняя активность</h3>
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <span class="activity-icon">{{ getActivityIcon(activity.action) }}</span>
            <span class="activity-text">{{ activity.details }}</span>
            <span class="activity-time">{{ formatDate(activity.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- Управление фильмами -->
      <div v-if="activeSection === 'movies'" class="movies-management">
        <div class="section-header">
          <h1>Управление фильмами</h1>
          <button class="btn-add" @click="openMovieModal()">➕ Добавить фильм</button>
        </div>

        <div class="search-bar">
          <input
              type="text"
              v-model="movieSearch"
              placeholder="Поиск фильмов..."
              class="search-input"
          />
        </div>

        <div class="movies-table">
          <table>
            <thead>
            <tr>
              <th>Постер</th>
              <th>Название</th>
              <th>Рейтинг</th>
              <th>Кол-во оценок</th>
              <th>Отзывы</th>
              <th>Год</th>
              <th>Жанр</th>
              <th>Длит.</th>
              <th>Возраст</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="movie in filteredMovies" :key="movie.id">
              <td><img :src="movie.poster" class="table-poster" /></td>
              <td><strong>{{ movie.title }}</strong></td>
              <td>⭐ {{ movie.rating || '—' }}</td>
              <td>{{ formatNumber(movie.ratingCount) || 0 }}</td>
              <td>{{ movie.commentsCount || 0 }}</td>
              <td>{{ movie.year || '—' }}</td>
              <td>{{ movie.genre || '—' }}</td>
              <td>{{ movie.duration || '—' }} мин</td>
              <td>{{ movie.ageRating || '—' }}+</td>
              <td class="actions">
                <button @click="openMovieModal(movie)" class="btn-edit">✏️</button>
                <button @click="deleteMovie(movie.id)" class="btn-delete">🗑️</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Управление пользователями -->
      <div v-if="activeSection === 'users'" class="users-management">
        <div class="section-header">
          <h1>Управление пользователями</h1>
        </div>

        <div class="search-bar">
          <input
              type="text"
              v-model="userSearch"
              placeholder="Поиск пользователей..."
              class="search-input"
          />
        </div>

        <div class="users-table">
          <table>
            <thead>
            <tr>
              <th>Аватар</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Отзывов</th>
              <th>Оценок</th>
              <th>Дата регистрации</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="user in filteredUsers" :key="user.uid">
              <td><div class="user-avatar-small">{{ user.email?.[0]?.toUpperCase() }}</div></td>
              <td>{{ user.email }}</td>
              <td>{{ user.displayName || '-' }}</td>
              <td>
                <select v-model="user.role" @change="updateUserRole(user)">
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </td>
              <td>{{ user.reviewsCount || 0 }}</td>
              <td>{{ user.ratingsCount || 0 }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td class="actions">
                <button @click="deleteUser(user.uid)" class="btn-delete">🗑️</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Модерация отзывов -->
      <div v-if="activeSection === 'reviews'" class="reviews-management">
        <div class="section-header">
          <h1>Модерация отзывов</h1>
        </div>

        <div class="search-bar">
          <input
              type="text"
              v-model="reviewSearch"
              placeholder="Поиск отзывов..."
              class="search-input"
          />
        </div>

        <div class="reviews-table">
          <table>
            <thead>
            <tr>
              <th>Пользователь</th>
              <th>Фильм</th>
              <th>Отзыв</th>
              <th>Оценка</th>
              <th>Лайки</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="review in filteredReviews" :key="review.id">
              <td>{{ review.userName }}</td>
              <td>{{ review.movieTitle }}</td>
              <td class="review-text-cell">{{ review.text }}</td>
              <td>{{ review.rating ? '⭐ ' + review.rating : '—' }}</td>
              <td>👍 {{ review.likes || 0 }}</td>
              <td>{{ formatDate(review.createdAt) }}</td>
              <td class="actions">
                <button @click="deleteReview(review.id)" class="btn-delete">🗑️</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Логи действий -->
      <div v-if="activeSection === 'logs'" class="logs-management">
        <div class="section-header">
          <h1>Логи действий</h1>
        </div>

        <div class="logs-list">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-header">
              <span class="log-user">{{ log.userEmail }}</span>
              <span class="log-action">{{ log.action }}</span>
              <span class="log-time">{{ formatDate(log.timestamp) }}</span>
            </div>
            <div class="log-details">{{ log.details }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для редактирования фильма -->
    <div v-if="showMovieModal" class="modal-overlay" @click.self="closeMovieModal">
      <div class="modal-content">
        <h2>{{ editingMovie ? 'Редактировать фильм' : 'Добавить фильм' }}</h2>
        <form @submit.prevent="saveMovie" class="movie-form">
          <div class="form-row">
            <div class="form-group">
              <label>Название *</label>
              <input v-model="movieForm.title" required class="form-input" />
            </div>
            <div class="form-group">
              <label>Год *</label>
              <input v-model="movieForm.year" required class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Жанр *</label>
              <select v-model="movieForm.genre" required class="form-input">
                <option value="">Выберите жанр</option>
                <option value="Боевик">Боевик</option>
                <option value="Комедия">Комедия</option>
                <option value="Драма">Драма</option>
                <option value="Фантастика">Фантастика</option>
                <option value="Ужасы">Ужасы</option>
                <option value="Триллер">Триллер</option>
                <option value="Мелодрама">Мелодрама</option>
                <option value="Документальный">Документальный</option>
              </select>
            </div>
            <div class="form-group">
              <label>Длительность (мин) *</label>
              <input v-model="movieForm.duration" required class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Возрастной рейтинг</label>
              <input v-model="movieForm.ageRating" placeholder="16" class="form-input" />
            </div>
            <div class="form-group">
              <label>Рейтинг (из внешних источников)</label>
              <input v-model="movieForm.rating" type="number" step="0.1" placeholder="0" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Количество оценок (из внешних источников)</label>
              <input v-model="movieForm.ratingCount" type="number" step="1" placeholder="0" class="form-input" />
            </div>
            <div class="form-group">
              <label>Количество отзывов</label>
              <input v-model="movieForm.commentsCount" type="number" step="1" placeholder="0" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>URL постера *</label>
            <input v-model="movieForm.poster" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="movieForm.description" rows="4" class="form-input" placeholder="Описание фильма..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" @click="closeMovieModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, limit, where, getDoc, serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeSection = ref('dashboard')
const currentUser = ref(null)
const isAdmin = ref(false)

const navItems = [
  { id: 'dashboard', name: 'Дашборд', icon: '📊' },
  { id: 'movies', name: 'Фильмы', icon: '🎬' },
  { id: 'users', name: 'Пользователи', icon: '👥' },
  { id: 'reviews', name: 'Отзывы', icon: '💬' },
  { id: 'logs', name: 'Логи', icon: '📝' }
]


const stats = ref({
  totalMovies: 0,
  totalUsers: 0,
  totalReviews: 0,
  totalRatings: 0
})

const recentActivities = ref([])


const movies = ref([])
const movieSearch = ref('')
const showMovieModal = ref(false)
const editingMovie = ref(null)
const movieForm = ref({
  title: '',
  year: '',
  genre: '',
  duration: '',
  ageRating: '',
  rating: '',
  ratingCount: '',
  commentsCount: '',
  poster: '',
  description: ''
})


const users = ref([])
const userSearch = ref('')


const reviews = ref([])
const reviewSearch = ref('')


const logs = ref([])


const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const filteredMovies = computed(() => {
  if (!movieSearch.value) return movies.value
  const search = movieSearch.value.toLowerCase()
  return movies.value.filter(m => m.title?.toLowerCase().includes(search))
})

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  const search = userSearch.value.toLowerCase()
  return users.value.filter(u =>
      u.email?.toLowerCase().includes(search) ||
      u.displayName?.toLowerCase().includes(search)
  )
})

const filteredReviews = computed(() => {
  if (!reviewSearch.value) return reviews.value
  const search = reviewSearch.value.toLowerCase()
  return reviews.value.filter(r =>
      r.text?.toLowerCase().includes(search) ||
      r.userName?.toLowerCase().includes(search)
  )
})

const formatDate = (timestamp) => {
  if (!timestamp) return 'Недавно'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getActivityIcon = (action) => {
  const icons = {
    movie_add: '🎬',
    movie_edit: '✏️',
    movie_delete: '🗑️',
    user_role: '👤',
    review_delete: '💬',
    review_add: '💬'
  }
  return icons[action] || '📌'
}


const loadStats = async () => {
  try {
    const moviesSnap = await getDocs(collection(db, 'movies'))
    const usersSnap = await getDocs(collection(db, 'userData'))
    const reviewsSnap = await getDocs(collection(db, 'reviews'))
    const ratingsSnap = await getDocs(collection(db, 'userRatings'))

    stats.value = {
      totalMovies: moviesSnap.size,
      totalUsers: usersSnap.size,
      totalReviews: reviewsSnap.size,
      totalRatings: ratingsSnap.size
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  }
}


const loadRecentActivity = async () => {
  try {
    const logsQuery = query(
        collection(db, 'adminLogs'),
        orderBy('timestamp', 'desc'),
        limit(10)
    )
    const snapshot = await getDocs(logsQuery)
    recentActivities.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Ошибка загрузки активности:', error)
  }
}


const loadMovies = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'movies'))
    movies.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Ошибка загрузки фильмов:', error)
  }
}


const loadUsers = async () => {
  try {
    const usersSnap = await getDocs(collection(db, 'userData'))

    const reviewsSnap = await getDocs(collection(db, 'reviews'))
    const ratingsSnap = await getDocs(collection(db, 'userRatings'))

    const reviewsCount = {}
    const ratingsCount = {}

    reviewsSnap.forEach(doc => {
      const userId = doc.data().userId
      reviewsCount[userId] = (reviewsCount[userId] || 0) + 1
    })

    ratingsSnap.forEach(doc => {
      const userId = doc.data().userId
      ratingsCount[userId] = (ratingsCount[userId] || 0) + 1
    })

    users.value = usersSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      reviewsCount: reviewsCount[doc.id] || 0,
      ratingsCount: ratingsCount[doc.id] || 0
    }))
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error)
  }
}


const loadReviews = async () => {
  try {
    const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(reviewsQuery)
    reviews.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error)
  }
}


const loadLogs = async () => {
  try {
    const logsQuery = query(
        collection(db, 'adminLogs'),
        orderBy('timestamp', 'desc'),
        limit(50)
    )
    const snapshot = await getDocs(logsQuery)
    logs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Ошибка загрузки логов:', error)
  }
}


const addLog = async (action, details) => {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      action,
      details,
      userEmail: currentUser.value?.email,
      userId: currentUser.value?.uid,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Ошибка сохранения лога:', error)
  }
}


const openMovieModal = (movie = null) => {
  if (movie) {
    editingMovie.value = movie
    movieForm.value = { ...movie }
  } else {
    editingMovie.value = null
    movieForm.value = {
      title: '',
      year: '',
      genre: '',
      duration: '',
      ageRating: '',
      rating: '0',
      ratingCount: '0',
      commentsCount: '0',
      poster: '',
      description: ''
    }
  }
  showMovieModal.value = true
}

const closeMovieModal = () => {
  showMovieModal.value = false
  editingMovie.value = null
}

const saveMovie = async () => {
  try {
    const movieData = {
      title: movieForm.value.title,
      year: movieForm.value.year,
      genre: movieForm.value.genre,
      duration: movieForm.value.duration,
      ageRating: movieForm.value.ageRating || '16',
      rating: parseFloat(movieForm.value.rating) || 0,
      ratingCount: parseInt(movieForm.value.ratingCount) || 0,
      commentsCount: parseInt(movieForm.value.commentsCount) || 0,
      poster: movieForm.value.poster,
      description: movieForm.value.description || '',
      isFavorite: editingMovie.value?.isFavorite || false
    }

    if (editingMovie.value) {
      await updateDoc(doc(db, 'movies', editingMovie.value.id), movieData)
      await addLog('movie_edit', `Редактирован фильм: ${movieData.title}`)
      alert('Фильм обновлен!')
    } else {
      await addDoc(collection(db, 'movies'), movieData)
      await addLog('movie_add', `Добавлен фильм: ${movieData.title}`)
      alert('Фильм добавлен!')
    }

    closeMovieModal()
    await loadMovies()
    await loadStats()
  } catch (error) {
    console.error('Ошибка сохранения фильма:', error)
    alert('Ошибка при сохранении фильма')
  }
}


const deleteMovie = async (movieId) => {
  if (!confirm('Вы уверены, что хотите удалить этот фильм? Это также удалит все отзывы к нему.')) return

  try {
    const movie = movies.value.find(m => m.id === movieId)

    const reviewsQuery = query(
        collection(db, 'reviews'),
        where('movieId', '==', movieId)
    )
    const reviewsSnapshot = await getDocs(reviewsQuery)
    for (const review of reviewsSnapshot.docs) {
      await deleteDoc(review.ref)
    }

    await deleteDoc(doc(db, 'movies', movieId))
    await addLog('movie_delete', `Удален фильм: ${movie?.title} и ${reviewsSnapshot.size} отзывов`)
    alert('Фильм и все отзывы к нему удалены!')
    await loadMovies()
    await loadReviews()
    await loadStats()
  } catch (error) {
    console.error('Ошибка удаления фильма:', error)
    alert('Ошибка при удалении фильма')
  }
}


const updateUserRole = async (user) => {
  try {
    await updateDoc(doc(db, 'userData', user.uid), {
      role: user.role
    })
    await addLog('user_role', `Изменена роль пользователя ${user.email} на ${user.role}`)
    alert('Роль пользователя обновлена!')
  } catch (error) {
    console.error('Ошибка обновления роли:', error)
    alert('Ошибка при обновлении роли')
  }
}


const deleteUser = async (userId) => {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя? Все его отзывы также будут удалены.')) return

  try {
    const user = users.value.find(u => u.uid === userId)

    const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
    )
    const reviewsSnapshot = await getDocs(reviewsQuery)
    for (const review of reviewsSnapshot.docs) {
      await deleteDoc(review.ref)
    }

    const ratingsQuery = query(
        collection(db, 'userRatings'),
        where('userId', '==', userId)
    )
    const ratingsSnapshot = await getDocs(ratingsQuery)
    for (const rating of ratingsSnapshot.docs) {
      await deleteDoc(rating.ref)
    }

    await deleteDoc(doc(db, 'userData', userId))
    await addLog('user_delete', `Удален пользователь: ${user?.email} (отзывов: ${reviewsSnapshot.size})`)
    alert('Пользователь и все его данные удалены!')
    await loadUsers()
    await loadReviews()
    await loadStats()
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error)
    alert('Ошибка при удалении пользователя')
  }
}


const deleteReview = async (reviewId) => {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return

  try {
    const review = reviews.value.find(r => r.id === reviewId)
    await deleteDoc(doc(db, 'reviews', reviewId))

    if (review?.movieId) {
      const movieRef = doc(db, 'movies', review.movieId)
      const movieDoc = await getDoc(movieRef)
      if (movieDoc.exists()) {
        await updateDoc(movieRef, {
          commentsCount: (movieDoc.data().commentsCount || 1) - 1
        })
      }
    }

    await addLog('review_delete', `Удален отзыв пользователя ${review?.userName} к фильму "${review?.movieTitle}"`)
    alert('Отзыв удален!')
    await loadReviews()
    await loadStats()
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error)
    alert('Ошибка при удалении отзыва')
  }
}


onMounted(async () => {
  onAuthStateChanged(auth, async (user) => {
    currentUser.value = user

    if (user) {
      try {
        const userDataRef = doc(db, 'userData', user.uid)
        const userData = await getDoc(userDataRef)

        if (userData.exists() && userData.data().role === 'admin') {
          isAdmin.value = true
          await loadStats()
          await loadRecentActivity()
          await loadMovies()
          await loadUsers()
          await loadReviews()
          await loadLogs()
        } else {
          alert('У вас нет прав администратора')
          router.push('/')
        }
      } catch (error) {
        console.error('Ошибка проверки прав:', error)
        router.push('/')
      }
    } else {
      router.push('/')
    }
  })
})
</script>

<style scoped>
.admin-panel {
  display: flex;
  min-height: 100vh;
  background: #141414;
  color: white;
}

.admin-sidebar {
  width: 280px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.admin-logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
}

.admin-logo h2 {
  color: #e50914;
  font-size: 20px;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 15px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #333;
  color: white;
}

.nav-item.active {
  background: #e50914;
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.admin-content {
  flex: 1;
  margin-left: 280px;
  padding: 30px;
  overflow-y: auto;
  min-height: 100vh;
}

.dashboard h1,
.section-header h1 {
  font-size: 28px;
  margin-bottom: 30px;
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

.recent-activity {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
}

.recent-activity h3 {
  margin-bottom: 20px;
  font-size: 20px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-bottom: 1px solid #333;
}

.activity-icon {
  font-size: 20px;
}

.activity-text {
  flex: 1;
}

.activity-time {
  color: #666;
  font-size: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.btn-add {
  padding: 10px 20px;
  background: #e50914;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #f40612;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  background: #333;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

.movies-table,
.users-table,
.reviews-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #333;
}

th {
  color: #aaa;
  font-weight: 500;
  background: #1a1a1a;
  position: sticky;
  top: 0;
}

.table-poster {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
}

.user-avatar-small {
  width: 40px;
  height: 40px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.review-text-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.btn-edit, .btn-delete {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-edit {
  background: #4a4a4a;
  color: white;
}

.btn-delete {
  background: #e50914;
  color: white;
}

select {
  padding: 5px 10px;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-item {
  background: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
}

.log-user {
  color: #e50914;
  font-weight: bold;
}

.log-action {
  color: #ffd700;
}

.log-time {
  color: #666;
  font-size: 12px;
}

.log-details {
  color: #aaa;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: white;
}

.movie-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #aaa;
  font-size: 14px;
}

.form-input {
  padding: 10px;
  background: #333;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #e50914;
  color: white;
}

.btn-secondary {
  background: #333;
  color: white;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }

  .admin-content {
    margin-left: 0;
    padding: 20px;
  }

  .admin-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    white-space: nowrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 12px;
  }

  th, td {
    padding: 8px 4px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .review-text-cell {
    max-width: 150px;
  }
}
</style>npx @drmhse/remove-comments@latest .