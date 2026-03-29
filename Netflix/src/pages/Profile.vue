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
.page { min-height: 100vh; background: #0d1f13; }
.main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

.auth-required { text-align: center; padding: 4rem; }
.auth-required p { color: #a5d6a7; margin-bottom: 1rem; font-size: 1.1rem; }

.btn-accent {
  background: #4caf50; color: #fff;
  padding: 0.55rem 1.5rem; border-radius: 6px;
  font-weight: 600; font-size: 0.95rem;
}
.btn-accent:hover { background: #43a047; }
</style>
