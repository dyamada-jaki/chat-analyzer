import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

// Google Login プラグインを設定
app.use(vue3GoogleLogin, {
  clientId: '55163924640-q2se3apg7cgig7ob7as6622gltr3r8fa.apps.googleusercontent.com'
})

app.mount('#app')