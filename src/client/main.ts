import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { router } from './routes/router'
import './style.css'
import App from './App.vue'

const app = createApp(App);
const pinia = createPinia();
const colada = PiniaColada;

app.use(pinia);
app.use(colada, {});
app.use(router);
app.mount('#app')