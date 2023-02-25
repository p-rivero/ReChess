<template>
  <div>
    <p>Home page</p>
    <button @click="$router.push('/play')" class="button is-primary">Go to /play</button>
    <button @click="$router.push('/edit')" class="button is-primary">Edit variant</button>
  </div>
</template>
