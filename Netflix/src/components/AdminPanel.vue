<template>
  <div class="admin-panel">
    <h1>⚙️ Панель управления</h1>

    <div class="admin-tabs">
      <button v-for="t in adminTabs" :key="t.value" :class="['atab', { active: activeTab === t.value }]" @click="activeTab = t.value">
        {{ t.label }}
      </button>
    </div>

    <!-- STATISTICS -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">{{ animals.length }}</div><div class="stat-lbl">Животных</div></div>
        <div class="stat-card"><div class="stat-num">{{ bookings.length }}</div><div class="stat-lbl">Бронирований</div></div>
        <div class="stat-card"><div class="stat-num">{{ users.length }}</div><div class="stat-lbl">Пользователей</div></div>
        <div class="stat-card"><div class="stat-num">{{ reviews.length }}</div><div class="stat-lbl">Отзывов</div></div>
      </div>
      <h2>Последние бронирования</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Пользователь</th><th>Животное</th><th>Тип</th><th>Дата</th><th>Статус</th></tr></thead>
          <tbody>
            <tr v-for="b in recentBookings" :key="b.id">
              <td>{{ b.userEmail }}</td>
              <td>{{ b.animalName }}</td>
              <td>{{ b.type === 'adoption' ? 'Усыновление' : 'Визит' }}</td>
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
        <h2>Животные ({{ animals.length }})</h2>
        <button class="btn-accent" @click="showAnimalForm = !showAnimalForm">
          {{ showAnimalForm ? 'Скрыть форму' : '+ Добавить животное' }}
        </button>
      </div>

      <div v-if="showAnimalForm" class="animal-form card">
        <h3>{{ editingAnimal ? 'Редактировать животное' : 'Новое животное' }}</h3>
        <div class="form-grid">
          <div class="form-group"><label>Имя *</label><input v-model="animalForm.name" /></div>
          <div class="form-group"><label>Вид *</label><input v-model="animalForm.species" /></div>
          <div class="form-group"><label>Порода</label><input v-model="animalForm.breed" /></div>
          <div class="form-group"><label>Возраст (лет) *</label><input v-model.number="animalForm.age" type="number" min="0" step="0.1" /></div>
          <div class="form-group">
            <label>Пол *</label>
            <select v-model="animalForm.gender">
              <option value="Самец">Самец</option>
              <option value="Самка">Самка</option>
            </select>
          </div>
          <div class="form-group">
            <label>Категория *</label>
            <select v-model="animalForm.category">
              <option v-for="c in animalCategories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label>Цена (₽)</label><input v-model.number="animalForm.price" type="number" min="0" /></div>
          <div class="form-group"><label>URL изображения</label><input v-model="animalForm.imageUrl" /></div>
          <div class="form-group full"><label>Описание</label><textarea v-model="animalForm.description" rows="3"></textarea></div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" v-model="animalForm.available" /> Доступен</label>
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
          <thead><tr><th>Имя</th><th>Вид</th><th>Категория</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            <tr v-for="a in animals" :key="a.id">
              <td>{{ a.name }}</td>
              <td>{{ a.species }}</td>
              <td>{{ a.category }}</td>
              <td>{{ a.price ? a.price.toLocaleString('ru-RU') + ' ₽' : '—' }}</td>
              <td><span :class="['sbadge', a.available ? 'confirmed' : 'cancelled']">{{ a.available ? 'Доступен' : 'Занят' }}</span></td>
              <td class="actions">
                <button class="btn-sm" @click="editAnimal(a)">✏️</button>
                <button class="btn-sm danger" @click="deleteAnimal(a.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!animals.length"><td colspan="6" class="empty-row">Нет животных</td></tr>
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
          <thead><tr><th>Пользователь</th><th>Животное</th><th>Тип</th><th>Дата/Время</th><th>Статус</th><th>Изменить статус</th></tr></thead>
          <tbody>
            <tr v-for="b in filteredBookings" :key="b.id">
              <td>{{ b.userEmail }}</td>
              <td>{{ b.animalName }}</td>
              <td>{{ b.type === 'adoption' ? 'Усыновление' : 'Визит' }}</td>
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
          <thead><tr><th>Пользователь</th><th>Животное</th><th>Рейтинг</th><th>Отзыв</th><th>Действия</th></tr></thead>
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
  { value: 'animals', label: '🐾 Животные' },
  { value: 'bookings', label: '📅 Бронирования' },
  { value: 'users', label: '👥 Пользователи' },
  { value: 'moderation', label: '📝 Модерация' },
]
const activeTab = ref('stats')

const animals = ref([])
const bookings = ref([])
const users = ref([])
const reviews = ref([])

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
  await deleteDoc(doc(db, 'animals', id))
}

async function changeBookingStatus(id, status) {
  await updateDoc(doc(db, 'bookings', id), { status })
}

async function toggleRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin'
  if (!confirm(`Изменить роль на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}"?`)) return
  await updateDoc(doc(db, 'userData', uid), { role: newRole })
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
.admin-panel { padding-bottom: 3rem; }
h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
h2 { font-size: 1.2rem; margin-bottom: 1rem; }

.admin-tabs {
  display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem;
}
.atab {
  padding: 0.5rem 1.1rem;
  background: #1a3d2b; border: 1px solid #2d7a4f;
  color: #a5d6a7; border-radius: 6px; font-size: 0.9rem;
}
.atab.active { background: #4caf50; border-color: #4caf50; color: #fff; }
.atab:hover:not(.active) { border-color: #4caf50; color: #4caf50; }

.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem; margin-bottom: 2rem;
}
.stat-card {
  background: #1a3d2b; border: 1px solid #2d7a4f;
  border-radius: 10px; padding: 1.5rem; text-align: center;
}
.stat-num { font-size: 2.5rem; font-weight: 700; color: #4caf50; }
.stat-lbl { color: #a5d6a7; font-size: 0.88rem; margin-top: 0.25rem; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.filter-select { padding: 0.4rem 0.75rem; font-size: 0.9rem; }

.card { background: #1a3d2b; border: 1px solid #2d7a4f; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
.card h3 { margin-bottom: 1rem; color: #a5d6a7; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.85rem; color: #a5d6a7; }
.form-group input, .form-group select, .form-group textarea { width: 100%; font-size: 0.9rem; }
.form-group.full { grid-column: 1 / -1; }
.checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex-direction: row; }
.checkbox-group input[type=checkbox] { width: auto; }

.form-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }

.btn-accent {
  background: #4caf50; color: #fff;
  padding: 0.5rem 1.25rem; border-radius: 6px;
  font-weight: 600; font-size: 0.9rem;
}
.btn-accent:hover:not(:disabled) { background: #43a047; }
.btn-accent:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline {
  background: transparent; border: 1px solid #2d7a4f;
  color: #a5d6a7; padding: 0.5rem 1.25rem; border-radius: 6px;
  font-size: 0.9rem;
}
.btn-outline:hover { border-color: #4caf50; color: #4caf50; }

.table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #2d7a4f; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
thead { background: #1a3d2b; }
th { padding: 0.75rem 1rem; text-align: left; color: #a5d6a7; font-weight: 600; border-bottom: 1px solid #2d7a4f; }
td { padding: 0.65rem 1rem; border-bottom: 1px solid rgba(45,122,79,0.3); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(76,175,80,0.05); }
.empty-row { text-align: center; color: #6a9a72; font-style: italic; }
.review-text-cell { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sbadge {
  padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.78rem; font-weight: 600;
}
.sbadge.pending { background: rgba(255,167,38,0.2); color: #ffa726; }
.sbadge.confirmed { background: rgba(76,175,80,0.2); color: #4caf50; }
.sbadge.cancelled { background: rgba(239,83,80,0.2); color: #ef5350; }
.sbadge.completed { background: rgba(66,165,245,0.2); color: #42a5f5; }

.role-badge { padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.78rem; font-weight: 600; }
.role-badge.admin { background: rgba(255,167,38,0.2); color: #ffa726; }
.role-badge.user { background: rgba(76,175,80,0.15); color: #a5d6a7; }

.actions { display: flex; gap: 0.5rem; }
.btn-sm {
  padding: 0.25rem 0.6rem; background: #0d1f13;
  border: 1px solid #2d7a4f; color: #a5d6a7;
  border-radius: 4px; font-size: 0.82rem;
}
.btn-sm:hover { border-color: #4caf50; }
.btn-sm.danger:hover { border-color: #ef5350; }

.mini-select { padding: 0.25rem 0.5rem; font-size: 0.82rem; }

.error-msg {
  background: rgba(239,83,80,0.15); border: 1px solid #ef5350;
  color: #ef9a9a; padding: 0.6rem 1rem; border-radius: 6px;
  font-size: 0.88rem; margin-bottom: 0.75rem;
}

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
