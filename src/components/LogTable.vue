<template>
  <div style="overflow-y: auto; flex-grow: 1;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Level</th>
          <th>Module</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in entries"
          :key="i"
          :id="`entry-${i}`"
          :class="{ highlight: i === highlighted }"
          style="border-bottom: 1px solid #ddd;"
        >
          <td>{{ entry.timestamp || '-' }}</td>
          <td :class="`level-${entry.level?.toLowerCase()}`">{{ entry.level || '-' }}</td>
          <td>{{ entry.module || '-' }}</td>
          <td>{{ entry.message }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    entries: Array,
    highlighted: Number
  }
}
</script>

<style scoped>
.highlight {
  background-color: #ffcccc;
  font-weight: bold;
}
</style>
