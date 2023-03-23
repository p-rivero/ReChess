<template>
  <div>
    <div class="is-flex is-flex-direction-row is-justify-content-center">
      <div class="box">
        <p class="control has-icons-left has-icons-right">
          <SmartTextInput
            class="is-medium"
            placeholder="Search variants..."
          />
          <span class="icon is-small is-left px-3 py-3">
            <div class="icon-search color-theme" />
          </span>
        </p>
      </div>
    </div>
    <VariantList />
  </div>
</template>

<script setup lang="ts">
  import VariantList from '@/components/ViewVariant/VariantList.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import { onMounted } from 'vue'
  import { updateTitle } from '@/utils/web-utils'
  onMounted(() => updateTitle())
</script>

<style lang="scss" scoped>
  .box {
    padding: 0;
    max-width: 1000px;
    flex-grow: 1;
  }
</style>
