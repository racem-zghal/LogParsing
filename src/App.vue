<template>
  <div class="app-container">
    <div
      v-if="!logData"
      class="upload-area"
      @dragover.prevent
      @drop="handleDrop"
    >
      <h2>📄 Upload Log File</h2>
      <input type="file" @change="handleFileUpload" />
      <p>or drag and drop here</p>
    </div>

    <div v-else class="main-content">
      <div class="sidebar-area">
        <button class="toggle-sidebar" @click="toggleSidebar">
          {{ sidebarVisible ? 'Close Sidebar' : 'Open Sidebar' }}
        </button>

        <div v-show="sidebarVisible" class="sidebar">
          <h3>❌ Failed Test Cases</h3>
          <div class="test-stats">
            <div class="stat-item">
              <span class="stat-label">Total Tests:</span>
              <span class="stat-value">{{ totalTestCases }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Failed:</span>
              <span class="stat-value stat-failed">{{ failedTestCases.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Passed:</span>
              <span class="stat-value stat-passed">{{ passedTestCases.length }}</span>
            </div>
          </div>
          
          <ul>
            <li 
              v-for="(testCase, index) in failedTestCases" 
              :key="index" 
              @click="scrollToTestCase(testCase)"
              class="failed-test-item"
            >
              <span class="test-icon">❌</span>
              {{ testCase }}
            </li>
          </ul>
          
          <div v-if="passedTestCases.length > 0" class="passed-section">
            <h4>✅ Passed Test Cases</h4>
            <ul>
              <li 
                v-for="(testCase, index) in passedTestCases" 
                :key="index" 
                @click="scrollToTestCase(testCase)"
                class="passed-test-item"
              >
                <span class="test-icon">✅</span>
                {{ testCase }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="log-display">
        <div class="log-header">
          <div class="legend">
            <span class="legend-item"></span>
            <span class="legend-item"></span>
            <span class="legend-item"></span>
          </div>
        </div>
        <div class="log-content">
          <pre class="log-raw-content" v-html="formattedLog"></pre>

       
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
import { LogParser } from './parser/LogParser.js';
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


export default {
  data() {
    return {
      logData: '',
      parsedEntries: [],
      sidebarVisible: false,
      failedTestCases: [],
      passedTestCases: [],
      totalTestCases: 0,
      logParser: null
    };
  },
 computed: {
  formattedLog() {
  if (!this.logData) return '';

  return this.parsedEntries.map((entry, idx) => {
    const lineRaw = escapeHtml(entry.rawLine || entry.message); 
    let line = lineRaw

    if (entry.highlightTokens?.length) {
      line = this.applyHighlights(line, entry.highlightTokens);
    }

    if (entry.isTestCase) {
      return `<pre class="log-entry testcase-${entry.testCaseStatus}" 
                   id="testcase-${idx}"
                   style="border-left-color: ${entry.getBorderColor()};
                          background: ${entry.getBackgroundColor()};
                          margin: 0;">
                ${line}
              </pre>`;
    }

    return `<pre class="log-entry" style="margin: 0;">${line}</pre>`;
  }).join('');
}

}
,
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.readLogFile(file);
    },
    
    handleDrop(event) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        this.readLogFile(file);
      }
    },
    
    readLogFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logData = e.target.result;
        this.parseLogData();
      };
      reader.readAsText(file);
    },
   async parseLogData() {
      this.logParser = new LogParser();
      this.parsedEntries = await this.logParser.parse(this.logData); 
      console.log('Entrées parsées:', this.parsedEntries);
      this.extractTestCaseInfo();
    },
    
    extractTestCaseInfo() {
      const failedTests = new Set();
      const passedTests = new Set();
      let totalTests = 0;
      
      this.parsedEntries.forEach(entry => {
        if (entry.isTestCase) {
          totalTests++;
          const testCaseName = this.extractTestCaseName(entry.message);
          
          if (entry.testCaseStatus === 'failed') {
            failedTests.add(testCaseName);
          } else {
            passedTests.add(testCaseName);
          }
        }
      });
      
      this.totalTestCases = totalTests;
      this.failedTestCases = Array.from(failedTests);
      this.passedTestCases = Array.from(passedTests);
    },
    
    extractTestCaseName(message) {
      const match = message.match(/(.+\.py::\w+::\w+)/);
      return match ? match[1] : message;
    },
    
    escapeHtmlPreservingWhitespace(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    
 applyHighlights(text, highlightTokens) {
  console.log('--- applyHighlights() called ---');
  console.log('Original text:', text);
  console.log('Highlight tokens:', JSON.parse(JSON.stringify(highlightTokens)));

  if (!highlightTokens?.length) {
    console.log('No highlight tokens, returning original text');
    return text;
  }

  const sortedTokens = [...highlightTokens].sort((a, b) => b.start - a.start);
  console.log('Sorted tokens:', JSON.parse(JSON.stringify(sortedTokens)));

  let result = text;
  let iteration = 0;

  sortedTokens.forEach(token => {
    iteration++;
    console.log(`\nIteration ${iteration}: Processing token`, token);
    console.log('Current result before processing:', result);

    const before = result.substring(0, token.start);
    const match = result.substring(token.start, token.end);
    const after = result.substring(token.end);
    
    console.log(`Splitting text: before=${before.length} chars | match=${match} | after=${after.length} chars`);
    
    result = `${before}<span class="highlight" style="background:${token.color}">${match}</span>${after}`;
    
    console.log('Result after processing:', result);
  });

  console.log('\nFinal result:', result);
  return result;
},
    
    scrollToTestCase(testCaseName) {
      const entryIndex = this.parsedEntries.findIndex(entry => 
        entry.isTestCase && this.extractTestCaseName(entry.message) === testCaseName
      );
      
      if (entryIndex !== -1) {
        const element = document.getElementById(`testcase-${entryIndex}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          element.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
          element.style.transition = 'background-color 0.3s';
          
          setTimeout(() => {
            const entry = this.parsedEntries[entryIndex];
            element.style.backgroundColor = entry.getBackgroundColor();
          }, 2000);
        } else {
          const logContent = document.querySelector('.log-raw-content');
          if (logContent && logContent.textContent.includes(testCaseName)) {
            const textPosition = logContent.textContent.indexOf(testCaseName);
            if (textPosition !== -1) {
              const lines = logContent.textContent.substring(0, textPosition).split('\n').length;
              const lineHeight = 14.4; 
              const scrollPosition = lines * lineHeight - logContent.clientHeight / 2;
              
              logContent.scrollTop = Math.max(0, scrollPosition);
            }
          }
        }
      }
    },
    
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    }
  }
  };
</script>

<style scoped>
.app-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f5f5;
  height: 100vh;
  box-sizing: border-box;
}

.upload-area {
  margin: auto;
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 2px dashed #ccc;
}

.upload-area input[type='file'] {
  margin-top: 15px;
}

.main-content {
  display: flex;
  height: 100%;
  position: relative;
}

.sidebar-area {
  display: flex;
  flex-direction: column;
  margin-right: 20px;
}

.toggle-sidebar {
  margin-bottom: 10px;
  align-self: flex-start;
  padding: 8px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-sidebar:hover {
  background: #2980b9;
}

.sidebar {
  width: 280px;
  background: #2c3e50;
  color: white;
  padding: 20px;
  overflow-y: auto;
  border-radius: 8px;
  flex-shrink: 0;
  height: 100%;
}

.sidebar h3, .sidebar h4 {
  margin-bottom: 15px;
  color: #ecf0f1;
}

.test-stats {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-label {
  color: #bdc3c7;
}

.stat-value {
  font-weight: bold;
}

.stat-failed {
  color: #e74c3c;
}

.stat-passed {
  color: #2ecc71;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.log-raw-content span {
  padding: 2px;
  border-radius: 3px;
}

.sidebar li:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.test-icon {
  margin-right: 8px;
  font-size: 14px;
}

.passed-section {
  margin-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 20px;
}

.log-display {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.log-header {
  background: #34495e;
  color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #2c3e50;
}

.log-header h3 {
  margin: 0 0 10px 0;
}

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.log-content {
  flex-grow: 1;
  overflow: auto;
  padding: 0;
  position: relative;
}

.log-raw-content {
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.2;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
  tab-size: 4;
  -moz-tab-size: 4;
  padding: 20px;
  margin: 0;
  background: #ffffff;
  color: #000000;
}


.log-entry {
  transition: background-color 0.3s ease;
  /* Préserver le formatage dans les entrées spéciales */
  white-space: pre;
  margin: 0;
  padding: 2px 0;
}

.testcase-passed {
  border-left: 3px solid rgba(46, 204, 113, 0.3) !important;
}

.testcase-failed {
  border-left: 3px solid rgba(231, 76, 60, 0.3) !important;
}

.log-entry {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    margin-bottom: 20px;
  }
  
  .legend {
    flex-direction: column;
    gap: 10px;
  }
  
  .log-raw-content {
    font-size: 12px;
    padding: 15px;
  }
}

.log-content::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.log-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.log-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.highlight-assertion {
  background-color: #FF8800;
  padding: 2px;
  border-radius: 3px;
}

.highlight-exception {
  background-color: #FF5050;
  padding: 2px;
  border-radius: 3px;
}

.highlight-error {
  background-color: #FF0000;
  color: white;
  padding: 2px;
  border-radius: 3px;
}

.highlight-warning {
  background-color: #FFFF00;
  padding: 2px;
  border-radius: 3px;
}
</style>