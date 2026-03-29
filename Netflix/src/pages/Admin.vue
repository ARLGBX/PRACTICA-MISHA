<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />
    <main class="main">
      <div v-if="authLoading" class="loading"><div class="spinner"></div></div>
      <div v-else-if="!currentUser" class="forbidden">
        <h2>🔒 Требуется авторизация</h2>
        <button class="btn-accent" @click="showAuth = true">Войти</button>
      </div>
      <div v-else-if="!isAdmin" class="forbidden">
        <h2>🚫 Доступ запрещён</h2>
        <p>У вас нет прав для просмотра этой страницы</p>
        <button class="btn-accent" @click="$router.push('/')">На главную</button>
      </div>
      <AdminPanel v-else />
    </main>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import Header from '../components/Header.vue'
import AuthModal from './AuthModal.vue'
import AdminPanel from '../components/AdminPanel.vue'

const currentUser = ref(null)
const isAdmin = ref(false)
const showAuth = ref(false)
const authLoading = ref(true)

const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
  } else {
    isAdmin.value = false
  }
  authLoading.value = false
})

onUnmounted(() => unsubAuth())
</script>

<style scoped>
.page { min-height: 100vh; }
.main { max-width: 1320px; margin: 0 auto; padding: 2.5rem 1.75rem; }

.loading { text-align: center; padding: 4rem; }

.forbidden {
  text-align: center; padding: 6rem 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.85rem;
}
.forbidden h2 { font-size: 1.75rem; color: #eef8f0; }
.forbidden p { color: rgba(238,248,240,0.4); }

.btn-accent {
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff; padding: 0.65rem 1.75rem; border-radius: 11px;
  font-weight: 800; font-size: 0.95rem;
  box-shadow: 0 3px 14px rgba(62,207,94,0.3); transition: all 0.2s;
}
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(62,207,94,0.45); }
</style>
