<template>
  <div class="sidebar">
    <input type="text" placeholder="Search test cases..." @input="onSearch" />
    <ul>
      <li
        v-for="testCase in testCases"
        :key="testCase"
        @click="$emit('select', testCase)"
      >
        {{ testCase }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['testCases'],
  methods: {
    onSearch(event) {
      this.$emit('search', event.target.value);
    }
  }
}
</script>

<style>
.sidebar {
  width: 250px;
  background: #f0f0f0;
  padding: 10px;
  border-right: 1px solid #ccc;
  height: 100vh;
  overflow-y: auto;
}
.sidebar input {
  width: 100%;
  padding: 5px;
  margin-bottom: 10px;
}
.sidebar li {
  list-style: none;
  cursor: pointer;
  padding: 5px;
}
.sidebar li:hover {
  background-color: #ddd;
}
</style>