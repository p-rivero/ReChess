<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="closePopup"></div>
    <div class="box modal-card signin-card">
      
      <p v-if="!isRegister" class="modal-card-title mb-3">Welcome to ReChess!</p>
      <p v-else class="modal-card-title mb-5">Create account</p>
      
      <p v-if="!isRegister" class="mb-5">Log in or make an account to start reinventing chess in your own way</p>
      
      <div class="mb-5">
        <label class="label">Email</label>
        <SmartTextInput ref="emailRef" :multiline="false" type="email" placeholder="Email" 
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (text === '' && !isStrict) return undefined
            if (text === '') return 'An email is required'
            if (!(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/).test(text))
              return 'The email has an invalid format'
          }"
          @changed="text => email = text"/>
      </div>
      
      <div v-show="isRegister" class="mb-5">
        <label class="label">Display name</label>
        <SmartTextInput ref="usernameRef" :multiline="false" placeholder="Your name" 
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (text === '' && !isStrict) return undefined
            if (text === '') return 'Please enter a name'
            if (text.length < 3) return 'Display name must be at least 3 characters long'
            if (text.length > 25) return 'Display name must be at most 25 characters long'
          }"
          @changed="text => displayName = text"/>
      </div>
      
      <div class="mb-5">
        <label class="label">Password</label>
        <SmartTextInput :multiline="false" type="password" placeholder="Password" 
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (text === '' && !isStrict) return undefined
            if (text === '') return 'The password is required'
            if (text.length < 6 && isRegister) return 'Password must be at least 6 characters long'
          }"
          @changed="text => password = text"/>
      </div>
      
      <div v-show="isRegister" class="mb-5">
        <label class="label">Repeat password</label>
        <SmartTextInput :multiline="false" type="password" placeholder="Password"
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (text === '' && !isStrict) return undefined
            if (text.length < 6 || text !== password) return 'Passwords must match and be at least 6 characters long'
          }"
          @changed="text => passwordRepeat = text"/>
      </div>
      
      <SmartErrorMessage class="mb-4" v-show="hasError" :handler="errorHandler" />
      
      <div>
        <button class="button is-primary" :disabled="hasError" @click="signInClick">
          {{ isRegister ? 'Register' : 'Sign in' }}
        </button>
      </div>
      
      <div id="firebaseui-auth-container"></div>
      <div class="is-align-self-center pt-5" v-if="loadingSocialSignin">Loading other sign in options...</div>
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import 'firebaseui/dist/firebaseui.css'
  import { GoogleAuthProvider } from 'firebase/auth'
  import { GithubAuthProvider } from 'firebase/auth'
  import { FirebaseError } from '@firebase/util'
  
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from '@/stores/auth-user'
  import { authUI } from '@/firebase'
  
  import SmartTextInput from '../BasicWrappers/SmartTextInput.vue'
  import SmartErrorMessage from '../BasicWrappers/SmartErrorMessage.vue'
  import { ErrorMessageHandler } from '@/utils/error-message-handler'
  
  
  const popup = ref<HTMLElement>()
  const emailRef = ref<InstanceType<typeof SmartTextInput>>()
  const usernameRef = ref<InstanceType<typeof SmartTextInput>>()
  const loadingSocialSignin = ref(true)
  const email = ref('')
  const displayName = ref('')
  const password = ref('')
  const passwordRepeat = ref('')
  const isRegister = ref(false)
  const isStrict = ref(false)
  
  const authStore = useAuthStore()
  const hasError = ref(false)
  const errorHandler = new ErrorMessageHandler(hasError)
  
  
  defineExpose({
    show: async () => {
      // Don't show if already logged in
      const logged = await authStore.isLogged()
      if (logged) return
      
      // Mount firebaseui
      authUI.start('#firebaseui-auth-container', {
        signInFlow: 'popup',
        signInSuccessUrl: '/',
        signInOptions: [
          GoogleAuthProvider.PROVIDER_ID,
          GithubAuthProvider.PROVIDER_ID,
        ],
        callbacks: {
          signInSuccessWithAuthResult: _authResult => {
            closePopup()
            // Don't redirect.
            return false
          },
          uiShown: () => {
            loadingSocialSignin.value = false
          },
        }
      })
      
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      emailRef.value?.focus()
    },
    hide: closePopup,
  })
  
  async function signInClick() {
    if (isRegister.value) await register()
    else await logIn()
  }
  
  async function register() {
    if (email.value === '' || displayName.value === '' || password.value === '' || passwordRepeat.value === '') {
      // Refresh error messages, now in strict mode
      isStrict.value = true
      errorHandler.clear()
      return
    }
    
    try {
      await authStore.emailRegister(email.value, displayName.value, password.value)
      closePopup()
    } catch (e) {
      if (!(e instanceof FirebaseError)) throw e
      if (e.code === 'auth/email-already-in-use') {
        errorHandler.show('This email is already in use', -1)
        return
      }
      throw e
    }
  }
  
  async function logIn() {
    if (email.value === '' || password.value === '') {
      // Refresh error messages, now in strict mode
      isStrict.value = true
      errorHandler.clear()
      return
    }
    
    try {
      await authStore.emailLogIn(email.value, password.value)
      closePopup()
    } catch (e) {
      if (!(e instanceof FirebaseError)) throw e
      if (e.code === 'auth/user-not-found') {
        isRegister.value = true
        isStrict.value = false
        errorHandler.clear()
        setTimeout(() => usernameRef.value?.focus(), 100)
        return
      }
      if (e.code === 'auth/wrong-password') {
        errorHandler.show('The password is incorrect', -1)
        return
      }
      throw e
    }
  }
  

  function closePopup() {
    isStrict.value = false
    isRegister.value = false
    passwordRepeat.value = ''
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }

</script>

<style scoped lang="scss">
  .signin-card {
    max-width: 30rem;
  }
</style>
