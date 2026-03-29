<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">🐾</span>
        <span class="logo-text">Зоопитомник</span>
      </router-link>

      <nav class="nav">
        <router-link to="/" class="nav-link">Главная</router-link>
        <router-link to="/bookings" class="nav-link">Мои заявки</router-link>
        <router-link to="/profile" class="nav-link">Кабинет</router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-link nav-admin">
          <span class="admin-dot"></span>Админ
        </router-link>
      </nav>

      <div class="auth-area">
        <template v-if="currentUser">
          <div class="user-menu" ref="menuRef">
            <button class="user-btn" @click="menuOpen = !menuOpen">
              <span class="user-avatar">{{ userInitial }}</span>
              <span class="user-name">{{ currentUser.displayName || currentUser.email }}</span>
              <svg class="chevron-icon" :class="{ open: menuOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <Transition name="dropdown">
              <div v-if="menuOpen" class="dropdown">
                <div class="dropdown-user">
                  <span class="dropdown-avatar">{{ userInitial }}</span>
                  <div>
                    <div class="dropdown-name">{{ currentUser.displayName || 'Пользователь' }}</div>
                    <div class="dropdown-email">{{ currentUser.email }}</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <router-link to="/profile" class="dropdown-item" @click="menuOpen = false">
                  <span>👤</span> Профиль
                </router-link>
                <router-link to="/bookings" class="dropdown-item" @click="menuOpen = false">
                  <span>📅</span> Мои заявки
                </router-link>
                <router-link v-if="isAdmin" to="/admin" class="dropdown-item" @click="menuOpen = false">
                  <span>⚙️</span> Админ панель
                </router-link>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout" @click="handleLogout">
                  <span>🚪</span> Выйти
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <button class="btn-login" @click="$emit('show-auth')">
            Войти
          </button>
        </template>
      </div>

      <button class="burger" @click="mobileOpen = !mobileOpen" :class="{ open: mobileOpen }">
        <span></span><span></span><span></span>
      </button>
    </div>

    <Transition name="mobile">
      <nav v-if="mobileOpen" class="mobile-nav">
        <router-link to="/" class="mob-link" @click="mobileOpen = false">🏠 Главная</router-link>
        <router-link to="/bookings" class="mob-link" @click="mobileOpen = false">📅 Мои заявки</router-link>
        <router-link to="/profile" class="mob-link" @click="mobileOpen = false">👤 Кабинет</router-link>
        <router-link v-if="isAdmin" to="/admin" class="mob-link admin" @click="mobileOpen = false">⚙️ Админ</router-link>
        <div class="mob-divider"></div>
        <template v-if="!currentUser">
          <button class="mob-login-btn" @click="$emit('show-auth'); mobileOpen = false">Войти</button>
        </template>
        <template v-else>
          <div class="mob-user">{{ currentUser.displayName || currentUser.email }}</div>
          <button class="mob-logout" @click="handleLogout">Выйти</button>
        </template>
      </nav>
    </Transition>
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
  mobileOpen.value = false
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
  background: rgba(7, 18, 10, 0.85);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(62, 207, 94, 0.15);
  position: sticky;
  top: 0;
  z-index: 200;
}

.header-inner {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 1.75rem;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-icon {
  font-size: 1.6rem;
  filter: drop-shadow(0 0 8px rgba(62,207,94,0.5));
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3ecf5e 0%, #a8f0b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

/* Nav */
.nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
}
.nav-link {
  color: rgba(238,248,240,0.65);
  font-size: 0.93rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-link:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.05);
}
.nav-link.router-link-exact-active {
  color: #3ecf5e;
  background: rgba(62,207,94,0.12);
}
.nav-admin {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #f5c842 !important;
}
.nav-admin:hover { background: rgba(245,200,66,0.1) !important; }
.nav-admin.router-link-exact-active { background: rgba(245,200,66,0.12) !important; }
.admin-dot {
  width: 6px; height: 6px;
  background: #f5c842;
  border-radius: 50%;
  box-shadow: 0 0 6px #f5c842;
  flex-shrink: 0;
}

/* Auth area */
.auth-area { margin-left: auto; }

.btn-login {
  background: linear-gradient(135deg, #3ecf5e 0%, #2db84e 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.93rem;
  padding: 0.5rem 1.4rem;
  border-radius: 10px;
  box-shadow: 0 2px 14px rgba(62,207,94,0.3);
  transition: all 0.2s;
}
.btn-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(62,207,94,0.45);
}

/* User menu */
.user-menu { position: relative; }

.user-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(62,207,94,0.25);
  color: var(--text-primary);
  padding: 0.4rem 0.85rem 0.4rem 0.5rem;
  border-radius: 12px;
  transition: all 0.2s;
}
.user-btn:hover {
  border-color: rgba(62,207,94,0.55);
  background: rgba(255,255,255,0.07);
}

.user-avatar {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, #3ecf5e, #1e8a38);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.85rem;
  color: #fff;
  flex-shrink: 0;
}
.user-name {
  max-width: 130px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 0.88rem; font-weight: 600;
}
.chevron-icon {
  color: rgba(238,248,240,0.5);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.chevron-icon.open { transform: rotate(180deg); }

/* Dropdown */
.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  background: rgba(11, 26, 16, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(62,207,94,0.2);
  border-radius: 16px;
  min-width: 230px;
  padding: 0.6rem;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(62,207,94,0.1);
  overflow: hidden;
}

.dropdown-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
}
.dropdown-avatar {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #3ecf5e, #1e8a38);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1rem;
  color: #fff;
  flex-shrink: 0;
}
.dropdown-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.dropdown-email {
  font-size: 0.77rem;
  color: rgba(238,248,240,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.dropdown-divider {
  height: 1px;
  background: rgba(62,207,94,0.12);
  margin: 0.35rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.75rem;
  color: rgba(238,248,240,0.75);
  font-size: 0.9rem;
  font-weight: 600;
  background: none;
  border-radius: 10px;
  transition: all 0.15s;
  text-decoration: none;
}
.dropdown-item:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
.dropdown-item.logout { color: rgba(240,82,82,0.8); }
.dropdown-item.logout:hover { background: rgba(240,82,82,0.1); color: #f05252; }

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-8px);
}

/* Burger */
.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  margin-left: auto;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
}
.burger:hover { background: rgba(255,255,255,0.06); }
.burger span {
  display: block;
  width: 22px; height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.2s;
}
.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Mobile nav */
.mobile-nav {
  border-top: 1px solid rgba(62,207,94,0.12);
  padding: 1rem 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(7,18,10,0.95);
}

.mob-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(238,248,240,0.75);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.15s;
}
.mob-link:hover, .mob-link.router-link-exact-active {
  background: rgba(255,255,255,0.06);
  color: var(--text-primary);
}
.mob-link.admin { color: #f5c842; }

.mob-divider {
  height: 1px;
  background: rgba(62,207,94,0.12);
  margin: 0.5rem 0;
}

.mob-user {
  padding: 0.4rem 0.9rem;
  color: rgba(238,248,240,0.45);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mob-login-btn {
  background: linear-gradient(135deg, #3ecf5e 0%, #2db84e 100%);
  color: #fff;
  font-weight: 700;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  margin-top: 0.25rem;
}

.mob-logout {
  background: rgba(240,82,82,0.1);
  border: 1px solid rgba(240,82,82,0.3);
  color: #f05252;
  font-weight: 600;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: left;
}

/* Mobile transition */
.mobile-enter-active, .mobile-leave-active { transition: all 0.2s ease; }
.mobile-enter-from, .mobile-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 768px) {
  .nav, .auth-area { display: none; }
  .burger { display: flex; }
}
</style>

