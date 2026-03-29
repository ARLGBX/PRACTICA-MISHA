<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="modal-close" @click="$emit('close')">✕</button>
      <div class="modal-header">
        <h2>🐾 Зоопитомник</h2>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: tab === 'login' }]" @click="tab = 'login'; error = ''">Войти</button>
        <button :class="['tab', { active: tab === 'register' }]" @click="tab = 'register'; error = ''">Регистрация</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div v-if="error" class="error-msg">{{ error }}</div>
        <div v-if="success" class="success-msg">{{ success }}</div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="your@email.com" required />
        </div>

        <div class="form-group" v-if="tab !== 'forgot'">
          <label>Пароль</label>
          <input v-model="password" type="password" placeholder="Пароль" required />
        </div>

        <div class="form-group" v-if="tab === 'register'">
          <label>Имя</label>
          <input v-model="displayName" type="text" placeholder="Ваше имя" required />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading">Загрузка...</span>
          <span v-else-if="tab === 'login'">Войти</span>
          <span v-else-if="tab === 'register'">Зарегистрироваться</span>
          <span v-else>Отправить письмо</span>
        </button>

        <div class="form-links">
          <span v-if="tab === 'login'">
            <a href="#" @click.prevent="tab = 'forgot'; error = ''; success = ''">Забыли пароль?</a>
          </span>
          <span v-if="tab === 'forgot'">
            <a href="#" @click.prevent="tab = 'login'; error = ''; success = ''">← Назад</a>
          </span>
        </div>
      </form>

      <div class="divider"><span>или</span></div>

      <button class="btn-google" @click="handleGoogle" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.2 29.6 1 24 1 14.7 1 6.8 6.7 3.4 14.9l7 5.4C12.2 13.7 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.2-9.9 6.2-16.9z"/><path fill="#FBBC05" d="M10.4 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.9-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.8-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2-6.3 2-6.4 0-11.8-4.3-13.6-10.1l-7.8 6.2C6.7 41.2 14.7 47 24 47z"/></svg>
        Войти через Google
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const emit = defineEmits(['close'])

const tab = ref('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (tab.value === 'login') {
      await signInWithEmailAndPassword(auth, email.value, password.value)
      emit('close')
    } else if (tab.value === 'register') {
      const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)
      await updateProfile(cred.user, { displayName: displayName.value })
      await setDoc(doc(db, 'userData', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName.value,
        role: 'user',
        phone: '',
        bio: '',
        createdAt: serverTimestamp(),
      })
      emit('close')
    } else {
      await sendPasswordResetEmail(auth, email.value)
      success.value = 'Письмо для сброса пароля отправлено!'
    }
  } catch (e) {
    error.value = getErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  error.value = ''
  loading.value = true
  try {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await setDoc(doc(db, 'userData', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || '',
      role: 'user',
      phone: '',
      bio: '',
      createdAt: serverTimestamp(),
    }, { merge: true })
    emit('close')
  } catch (e) {
    error.value = getErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/email-already-in-use': 'Email уже используется',
    'auth/invalid-email': 'Некорректный email',
    'auth/weak-password': 'Пароль слишком слабый (минимум 6 символов)',
    'auth/popup-closed-by-user': 'Окно входа закрыто',
    'auth/invalid-credential': 'Неверные данные для входа',
  }
  return messages[code] || 'Произошла ошибка. Попробуйте снова.'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #1a3d2b;
  border: 1px solid #2d7a4f;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  color: #a5d6a7;
  font-size: 1.2rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.modal-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.modal-header h2 { color: #4caf50; font-size: 1.5rem; }

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  background: #0d1f13;
  border-radius: 8px;
  padding: 4px;
}
.tab {
  flex: 1;
  padding: 0.5rem;
  background: none;
  color: #a5d6a7;
  border-radius: 6px;
  font-size: 0.95rem;
}
.tab.active { background: #4caf50; color: #fff; }

.form { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.9rem; color: #a5d6a7; }
.form-group input { width: 100%; }

.btn-submit {
  background: #4caf50;
  color: #fff;
  padding: 0.7rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}
.btn-submit:hover:not(:disabled) { background: #43a047; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.form-links { text-align: center; font-size: 0.9rem; }
.form-links a { color: #4caf50; }

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0;
  color: #6a9a72;
  font-size: 0.85rem;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #2d7a4f;
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.7rem;
  background: #fff;
  color: #333;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
}
.btn-google:hover:not(:disabled) { background: #f5f5f5; }
.btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  background: rgba(239,83,80,0.15);
  border: 1px solid #ef5350;
  color: #ef9a9a;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}
.success-msg {
  background: rgba(76,175,80,0.15);
  border: 1px solid #4caf50;
  color: #a5d6a7;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}
</style>
