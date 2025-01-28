<template>
  <div class="container">
    <NoVncClient
      host="localhost"
      :port="6001"
      :view-only="false"
      password=""
      style="width: 100%; height: 90vh"
    />
  </div>
</template>

<script>
import NoVncClient from '@/components/vnc.vue';

export default {
  components: {
    NoVncClient,
  },
};
</script>
