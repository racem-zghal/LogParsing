<template>
  <div class="flex">
    <div
      v-if="sidebarVisible"
      class="w-64 bg-gray-800 text-white min-h-screen p-4"
    >
      <h2 class="text-lg font-semibold mb-4">All Test Cases</h2>
      <div class="bg-gray-900 rounded p-3 text-sm">
        <p>Total: <strong>{{ totalTestCases }}</strong></p>
        <p class="text-green-400">✅ Passed: {{ passedTestCases.length }}</p>
        <p class="text-red-400">❌ Failed: {{ failedTestCases.length }}</p>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-bold mb-2">❌ Failed</h3>
        <ul class="space-y-1">
          <li
            v-for="test in failedTestCases"
            :key="test"
            class="text-red-400 cursor-pointer hover:underline"
            @click="$emit('scrollToTestCase', test)"
          >
            {{ test }}
          </li>
        </ul>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-bold mb-2">✅ Passed</h3>
        <ul class="space-y-1">
          <li
            v-for="test in passedTestCases"
            :key="test"
            class="text-green-400 cursor-pointer hover:underline"
            @click="$emit('scrollToTestCase', test)"
          >
            {{ test }}
          </li>
        </ul>
      </div>
    </div>

    <div class="flex-1 p-4">
      <button
        class="mb-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="$emit('toggleSidebar')"
      >
        {{ sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar' }}
      </button>

      <div v-html="formattedLog" class="text-sm whitespace-pre-wrap font-mono"></div>
    </div>
  </div>
</template>

<script>
import { parseLog } from '@/utils/logParser';

export default {
  name: 'AppSidebar',
  props: {
    logData: String,
    sidebarVisible: Boolean
  },
  data() {
    return {
      parsedEntries: [],
      failedTestCases: [],
      passedTestCases: [],
      collapsedTestCases: {}
    };
  },
  computed: {
    totalTestCases() {
      return this.failedTestCases.length + this.passedTestCases.length;
    },
    formattedLog() {
      if (!this.logData) return '';

      let content = this.escapeHtml(this.logData);

      if (this.parsedEntries.length > 0) {
        this.parsedEntries.forEach((entry, index) => {
          if (entry.isTestCase) {
            const testCaseId = `testcase-${index}`;
            const testCaseName = this.extractTestCaseName(entry.message);
            const collapsed = this.collapsedTestCases[testCaseId] ?? true;
            const toggleText = collapsed ? '[+]' : '[–]';
            const displayStyle = collapsed ? 'none' : 'block';

            const spanHtml = `
              <div class="log-entry-wrapper">
                <div 
                  class="log-entry-toggle" 
                  onclick="document.getElementById('${testCaseId}').style.display = (document.getElementById('${testCaseId}').style.display === 'none' ? 'block' : 'none')"
                >
                  ${toggleText} <strong>${testCaseName}</strong>
                </div>
                <div 
                  id="${testCaseId}" 
                  class="log-entry-content" 
                  style="display:${displayStyle}; background-color: ${entry.getBackgroundColor()};
                         border-left: 4px solid ${entry.getBorderColor()}; padding-left: 8px;"
                >
                  ${this.escapeHtml(entry.message)}
                </div>
              </div>
            `;

            content = content.replace(
              this.escapeHtml(entry.message),
              spanHtml
            );
          }
        });
      }

      return content;
    }
  },
  watch: {
    logData: {
      immediate: true,
      handler(newVal) {
        if (!newVal) return;
        const parsed = parseLog(newVal);
        this.parsedEntries = parsed;

        const failedTests = new Set();
        const passedTests = new Set();

        parsed.forEach(entry => {
          if (entry.isTestCase) {
            const name = this.extractTestCaseName(entry.message);
            if (entry.status === 'failed') failedTests.add(name);
            else if (entry.status === 'passed') passedTests.add(name);
          }
        });

        this.failedTestCases = Array.from(failedTests).sort();
        this.passedTestCases = Array.from(passedTests).sort();
      }
    }
  },
  methods: {
    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },
    extractTestCaseName(text) {
      const match = text.match(/\btest[_\w\d\.]+/i);
      return match ? match[0] : 'Unnamed Test';
    },
    toggleTestCase(testCaseId) {
      this.$set(
        this.collapsedTestCases,
        testCaseId,
        !this.collapsedTestCases[testCaseId]
      );
    }
  }
};
</script>

<style scoped>
.log-entry-wrapper {
  margin-bottom: 10px;
}

.log-entry-toggle {
  cursor: pointer;
  background-color: #ecf0f1;
  padding: 6px 10px;
  font-family: monospace;
  border-left: 4px solid #2980b9;
}

.log-entry-content {
  margin-top: 5px;
  padding: 6px 10px;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>