<template>
  <GenericUserReports
    :reports="userReports.reports"
    :discard-reports="discardReports"
  >
    <div class="column is-flex is-align-self-center is-align-items-center">
      <img
        v-if="user.profileImg"
        class="sz-3 mr-3 is-rounded"
        :src="user.profileImg"
        draggable="false"
        alt="Profile image"
      >
      <div
        v-else
        class="sz-3 mr-3 icon-user color-theme"
      />
      <div>
        <RouterLink
          class="is-size-4 is-break-word"
          :to="{ name: 'user-profile', params: { username: user.username } }"
        >
          {{ user.displayName }}
        </RouterLink>
        <p class="is-size-5 is-break-word">
          @{{ user.username }}
        </p>
      </div>
    </div>
      
      
    <div class="column is-flex is-3 is-align-self-center is-align-items-center">
      <p class="is-size-4 mr-3">
        {{ user.numWinPoints }} / {{ user.numGamesPlayed }}
      </p>
      <TooltipInfo text="Win points / Played games" />
    </div>
  </GenericUserReports>
</template>


<script setup lang="ts">
  import { type UserReports, useModeratorStore } from '@/stores/moderator'
  import { computed } from 'vue'
  import GenericUserReports from './GenericReports.vue'
  import TooltipInfo from '@/components/TooltipInfo.vue'
  
  const moderatorStore = useModeratorStore()
  
  const props = defineProps<{
    userReports: UserReports
  }>()
  
  const user = computed(() => props.userReports.reportedUser)
  
  async function discardReports(indexes: Set<number>) {
    const userId = user.value.uid
    await moderatorStore.discardUserReports(userId, indexes)
  }
</script>
