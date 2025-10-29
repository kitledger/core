<script setup lang="ts">

import { ref } from "vue";

const count = ref(0);

</script>

<template>
  <div class="app">
	<h1>Welcome to Kitledger Vue Client!</h1>
	<button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

