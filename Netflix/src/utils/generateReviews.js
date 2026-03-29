import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'


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
    { name: 'Наталья', avatar: 'N' }
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
    'Смотреть в оригинале с субтитрами - отдельное удовольствие.'
]


const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]


const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min


const generateRandomReview = (movieTitle, userId = null) => {
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
        userId: userId || `user_${user.name.toLowerCase()}_${Date.now()}`
    }
}


export const generateReviewsForMovie = async (movieId, movieTitle) => {
    const reviewsCount = randomNumber(5, 10)
    const generatedReviews = []

    for (let i = 0; i < reviewsCount; i++) {
        
        const review = generateRandomReview(movieTitle, `demo_user_${i + 1}`)
        generatedReviews.push(review)

        try {
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
            console.log(`✅ Добавлен отзыв для фильма "${movieTitle}" от ${review.userName}`)
        } catch (error) {
            console.error('Ошибка добавления отзыва:', error)
        }
    }

    
    try {
        const movieRef = doc(db, 'movies', movieId)
        await updateDoc(movieRef, {
            commentsCount: reviewsCount
        })
        console.log(`📊 Обновлен счетчик комментариев для "${movieTitle}": ${reviewsCount}`)
    } catch (error) {
        console.error('Ошибка обновления счетчика:', error)
    }

    return generatedReviews
}


export const generateReviewsForAllMovies = async () => {
    try {
        const moviesSnapshot = await getDocs(collection(db, 'movies'))
        const movies = moviesSnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title
        }))

        console.log(`🎬 Найдено ${movies.length} фильмов`)

        for (const movie of movies) {
            console.log(`\n📝 Генерация отзывов для "${movie.title}"...`)
            await generateReviewsForMovie(movie.id, movie.title)
        }

        console.log('\n✅ Все отзывы успешно сгенерированы!')
    } catch (error) {
        console.error('Ошибка генерации отзывов:', error)
    }
}