<template>
  <div>
    <p
      v-if="!isRegister"
      class="modal-card-title mb-3"
    >
      Welcome to ReChess!
    </p>
    <p
      v-else
      class="modal-card-title mb-5"
    >
      Create account
    </p>
    
    <p
      v-if="!isRegister"
      class="mb-5"
    >
      Log in or make an account to start reinventing chess in your own way
    </p>
    
    <div class="mb-5">
      <label class="label">Email</label>
      <SmartTextInput
        ref="emailRef"
        type="email"
        placeholder="Email"
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (text === '' && !isStrict) return undefined
          if (text === '') return 'An email is required'
          if (!(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/).test(text))
            return 'The email has an invalid format'
        }"
        :start-text="email"
        @changed="text => email = text"
      />
    </div>
    
    <div
      v-show="isRegister"
      class="mb-5"
    >
      <label class="label">Username</label>
      <UsernameTextbox
        ref="usernameRef"
        :error-handler="errorHandler"
        :strict-mode="isStrict"
        :disable-checking="!isRegister"
      />
    </div>
    
    <div class="mb-5">
      <label class="label">Password</label>
      <p class="control has-icons-right">
        <SmartTextInput
          :type="revealPasswords ? 'text' : 'password'"
          placeholder="Password"
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (text === '' && !isStrict) return undefined
            if (text === '') return 'The password is required'
            if (text.length < 6 && isRegister) return 'Password must be at least 6 characters long'
          }"
          :emit-changed-when-error="true"
          :start-text="password"
          @changed="text => password = text"
          @enter-pressed="signInClick"
        />
        <span
          v-show="password.length > 0"
          class="icon is-small is-right is-clickable"
          @click="revealPasswords = !revealPasswords"
        >
          <div
            class="sz-icon color-theme"
            :class="{
              'icon-eye': !revealPasswords,
              'icon-eye-off': revealPasswords,
            }"
          />
        </span>
      </p>
    </div>
    
    <div
      v-show="isRegister"
      class="mb-5"
    >
      <label class="label">Repeat password</label>
      <p class="control has-icons-right">
        <SmartTextInput
          ref="passwordRepeatRef"
          :type="revealPasswords ? 'text' : 'password'"
          placeholder="Password"
          :error-handler="errorHandler"
          :refresh-handler-on-input="true"
          :validator="text => {
            if (!isRegister) return undefined
            if (text === '' && !isStrict) return undefined
            if (text.length < 6 || text !== password) return 'Passwords must match and be at least 6 characters long'
          }"
          :emit-changed-when-error="true"
          :start-text="passwordRepeat"
          @changed="text => passwordRepeat = text"
          @enter-pressed="signInClick"
        />
        <span
          v-show="passwordRepeat.length > 0"
          class="icon is-small is-right is-clickable"
          @click="revealPasswords = !revealPasswords"
        >
          <div
            class="sz-icon color-theme"
            :class="{
              'icon-eye': !revealPasswords,
              'icon-eye-off': revealPasswords,
            }"
          />
        </span>
      </p>
    </div>
    
    <div class="mb-4 is-flex">
      <SmartErrorMessage
        v-show="hasError"
        class="mr-5"
        :handler="errorHandler"
      />
      <a
        v-show="resetPasswordHint === 'shown'"
        class="has-text-danger"
        @click="resetPassword"
      >Reset password?</a>
      <p v-show="resetPasswordHint === 'sending'">
        Sending...
      </p>
    </div>
    
    <p
      v-if="isRegister"
      class="help mb-4"
    >
      By creating an account, you agree to the <a href="/tos">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
    </p>
    
    <div class="pb-2 is-flex is-justify-content-space-between is-align-items-center">
      <button
        class="button is-primary mr-4"
        :class="{'is-loading': loading}"
        :disabled="submitDisabled"
        @click="signInClick"
      >
        {{ isRegister ? 'Register' : 'Sign in' }}
      </button>
      <a
        v-if="!isRegister"
        @click="toggleRegister"
      >Don't have an account?</a>
    </div>
    
    <div class="is-flex is-flex-direction-column is-justify-content-space-between is-align-items-center">
      <button
        class="button is-light mt-5 has-shadow"
        :disabled="loading"
        @click="thirdPartySignIn('google')"
      >
        <div class="sz-icon mr-3 google-icon" />
        Sign in with Google
      </button>
      <button
        class="button is-dark mt-3 has-shadow"
        :disabled="loading"
        @click="thirdPartySignIn('github')"
      >
        <div class="sz-icon mr-3 icon-github color-white" />
        Sign in with GitHub
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth-user'
  
  import { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  import { PopupClosedError } from '@/helpers/errors/PopupClosedError'
  import { RechessError } from '@/helpers/errors/RechessError'
  import { UserNotFoundError } from '@/helpers/errors/UserNotFoundError'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import SmartErrorMessage from '@/components/basic-wrappers/SmartErrorMessage.vue'
  import SmartTextInput from '@/components/basic-wrappers/SmartTextInput.vue'
  import UsernameTextbox from './UsernameTextbox.vue'
  
  
  const emailRef = ref<InstanceType<typeof SmartTextInput>>()
  const usernameRef = ref<InstanceType<typeof UsernameTextbox>>()
  const passwordRepeatRef = ref<InstanceType<typeof SmartTextInput>>()
  const email = ref('')
  const password = ref('')
  const passwordRepeat = ref('')
  const isRegister = ref(false)
  const isStrict = ref(false)
  const loading = ref(false)
  const revealPasswords = ref(false)
  
  const authStore = useAuthStore()
  const hasError = ref(false)
  const resetPasswordHint = ref<'hidden' | 'shown' | 'sending'>('hidden')
  const errorHandler = new ErrorMessageHandler(hasError)
  
  const submitDisabled = computed(() => {
    if (!usernameRef.value) return true
    return hasError.value || loading.value || (isRegister.value && usernameRef.value.usernameStatus !== 'available')
  })
  
  defineExpose({
    init() {
      emailRef.value?.focus()
    },
    cleanup() {
      isStrict.value = false
      isRegister.value = false
      loading.value = false
      revealPasswords.value = false
      resetPasswordHint.value = 'hidden'
      passwordRepeat.value = ''
      usernameRef.value?.cleanup()
      passwordRepeatRef.value?.setText('')
    },
  })
  
  const emit = defineEmits<{
    (event: 'check-verify'): void
    (event: 'choose-username'): void
  }>()
  
  
  async function signInClick() {
    if (submitDisabled.value) return
    resetPasswordHint.value = 'hidden'
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
    if (!usernameRef.value) throw new Error('Username textbox not found')
    if (email.value === '' || usernameRef.value.username === '' || password.value === '' || passwordRepeat.value === '') {
      // Refresh error messages, now in strict mode
      isStrict.value = true
      errorHandler.clear()
      return
    }
    // This throws an error if the email or username is already taken
    await authStore.emailRegister(email.value, usernameRef.value.username, password.value)
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
        toggleRegister()
        usernameRef.value?.focus()
        return
      }
      if (e instanceof RechessError && e.code === 'WRONG_PASSWORD') {
        // The user might have tried to log in with a mail associated with a google account
        const provider = await authStore.getProvider(email.value)
        // The user has definitely entered the wrong password, throw the error and show hint
        if (provider === 'password') {
          resetPasswordHint.value = 'shown'
          throw e
        }
        throw new RechessError('WRONG_PASSWORD_PROVIDER', { provider: provider === 'google.com' ? 'Google' : 'GitHub' })
      }
      throw e
    }
  }
  
  async function thirdPartySignIn(provider: 'google'|'github') {
    loading.value = true
    try {
      const user = await authStore.thirdPartySignIn(provider)
      if (user) {
        // User exists, we can just skip this step and ckeck directly if the user is verified
        emit('check-verify')
      } else {
        emit('choose-username')
      }
    } catch (e) {
      if (e instanceof PopupClosedError) {
        // The user closed the popup, do nothing
        return
      }
      if (e instanceof RechessError) {
        errorHandler.showException(e)
        return
      }
      console.error(e)
      showPopup('Error', 'An unknown error occurred while signing in. Please try again later.', 'ok')
    } finally {
      loading.value = false
    }
  }
  
  function toggleRegister() {
    isRegister.value = !isRegister.value
    isStrict.value = false
    errorHandler.clear()
  }
  
  async function resetPassword() {
    resetPasswordHint.value = 'sending'
    try {
      await authStore.sendPasswordResetEmail(email.value)
      showPopup('Reset password', `We have sent \`${email.value}\` an email to reset your password.`, 'ok')
    } catch (e) {
      console.error(e)
      showPopup('Reset password', `Could not send email to \`${email.value}\`. Make sure the address is correct.`, 'ok')
    }
    resetPasswordHint.value = 'hidden'
  }
  // Hide the reset password hint if the user changes anything
  watch([email, usernameRef, password, passwordRepeat], () => {
    resetPasswordHint.value = 'hidden'
  })
</script>


<style scoped>
  .google-icon {
    background: url("@/assets/img/icons/google-color.svg");
    background-size: 85%;
    background-position: center;
    background-repeat: no-repeat;
  }
  
  button.has-shadow {
    box-shadow: 0 0.1em 0.5em 0 rgba(0, 0, 0, 0.2);
  }
</style>
