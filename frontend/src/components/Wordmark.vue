<template>
  <div class="leading-tight select-none">
    <div :class="['font-extrabold tracking-tight bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent', sizeClass]">
      Speakra
    </div>
    <div v-if="subtitle" class="text-xs sm:text-sm text-slate-500 -mt-0.5">
      {{ subtitle }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Wordmark',
  props: {
    subtitle: { type: String, default: '' },
    size: { type: String, default: 'md' }
  },
  computed: {
    sizeClass() {
      switch (this.size) {
        case 'xl': return 'text-3xl';
        case 'lg': return 'text-2xl';
        default:   return 'text-xl';
      }
    }
  }
}
</script>
