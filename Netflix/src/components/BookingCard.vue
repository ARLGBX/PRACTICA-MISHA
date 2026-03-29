<template>
  <div class="booking-card">
    <div class="booking-header">
      <span class="animal-name">{{ booking.animalName }}</span>
      <span :class="['status-badge', booking.status]">{{ statusLabel }}</span>
    </div>
    <div class="booking-details">
      <span class="detail">🗓️ {{ booking.date }}</span>
      <span class="detail">⏰ {{ booking.time }}</span>
      <span class="detail">{{ typeLabel }}</span>
    </div>
    <div class="booking-meta">
      <span class="created-at">Создано: {{ formatDate(booking.createdAt) }}</span>
      <button
        v-if="booking.status === 'pending'"
        class="btn-cancel"
        @click="$emit('cancel')"
      >Отменить</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ booking: Object })
defineEmits(['cancel'])

const statusLabel = computed(() => {
  const map = { pending: 'Ожидание', confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено' }
  return map[props.booking.status] || props.booking.status
})

const typeLabel = computed(() => props.booking.type === 'adoption' ? '🏠 Усыновление' : '👁 Визит')

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.booking-card {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}
.booking-card:hover { border-color: #4caf50; }

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.animal-name { font-size: 1.05rem; font-weight: 700; color: #fff; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
.status-badge.pending { background: rgba(255,167,38,0.2); color: #ffa726; border: 1px solid #ffa726; }
.status-badge.confirmed { background: rgba(76,175,80,0.2); color: #4caf50; border: 1px solid #4caf50; }
.status-badge.cancelled { background: rgba(239,83,80,0.2); color: #ef5350; border: 1px solid #ef5350; }
.status-badge.completed { background: rgba(66,165,245,0.2); color: #42a5f5; border: 1px solid #42a5f5; }

.booking-details {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  color: #a5d6a7;
  font-size: 0.9rem;
}
.detail { display: flex; align-items: center; gap: 0.3rem; }

.booking-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.created-at { color: #6a9a72; font-size: 0.82rem; }

.btn-cancel {
  padding: 0.3rem 0.9rem;
  background: rgba(239,83,80,0.15);
  border: 1px solid #ef5350;
  color: #ef9a9a;
  border-radius: 6px;
  font-size: 0.85rem;
}
.btn-cancel:hover { background: rgba(239,83,80,0.3); }
</style>
