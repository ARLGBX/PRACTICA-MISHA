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
.page { min-height: 100vh; background: #0d1f13; }
.main { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }

.loading { text-align: center; padding: 4rem; }

.forbidden {
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.forbidden h2 { font-size: 1.8rem; }
.forbidden p { color: #a5d6a7; }

.btn-accent {
  background: #4caf50; color: #fff;
  padding: 0.55rem 1.5rem; border-radius: 6px;
  font-weight: 600; font-size: 0.95rem;
}
.btn-accent:hover { background: #43a047; }
</style>
