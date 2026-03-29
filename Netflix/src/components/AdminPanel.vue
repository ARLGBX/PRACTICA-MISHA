<template>
  <div class="admin-panel">
    <h1>⚙️ Панель управления</h1>

    <div v-if="adminError" class="admin-error-banner">{{ adminError }}</div>

    <div class="admin-tabs">
      <button v-for="t in adminTabs" :key="t.value" :class="['atab', { active: activeTab === t.value }]" @click="activeTab = t.value">
        {{ t.label }}
      </button>
    </div>

    <!-- STATISTICS -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">{{ animals.length }}</div><div class="stat-lbl">Мест</div></div>
        <div class="stat-card"><div class="stat-num">{{ bookings.length }}</div><div class="stat-lbl">Заявок</div></div>
        <div class="stat-card"><div class="stat-num">{{ users.length }}</div><div class="stat-lbl">Пользователей</div></div>
        <div class="stat-card"><div class="stat-num">{{ reviews.length }}</div><div class="stat-lbl">Отзывов</div></div>
      </div>
      <h2>Последние заявки</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Пользователь</th><th>Место</th><th>Тип</th><th>Дата</th><th>Статус</th></tr></thead>
          <tbody>
            <tr v-for="b in recentBookings" :key="b.id">
              <td>{{ b.userEmail }}</td>
              <td>{{ b.animalName }}</td>
              <td>{{ b.type === 'adoption' ? 'Долгосрочный' : 'Краткосрочный' }}</td>
              <td>{{ b.date }} {{ b.time }}</td>
              <td><span :class="['sbadge', b.status]">{{ statusLabel(b.status) }}</span></td>
            </tr>
            <tr v-if="!recentBookings.length"><td colspan="5" class="empty-row">Нет данных</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ANIMALS -->
    <div v-if="activeTab === 'animals'" class="tab-content">
      <div class="section-header">
        <h2>Места для постоя ({{ animals.length }})</h2>
        <button class="btn-accent" @click="showAnimalForm = !showAnimalForm">
          {{ showAnimalForm ? 'Скрыть форму' : '+ Добавить место' }}
        </button>
      </div>

      <div v-if="showAnimalForm" class="animal-form card">
        <h3>{{ editingAnimal ? 'Редактировать место' : 'Новое место' }}</h3>
        <div class="form-grid">
          <div class="form-group"><label>Название *</label><input v-model="animalForm.name" /></div>
          <div class="form-group"><label>Вид животных *</label><input v-model="animalForm.species" /></div>
          <div class="form-group"><label>Порода</label><input v-model="animalForm.breed" /></div>
          <div class="form-group"><label>Вместимость (кг/размер)</label><input v-model.number="animalForm.age" type="number" min="0" step="0.1" /></div>
          <div class="form-group">
            <label>Тип вольера</label>
            <select v-model="animalForm.gender">
              <option value="Самец">Стандарт</option>
              <option value="Самка">Люкс</option>
            </select>
          </div>
          <div class="form-group">
            <label>Категория *</label>
            <select v-model="animalForm.category">
              <option v-for="c in animalCategories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label>Цена в сутки (₽)</label><input v-model.number="animalForm.price" type="number" min="0" /></div>
          <div class="form-group"><label>URL изображения</label><input v-model="animalForm.imageUrl" /></div>
          <div class="form-group full"><label>Описание</label><textarea v-model="animalForm.description" rows="3"></textarea></div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" v-model="animalForm.available" /> Свободно</label>
          </div>
        </div>
        <div v-if="animalFormError" class="error-msg">{{ animalFormError }}</div>
        <div class="form-actions">
          <button class="btn-accent" @click="saveAnimal" :disabled="animalSaving">
            {{ animalSaving ? 'Сохранение...' : (editingAnimal ? 'Обновить' : 'Добавить') }}
          </button>
          <button class="btn-outline" @click="cancelAnimalForm">Отмена</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Название</th><th>Вид животных</th><th>Категория</th><th>Цена/сут</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            <tr v-for="a in animals" :key="a.id">
              <td>{{ a.name }}</td>
              <td>{{ a.species }}</td>
              <td>{{ a.category }}</td>
              <td>{{ a.price ? a.price.toLocaleString('ru-RU') + ' ₽/сут' : '—' }}</td>
              <td><span :class="['sbadge', a.available ? 'confirmed' : 'cancelled']">{{ a.available ? 'Свободно' : 'Занято' }}</span></td>
              <td class="actions">
                <button class="btn-sm" @click="editAnimal(a)">✏️</button>
                <button class="btn-sm danger" @click="deleteAnimal(a.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!animals.length"><td colspan="6" class="empty-row">Нет мест</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- BOOKINGS -->
    <div v-if="activeTab === 'bookings'" class="tab-content">
      <div class="section-header">
        <h2>Бронирования ({{ filteredBookings.length }})</h2>
        <select v-model="bookingStatusFilter" class="filter-select">
          <option value="">Все статусы</option>
          <option value="pending">Ожидание</option>
          <option value="confirmed">Подтверждено</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Пользователь</th><th>Место</th><th>Тип</th><th>Дата/Время</th><th>Статус</th><th>Изменить статус</th></tr></thead>
          <tbody>
            <tr v-for="b in filteredBookings" :key="b.id">
              <td>{{ b.userEmail }}</td>
              <td>{{ b.animalName }}</td>
              <td>{{ b.type === 'adoption' ? 'Долгосрочный' : 'Краткосрочный' }}</td>
              <td>{{ b.date }} {{ b.time }}</td>
              <td><span :class="['sbadge', b.status]">{{ statusLabel(b.status) }}</span></td>
              <td>
                <select :value="b.status" @change="changeBookingStatus(b.id, $event.target.value)" class="mini-select">
                  <option value="pending">Ожидание</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </td>
            </tr>
            <tr v-if="!filteredBookings.length"><td colspan="6" class="empty-row">Нет бронирований</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- USERS -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <h2>Пользователи ({{ users.length }})</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Email</th><th>Имя</th><th>Роль</th><th>Действия</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.email }}</td>
              <td>{{ u.displayName || '—' }}</td>
              <td><span :class="['role-badge', u.role]">{{ u.role === 'admin' ? 'Администратор' : 'Пользователь' }}</span></td>
              <td>
                <button class="btn-sm" @click="toggleRole(u.id, u.role)">
                  {{ u.role === 'admin' ? '→ Пользователь' : '→ Админ' }}
                </button>
              </td>
            </tr>
            <tr v-if="!users.length"><td colspan="4" class="empty-row">Нет пользователей</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- REVIEWS MODERATION -->
    <div v-if="activeTab === 'moderation'" class="tab-content">
      <h2>Отзывы ({{ reviews.length }})</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Пользователь</th><th>Место</th><th>Рейтинг</th><th>Отзыв</th><th>Действия</th></tr></thead>
          <tbody>
            <tr v-for="r in reviews" :key="r.id">
              <td>{{ r.userEmail }}</td>
              <td>{{ r.animalName }}</td>
              <td>{{ '★'.repeat(r.rating) }}</td>
              <td class="review-text-cell">{{ r.text }}</td>
              <td>
                <button class="btn-sm danger" @click="deleteReview(r.id, r.animalId)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!reviews.length"><td colspan="5" class="empty-row">Нет отзывов</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, getDocs, where
} from 'firebase/firestore'
import { db } from '../firebase/config'

const adminTabs = [
  { value: 'stats', label: '📊 Статистика' },
  { value: 'animals', label: '🏠 Места для постоя' },
  { value: 'bookings', label: '📅 Заявки' },
  { value: 'users', label: '👥 Пользователи' },
  { value: 'moderation', label: '📝 Модерация' },
]
const activeTab = ref('stats')

const animals = ref([])
const bookings = ref([])
const users = ref([])
const reviews = ref([])

const adminError = ref('')

const animalCategories = ['Кошки', 'Собаки', 'Птицы', 'Грызуны', 'Рептилии', 'Экзотика']
const showAnimalForm = ref(false)
const editingAnimal = ref(null)
const animalSaving = ref(false)
const animalFormError = ref('')
const bookingStatusFilter = ref('')

const defaultAnimalForm = () => ({
  name: '', species: '', breed: '', age: 0, gender: 'Самец',
  category: 'Кошки', description: '', price: 0, imageUrl: '', available: true,
})
const animalForm = ref(defaultAnimalForm())

let unsubs = []

onMounted(() => {
  unsubs.push(onSnapshot(collection(db, 'animals'), s => {
    animals.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
  }))
  unsubs.push(onSnapshot(collection(db, 'bookings'), s => {
    bookings.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }))
  unsubs.push(onSnapshot(collection(db, 'userData'), s => {
    users.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
  }))
  unsubs.push(onSnapshot(collection(db, 'reviews'), s => {
    reviews.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }))
})

onUnmounted(() => unsubs.forEach(u => u()))

const recentBookings = computed(() => bookings.value.slice(0, 10))
const filteredBookings = computed(() => {
  if (!bookingStatusFilter.value) return bookings.value
  return bookings.value.filter(b => b.status === bookingStatusFilter.value)
})

function statusLabel(s) {
  return { pending: 'Ожидание', confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено' }[s] || s
}

async function saveAnimal() {
  animalFormError.value = ''
  if (!animalForm.value.name || !animalForm.value.species) {
    animalFormError.value = 'Заполните обязательные поля (Имя, Вид)'
    return
  }
  animalSaving.value = true
  try {
    const data = { ...animalForm.value }
    if (editingAnimal.value) {
      await updateDoc(doc(db, 'animals', editingAnimal.value), data)
    } else {
      await addDoc(collection(db, 'animals'), { ...data, rating: 0, reviewsCount: 0, createdAt: serverTimestamp() })
    }
    cancelAnimalForm()
  } catch (e) {
    animalFormError.value = 'Ошибка при сохранении'
  } finally {
    animalSaving.value = false
  }
}

function editAnimal(a) {
  editingAnimal.value = a.id
  animalForm.value = {
    name: a.name || '', species: a.species || '', breed: a.breed || '',
    age: a.age || 0, gender: a.gender || 'Самец', category: a.category || 'Кошки',
    description: a.description || '', price: a.price || 0, imageUrl: a.imageUrl || '',
    available: a.available !== false,
  }
  showAnimalForm.value = true
}

function cancelAnimalForm() {
  showAnimalForm.value = false
  editingAnimal.value = null
  animalForm.value = defaultAnimalForm()
  animalFormError.value = ''
}

async function deleteAnimal(id) {
  if (!confirm('Удалить животное?')) return
  adminError.value = ''
  try {
    await deleteDoc(doc(db, 'animals', id))
  } catch (err) {
    adminError.value = 'Ошибка при удалении животного.'
    console.error(err)
  }
}

async function changeBookingStatus(id, status) {
  adminError.value = ''
  try {
    await updateDoc(doc(db, 'bookings', id), { status })
  } catch (err) {
    adminError.value = 'Ошибка при изменении статуса бронирования.'
    console.error(err)
  }
}

async function toggleRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin'
  if (!confirm(`Изменить роль на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}"?`)) return
  adminError.value = ''
  try {
    await updateDoc(doc(db, 'userData', uid), { role: newRole })
  } catch (err) {
    adminError.value = 'Ошибка при изменении роли пользователя.'
    console.error(err)
  }
}

async function deleteReview(id, animalId) {
  if (!confirm('Удалить отзыв?')) return
  await deleteDoc(doc(db, 'reviews', id))
  if (animalId) {
    const q = query(collection(db, 'reviews'), where('animalId', '==', animalId))
    const snap = await getDocs(q)
    const all = snap.docs.map(d => d.data())
    const avg = all.length ? all.reduce((s, r) => s + (r.rating || 0), 0) / all.length : 0
    await updateDoc(doc(db, 'animals', animalId), {
      rating: Math.round(avg * 10) / 10,
      reviewsCount: all.length,
    })
  }
}
</script>


<style scoped>
.admin-panel { padding-bottom: 4rem; }

h1 { font-size: 1.9rem; font-weight: 900; margin-bottom: 0.4rem; color: #eef8f0; }
.admin-subtitle { color: rgba(238,248,240,0.4); font-size: 0.92rem; margin-bottom: 2rem; }
h2 { font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; color: #eef8f0; }
h3 { font-size: 1rem; font-weight: 800; color: #eef8f0; margin-bottom: 1rem; }

.admin-error-banner {
  background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3);
  color: #fca5a5; padding: 0.75rem 1rem; border-radius: 10px;
  margin-bottom: 1.5rem; font-size: 0.92rem; font-weight: 600;
}

.admin-tabs {
  display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2.5rem;
}
.atab {
  padding: 0.5rem 1.1rem;
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(62,207,94,0.15);
  color: rgba(238,248,240,0.55);
  border-radius: 10px; font-size: 0.88rem; font-weight: 700;
  transition: all 0.2s;
}
.atab:hover { border-color: rgba(62,207,94,0.35); color: rgba(238,248,240,0.85); }
.atab.active {
  background: rgba(62,207,94,0.15); border-color: #3ecf5e; color: #3ecf5e;
  box-shadow: 0 0 12px rgba(62,207,94,0.15);
}

.tab-content { }

/* Stat cards */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.stat-card {
  background: rgba(17,42,28,0.7); border: 1.5px solid rgba(62,207,94,0.15);
  border-radius: 16px; padding: 1.4rem; text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}
.stat-card:hover { border-color: rgba(62,207,94,0.35); transform: translateY(-2px); }
.stat-num { font-size: 2.4rem; font-weight: 900; background: linear-gradient(135deg, #3ecf5e, #a8f0b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: block; }
.stat-lbl { font-size: 0.78rem; font-weight: 700; color: rgba(238,248,240,0.4); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.25rem; }

/* Section header */
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.section-header h2 { margin: 0; }

/* Buttons */
.btn-accent {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff; font-weight: 800; font-size: 0.88rem;
  padding: 0.5rem 1.1rem; border-radius: 10px;
  box-shadow: 0 2px 10px rgba(62,207,94,0.25); transition: all 0.2s;
}
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(62,207,94,0.4); }
.btn-outline {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(255,255,255,0.04); border: 1.5px solid rgba(62,207,94,0.2);
  color: rgba(238,248,240,0.65); font-weight: 700; font-size: 0.88rem;
  padding: 0.5rem 1.1rem; border-radius: 10px; transition: all 0.15s;
}
.btn-outline:hover { border-color: rgba(62,207,94,0.45); color: #eef8f0; }

/* Animal form */
.card {
  background: rgba(17,42,28,0.65); backdrop-filter: blur(8px);
  border: 1.5px solid rgba(62,207,94,0.18); border-radius: 16px;
  padding: 1.5rem; margin-bottom: 1.5rem;
}
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(238,248,240,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input, .form-group select, .form-group textarea { width: 100%; font-size: 0.9rem; }
.checkbox-group label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: rgba(238,248,240,0.65); text-transform: none; font-weight: 600; letter-spacing: 0; }
.error-msg { background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3); color: #fca5a5; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.88rem; margin-bottom: 0.75rem; }
.form-actions { display: flex; gap: 0.75rem; }

/* Table */
.table-wrap { overflow-x: auto; border-radius: 14px; border: 1.5px solid rgba(62,207,94,0.12); }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
thead th {
  padding: 0.85rem 1rem; text-align: left;
  background: rgba(17,42,28,0.8);
  font-size: 0.75rem; font-weight: 800;
  color: rgba(238,248,240,0.4); text-transform: uppercase; letter-spacing: 0.06em;
  border-bottom: 1px solid rgba(62,207,94,0.12);
}
tbody tr { border-bottom: 1px solid rgba(62,207,94,0.07); transition: background 0.15s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: rgba(62,207,94,0.04); }
td { padding: 0.85rem 1rem; color: rgba(238,248,240,0.75); vertical-align: middle; }
.empty-row { text-align: center; color: rgba(238,248,240,0.3); font-style: italic; }

/* Status badges */
.sbadge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.7rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 800;
}
.sbadge.pending { background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.35); color: #fbbf24; }
.sbadge.confirmed { background: rgba(62,207,94,0.15); border: 1px solid rgba(62,207,94,0.35); color: #3ecf5e; }
.sbadge.cancelled { background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3); color: #f87171; }
.sbadge.completed { background: rgba(84,180,248,0.12); border: 1px solid rgba(84,180,248,0.3); color: #7dd3fc; }

/* Role badge */
.role-badge {
  display: inline-flex; padding: 0.2rem 0.65rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 800;
}
.role-badge.admin { background: rgba(245,200,66,0.15); border: 1px solid rgba(245,200,66,0.3); color: #f5c842; }
.role-badge.user { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(238,248,240,0.5); }

.actions { display: flex; gap: 0.4rem; }
.btn-sm {
  padding: 0.3rem 0.6rem; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(238,248,240,0.65); border-radius: 7px; font-size: 0.82rem; transition: all 0.15s;
}
.btn-sm:hover { background: rgba(255,255,255,0.09); color: #eef8f0; }
.btn-sm.danger:hover { border-color: rgba(240,82,82,0.4); color: #f87171; }

.filter-select, .mini-select {
  background: rgba(17,42,28,0.8); border: 1.5px solid rgba(62,207,94,0.18);
  color: rgba(238,248,240,0.75); border-radius: 9px; font-size: 0.85rem; font-weight: 700;
  padding: 0.4rem 0.75rem;
}

.review-text-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-group.full { grid-column: 1; }
}
</style>
