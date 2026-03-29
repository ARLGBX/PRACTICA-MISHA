<template>
  <div class="bcard">
    <div class="bcard-top">
      <div class="bcard-animal">
        <div class="animal-icon">🐾</div>
        <div>
          <div class="animal-name">{{ booking.animalName }}</div>
          <div class="animal-type">{{ typeLabel }}</div>
        </div>
      </div>
      <span :class="['status-pill', booking.status]">
        <span class="status-dot"></span>{{ statusLabel }}
      </span>
    </div>

    <div class="bcard-details">
      <div class="detail-item">
        <span class="detail-icon">📅</span>
        <span>{{ booking.date }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-icon">⏰</span>
        <span>{{ booking.time }}</span>
      </div>
      <div class="detail-item muted">
        <span class="detail-icon">🕒</span>
        <span>{{ formatDate(booking.createdAt) }}</span>
      </div>
    </div>

    <div v-if="booking.status === 'pending'" class="bcard-actions">
      <button class="btn-cancel" @click="$emit('cancel')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Отменить
      </button>
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

const typeLabel = computed(() => props.booking.type === 'adoption' ? '📦 Долгосрочный постой' : '⏰ Краткосрочный постой')

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.bcard {
  background: rgba(17,42,28,0.65);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(62,207,94,0.12);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.22s;
}
.bcard:hover {
  border-color: rgba(62,207,94,0.28);
  box-shadow: 0 6px 24px rgba(0,0,0,0.35);
}

.bcard-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bcard-animal {
  display: flex; align-items: center; gap: 0.75rem;
}
.animal-icon {
  width: 42px; height: 42px;
  background: rgba(62,207,94,0.1);
  border: 1.5px solid rgba(62,207,94,0.2);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.animal-name { font-size: 1rem; font-weight: 800; color: #eef8f0; }
.animal-type { font-size: 0.8rem; color: rgba(238,248,240,0.45); margin-top: 0.1rem; }

.status-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
}
.status-pill.pending { background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.35); color: #fbbf24; }
.status-pill.confirmed { background: rgba(62,207,94,0.15); border: 1px solid rgba(62,207,94,0.35); color: #3ecf5e; }
.status-pill.cancelled { background: rgba(240,82,82,0.12); border: 1px solid rgba(240,82,82,0.3); color: #f87171; }
.status-pill.completed { background: rgba(84,180,248,0.12); border: 1px solid rgba(84,180,248,0.3); color: #7dd3fc; }
.status-pill.pending .status-dot { animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

.bcard-details {
  display: flex; gap: 1.25rem; flex-wrap: wrap;
  padding: 0.85rem;
  background: rgba(0,0,0,0.15);
  border-radius: 10px;
  margin-bottom: 0.85rem;
}
.detail-item {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.87rem; font-weight: 700;
  color: rgba(238,248,240,0.7);
}
.detail-item.muted { color: rgba(238,248,240,0.35); }
.detail-icon { font-size: 0.85rem; }

.bcard-actions { display: flex; justify-content: flex-end; }
.btn-cancel {
  display: flex; align-items: center; gap: 0.4rem;
  background: rgba(240,82,82,0.1);
  border: 1px solid rgba(240,82,82,0.3);
  color: #f87171;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.15s;
}
.btn-cancel:hover { background: rgba(240,82,82,0.2); border-color: rgba(240,82,82,0.5); }
</style>
