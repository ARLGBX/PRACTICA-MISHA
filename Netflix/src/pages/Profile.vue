<template>
  <div class="profile-page">
    <nav class="navbar">
      <div class="nav-left">
        <div class="logo" @click="$router.push('/')">NETFLIX</div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Главная</router-link>
          <router-link to="/profile" class="nav-link active">Профиль</router-link>
        </div>
      </div>
      <div class="nav-right">
        <div class="user-menu" @click="showUserMenu = !showUserMenu">
          <div class="user-icon">
            {{ user?.email?.[0]?.toUpperCase() || '👤' }}
          </div>
          <div v-if="showUserMenu" class="user-dropdown">
            <div class="user-info">
              <div class="user-email">{{ user?.email }}</div>
              <button @click="logout" class="logout-btn">Выйти</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <Profile :user="user" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import Profile from '../components/Profile.vue'

const router = useRouter()
const user = ref(null)
const showUserMenu = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (!currentUser) {
      router.push('/')
    }
  })
})

const logout = async () => {
  try {
    await signOut(auth)
    router.push('/')
  } catch (error) {
    console.error('Ошибка выхода:', error)
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #141414;
  color: white;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 50px;
  background: rgba(0,0,0,0.9);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  font-size: 34px;
  font-weight: 900;
  color: #e50914;
  cursor: pointer;
}

.nav-links a {
  color: #ddd;
  text-decoration: none;
  font-size: 15.5px;
  margin-right: 25px;
}

.nav-links .active {
  color: white;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-menu {
  position: relative;
  cursor: pointer;
}

.user-icon {
  width: 40px;
  height: 40px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.user-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  background: #141414;
  border-radius: 8px;
  padding: 10px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 100;
}

.user-info {
  padding: 10px;
}

.user-email {
  color: white;
  font-size: 14px;
  margin-bottom: 10px;
  word-break: break-all;
}

.logout-btn {
  width: 100%;
  padding: 8px;
  background: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .navbar {
    padding: 15px 20px;
  }

  .logo {
    font-size: 24px;
  }

  .nav-links a {
    font-size: 12px;
    margin-right: 15px;
  }
}
</style>