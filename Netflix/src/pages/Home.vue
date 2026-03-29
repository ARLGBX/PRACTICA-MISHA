<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />

    <!-- HERO -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">🏠 Надёжный уход за вашим питомцем</div>
        <h1 class="hero-title">Оставьте питомца<br><span class="hero-accent">в надёжных руках</span></h1>
        <p class="hero-sub">Забронируйте место для вашего любимца прямо сейчас. Профессиональный уход и комфорт на время вашего отсутствия.</p>
        <div class="hero-search">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            type="text"
            placeholder="Поиск по названию места, виду или категории..."
            class="hero-search-input"
          />
        </div>
      </div>
      <div class="hero-decor">
        <div class="decor-circle c1"></div>
        <div class="decor-circle c2"></div>
        <div class="decor-circle c3"></div>
      </div>
    </section>

    <main class="main">
      <!-- Filters -->
      <div class="controls">
        <div class="filters">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="['filter-pill', { active: selectedCategory === cat.value }]"
            @click="selectedCategory = cat.value; currentPage = 1"
          >
            <span>{{ cat.emoji }}</span>{{ cat.label }}
          </button>
        </div>

        <div class="sort-row">
          <span class="sort-label">Сортировка:</span>
          <select v-model="sortBy" @change="currentPage = 1" class="sort-select">
            <option value="name">Название</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="age">Возраст</option>
            <option value="rating">Рейтинг</option>
          </select>
        </div>
      </div>

      <!-- Results count -->
      <div v-if="!loading" class="results-meta">
        <span class="results-count">{{ filtered.length }} мест для постоя</span>
        <span v-if="search || selectedCategory !== 'all'" class="results-hint">по вашим фильтрам</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-wrap">
        <div class="spinner"></div>
        <p>Загрузка мест...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="paginatedAnimals.length === 0" class="empty-state">
        <div class="empty-emoji">🔍</div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить фильтры или поисковый запрос</p>
        <button class="reset-btn" @click="search = ''; selectedCategory = 'all'">Сбросить фильтры</button>
      </div>

      <!-- Grid -->
      <div v-else class="grid">
        <div
          v-for="animal in paginatedAnimals"
          :key="animal.id"
          class="animal-card"
          @click="$router.push('/animal/' + animal.id)"
        >
          <div class="card-media">
            <img
              :src="animal.imageUrl || 'https://placehold.co/400x300/0f2318/3ecf5e?text=' + encodeURIComponent(animal.name)"
              :alt="animal.name"
              class="card-img"
              @error="e => e.target.src = 'https://placehold.co/400x300/0f2318/3ecf5e?text=' + encodeURIComponent(animal.name)"
            />
            <div class="card-overlay"></div>
            <span :class="['avail-badge', animal.available ? 'yes' : 'no']">
              <span class="avail-dot"></span>{{ animal.available ? 'Свободно' : 'Занято' }}
            </span>
            <button
              class="fav-btn"
              @click.stop="toggleFavorite(animal.id)"
              :title="isFavorite(animal.id) ? 'Убрать из избранного' : 'В избранное'"
            >{{ isFavorite(animal.id) ? '❤️' : '🤍' }}</button>
          </div>
          <div class="card-body">
            <div class="card-category">{{ animal.category }}</div>
            <h3 class="card-name">{{ animal.name }}</h3>
            <p class="card-species">{{ animal.species }}<span v-if="animal.breed"> · {{ animal.breed }}</span></p>
            <div class="card-chips">
              <span class="chip">{{ animal.age }} лет</span>
              <span class="chip">{{ animal.gender }}</span>
            </div>
            <div class="card-footer">
              <span class="card-price">{{ animal.price ? animal.price.toLocaleString('ru-RU') + ' ₽/сут' : 'Уточняйте' }}</span>
              <span class="card-rating">
                <span class="star">★</span>{{ animal.rating ? animal.rating.toFixed(1) : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="load-more">
        <button class="load-more-btn" @click="loadMore">
          Показать ещё
          <span class="load-more-count">(ещё {{ filtered.length - paginatedAnimals.length }})</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, onSnapshot, query } from 'firebase/firestore'
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
  { value: 'all', label: 'Все', emoji: '🐾' },
  { value: 'Кошки', label: 'Кошки', emoji: '🐱' },
  { value: 'Собаки', label: 'Собаки', emoji: '🐶' },
  { value: 'Птицы', label: 'Птицы', emoji: '🦜' },
  { value: 'Грызуны', label: 'Грызуны', emoji: '🐹' },
  { value: 'Рептилии', label: 'Рептилии', emoji: '🦎' },
  { value: 'Экзотика', label: 'Экзотика', emoji: '🦋' },
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
  unsubAuth()
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
  if (selectedCategory.value !== 'all') list = list.filter(a => a.category === selectedCategory.value)
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
.page { min-height: 100vh; }

/* ---- HERO ---- */
.hero {
  position: relative;
  overflow: hidden;
  padding: 5rem 1.5rem 4rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(62,207,94,0.07) 0%, transparent 100%);
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(62,207,94,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.hero-inner { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(62,207,94,0.1);
  border: 1px solid rgba(62,207,94,0.25);
  color: #3ecf5e;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
  letter-spacing: 0.02em;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 900;
  color: #eef8f0;
  margin-bottom: 1rem;
  line-height: 1.15;
}
.hero-accent {
  background: linear-gradient(135deg, #3ecf5e 0%, #a8f0b8 60%, #f5c842 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  color: rgba(238,248,240,0.55);
  font-size: 1.05rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.hero-search {
  position: relative;
  max-width: 520px;
  margin: 0 auto;
}
.search-icon {
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
}
.hero-search-input {
  width: 100%;
  padding: 0.85rem 1.2rem 0.85rem 2.8rem;
  font-size: 1rem;
  font-weight: 600;
  background: rgba(15,35,24,0.9);
  border: 1.5px solid rgba(62,207,94,0.25);
  border-radius: 14px;
  color: #eef8f0;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.hero-search-input:focus {
  border-color: #3ecf5e;
  box-shadow: 0 0 0 4px rgba(62,207,94,0.12), 0 4px 20px rgba(0,0,0,0.3);
  outline: none;
}
.hero-search-input::placeholder { color: rgba(238,248,240,0.3); font-weight: 400; }

/* Decorative circles */
.hero-decor { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.decor-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(62,207,94,0.08);
}
.c1 { width: 500px; height: 500px; top: -200px; left: -150px; }
.c2 { width: 350px; height: 350px; top: -80px; right: -100px; }
.c3 { width: 200px; height: 200px; bottom: -50px; left: 40%; border-color: rgba(245,200,66,0.06); }

/* ---- MAIN ---- */
.main {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1.5rem 1.75rem 4rem;
}

/* Controls */
.controls {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1.05rem;
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(62,207,94,0.18);
  color: rgba(238,248,240,0.65);
  border-radius: 999px;
  font-size: 0.87rem;
  font-weight: 700;
  transition: all 0.2s;
}
.filter-pill:hover {
  border-color: rgba(62,207,94,0.45);
  color: #eef8f0;
  background: rgba(62,207,94,0.07);
}
.filter-pill.active {
  background: linear-gradient(135deg, rgba(62,207,94,0.2) 0%, rgba(62,207,94,0.1) 100%);
  border-color: #3ecf5e;
  color: #3ecf5e;
  box-shadow: 0 0 12px rgba(62,207,94,0.15);
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}
.sort-label { color: rgba(238,248,240,0.4); font-size: 0.85rem; font-weight: 600; }
.sort-select {
  padding: 0.45rem 0.85rem;
  font-size: 0.87rem;
  font-weight: 700;
  background: rgba(15,35,24,0.8);
  border: 1.5px solid rgba(62,207,94,0.2);
  border-radius: 10px;
  min-width: 140px;
}

/* Results meta */
.results-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: rgba(238,248,240,0.4);
  font-size: 0.88rem;
}
.results-count { font-weight: 800; color: rgba(238,248,240,0.7); font-size: 0.95rem; }

/* Loading */
.loading-wrap {
  text-align: center;
  padding: 5rem 2rem;
  color: rgba(238,248,240,0.45);
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.empty-emoji { font-size: 3.5rem; }
.empty-state h3 { color: #eef8f0; font-size: 1.3rem; }
.empty-state p { color: rgba(238,248,240,0.4); font-size: 0.95rem; }
.reset-btn {
  margin-top: 0.5rem;
  background: rgba(62,207,94,0.12);
  border: 1.5px solid rgba(62,207,94,0.3);
  color: #3ecf5e;
  padding: 0.55rem 1.4rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
}
.reset-btn:hover { background: rgba(62,207,94,0.2); }

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.5rem;
}

/* Card */
.animal-card {
  background: rgba(17,42,28,0.7);
  border: 1.5px solid rgba(62,207,94,0.12);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  backdrop-filter: blur(4px);
  position: relative;
}
.animal-card:hover {
  transform: translateY(-5px);
  border-color: rgba(62,207,94,0.4);
  box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(62,207,94,0.2);
}

.card-media { position: relative; overflow: hidden; }
.card-img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.animal-card:hover .card-img { transform: scale(1.04); }
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(7,18,10,0.75) 0%, transparent 50%);
  pointer-events: none;
}

.avail-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}
.avail-badge.yes {
  background: rgba(62,207,94,0.85);
  color: #fff;
}
.avail-badge.no {
  background: rgba(240,82,82,0.85);
  color: #fff;
}
.avail-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.8s ease-in-out infinite;
}
.avail-badge.no .avail-dot { animation: none; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.fav-btn {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: rgba(7,18,10,0.65);
  backdrop-filter: blur(6px);
  border-radius: 50%;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s;
}
.fav-btn:hover { background: rgba(7,18,10,0.85); transform: scale(1.1); }

.card-body { padding: 1.1rem; }
.card-category {
  font-size: 0.72rem;
  font-weight: 800;
  color: #3ecf5e;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.3rem;
}
.card-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #eef8f0;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-species {
  color: rgba(238,248,240,0.45);
  font-size: 0.83rem;
  margin-bottom: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-chips { display: flex; gap: 0.4rem; margin-bottom: 0.85rem; }
.chip {
  padding: 0.2rem 0.6rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(62,207,94,0.15);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(238,248,240,0.6);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(62,207,94,0.1);
}
.card-price {
  font-size: 1.05rem;
  font-weight: 800;
  background: linear-gradient(135deg, #3ecf5e, #a8f0b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.card-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba(238,248,240,0.65);
}
.star { color: #f5c842; font-size: 0.9rem; }

/* Load more */
.load-more { text-align: center; margin-top: 3rem; }
.load-more-btn {
  background: rgba(62,207,94,0.08);
  border: 2px solid rgba(62,207,94,0.3);
  color: #3ecf5e;
  padding: 0.75rem 2.5rem;
  border-radius: 14px;
  font-size: 0.97rem;
  font-weight: 800;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.load-more-btn:hover {
  background: rgba(62,207,94,0.16);
  border-color: #3ecf5e;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(62,207,94,0.2);
}
.load-more-count {
  color: rgba(62,207,94,0.6);
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .hero { padding: 3.5rem 1rem 2.5rem; }
  .controls { flex-direction: column; }
  .sort-row { width: 100%; }
  .sort-select { flex: 1; }
  .main { padding: 1rem 1rem 3rem; }
}
</style>

