<template>
  <div class="generate-reviews">
    <div class="container">
      <h1>🎬 Генерация демо-отзывов</h1>

      <div class="info-card">
        <h3>О программе</h3>
        <p>Этот инструмент создаст для каждого фильма от <strong>5 до 10 уникальных отзывов</strong> с разными:</p>
        <ul>
          <li>Именами пользователей (Алексей, Мария, Дмитрий и др.)</li>
          <li>Оценками от 5 до 10</li>
          <li>Уникальными текстами с добавлением случайных фраз</li>
          <li>Разным количеством лайков (от 0 до 45)</li>
          <li>Разными датами создания (от 1 до 90 дней назад)</li>
        </ul>
        <p>Отзывы будут добавлены в коллекцию <code>reviews</code> в Firestore, а счетчики комментариев в фильмах будут обновлены.</p>
      </div>

      <div class="actions">
        <button @click="generateReviews" :disabled="loading" class="btn-generate">
          {{ loading ? 'Генерация...' : '🎬 Сгенерировать отзывы' }}
        </button>
        <button @click="clearReviews" :disabled="loading" class="btn-clear">
          🗑️ Очистить все отзывы
        </button>
        <button @click="goBack" class="btn-back">
          ← Назад
        </button>
      </div>

      <div v-if="loading" class="progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }">
            {{ Math.round(progress) }}%
          </div>
        </div>
        <p class="progress-message">{{ progressMessage }}</p>
      </div>

      <div v-if="result" class="result">
        <h3>📊 Результат:</h3>
        <pre>{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, deleteDoc, query, where, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

const router = useRouter()
const loading = ref(false)
const progress = ref(0)
const progressMessage = ref('')
const result = ref('')


const users = [
  { name: 'Алексей', avatar: 'A' },
  { name: 'Мария', avatar: 'M' },
  { name: 'Дмитрий', avatar: 'D' },
  { name: 'Екатерина', avatar: 'E' },
  { name: 'Сергей', avatar: 'S' },
  { name: 'Анна', avatar: 'A' },
  { name: 'Иван', avatar: 'I' },
  { name: 'Ольга', avatar: 'O' },
  { name: 'Владимир', avatar: 'V' },
  { name: 'Наталья', avatar: 'N' },
  { name: 'Павел', avatar: 'P' },
  { name: 'Татьяна', avatar: 'T' },
  { name: 'Андрей', avatar: 'A' },
  { name: 'Елена', avatar: 'E' }
]


const reviewTemplates = [
  { text: 'Шедевр! Фильм заставляет задуматься о жизни. Очень глубокая история с отличной игрой актеров.', rating: 9 },
  { text: 'Отличный фильм! Сюжет держит в напряжении до самого конца. Рекомендую к просмотру!', rating: 8 },
  { text: 'Неплохо, но есть к чему стремиться. Местами затянуто, но в целом достойно.', rating: 7 },
  { text: 'Лучший фильм, который я видел в этом году! Актерская игра на высоте, спецэффекты потрясающие.', rating: 10 },
  { text: 'Слабовато. Ожидал большего от такого состава актеров. Сценарий не продуман.', rating: 5 },
  { text: 'Хорошее кино для вечернего просмотра. Легкое, интересное, с юмором.', rating: 7 },
  { text: 'Потрясающая работа режиссера! Каждая сцена продумана до мелочей. Обязательно посмотрю еще раз.', rating: 9 },
  { text: 'Обычный фильм, ничего особенного. Посмотреть можно, но пересматривать не буду.', rating: 6 },
  { text: 'Восторг! Давно не видел такого качественного кино. Все на высшем уровне!', rating: 10 },
  { text: 'Интересная концепция, но реализация подкачала. Могло быть лучше.', rating: 6 },
  { text: 'Фильм оставил приятное впечатление. Хорошая игра актеров, красивая картинка.', rating: 8 },
  { text: 'Разочарование. Не оправдал ожиданий. Слишком предсказуемый сюжет.', rating: 5 },
  { text: 'Настоящий шедевр кинематографа! Обязателен к просмотру всем любителям кино.', rating: 10 },
  { text: 'Неплохой фильм для одного раза. Ничего выдающегося, но время убить можно.', rating: 6 },
  { text: 'Очень трогательная история. Фильм заставил плакать и смеяться одновременно.', rating: 9 }
]


const uniquePhrases = [
  'Особенно понравилась музыка в фильме!',
  'Визуальные эффекты просто завораживают.',
  'Концовка неожиданная, но логичная.',
  'Актерский состав подобран отлично.',
  'Фильм оставляет послевкусие на несколько дней.',
  'Хотелось бы увидеть продолжение!',
  'Диалоги живые и естественные.',
  'Операторская работа на высоте.',
  'Костюмы и декорации впечатляют.',
  'Смотреть в оригинале с субтитрами - отдельное удовольствие.',
  'Саундтрек заслуживает отдельной награды!',
  'Первый раз такое вижу, очень оригинально!',
  'Обязательно пересмотрю с семьей.',
  'Сценарий прописан великолепно.',
  'Атмосфера погружает с первых минут.'
]

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const generateRandomReview = (movieTitle) => {
  const template = randomItem(reviewTemplates)
  const user = randomItem(users)
  const phrase = randomItem(uniquePhrases)

  const finalText = Math.random() > 0.3
      ? `${template.text} ${phrase}`
      : template.text

  const withMovieName = Math.random() > 0.5
      ? finalText
      : `${finalText} "${movieTitle}" - действительно стоящая вещь!`

  return {
    userName: user.name,
    userAvatar: user.avatar,
    text: withMovieName,
    rating: template.rating,
    likes: randomNumber(0, 45),
    createdAt: new Date(Date.now() - randomNumber(1, 90) * 24 * 60 * 60 * 1000),
    userId: `demo_${user.name.toLowerCase()}_${Date.now()}_${Math.random()}`
  }
}

const generateReviewsForMovie = async (movieId, movieTitle) => {
  const reviewsCount = randomNumber(5, 10)
  const generatedReviews = []

  for (let i = 0; i < reviewsCount; i++) {
    const review = generateRandomReview(movieTitle)
    generatedReviews.push(review)

    await addDoc(collection(db, 'reviews'), {
      movieId: movieId,
      movieTitle: movieTitle,
      userId: review.userId,
      userName: review.userName,
      text: review.text,
      rating: review.rating,
      likes: review.likes,
      createdAt: review.createdAt
    })
  }

  const movieRef = doc(db, 'movies', movieId)
  await updateDoc(movieRef, {
    commentsCount: reviewsCount
  })

  return { reviewsCount, generatedReviews }
}

const generateReviews = async () => {
  loading.value = true
  progress.value = 0
  result.value = ''

  try {
    const moviesSnapshot = await getDocs(collection(db, 'movies'))
    const movies = moviesSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title
    }))

    progressMessage.value = `Найдено ${movies.length} фильмов`

    let totalReviews = 0

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i]
      progressMessage.value = `Генерация отзывов для "${movie.title}"...`

      const oldReviewsQuery = query(
          collection(db, 'reviews'),
          where('movieId', '==', movie.id)
      )
      const oldReviews = await getDocs(oldReviewsQuery)
      for (const review of oldReviews.docs) {
        await deleteDoc(review.ref)
      }

      const result = await generateReviewsForMovie(movie.id, movie.title)
      totalReviews += result.reviewsCount

      progress.value = ((i + 1) / movies.length) * 100
    }

    result.value = `✅ Успешно сгенерировано!\n\n📊 Статистика:\n• Всего фильмов: ${movies.length}\n• Всего отзывов: ${totalReviews}\n• Среднее количество отзывов на фильм: ${(totalReviews / movies.length).toFixed(1)}\n\nКаждый отзыв содержит уникальный текст, оценку и количество лайков.`
    progressMessage.value = 'Готово!'
  } catch (error) {
    console.error('Ошибка:', error)
    result.value = `❌ Ошибка: ${error.message}`
  } finally {
    loading.value = false
  }
}

const clearReviews = async () => {
  if (!confirm('Вы уверены, что хотите удалить ВСЕ отзывы? Это действие необратимо!')) return

  loading.value = true
  progress.value = 0
  progressMessage.value = 'Удаление отзывов...'

  try {
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'))
    let deleted = 0

    for (const review of reviewsSnapshot.docs) {
      await deleteDoc(review.ref)
      deleted++
      progress.value = (deleted / reviewsSnapshot.size) * 100
    }

    const moviesSnapshot = await getDocs(collection(db, 'movies'))
    for (const movie of moviesSnapshot.docs) {
      await updateDoc(doc(db, 'movies', movie.id), {
        commentsCount: 0
      })
    }

    result.value = `✅ Удалено ${deleted} отзывов\n📊 Счетчики комментариев у ${moviesSnapshot.size} фильмов сброшены`
    progressMessage.value = 'Готово!'
  } catch (error) {
    console.error('Ошибка:', error)
    result.value = `❌ Ошибка: ${error.message}`
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/admin')
}
</script>

<style scoped>
.generate-reviews {
  min-height: 100vh;
  background: #141414;
  padding: 40px;
  color: white;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #e50914;
}

.info-card {
  background: #1a1a1a;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
  border-left: 4px solid #e50914;
}

.info-card h3 {
  margin-bottom: 15px;
  color: #e50914;
}

.info-card p {
  margin: 10px 0;
  line-height: 1.6;
  color: #ddd;
}

.info-card ul {
  margin: 10px 0;
  padding-left: 20px;
}

.info-card li {
  margin: 5px 0;
  color: #aaa;
}

.info-card code {
  background: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #ffd700;
}

.actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn-generate, .btn-clear, .btn-back {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-generate {
  background: #e50914;
  color: white;
}

.btn-generate:hover:not(:disabled) {
  background: #f40612;
  transform: translateY(-2px);
}

.btn-clear {
  background: #333;
  color: white;
}

.btn-clear:hover:not(:disabled) {
  background: #555;
}

.btn-back {
  background: #4a4a4a;
  color: white;
}

.btn-back:hover {
  background: #5a5a5a;
}

.btn-generate:disabled, .btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.progress {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 40px;
  background: #333;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e50914, #f40612);
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.progress-message {
  text-align: center;
  color: #aaa;
  font-size: 14px;
}

.result {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
}

.result h3 {
  margin-bottom: 15px;
  color: #e50914;
}

.result pre {
  background: #0a0a0a;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  color: #0f0;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .generate-reviews {
    padding: 20px;
  }

  h1 {
    font-size: 24px;
  }

  .actions {
    flex-direction: column;
  }

  .btn-generate, .btn-clear, .btn-back {
    width: 100%;
  }
}
</style>

<script>

import { addDoc } from 'firebase/firestore'
</script>