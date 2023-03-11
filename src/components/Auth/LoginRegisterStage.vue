<template>
  <div>
    <p v-if="!isRegister" class="modal-card-title mb-3">Welcome to ReChess!</p>
    <p v-else class="modal-card-title mb-5">Create account</p>
    
    <p v-if="!isRegister" class="mb-5">Log in or make an account to start reinventing chess in your own way</p>
    
    <div class="mb-5">
      <label class="label">Email</label>
      <SmartTextInput ref="emailRef" type="email" placeholder="Email" 
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (text === '' && !isStrict) return undefined
          if (text === '') return 'An email is required'
          if (!(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/).test(text))
            return 'The email has an invalid format'
        }"
        :start-text="email"
        @changed="text => email = text"/>
    </div>
    
    <div v-show="isRegister" class="mb-5">
      <label class="label">Username</label>
      <SmartTextInput class="mb-2" ref="usernameRef" placeholder="your_username" 
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (!isRegister) return undefined
          if (text === '' && !isStrict) return undefined
          if (text === '') return 'Please enter a username'
          if (text.length < 3) return 'Username must be at least 3 characters long'
          if (text.length > 25) return 'Username must be at most 25 characters long'
          if (!(/^[a-zA-Z0-9_]+$/).test(text)) return 'Username can only contain letters, numbers, and underscores'
        }"
        :start-text="username"
        @changed="updateUsername"/>
      <p class="help"
        :style="{visibility: username ? 'visible' : 'hidden'}"
        :class="{
          'has-text-danger': usernameStatus === 'taken',
          'has-text-success': usernameStatus === 'available',
        }" >
        rechess.org/users/<b>{{ username }}</b>
        {{ usernameStatus === 'taken' ? 'is already taken' : usernameStatus === 'available' ? 'is available' : '' }}
      </p>
    </div>
    
    <div class="mb-5">
      <label class="label">Password</label>
      <SmartTextInput type="password" placeholder="Password" 
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (text === '' && !isStrict) return undefined
          if (text === '') return 'The password is required'
          if (text.length < 6 && isRegister) return 'Password must be at least 6 characters long'
        }"
        :emit-changed-when-error="true"
        :start-text="password"
        @changed="text => password = text"/>
    </div>
    
    <div v-show="isRegister" class="mb-5">
      <label class="label">Repeat password</label>
      <SmartTextInput type="password" placeholder="Password"
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (!isRegister) return undefined
          if (text === '' && !isStrict) return undefined
          if (text.length < 6 || text !== password) return 'Passwords must match and be at least 6 characters long'
        }"
        :start-text="passwordRepeat"
        @changed="text => passwordRepeat = text"/>
    </div>
    
    <SmartErrorMessage class="mb-4" v-show="hasError" :handler="errorHandler" />
    
    <div>
      <button class="button is-primary" @click="signInClick"
        :class="{'is-loading': loading}" :disabled="hasError || loading || (isRegister && usernameStatus !== 'available')">
        {{ isRegister ? 'Register' : 'Sign in' }}
      </button>
    </div>
    
    <div id="firebaseui-auth-container"></div>
    <div class="is-align-self-center pt-5" v-if="loadingSocialSignin">Loading other sign in options...</div>
  </div>
</template>


<script setup lang="ts">
  import 'firebaseui/dist/firebaseui.css'
  import { GoogleAuthProvider } from 'firebase/auth'
  import { GithubAuthProvider } from 'firebase/auth'
  import type { UserCredential } from '@firebase/auth'
  
  import { ref } from 'vue'
  import { useAuthStore } from '@/stores/auth-user'
  import { authUI } from '@/firebase'
  import { UserDB } from '@/firebase/db'
  
  import SmartTextInput from '../BasicWrappers/SmartTextInput.vue'
  import SmartErrorMessage from '../BasicWrappers/SmartErrorMessage.vue'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { UserNotFoundError } from '@/utils/errors/UserNotFoundError'
  import { debounce } from '@/utils/ts-utils'
  
  
  const emailRef = ref<InstanceType<typeof SmartTextInput>>()
  const usernameRef = ref<InstanceType<typeof SmartTextInput>>()
  const loadingSocialSignin = ref(true)
  const email = ref('')
  const username = ref('')
  const password = ref('')
  const passwordRepeat = ref('')
  const isRegister = ref(false)
  const isStrict = ref(false)
  const loading = ref(false)
  
  const authStore = useAuthStore()
  const usernameStatus = ref<'available' | 'taken' | 'unknown'>('unknown')
  const hasError = ref(false)
  const errorHandler = new ErrorMessageHandler(hasError)
  
  
  defineExpose({
    init() {
      // Mount firebaseui
      authUI.start('#firebaseui-auth-container', {
        signInFlow: 'popup',
        signInSuccessUrl: '/',
        signInOptions: [
          GoogleAuthProvider.PROVIDER_ID,
          GithubAuthProvider.PROVIDER_ID,
        ],
        callbacks: {
          signInSuccessWithAuthResult: (authResult: UserCredential) => {
            loading.value = true
            // If this is the first time the user signs in, we need to ask them to choose a username
            UserDB.getUserById(authResult.user.uid).then(user => {
              if (user) {
                // User exists, we can just skip this step and ckeck directly if the user is verified
                emit('check-verify')
              } else {
                emit('choose-username')
              }
            })
            // Don't redirect
            return false
          },
          uiShown: () => {
            loadingSocialSignin.value = false
          },
        }
      })
      emailRef.value?.focus()
    },
    cleanup() {
      isStrict.value = false
      isRegister.value = false
      loading.value = false
      username.value = ''
      passwordRepeat.value = ''
      usernameStatus.value = 'unknown'
    }
  })
  
  const emit = defineEmits<{
    (event: 'check-verify'): void
    (event: 'choose-username'): void
  }>()
  
  
  
  async function updateUsername(name: string) {
    if (name === username.value) return
    username.value = name
    usernameStatus.value = 'unknown'
    if (name === '') return
    // Limit the number of requests to the server
    await checkDebounced(name)
  }
  const checkDebounced = debounce(async (name: string) => {
    const available = await authStore.checkUsername(name)
    // This result is obsolete, user has already changed the username
    if (name !== username.value) return
    usernameStatus.value = available ? 'available' : 'taken'
    errorHandler.clear()
  }, 1000)
  
  async function signInClick() {
    loading.value = true
    try {
      if (isRegister.value) await register()
      else await logIn()
    } catch (e) {
      errorHandler.showException(e)
    }
    loading.value = false
  }
  
  async function register() {
    if (email.value === '' || username.value === '' || password.value === '' || passwordRepeat.value === '') {
      // Refresh error messages, now in strict mode
      isStrict.value = true
      errorHandler.clear()
      return
    }
    // This throws an error if the email or username is already taken
    await authStore.emailRegister(email.value, username.value, password.value)
    // Also send a verification email
    await authStore.sendEmailVerification()
    emit('check-verify')
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
      emit('check-verify')
    } catch (e) {
      if (e instanceof UserNotFoundError) {
        // Transition to register
        isRegister.value = true
        isStrict.value = false
        errorHandler.clear()
        usernameRef.value?.focus()
        return
      }
      throw e
    }
  }
</script>
