<template>
  <div class="page">
    <Header :currentUser="currentUser" :isAdmin="isAdmin" @show-auth="showAuth = true" />
    <AuthModal v-if="showAuth" @close="showAuth = false" />
    <main class="main">
      <div v-if="!currentUser && !authLoading" class="auth-required">
        <p>Войдите, чтобы просмотреть профиль</p>
        <button class="btn-accent" @click="showAuth = true">Войти</button>
      </div>
      <ProfileComponent v-else-if="currentUser" :currentUser="currentUser" />
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
import ProfileComponent from '../components/Profile.vue'

const currentUser = ref(null)
const isAdmin = ref(false)
const showAuth = ref(false)
const authLoading = ref(true)

const unsubAuth = onAuthStateChanged(auth, async user => {
  currentUser.value = user
  authLoading.value = false
  if (user) {
    const snap = await getDoc(doc(db, 'userData', user.uid))
    isAdmin.value = snap.exists() && snap.data().role === 'admin'
  } else {
    isAdmin.value = false
  }
})

onUnmounted(() => unsubAuth())
</script>

<style scoped>
.page { min-height: 100vh; }
.main { max-width: 900px; margin: 0 auto; padding: 2rem 1.75rem 4rem; }

.auth-required {
  text-align: center; padding: 5rem 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.auth-required p { color: rgba(238,248,240,0.4); font-size: 1.05rem; }

.btn-accent {
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff; padding: 0.65rem 1.75rem; border-radius: 11px;
  font-weight: 800; font-size: 0.95rem;
  box-shadow: 0 3px 14px rgba(62,207,94,0.3); transition: all 0.2s;
}
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(62,207,94,0.45); }
</style>
