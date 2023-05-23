<script setup lang="ts">
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { useRoute, useRouter } from 'vue-router'
  
  const router = useRouter()
  const route = useRoute()
  returnHome(router, 404, 'The page you are looking for does not exist: `' + route.path + '`.' +
    '\n\nIf you think this is a mistake, please [open an issue on GitHub](https://github.com/p-rivero/ReChess/issues).')
</script>
