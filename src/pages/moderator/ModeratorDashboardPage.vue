<template>
  <div class="mb-6">
    <div class="is-flex is-align-items-center is-justify-content-space-between">
      <p class="is-size-2 mb-2">
        Reported users
      </p>
      <button
        class="button borderless sz-3"
        @click="moderatorStore.refreshUserReports"
      >
        <div class="icon-reload sz-2 color-theme" />
      </button>
    </div>
    <hr>
    <UserReports
      v-for="reports of moderatorStore.userReports"
      :key="reports.reportedUser.uid"
      :store-key="reports.reportedUser.uid"
      :user-reports="reports"
    />
  </div>
  <div>
    <div class="is-flex is-align-items-center is-justify-content-space-between">
      <p class="is-size-2 mb-2">
        Reported variants
      </p>
      <button
        class="button borderless sz-3"
        @click="moderatorStore.refreshVariantReports"
      >
        <div class="icon-reload sz-2 color-theme" />
      </button>
    </div>
    <hr>
    <VariantReports
      v-for="reports of moderatorStore.variantReports"
      :key="reports.reportedVariant.uid"
      :store-key="reports.reportedVariant.uid"
      :variant-reports="reports"
    />
  </div>
</template>


<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useModeratorStore } from '@/stores/moderator'
  import UserReports from '@/components/moderator/UserReports.vue'
  import VariantReports from '@/components/moderator/VariantReports.vue'
  
  const authStore = useAuthStore()
  const moderatorStore = useModeratorStore()
  
  onMounted(() => {
    moderatorStore.refreshUserReports()
    moderatorStore.refreshVariantReports()
  })
  
  function checkUserIsModerator() {
    if (!authStore.loggedUser) {
      returnHome(401, 'If you are a moderator, please log in to access this page.')
      return
    }
    
    if (!authStore.loggedUser.moderator) {
      returnHome(403, 'You need to be a moderator to access this page.')
    }
  }
  
  watch(authStore, checkUserIsModerator)
  onMounted(checkUserIsModerator)
</script>
