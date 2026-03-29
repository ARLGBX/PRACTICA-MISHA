<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="close-btn" @click="closeModal">✕</button>

      <div class="auth-tabs">
        <button
            :class="['tab', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
        >
          Вход
        </button>
        <button
            :class="['tab', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
        >
          Регистрация
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <input
              type="email"
              v-model="email"
              placeholder="Email"
              required
              class="auth-input"
          />
        </div>

        <div class="form-group">
          <input
              type="password"
              v-model="password"
              placeholder="Пароль"
              required
              class="auth-input"
          />
        </div>

        <div v-if="activeTab === 'register'" class="form-group">
          <input
              type="password"
              v-model="confirmPassword"
              placeholder="Подтвердите пароль"
              required
              class="auth-input"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Загрузка...' : (activeTab === 'login' ? 'Войти' : 'Зарегистрироваться') }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div class="auth-divider">или</div>

      <button @click="signInWithGoogle" class="google-btn" :disabled="loading">
        <span>G</span> Войти через Google
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
  GoogleAuthProvider
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const props = defineProps({
  showModal: Boolean
})

const emit = defineEmits(['close', 'success'])

const activeTab = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const closeModal = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''

  if (activeTab.value === 'register' && password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  loading.value = true

  try {
    let userCredential;
    if (activeTab.value === 'login') {
      userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      
      await setDoc(doc(db, 'userData', userCredential.user.uid), {
        email: email.value,
        createdAt: serverTimestamp()
      })
    }

    emit('success')
    closeModal()
  } catch (err) {
    switch (err.code) {
      case 'auth/user-not-found':
        error.value = 'Пользователь не найден'
        break
      case 'auth/wrong-password':
        error.value = 'Неверный пароль'
        break
      case 'auth/email-already-in-use':
        error.value = 'Email уже используется'
        break
      case 'auth/weak-password':
        error.value = 'Пароль должен содержать минимум 6 символов'
        break
      default:
        error.value = 'Ошибка авторизации. Попробуйте позже.'
        console.error(err)
    }
  } finally {
    loading.value = false
  }

  
  if (activeTab.value === 'register') {
    userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    
    await setDoc(doc(db, 'userData', userCredential.user.uid), {
      email: email.value,
      displayName: '',
      role: 'user',  
      createdAt: serverTimestamp()
    })
  }

}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''

  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)

    
    await setDoc(doc(db, 'userData', userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      createdAt: serverTimestamp()
    }, { merge: true })

    emit('success')
    closeModal()
  } catch (err) {
    error.value = 'Ошибка входа через Google'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #141414;
  border-radius: 12px;
  padding: 40px;
  width: 90%;
  max-width: 450px;
  position: relative;
  color: white;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.auth-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid #333;
}

.tab {
  background: none;
  border: none;
  color: #aaa;
  font-size: 18px;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  color: #e50914;
  border-bottom: 2px solid #e50914;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  width: 100%;
}

.auth-input {
  width: 100%;
  padding: 12px;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.auth-input:focus {
  outline: none;
  background: #444;
}

.submit-btn {
  background: #e50914;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #f40612;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #e50914;
  text-align: center;
  font-size: 14px;
  margin-top: 10px;
}

.auth-divider {
  text-align: center;
  color: #666;
  margin: 20px 0;
  position: relative;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #333;
}

.auth-divider::before {
  left: 0;
}

.auth-divider::after {
  right: 0;
}

.google-btn {
  width: 100%;
  padding: 12px;
  background: white;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.3s;
}

.google-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.google-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.google-btn span {
  font-weight: bold;
  font-size: 18px;
}
</style>