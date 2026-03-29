<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'

onMounted(() => {
  onAuthStateChanged(auth, () => {})
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
