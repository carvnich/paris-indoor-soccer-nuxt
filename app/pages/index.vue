<script setup lang="ts">
// "/" opens the last league the visitor picked
await navigateTo(`/${useLeagueCookie().value}`, { replace: true });
</script>
