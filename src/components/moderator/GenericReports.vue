<template>
  <div>
    <div class="columns">
      <slot />
      
      <div class="column is-flex is-2 is-align-self-center is-align-items-center is-justify-content-flex-end">
        <button
          class="button px-1 py-1 borderless"
          @click="collapsed = !collapsed, selectedReportIndexes.clear()"
        >
          <p class="mr-3 is-size-5 ml-2">
            {{ reports.length }} {{ reports.length === 1 ? 'report' : 'reports' }}
          </p>
          <div
            class="sz-2 color-theme"
            :class="{
              'icon-chevron-down': collapsed,
              'icon-chevron-up': !collapsed,
            }"
          />
        </button>
      </div>
    </div>
    
    
    <div v-if="!collapsed">
      <div class="is-flex is-justify-content-flex-end">
        <SmartCheckbox
          ref="selectAllCheckbox"
          text="Select all"
          :start-value="false"
          @changed="selectAll"
        />
      </div>
      <div
        v-for="(report, index) of reports"
        :key="report.reporterUsername"
        class="columns mt-2 is-mobile"
      >
        <div class="column is-2 username-column">
          <RouterLink
            class="is-size-5 is-break-word"
            :to="{ name: 'user-profile', params: { username: report.reporterUsername } }"
          >
            @{{ report.reporterUsername }}
          </RouterLink>
        </div>
        <div class="column is-break-word is-align-self-center px-0">
          {{ report.reasonText }}
        </div>
        <div class="column is-2 is-align-self-center date-column">
          {{
            report.time.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: false,
            })
          }}
        </div>
        <div class="column is-narrow is-align-self-center">
          <SmartCheckbox
            ref="checkboxes"
            :start-value="false"
            @changed="active => onSelectCheckboxChange(active, index)"
          />
        </div>
      </div>
      <div class="is-flex is-justify-content-flex-end mb-5">
        <button
          class="button is-danger loading"
          :class="{'is-loading': deleting}"
          :disabled="selectedReportIndexes.size === 0 || deleting"
          @click="deleteSelectedReportsWithConfirmation"
        >
          <div
            class="sz-icon icon-trash"
            :class="{'color-white': !deleting}"
          />
          Discard selected
        </button>
      </div>
    </div>
    <hr>
  </div>
</template>


<script setup lang="ts">
  import { type Report } from '@/stores/moderator'
  import { ref } from 'vue'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import SmartCheckbox from '@/components/basic-wrappers/SmartCheckbox.vue'
  
  const collapsed = ref(true)
  const deleting = ref(false)
  const selectedReportIndexes = ref<Set<number>>(new Set())
  const selectAllCheckbox = ref<InstanceType<typeof SmartCheckbox>>()
  const checkboxes = ref<InstanceType<typeof SmartCheckbox>[]>([])
    
  const props = defineProps<{
    reports: Report[]
    discardReports: (indexes: Set<number>) => Promise<void>
  }>()
    
  function onSelectCheckboxChange(active: boolean, index: number) {
    if (active) {
      selectedReportIndexes.value.add(index)
      if (selectedReportIndexes.value.size === props.reports.length) {
        selectAllCheckbox.value?.setChecked(true)
      }
    } else {
      selectedReportIndexes.value.delete(index)
      selectAllCheckbox.value?.setChecked(false)
    }
  }
  function selectAll(active: boolean) {
    if (active) {
      selectedReportIndexes.value = new Set(props.reports.map((_, index) => index))
      checkboxes.value.forEach(checkbox => checkbox.setChecked(true))
    } else {
      selectedReportIndexes.value = new Set()
      checkboxes.value.forEach(checkbox => checkbox.setChecked(false))
    }
  }
  
  function deleteSelectedReportsWithConfirmation() {
    if (selectedReportIndexes.value.size === 1) {
      deleteSelectedReports()
      return
    }
    showPopup(
      'Discard reports?',
      'You are about to discard **' + selectedReportIndexes.value.size + '** reports. Select OK to continue.',
      'ok-cancel',
      () => deleteSelectedReports()
    )
  }
  async function deleteSelectedReports() {
    deleting.value = true
    try {
      await props.discardReports(selectedReportIndexes.value)
      selectedReportIndexes.value = new Set()
      selectAllCheckbox.value?.setChecked(false)
    } catch (e) {
      console.error(e)
      showPopup(
        'Error',
        'An unexpected error occurred while discarding the reports. Check the console.',
        'ok'
      )
    }
    deleting.value = false
  }
</script>

<style scoped lang="scss">
  hr {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
  .username-column {
    min-width: 5rem;
  }
  .date-column {
    min-width: 6rem;
  }
</style>
