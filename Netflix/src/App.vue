<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { auth } from './firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Пользователь вошел:', user.email)
    } else {
      console.log('Пользователь не авторизован')
    }
  })
})
</script>

<template>
  <RouterView />
</template>