<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="modal-close" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div class="modal-logo">
        <span class="logo-icon">🐾</span>
        <span class="logo-text">Зоопитомник</span>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: tab === 'login' }]" @click="tab = 'login'; error = ''; success = ''">Войти</button>
        <button :class="['tab', { active: tab === 'register' }]" @click="tab = 'register'; error = ''; success = ''">Регистрация</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <Transition name="alert">
          <div v-if="error" class="alert alert-error">
            <span>⚠️</span>{{ error }}
          </div>
        </Transition>
        <Transition name="alert">
          <div v-if="success" class="alert alert-success">
            <span>✓</span>{{ success }}
          </div>
        </Transition>

        <div class="form-group">
          <label>Email</label>
          <div class="input-wrap">
            <span class="input-icon">📧</span>
            <input v-model="email" type="email" placeholder="your@email.com" required />
          </div>
        </div>

        <div class="form-group" v-if="tab !== 'forgot'">
          <label>Пароль</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input v-model="password" :type="showPass ? 'text' : 'password'" placeholder="Введите пароль" required />
            <button type="button" class="pass-toggle" @click="showPass = !showPass">
              {{ showPass ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div class="form-group" v-if="tab === 'register'">
          <label>Имя</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input v-model="displayName" type="text" placeholder="Ваше имя" required />
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner-sm"></span>
          <span v-else-if="tab === 'login'">Войти</span>
          <span v-else-if="tab === 'register'">Создать аккаунт</span>
          <span v-else>Отправить письмо</span>
        </button>

        <div class="form-footer">
          <span v-if="tab === 'login'">
            Забыли пароль? <a href="#" @click.prevent="tab = 'forgot'; error = ''; success = ''">Восстановить</a>
          </span>
          <span v-if="tab === 'forgot'">
            <a href="#" @click.prevent="tab = 'login'; error = ''; success = ''">← Назад к входу</a>
          </span>
          <span v-if="tab === 'register'">
            Уже есть аккаунт? <a href="#" @click.prevent="tab = 'login'; error = ''; success = ''">Войти</a>
          </span>
        </div>
      </form>

      <div class="divider"><span>или</span></div>

      <button class="btn-google" @click="handleGoogle" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.2 29.6 1 24 1 14.7 1 6.8 6.7 3.4 14.9l7 5.4C12.2 13.7 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.2-9.9 6.2-16.9z"/><path fill="#FBBC05" d="M10.4 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.9-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.8-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2-6.3 2-6.4 0-11.8-4.3-13.6-10.1l-7.8 6.2C6.7 41.2 14.7 47 24 47z"/></svg>
        Продолжить с Google
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
const showPass = ref(false)

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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: rgba(11, 26, 16, 0.95);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(62,207,94,0.2);
  border-radius: 20px;
  padding: 2.25rem;
  width: 100%;
  max-width: 430px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(62,207,94,0.08);
}

.modal-close {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  background: rgba(255,255,255,0.05);
  color: rgba(238,248,240,0.5);
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover { background: rgba(255,255,255,0.1); color: #eef8f0; }

.modal-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}
.logo-icon { font-size: 1.8rem; filter: drop-shadow(0 0 10px rgba(62,207,94,0.5)); }
.logo-text {
  font-size: 1.35rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3ecf5e 0%, #a8f0b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.tabs {
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(62,207,94,0.12);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 1.75rem;
  gap: 4px;
}
.tab {
  flex: 1;
  padding: 0.55rem;
  background: none;
  color: rgba(238,248,240,0.5);
  border-radius: 9px;
  font-size: 0.92rem;
  font-weight: 700;
  transition: all 0.2s;
}
.tab.active {
  background: linear-gradient(135deg, rgba(62,207,94,0.25) 0%, rgba(62,207,94,0.12) 100%);
  color: #3ecf5e;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.form { display: flex; flex-direction: column; gap: 0.95rem; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label {
  font-size: 0.83rem;
  font-weight: 700;
  color: rgba(238,248,240,0.55);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 0.9rem;
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 1;
}
.input-wrap input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.4rem;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(62,207,94,0.18);
  border-radius: 11px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #eef8f0;
  transition: all 0.2s;
}
.input-wrap input:focus {
  border-color: #3ecf5e;
  background: rgba(62,207,94,0.05);
  box-shadow: 0 0 0 3px rgba(62,207,94,0.12);
  outline: none;
}
.pass-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  font-size: 1rem;
  padding: 0.25rem;
  color: rgba(238,248,240,0.4);
  transition: color 0.15s;
}
.pass-toggle:hover { color: #eef8f0; }

.btn-submit {
  background: linear-gradient(135deg, #3ecf5e 0%, #2aaf4a 100%);
  color: #fff;
  padding: 0.8rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 800;
  margin-top: 0.3rem;
  box-shadow: 0 3px 16px rgba(62,207,94,0.35);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 24px rgba(62,207,94,0.5);
}
.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

.spinner-sm {
  width: 18px; height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.form-footer {
  text-align: center;
  font-size: 0.88rem;
  color: rgba(238,248,240,0.4);
}
.form-footer a {
  color: #3ecf5e;
  font-weight: 700;
}
.form-footer a:hover { text-decoration: underline; }

.divider {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 1.25rem 0;
  color: rgba(238,248,240,0.25);
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(62,207,94,0.12);
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.96);
  color: #222;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.25);
}
.btn-google:hover:not(:disabled) {
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}
.btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

/* Alerts */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.4;
}
.alert-error {
  background: rgba(240,82,82,0.12);
  border: 1px solid rgba(240,82,82,0.3);
  color: #fca5a5;
}
.alert-success {
  background: rgba(62,207,94,0.12);
  border: 1px solid rgba(62,207,94,0.3);
  color: #86efac;
}

.alert-enter-active, .alert-leave-active { transition: all 0.2s ease; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

