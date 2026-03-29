<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">🐾 Зоопитомник</router-link>

      <nav class="nav">
        <router-link to="/" class="nav-link">Главная</router-link>
        <router-link to="/bookings" class="nav-link">Мои бронирования</router-link>
        <router-link to="/profile" class="nav-link">Личный кабинет</router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-link nav-admin">Админ</router-link>
      </nav>

      <div class="auth-area">
        <template v-if="currentUser">
          <div class="user-menu" ref="menuRef">
            <button class="user-btn" @click="menuOpen = !menuOpen">
              <span class="user-avatar">{{ userInitial }}</span>
              <span class="user-name">{{ currentUser.displayName || currentUser.email }}</span>
              <span class="chevron">▾</span>
            </button>
            <div v-if="menuOpen" class="dropdown">
              <div class="dropdown-email">{{ currentUser.email }}</div>
              <router-link to="/profile" class="dropdown-item" @click="menuOpen = false">Профиль</router-link>
              <router-link to="/bookings" class="dropdown-item" @click="menuOpen = false">Бронирования</router-link>
              <router-link v-if="isAdmin" to="/admin" class="dropdown-item" @click="menuOpen = false">Админ панель</router-link>
              <button class="dropdown-item logout" @click="handleLogout">Выйти</button>
            </div>
          </div>
        </template>
        <template v-else>
          <button class="btn-login" @click="$emit('show-auth')">Войти</button>
        </template>
      </div>

      <button class="burger" @click="mobileOpen = !mobileOpen">☰</button>
    </div>

    <nav v-if="mobileOpen" class="mobile-nav">
      <router-link to="/" class="nav-link" @click="mobileOpen = false">Главная</router-link>
      <router-link to="/bookings" class="nav-link" @click="mobileOpen = false">Мои бронирования</router-link>
      <router-link to="/profile" class="nav-link" @click="mobileOpen = false">Личный кабинет</router-link>
      <router-link v-if="isAdmin" to="/admin" class="nav-link nav-admin" @click="mobileOpen = false">Админ</router-link>
      <template v-if="!currentUser">
        <button class="btn-login" @click="$emit('show-auth'); mobileOpen = false">Войти</button>
      </template>
      <template v-else>
        <button class="dropdown-item logout" @click="handleLogout">Выйти</button>
      </template>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

const props = defineProps({
  currentUser: Object,
  isAdmin: Boolean,
})

defineEmits(['show-auth'])

const menuOpen = ref(false)
const mobileOpen = ref(false)
const menuRef = ref(null)

const userInitial = computed(() => {
  if (!props.currentUser) return ''
  const name = props.currentUser.displayName || props.currentUser.email || ''
  return name.charAt(0).toUpperCase()
})

async function handleLogout() {
  menuOpen.value = false
  await signOut(auth)
}

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.header {
  background: #1a3d2b;
  border-bottom: 1px solid #2d7a4f;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  color: #4caf50;
  font-size: 1.3rem;
  font-weight: 700;
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.nav-link {
  color: #a5d6a7;
  font-size: 0.95rem;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.nav-link:hover, .nav-link.router-link-exact-active {
  color: #4caf50;
  border-bottom-color: #4caf50;
}
.nav-admin { color: #ffa726; }
.nav-admin:hover { color: #ffb74d; border-bottom-color: #ffa726; }

.auth-area { margin-left: auto; }

.btn-login {
  background: #4caf50;
  color: #fff;
  padding: 0.45rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
}
.btn-login:hover { background: #43a047; }

.user-menu { position: relative; }

.user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(76,175,80,0.15);
  border: 1px solid #2d7a4f;
  color: #fff;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
}
.user-btn:hover { border-color: #4caf50; }

.user-avatar {
  width: 28px; height: 28px;
  background: #4caf50;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem;
}
.user-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem; }
.chevron { font-size: 0.75rem; color: #a5d6a7; }

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 8px;
  min-width: 200px;
  padding: 0.5rem 0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.dropdown-email {
  padding: 0.5rem 1rem;
  color: #6a9a72;
  font-size: 0.8rem;
  border-bottom: 1px solid #2d7a4f;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  color: #a5d6a7;
  font-size: 0.9rem;
  background: none;
  border-radius: 0;
  transition: background 0.15s;
}
.dropdown-item:hover { background: rgba(76,175,80,0.15); color: #fff; }
.dropdown-item.logout { color: #ef9a9a; }
.dropdown-item.logout:hover { background: rgba(239,83,80,0.15); }

.burger {
  display: none;
  background: none;
  color: #a5d6a7;
  font-size: 1.4rem;
  padding: 0.25rem;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 1rem 1.5rem;
  border-top: 1px solid #2d7a4f;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .nav, .auth-area { display: none; }
  .burger { display: block; margin-left: auto; }
  .mobile-nav { display: flex; }
}
</style>
