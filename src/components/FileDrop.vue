<template>
  <div
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    :style="{ border: '2px dashed', padding: '10px', textAlign: 'center', borderColor: isDragging ? 'blue' : '#aaa' }"
  >
    Drop your .log file here or
    <input type="file" @change="handleChange" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDragging: false
    }
  },
  methods: {
    handleDrop(event) {
      this.isDragging = false
      const file = event.dataTransfer.files[0]
      if (file) this.readFile(file)
    },
    handleChange(event) {
      const file = event.target.files[0]
      if (file) this.readFile(file)
    },
    readFile(file) {
      const reader = new FileReader()
      reader.onload = () => {
        this.$emit('file-loaded', reader.result)
      }
      reader.readAsText(file)
    }
  }
}
</script>
