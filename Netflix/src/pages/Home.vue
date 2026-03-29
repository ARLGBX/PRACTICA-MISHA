<template>
  <div class="container">
    <nav class="navbar">
      <div class="nav-left">
        <div class="logo" @click="resetFilters">NETFLIX</div>
        <div class="nav-links">
          <router-link to="/profile" class="nav-link">Мой профиль</router-link>
          <router-link v-if="isAdmin" to="/admin" class="nav-link admin-link">🔧 Админка</router-link>
        </div>
      </div>

      <div class="nav-right">
        <div class="search-container">
          <input
              class="search"
              type="text"
              placeholder="Поиск фильмов..."
              v-model="searchQuery"
              @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>

        <div class="filter-sort-container">
          <button class="filter-btn" @click="showFilters = !showFilters">
            ⚙️ Фильтры
          </button>
          <select v-model="sortBy" class="sort-select" @change="handleSortChange">
            <option value="rating_desc">По рейтингу ↓</option>
            <option value="rating_asc">По рейтингу ↑</option>
            <option value="year_desc">По году ↓</option>
            <option value="year_asc">По году ↑</option>
            <option value="title_asc">По названию А-Я</option>
            <option value="title_desc">По названию Я-А</option>
            <option value="comments_desc">По популярности ↓</option>
          </select>
        </div>

        <div class="user-menu" @click="showUserMenu = !showUserMenu">
          <div class="user-icon">
            <span v-if="user">{{ user.email?.[0]?.toUpperCase() || '👤' }}</span>
            <span v-else>👤</span>
          </div>
          <div v-if="showUserMenu" class="user-dropdown" @click.stop>
            <div v-if="user" class="user-info">
              <div class="user-email">{{ user.email }}</div>
              <button @click="logout" class="logout-btn">Выйти</button>
            </div>
            <button v-else @click="showAuthModal = true" class="login-btn">Войти</button>
          </div>
        </div>
      </div>
    </nav>

    <div v-if="showFilters" class="filters-panel">
      <div class="filters-header">
        <h3>Фильтры</h3>
        <button class="reset-filters" @click="resetFilters">Сбросить все</button>
      </div>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Жанр</label>
          <select v-model="filters.genre">
            <option value="">Все жанры</option>
            <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Год выпуска</label>
          <div class="year-range">
            <input type="number" v-model="filters.yearFrom" placeholder="От" class="year-input" />
            <span>-</span>
            <input type="number" v-model="filters.yearTo" placeholder="До" class="year-input" />
          </div>
        </div>
        <div class="filter-group">
          <label>Рейтинг</label>
          <div class="rating-range">
            <input type="range" v-model="filters.ratingMin" min="0" max="10" step="0.5" />
            <span>{{ filters.ratingMin }} - 10</span>
          </div>
        </div>
        <div class="filter-group">
          <label>Длительность (мин)</label>
          <div class="duration-range">
            <input type="number" v-model="filters.durationMax" placeholder="Макс." class="duration-input" />
            <span>мин</span>
          </div>
        </div>
        <div class="filter-group">
          <label>Возрастной рейтинг</label>
          <select v-model="filters.ageRating">
            <option value="">Любой</option>
            <option value="0">0+</option>
            <option value="6">6+</option>
            <option value="12">12+</option>
            <option value="16">16+</option>
            <option value="18">18+</option>
          </select>
        </div>
      </div>
    </div>

    <div class="results-header">
      <h2>{{ showFavoritesOnly ? 'Избранные фильмы' : '' }}</h2>
      <div class="results-info">
        <span>Найдено: {{ filteredMovies.length }} фильмов</span>
        <button v-if="showFavoritesOnly" class="show-all" @click="showFavoritesOnly = false">
          Показать все
        </button>
        <button v-else class="show-favorites" @click="showFavoritesOnly = true">
          ⭐ Избранное
        </button>
      </div>
    </div>

    <div class="carousel-container">
      <div class="carousel-header">
        <div class="carousel-controls">
          <button class="control-btn prev" @click="prevSlide" :disabled="currentSlide === 0">❮</button>
          <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>
          <button class="control-btn next" @click="nextSlide" :disabled="currentSlide >= totalSlides - 1">❯</button>
        </div>
      </div>

      <div class="carousel-wrapper">
        <div class="carousel-track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
          <div v-for="(slideGroup, slideIndex) in movieSlides" :key="slideIndex" class="carousel-slide">
            <div v-for="movie in slideGroup" :key="movie.id" class="card" @click="goToMovie(movie.id)">
              <div class="card-poster" :style="{ backgroundImage: `url(${movie.poster})` }">
                <div class="favorite-badge" @click.stop="toggleFavorite(movie)">
                  <span v-if="movie.isFavorite">❤️</span>
                  <span v-else>🤍</span>
                </div>
                <div class="card-gradient"></div>
                <div class="card-info">
                  <h3>{{ movie.title }}</h3>
                  <div class="rating-section">
                    <div class="rating-stars">
                      <span class="star">⭐</span>
                      <span class="rating-value">{{ movie.rating }}</span>
                      <span class="rating-count">({{ formatNumber(movie.ratingCount) }})</span>
                    </div>
                  </div>
                  <div class="comments-section">
                    <span class="comment-icon">💬</span>
                    <span class="comment-count">{{ formatNumber(movie.commentsCount) }} комментариев</span>
                  </div>
                  <div class="movie-meta">
                    <span class="year">{{ movie.year }} год</span>
                    <span class="duration">{{ movie.duration }} мин</span>
                    <span class="age-rating">{{ movie.ageRating }}+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="carousel-dots" v-if="totalSlides > 1">
        <button v-for="(_, index) in totalSlides" :key="index" class="dot" :class="{ active: currentSlide === index }" @click="goToSlide(index)"></button>
      </div>
    </div>

    <div v-if="paginatedMovies.length > 0 && !showFavoritesOnly" class="movies-grid-section">
      <h2>Все фильмы</h2>
      <div class="movies-grid">
        <div v-for="movie in paginatedMovies" :key="movie.id" class="grid-card" @click="goToMovie(movie.id)">
          <img :src="movie.poster" :alt="movie.title" class="grid-poster">
          <div class="grid-info">
            <h4>{{ movie.title }}</h4>
            <div class="grid-rating">⭐ {{ movie.rating }}</div>
            <div class="grid-year">{{ movie.year }} · {{ movie.duration }} мин</div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">← Назад</button>
        <span class="page-info">Страница {{ currentPage }} из {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">Вперед →</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка фильмов...</div>
    <div v-if="!loading && filteredMovies.length === 0" class="empty-state">
      <p>Фильмы не найдены</p>
      <button class="reset-btn" @click="resetFilters">Сбросить фильтры</button>
    </div>

    <AuthModal :showModal="showAuthModal" @close="showAuthModal = false" @success="onAuthSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase/config.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import AuthModal from '../pages/AuthModal.vue'

const router = useRouter()


const movies = ref([])
const searchQuery = ref('')
const loading = ref(true)
const currentSlide = ref(0)
const showFavoritesOnly = ref(false)
const showUserMenu = ref(false)
const showAuthModal = ref(false)
const showFilters = ref(false)
const user = ref(null)
const isAdmin = ref(false)
const currentPage = ref(1)
const ITEMS_PER_PAGE = 12
const ITEMS_PER_SLIDE = 5


const genres = ['Боевик', 'Комедия', 'Драма', 'Фантастика', 'Ужасы', 'Триллер', 'Мелодрама', 'Документальный']


const filters = ref({
  genre: '',
  yearFrom: '',
  yearTo: '',
  ratingMin: 0,
  durationMax: '',
  ageRating: ''
})


const sortBy = ref('rating_desc')


const sortMovies = (moviesList) => {
  const sorted = [...moviesList]
  switch (sortBy.value) {
    case 'rating_desc':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'rating_asc':
      return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0))
    case 'year_desc':
      return sorted.sort((a, b) => (b.year || 0) - (a.year || 0))
    case 'year_asc':
      return sorted.sort((a, b) => (a.year || 0) - (b.year || 0))
    case 'title_asc':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    case 'title_desc':
      return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
    case 'comments_desc':
      return sorted.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0))
    default:
      return sorted
  }
}


const filteredMovies = computed(() => {
  let result = movies.value

  
  if (showFavoritesOnly.value) {
    result = result.filter(movie => movie.isFavorite)
  }

  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(movie =>
        movie.title.toLowerCase().includes(q) ||
        movie.description?.toLowerCase().includes(q)
    )
  }

  
  if (filters.value.genre) {
    result = result.filter(movie => movie.genre === filters.value.genre)
  }

  
  if (filters.value.yearFrom) {
    result = result.filter(movie => (movie.year || 0) >= parseInt(filters.value.yearFrom))
  }
  if (filters.value.yearTo) {
    result = result.filter(movie => (movie.year || 0) <= parseInt(filters.value.yearTo))
  }

  
  if (filters.value.ratingMin > 0) {
    result = result.filter(movie => (movie.rating || 0) >= filters.value.ratingMin)
  }

  
  if (filters.value.durationMax) {
    result = result.filter(movie => {
      const duration = parseInt(movie.duration)
      return duration && duration <= parseInt(filters.value.durationMax)
    })
  }

  
  if (filters.value.ageRating) {
    result = result.filter(movie => parseInt(movie.ageRating) >= parseInt(filters.value.ageRating))
  }

  
  return sortMovies(result)
})


const totalPages = computed(() => {
  return Math.ceil(filteredMovies.value.length / ITEMS_PER_PAGE)
})

const paginatedMovies = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredMovies.value.slice(start, end)
})


const carouselMovies = computed(() => {
  return filteredMovies.value.slice(0, 20)
})

const movieSlides = computed(() => {
  const slides = []
  for (let i = 0; i < carouselMovies.value.length; i += ITEMS_PER_SLIDE) {
    slides.push(carouselMovies.value.slice(i, i + ITEMS_PER_SLIDE))
  }
  return slides
})

const totalSlides = computed(() => movieSlides.value.length)


const nextSlide = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    currentSlide.value++
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const goToSlide = (index) => {
  currentSlide.value = index
}


const resetFilters = () => {
  searchQuery.value = ''
  showFavoritesOnly.value = false
  filters.value = {
    genre: '',
    yearFrom: '',
    yearTo: '',
    ratingMin: 0,
    durationMax: '',
    ageRating: ''
  }
  sortBy.value = 'rating_desc'
  currentPage.value = 1
  currentSlide.value = 0
}


const handleSearch = () => {
  currentPage.value = 1
  currentSlide.value = 0
}

const handleSortChange = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
}


const checkAdminStatus = async () => {
  if (user.value) {
    try {
      const userDataRef = doc(db, 'userData', user.value.uid)
      const userData = await getDoc(userDataRef)
      isAdmin.value = userData.exists() && userData.data().role === 'admin'
    } catch (error) {
      console.error('Ошибка проверки прав:', error)
    }
  }
}


let unsubscribeMovies = null

const subscribeToMovies = () => {
  if (unsubscribeMovies) {
    unsubscribeMovies()
  }

  unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
    const newMovies = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Название фильма',
      poster: doc.data().poster || '',
      rating: doc.data().rating || 0,
      ratingCount: doc.data().ratingCount || 0,
      commentsCount: doc.data().commentsCount || 0,
      year: doc.data().year || '2024',
      duration: doc.data().duration || '120',
      ageRating: doc.data().ageRating || '16',
      genre: doc.data().genre || 'Драма',
      description: doc.data().description || '',
      isFavorite: false
    }))

    movies.value = newMovies

    if (user.value) {
      loadUserFavorites()
    }

    loading.value = false
  }, (error) => {
    console.error('Ошибка подписки на фильмы:', error)
    loading.value = false
  })
}


const loadUserFavorites = async () => {
  if (!user.value) return

  try {
    const userFavoritesRef = doc(db, 'userFavorites', user.value.uid)
    const favoritesDoc = await getDoc(userFavoritesRef)

    if (favoritesDoc.exists()) {
      const favoriteIds = favoritesDoc.data().movieIds || []
      movies.value = movies.value.map(movie => ({
        ...movie,
        isFavorite: favoriteIds.includes(movie.id)
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки избранного:', error)
  }
}


const toggleFavorite = async (movie) => {
  if (!user.value) {
    showAuthModal.value = true
    return
  }

  const newFavoriteStatus = !movie.isFavorite
  movie.isFavorite = newFavoriteStatus

  const userFavoritesRef = doc(db, 'userFavorites', user.value.uid)

  try {
    const favoritesDoc = await getDoc(userFavoritesRef)
    let favoriteIds = []

    if (favoritesDoc.exists()) {
      favoriteIds = favoritesDoc.data().movieIds || []
    }

    if (newFavoriteStatus) {
      if (!favoriteIds.includes(movie.id)) {
        favoriteIds.push(movie.id)
      }
    } else {
      favoriteIds = favoriteIds.filter(id => id !== movie.id)
    }

    await setDoc(userFavoritesRef, { movieIds: favoriteIds })
  } catch (error) {
    console.error('Ошибка обновления избранного:', error)
    movie.isFavorite = !newFavoriteStatus
  }
}


const logout = async () => {
  try {
    await signOut(auth)
    showUserMenu.value = false
    showFavoritesOnly.value = false
  } catch (error) {
    console.error('Ошибка выхода:', error)
  }
}


const goToMovie = (id) => {
  router.push(`/movie/${id}`)
}


const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}


const onAuthSuccess = () => {
  if (user.value) {
    loadUserFavorites()
  }
}


onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
  checkAdminStatus()
  if (currentUser) {
    loadUserFavorites()
  } else {
    movies.value = movies.value.map(movie => ({
      ...movie,
      isFavorite: false
    }))
  }
})


watch([filteredMovies, showFavoritesOnly, searchQuery, filters, sortBy], () => {
  currentPage.value = 1
  currentSlide.value = 0
})


onMounted(() => {
  subscribeToMovies()
})
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  background: #141414;
  color: #fff;
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 50px;
  background: rgba(0,0,0,0.9);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
  gap: 15px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  font-size: 34px;
  font-weight: 900;
  color: #e50914;
  cursor: pointer;
}

.nav-links a, .nav-links .router-link-active {
  color: #ddd;
  text-decoration: none;
  font-size: 15.5px;
  margin-right: 25px;
}

.nav-links .active {
  color: white;
}

.admin-link {
  color: #e50914 !important;
  font-weight: bold;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
}

.search {
  padding: 10px 20px;
  width: 320px;
  background: rgba(255,255,255,0.12);
  border: none;
  border-radius: 4px;
  color: white;
}

.search::placeholder {
  color: rgba(255,255,255,0.7);
}

.search:focus {
  outline: none;
  background: rgba(255,255,255,0.2);
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 16px;
}

.filter-sort-container {
  display: flex;
  gap: 10px;
}

.filter-btn, .sort-select {
  padding: 10px 15px;
  background: rgba(255,255,255,0.12);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.filter-btn:hover, .sort-select:hover {
  background: rgba(255,255,255,0.2);
}

.sort-select option {
  background: #141414;
}

.filters-panel {
  background: #1a1a1a;
  margin: 20px 50px;
  padding: 20px;
  border-radius: 12px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters-header h3 {
  margin: 0;
}

.reset-filters, .reset-btn, .show-all, .show-favorites {
  padding: 8px 16px;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.reset-filters:hover, .reset-btn:hover {
  background: #e50914;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  color: #aaa;
  font-size: 14px;
}

.filter-group select, .filter-group input {
  padding: 8px 12px;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
}

.year-range, .duration-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.year-input, .duration-input {
  width: 80px;
}

.rating-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating-range input {
  flex: 1;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  flex-wrap: wrap;
  gap: 15px;
}

.results-header h2 {
  margin: 0;
  font-size: 24px;
}

.results-info {
  display: flex;
  gap: 15px;
  align-items: center;
  color: #aaa;
}

.carousel-container {
  padding: 0 50px 40px;
}

.carousel-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.carousel-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
  background: #e50914;
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-counter {
  font-size: 14px;
  color: #aaa;
  min-width: 60px;
  text-align: center;
}

.carousel-wrapper {
  overflow: hidden;
  position: relative;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel-slide {
  flex: 0 0 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 28px;
  padding: 10px 0;
}

.card {
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s ease;
  position: relative;
}

.card:hover {
  transform: scale(1.07);
}

.card-poster {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.favorite-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.favorite-badge:hover {
  transform: scale(1.1);
  background: rgba(0,0,0,0.9);
}

.card-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.65), transparent);
}

.card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 25px 22px;
  z-index: 2;
  color: white;
}

.card-info h3 {
  margin: 0 0 15px 0;
  font-size: 19px;
  line-height: 1.35;
  font-weight: 600;
}

.rating-section {
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.star {
  font-size: 14px;
  color: #ffd700;
}

.rating-value {
  font-weight: 600;
  font-size: 16px;
  color: #ffd700;
}

.rating-count {
  font-size: 13px;
  color: #aaa;
}

.comments-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #ccc;
}

.movie-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #aaa;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.year, .duration, .age-rating {
  padding: 2px 6px;
  background: rgba(0,0,0,0.5);
  border-radius: 4px;
  font-size: 12px;
}

.age-rating {
  background: #e50914;
  color: white;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot:hover {
  background: rgba(255,255,255,0.6);
}

.dot.active {
  background: #e50914;
  width: 30px;
  border-radius: 5px;
}

.movies-grid-section {
  padding: 20px 50px 50px;
}

.movies-grid-section h2 {
  margin-bottom: 25px;
  font-size: 24px;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.grid-card {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.grid-card:hover {
  transform: translateY(-5px);
}

.grid-poster {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.grid-info {
  padding: 12px;
}

.grid-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-rating {
  color: #ffd700;
  font-size: 14px;
  margin-bottom: 4px;
}

.grid-year {
  color: #aaa;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-btn {
  padding: 10px 20px;
  background: #333;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #e50914;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #aaa;
}

.user-menu {
  position: relative;
  cursor: pointer;
}

.user-icon {
  width: 40px;
  height: 40px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-icon:hover {
  transform: scale(1.05);
  background: #f40612;
}

.user-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  background: #141414;
  border-radius: 8px;
  padding: 10px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 100;
}

.user-info {
  padding: 10px;
}

.user-email {
  color: white;
  font-size: 14px;
  margin-bottom: 10px;
  word-break: break-all;
}

.logout-btn, .login-btn {
  width: 100%;
  padding: 8px;
  background: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover, .login-btn:hover {
  background: #f40612;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: #aaa;
}

.reset-btn {
  margin-top: 15px;
  background: #e50914;
}

@media (max-width: 1200px) {
  .carousel-slide {
    gap: 20px;
  }
  .card {
    height: 450px;
  }
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    align-items: stretch;
    padding: 15px 20px;
  }

  .nav-left {
    justify-content: space-between;
  }

  .nav-right {
    flex-direction: column;
  }

  .search, .filter-btn, .sort-select {
    width: 100%;
  }

  .search-container {
    width: 100%;
  }

  .search {
    width: 100%;
  }

  .filter-sort-container {
    flex-direction: column;
  }

  .carousel-slide {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .card {
    height: 380px;
  }

  .filters-panel {
    margin: 20px;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .movies-grid-section {
    padding: 20px;
  }

  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .carousel-slide {
    grid-template-columns: repeat(2, 1fr);
  }

  .card {
    height: 320px;
  }

  .movies-grid {
    grid-template-columns: 1fr;
  }
}
</style>