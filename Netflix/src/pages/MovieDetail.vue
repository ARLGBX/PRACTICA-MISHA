<template>
  <div class="container">
    <button class="back-btn" @click="goBack">← Назад к каталогу</button>

    <div class="movie">
      <div class="poster">
        <img :src="movie.poster || 'https://via.placeholder.com/300x450'" alt="poster" />
      </div>

      <div class="info">
        <h1>{{ movie.title }}</h1>

        <div class="rating-section">
          <div class="rating">
            <span class="star">⭐</span>
            <span class="rating-value">{{ movie.rating }}</span>
            <span class="rating-count">({{ formatNumber(movie.ratingCount) }} оценок)</span>
          </div>
          <div class="user-rating-info" v-if="userRating">
            <span>Ваша оценка: {{ userRating }} ⭐</span>
          </div>
          <button class="rate-btn" @click="showRatingModal = true" :disabled="hasUserRated">
            {{ hasUserRated ? 'Вы уже оценили' : 'Оценить' }}
          </button>
        </div>

        <div class="movie-details">
          <span class="detail-item">{{ movie.year || '2024' }}</span>
          <span class="detail-item">{{ movie.duration || '120 мин' }}</span>
          <span class="detail-item age">{{ movie.ageRating || '16' }}+</span>
          <span class="detail-item">{{ movie.genre || 'Драма' }}</span>
        </div>

        <div class="comments-info">
          <span class="comment-icon">💬</span>
          <span>{{ formatNumber(movie.commentsCount) }} комментариев</span>
        </div>

        <p class="description">{{ movie.description || 'Описание скоро появится' }}</p>

        <div class="action-buttons">
          <button class="action favorite" @click="toggleFavorite">
            {{ movie.isFavorite ? "❤️ В избранном" : "🤍 В избранное" }}
          </button>
        </div>

        <div class="trailer" v-if="movie.trailerUrl">
          <h3>Трейлер</h3>
          <iframe
              :src="movie.trailerUrl"
              frameborder="0"
              allowfullscreen
              class="trailer-frame"
          ></iframe>
        </div>
      </div>
    </div>

    <div v-if="showRatingModal" class="modal-overlay" @click.self="showRatingModal = false">
      <div class="modal-content">
        <h3>Оцените фильм</h3>
        <div class="rating-select">
          <button
              v-for="i in 10"
              :key="i"
              :class="['rating-star', { active: selectedRating >= i }]"
              @click="selectedRating = i"
          >
            ⭐
          </button>
        </div>
        <div class="modal-actions">
          <button @click="submitRating" class="btn-primary">Отправить</button>
          <button @click="showRatingModal = false" class="btn-secondary">Отмена</button>
        </div>
      </div>
    </div>

    <button class="action watchlist" @click="addToWatchlist">
      📌 Смотреть позже
    </button>

    <div class="reviews-section">
      <div class="reviews-header">
        <h2>Отзывы ({{ movie.commentsCount }})</h2>
        <button class="add-review-btn" @click="showReviewForm = true" v-if="user">
          ✍️ Написать отзыв
        </button>
      </div>

      <div v-if="showReviewForm" class="review-form">
        <textarea
            v-model="newReviewText"
            placeholder="Поделитесь своим мнением о фильме..."
            rows="4"
            class="review-textarea"
        ></textarea>
        <div class="review-rating-input">
          <label>Ваша оценка (необязательно):</label>
          <div class="rating-stars-input">
            <button
                v-for="i in 10"
                :key="i"
                :class="['star-input', { active: newReviewRating >= i }]"
                @click="newReviewRating = i"
            >
              ⭐
            </button>
          </div>
        </div>
        <div class="review-actions">
          <button @click="submitReview" class="btn-primary">Отправить</button>
          <button @click="showReviewForm = false" class="btn-secondary">Отмена</button>
        </div>
      </div>

      <div v-if="loadingReviews" class="loading">Загрузка отзывов...</div>
      <div v-else-if="reviews.length === 0" class="empty-state">
        <p>😊 Пока нет отзывов. Будьте первым!</p>
      </div>
      <div v-else class="reviews-list">
        <div v-for="review in reviews" :key="review.id" class="review">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="user-avatar">
                {{ review.userName?.[0]?.toUpperCase() || 'U' }}
              </div>
              <div>
                <div class="user-name">{{ review.userName || 'Аноним' }}</div>
                <div class="review-rating" v-if="review.rating">⭐ {{ review.rating }}/10</div>
              </div>
            </div>
            <div class="review-date">{{ formatDate(review.createdAt) }}</div>
          </div>
          <p class="review-text">{{ review.text }}</p>
          <div class="review-footer">
            <button @click="likeReview(review.id)" class="like-btn">
              👍 {{ review.likes || 0 }}
            </button>
            <div v-if="canEditReview(review)" class="review-actions">
              <button @click="editReview(review)" class="icon-btn edit">✏️</button>
              <button @click="deleteReview(review.id)" class="icon-btn delete">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="similar-movies" v-if="similarMovies.length > 0">
      <h2>Похожие фильмы</h2>
      <div class="similar-grid">
        <div
            v-for="movie in similarMovies"
            :key="movie.id"
            class="similar-card"
            @click="goToMovie(movie.id)"
        >
          <img :src="movie.poster" :alt="movie.title" class="similar-poster">
          <div class="similar-info">
            <h4>{{ movie.title }}</h4>
            <div class="similar-rating">⭐ {{ movie.rating }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  doc, getDoc, updateDoc, collection,
  query, where, getDocs, addDoc, deleteDoc,
  orderBy, serverTimestamp, increment, setDoc
} from 'firebase/firestore'
import { db, auth } from '../firebase/config.js'
import { onAuthStateChanged } from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const movieId = route.params.id


const movie = ref({
  title: "Загрузка...",
  description: "",
  rating: "—",
  ratingCount: 0,
  commentsCount: 0,
  year: "2024",
  duration: "120 мин",
  ageRating: "16",
  genre: "Драма",
  poster: "",
  isFavorite: false,
  trailerUrl: ""
})

const reviews = ref([])
const similarMovies = ref([])
const user = ref(null)
const loadingReviews = ref(false)
const showRatingModal = ref(false)
const showReviewForm = ref(false)
const selectedRating = ref(0)
const newReviewText = ref('')
const newReviewRating = ref(0)
const hasUserRated = ref(false)
const userRating = ref(null)


const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Недавно'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}


onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
  console.log('Пользователь авторизован:', currentUser?.email)
  if (currentUser) {
    checkUserRating()
  }
})


const toggleFavorite = async () => {
  if (!user.value) {
    alert('Войдите в аккаунт, чтобы добавить в избранное')
    return
  }

  const newFavoriteStatus = !movie.value.isFavorite
  movie.value.isFavorite = newFavoriteStatus

  try {
    const movieRef = doc(db, 'movies', movieId)
    await updateDoc(movieRef, {
      isFavorite: newFavoriteStatus
    })
  } catch (error) {
    console.error("Ошибка:", error)
    movie.value.isFavorite = !newFavoriteStatus
  }
}


const checkUserRating = async () => {
  if (!user.value) return

  try {
    const ratingId = `${user.value.uid}_${movieId}`
    const userRatingRef = doc(db, 'userRatings', ratingId)
    const ratingDoc = await getDoc(userRatingRef)

    if (ratingDoc.exists()) {
      hasUserRated.value = true
      userRating.value = ratingDoc.data().rating
    } else {
      hasUserRated.value = false
      userRating.value = null
    }
  } catch (error) {
    console.error('Ошибка проверки оценки:', error)
  }
}


const submitRating = async () => {
  if (!user.value) {
    alert('Войдите в аккаунт, чтобы оценить фильм')
    return
  }

  if (selectedRating.value === 0) {
    alert('Выберите оценку')
    return
  }

  if (hasUserRated.value) {
    alert('Вы уже оценили этот фильм')
    showRatingModal.value = false
    return
  }

  try {
    const ratingId = `${user.value.uid}_${movieId}`
    const userRatingRef = doc(db, 'userRatings', ratingId)

    await setDoc(userRatingRef, {
      userId: user.value.uid,
      movieId: movieId,
      rating: selectedRating.value,
      createdAt: serverTimestamp()
    })

    hasUserRated.value = true
    userRating.value = selectedRating.value

    showRatingModal.value = false
    selectedRating.value = 0
    alert(`Спасибо за оценку ${userRating.value}!`)
  } catch (error) {
    console.error('Ошибка при оценке:', error)
    alert('Ошибка при сохранении оценки')
  }
}


const submitReview = async () => {
  if (!user.value) {
    alert('Войдите в аккаунт, чтобы оставить отзыв')
    return
  }

  if (!newReviewText.value.trim()) {
    alert('Напишите отзыв')
    return
  }

  try {
    const reviewData = {
      movieId: movieId,
      userId: user.value.uid,
      userName: user.value.displayName || user.value.email?.split('@')[0],
      movieTitle: movie.value.title,
      text: newReviewText.value.trim(),
      rating: newReviewRating.value > 0 ? newReviewRating.value : null,
      likes: 0,
      createdAt: serverTimestamp()
    }

    console.log('Добавление отзыва:', reviewData)
    await addDoc(collection(db, 'reviews'), reviewData)

    const movieRef = doc(db, 'movies', movieId)
    await updateDoc(movieRef, {
      commentsCount: increment(1)
    })

    movie.value.commentsCount++
    newReviewText.value = ''
    newReviewRating.value = 0
    showReviewForm.value = false
    await loadReviews()
    alert('Отзыв добавлен!')
  } catch (error) {
    console.error('Ошибка:', error)
    alert('Ошибка при добавлении отзыва')
  }
}


const loadReviews = async () => {
  loadingReviews.value = true
  try {
    console.log('Загрузка отзывов для фильма:', movieId)

    
    const reviewsQuery = query(
        collection(db, 'reviews'),
        where('movieId', '==', movieId)
        
    )

    const snapshot = await getDocs(reviewsQuery)
    console.log('Найдено отзывов:', snapshot.size)

    reviews.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    
    reviews.value.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })

    console.log('Отзывы загружены:', reviews.value.length)
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error)
    alert('Ошибка загрузки отзывов. Пожалуйста, создайте индекс в Firebase Console.')
  } finally {
    loadingReviews.value = false
  }
}


const likeReview = async (reviewId) => {
  if (!user.value) {
    alert('Войдите в аккаунт')
    return
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId)
    await updateDoc(reviewRef, {
      likes: increment(1)
    })

    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.likes = (review.likes || 0) + 1
    }
  } catch (error) {
    console.error('Ошибка:', error)
  }
}


const deleteReview = async (reviewId) => {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return

  try {
    await deleteDoc(doc(db, 'reviews', reviewId))
    const movieRef = doc(db, 'movies', movieId)
    await updateDoc(movieRef, {
      commentsCount: increment(-1)
    })

    movie.value.commentsCount--
    await loadReviews()
    alert('Отзыв удален')
  } catch (error) {
    console.error('Ошибка:', error)
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

const canEditReview = (review) => {
  return user.value && review.userId === user.value.uid
}


const loadSimilarMovies = async () => {
  try {
    const moviesQuery = query(
        collection(db, 'movies'),
        where('genre', '==', movie.value.genre),
        limit(6)
    )
    const snapshot = await getDocs(moviesQuery)
    similarMovies.value = snapshot.docs
        .filter(doc => doc.id !== movieId)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
  } catch (error) {
    console.error('Ошибка:', error)
  }
}

const goToMovie = (id) => {
  router.push(`/movie/${id}`)
}

const goBack = () => router.push('/')


onMounted(async () => {
  if (!movieId) return

  try {
    console.log('Загрузка фильма с ID:', movieId)
    const docRef = doc(db, 'movies', movieId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      movie.value = {
        id: docSnap.id,
        title: data.title || "Название фильма",
        description: data.description || "Описание скоро появится",
        rating: data.rating || "0",
        ratingCount: data.ratingCount || 0,
        commentsCount: data.commentsCount || 0,
        year: data.year || "2024",
        duration: data.duration || "120 мин",
        ageRating: data.ageRating || "16",
        genre: data.genre || "Драма",
        poster: data.poster || "https://via.placeholder.com/300x450",
        isFavorite: data.isFavorite || false,
        trailerUrl: data.trailerUrl || ""
      }

      console.log('Фильм загружен:', movie.value.title)
      await loadSimilarMovies()
    } else {
      console.log('Фильм не найден')
      movie.value.title = "Фильм не найден"
    }
  } catch (error) {
    console.error("Ошибка:", error)
  }

  await loadReviews()
  if (user.value) {
    await checkUserRating()
  }
})
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  background: #141414;
  color: #fff;
  min-height: 100vh;
}

.back-btn {
  background: transparent;
  color: #aaa;
  border: 1px solid #555;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 30px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #333;
  color: white;
  border-color: #e50914;
}

.movie {
  display: flex;
  gap: 50px;
  margin-bottom: 60px;
}

.poster {
  width: 340px;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
}

.info h1 {
  font-size: 42px;
  margin-bottom: 20px;
  font-weight: 700;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rating {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
}

.star {
  font-size: 28px;
  color: #ffd700;
}

.rating-value {
  font-weight: 700;
  color: #ffd700;
}

.rating-count {
  font-size: 16px;
  color: #aaa;
  font-weight: normal;
}

.user-rating-info {
  background: #333;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #ffd700;
}

.rate-btn {
  padding: 5px 15px;
  background: #333;
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.rate-btn:hover:not(:disabled) {
  background: #e50914;
}

.rate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.movie-details {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-item {
  padding: 6px 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #ddd;
}

.detail-item.age {
  background: #e50914;
  color: white;
}

.comments-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-size: 16px;
  color: #ccc;
}

.comment-icon {
  font-size: 20px;
}

.description {
  font-size: 18px;
  line-height: 1.7;
  color: #ccc;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.action {
  padding: 14px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.action.favorite {
  background: #333;
  color: white;
}

.action.favorite:hover {
  background: #444;
}

.trailer {
  margin-top: 20px;
}

.trailer h3 {
  margin-bottom: 15px;
}

.trailer-frame {
  width: 100%;
  max-width: 560px;
  height: 315px;
  border-radius: 12px;
}

.reviews-section {
  margin-top: 50px;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.reviews-header h2 {
  font-size: 28px;
}

.add-review-btn {
  padding: 10px 20px;
  background: #e50914;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.review-form {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  background: #333;
  border: none;
  border-radius: 8px;
  color: white;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 15px;
}

.review-rating-input {
  margin-bottom: 15px;
}

.review-rating-input label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 14px;
}

.rating-stars-input {
  display: flex;
  gap: 5px;
}

.star-input {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.star-input.active {
  opacity: 1;
}

.review {
  background: #1c1c1c;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.review:hover {
  background: #242424;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.user-name {
  font-weight: bold;
  color: #e50914;
}

.review-rating {
  font-size: 12px;
  color: #ffd700;
  margin-top: 4px;
}

.review-date {
  color: #666;
  font-size: 12px;
}

.review-text {
  line-height: 1.6;
  margin: 15px 0;
  color: #ddd;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.like-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 20px;
  transition: all 0.3s;
  font-size: 14px;
}

.like-btn:hover {
  background: #333;
  color: white;
}

.review-actions {
  display: flex;
  gap: 10px;
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

.similar-movies {
  margin-top: 60px;
}

.similar-movies h2 {
  font-size: 28px;
  margin-bottom: 25px;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.similar-card {
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.similar-card:hover {
  transform: scale(1.05);
}

.similar-poster {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.similar-info {
  padding: 12px;
}

.similar-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.similar-rating {
  color: #ffd700;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
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
  max-width: 400px;
}

.rating-select {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
}

.rating-star {
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.rating-star.active {
  opacity: 1;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  background: #e50914;
  color: white;
}

.btn-secondary {
  background: #333;
  color: white;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: #aaa;
}

@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  .movie {
    flex-direction: column;
    gap: 30px;
  }

  .poster {
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
    height: auto;
  }

  .info h1 {
    font-size: 28px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .similar-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .reviews-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
}
</style>