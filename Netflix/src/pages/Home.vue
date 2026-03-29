<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />

    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <main class="main">
      <div class="hero">
        <h1>🐾 Зоопитомник</h1>
        <p>Найдите своего идеального питомца и запишитесь на визит или усыновление</p>
      </div>

      <div class="controls">
        <input
          v-model="search"
          type="text"
          placeholder="Поиск по имени, виду, породе..."
          class="search-input"
        />

        <div class="filters">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="['filter-btn', { active: selectedCategory === cat.value }]"
            @click="selectedCategory = cat.value; currentPage = 1"
          >{{ cat.label }}</button>
        </div>

        <div class="sort-row">
          <label>Сортировка:</label>
          <select v-model="sortBy" @change="currentPage = 1">
            <option value="name">Название</option>
            <option value="price_asc">Цена (возр.)</option>
            <option value="price_desc">Цена (убыв.)</option>
            <option value="age">Возраст</option>
            <option value="rating">Рейтинг</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка животных...</p>
      </div>

      <div v-else-if="paginatedAnimals.length === 0" class="empty">
        <p>🔍 Животные не найдены</p>
      </div>

      <div v-else class="grid">
        <div
          v-for="animal in paginatedAnimals"
          :key="animal.id"
          class="animal-card"
          @click="$router.push('/animal/' + animal.id)"
        >
          <div class="card-img-wrap">
            <img
              :src="animal.imageUrl || 'https://placehold.co/400x300/1a3d2b/4caf50?text=' + encodeURIComponent(animal.name)"
              :alt="animal.name"
              class="card-img"
              @error="e => e.target.src = 'https://placehold.co/400x300/1a3d2b/4caf50?text=' + encodeURIComponent(animal.name)"
            />
            <span :class="['badge-available', animal.available ? 'yes' : 'no']">
              {{ animal.available ? 'Доступен' : 'Занят' }}
            </span>
            <button
              class="fav-btn"
              @click.stop="toggleFavorite(animal.id)"
              :title="isFavorite(animal.id) ? 'Убрать из избранного' : 'В избранное'"
            >{{ isFavorite(animal.id) ? '❤️' : '🤍' }}</button>
          </div>
          <div class="card-body">
            <h3 class="card-name">{{ animal.name }}</h3>
            <p class="card-species">{{ animal.species }}<span v-if="animal.breed"> · {{ animal.breed }}</span></p>
            <div class="card-meta">
              <span>{{ animal.age }} лет</span>
              <span>{{ animal.gender }}</span>
            </div>
            <div class="card-footer">
              <span class="card-price">{{ animal.price ? animal.price.toLocaleString('ru-RU') + ' ₽' : 'Бесплатно' }}</span>
              <span class="card-rating">⭐ {{ animal.rating ? animal.rating.toFixed(1) : '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button class="btn-load" @click="loadMore">Показать ещё</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import Header from '../components/Header.vue'
import AuthModal from './AuthModal.vue'

const currentUser = ref(null)
const isAdmin = ref(false)
const showAuth = ref(false)
const loading = ref(true)
const animals = ref([])
const search = ref('')
const selectedCategory = ref('all')
const sortBy = ref('name')
const currentPage = ref(1)
const pageSize = 12
const favorites = ref(JSON.parse(localStorage.getItem('zoo_favorites') || '[]'))

const categories = [
  { value: 'all', label: 'Все' },
  { value: 'Кошки', label: 'Кошки' },
  { value: 'Собаки', label: 'Собаки' },
  { value: 'Птицы', label: 'Птицы' },
  { value: 'Грызуны', label: 'Грызуны' },
  { value: 'Рептилии', label: 'Рептилии' },
  { value: 'Экзотика', label: 'Экзотика' },
]

let unsubAnimals = null

onMounted(() => {
  const q = query(collection(db, 'animals'))
  unsubAnimals = onSnapshot(q, snap => {
    animals.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubAnimals) unsubAnimals()
})

const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
  } else {
    isAdmin.value = false
  }
})

const filtered = computed(() => {
  let list = animals.value
  if (selectedCategory.value !== 'all') {
    list = list.filter(a => a.category === selectedCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.species || '').toLowerCase().includes(q) ||
      (a.breed || '').toLowerCase().includes(q)
    )
  }
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy.value === 'price_asc') return (a.price || 0) - (b.price || 0)
    if (sortBy.value === 'price_desc') return (b.price || 0) - (a.price || 0)
    if (sortBy.value === 'age') return (a.age || 0) - (b.age || 0)
    if (sortBy.value === 'rating') return (b.rating || 0) - (a.rating || 0)
    return 0
  })
})

watch([search, selectedCategory], () => { currentPage.value = 1 })

const paginatedAnimals = computed(() => filtered.value.slice(0, currentPage.value * pageSize))
const hasMore = computed(() => paginatedAnimals.value.length < filtered.value.length)

function loadMore() { currentPage.value++ }

function isFavorite(id) { return favorites.value.includes(id) }
function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorites.value = favorites.value.filter(f => f !== id)
  } else {
    favorites.value.push(id)
  }
  localStorage.setItem('zoo_favorites', JSON.stringify(favorites.value))
}
</script>

<style scoped>
.page { min-height: 100vh; background: #0d1f13; }

.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.hero {
  text-align: center;
  padding: 2.5rem 1rem;
  margin-bottom: 2rem;
}
.hero h1 { font-size: 2.5rem; color: #4caf50; margin-bottom: 0.75rem; }
.hero p { color: #a5d6a7; font-size: 1.1rem; }

.controls { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 0.65rem 1rem;
  font-size: 1rem;
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 8px;
  color: #fff;
}
.search-input:focus { border-color: #4caf50; }

.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.filter-btn {
  padding: 0.4rem 1rem;
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  color: #a5d6a7;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.filter-btn:hover, .filter-btn.active {
  background: #4caf50;
  border-color: #4caf50;
  color: #fff;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #a5d6a7;
  font-size: 0.9rem;
}
.sort-row select { padding: 0.4rem 0.75rem; min-width: 160px; }

.loading { text-align: center; padding: 3rem; color: #a5d6a7; }
.empty { text-align: center; padding: 4rem; color: #6a9a72; font-size: 1.1rem; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.animal-card {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.animal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(76,175,80,0.2);
  border-color: #4caf50;
}

.card-img-wrap { position: relative; }
.card-img { width: 100%; height: 200px; object-fit: cover; }

.badge-available {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
}
.badge-available.yes { background: rgba(76,175,80,0.9); color: #fff; }
.badge-available.no { background: rgba(239,83,80,0.9); color: #fff; }

.fav-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: background 0.2s;
}
.fav-btn:hover { background: rgba(0,0,0,0.75); }

.card-body { padding: 1rem; }
.card-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
.card-species { color: #a5d6a7; font-size: 0.88rem; margin-bottom: 0.5rem; }

.card-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #6a9a72;
  margin-bottom: 0.75rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-price { color: #4caf50; font-weight: 700; font-size: 1rem; }
.card-rating { color: #ffa726; font-size: 0.9rem; }

.load-more { text-align: center; margin-top: 2rem; }
.btn-load {
  background: transparent;
  border: 2px solid #4caf50;
  color: #4caf50;
  padding: 0.65rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-load:hover { background: #4caf50; color: #fff; }
</style>
