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
          
          <ul ref="failedTestsList">
            <li 
              v-for="(testCase, index) in failedTestCases" 
              :key="index" 
              @click="scrollToTestCase(testCase)"
              class="failed-test-item"
              :class="{ 'active-test': activeTestCase === testCase }"
              :ref="'testCase-' + testCase"
            >
              <span class="test-icon">❌</span>
              {{ testCase }}
            </li>
          </ul>
          
          <div v-if="passedTestCases.length > 0" class="passed-section">
            <h4>✅ Passed Test Cases</h4>
            <ul ref="passedTestsList">
              <li 
                v-for="(testCase, index) in passedTestCases" 
                :key="index" 
                @click="scrollToTestCase(testCase)"
                class="passed-test-item"
                :class="{ 'active-test': activeTestCase === testCase }"
                :ref="'testCase-' + testCase"
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
          <h3>Log Analysis Results</h3>
          <div class="legend">
            <span class="legend-item">
              <span class="legend-color testcase-passed"></span>
              Test Case Passed
            </span>
            <span class="legend-item">
              <span class="legend-color testcase-failed"></span>
              Test Case Failed
            </span>
            <span class="legend-item">
              <span class="legend-color assertion-highlight"></span>
              Assertion/Exception
            </span>
          </div>
        </div>
        <div class="log-content" v-html="formattedRawLog"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { LogParser } from './parser/LogParser.js';

export default {
  data() {
    return {
      logData: '',
      parsedEntries: [],
      sidebarVisible: true,
      failedTestCases: [],
      passedTestCases: [],
      totalTestCases: 0,
      logParser: null,
      rawLogLines: [],
      activeTestCase: null
    };
  },
  computed: {
    formattedRawLog() {
      if (!this.logData) return '';
      
      const lines = this.logData.split(/\r?\n/);
      let processedLines = [];
      
      try {
        // Si LogParser est disponible, utiliser ses informations pour le surlignage
        if (this.logParser && this.parsedEntries.length > 0) {
          let currentEntryIndex = 0;
          
          lines.forEach((line, lineIndex) => {
            let highlightedLine = line;
            
            // Chercher si cette ligne correspond à une entrée parsée
            if (currentEntryIndex < this.parsedEntries.length) {
              const entry = this.parsedEntries[currentEntryIndex];
              
              // Vérifier si la ligne actuelle contient le message de l'entrée
              if (line.includes(entry.message) || entry.message.includes(line.trim())) {
                // Appliquer les highlights
                highlightedLine = this.applyHighlights(line, entry.highlightTokens);
                
                // Déterminer la couleur de fond et bordure
                const backgroundColor = entry.getBackgroundColor();
                const borderColor = entry.getBorderColor();
                const icon = entry.getIcon();
                
                let cssClass = '';
                if (entry.isTestCase) {
                  cssClass = entry.testCaseStatus === 'failed' ? 'testcase-failed' : 'testcase-passed';
                } else if (entry.category === 'assertion' || entry.category === 'exception') {
                  cssClass = 'assertion-line';
                }
                
                processedLines.push(`
                  <div 
                    class="raw-log-line ${cssClass}" 
                    style="
                      background-color: ${backgroundColor}; 
                      border-left: 4px solid ${borderColor}; 
                      padding: 4px 8px; 
                      margin: 1px 0;
                    "
                  >
                    <span class="line-number">${lineIndex + 1}</span>
                    <span class="entry-icon">${icon}</span>
                    <span class="line-content">${highlightedLine}</span>
                  </div>
                `);
                
                currentEntryIndex++;
              } else {
                // Ligne normale sans traitement spécial
                processedLines.push(`
                  <div class="raw-log-line">
                    <span class="line-number">${lineIndex + 1}</span>
                    <span class="line-content">${this.escapeHtml(line)}</span>
                  </div>
                `);
              }
            } else {
              // Ligne normale sans traitement spécial
              processedLines.push(`
                <div class="raw-log-line">
                  <span class="line-number">${lineIndex + 1}</span>
                  <span class="line-content">${this.escapeHtml(line)}</span>
                </div>
              `);
            }
          });
        } else {
          // Si pas de LogParser, afficher le contenu brut simple
          lines.forEach((line, lineIndex) => {
            processedLines.push(`
              <div class="raw-log-line">
                <span class="line-number">${lineIndex + 1}</span>
                <span class="line-content">${this.escapeHtml(line)}</span>
              </div>
            `);
          });
        }
      } catch (error) {
        console.warn('Error processing log with highlights:', error);
        // Fallback : affichage simple
        lines.forEach((line, lineIndex) => {
          processedLines.push(`
            <div class="raw-log-line">
              <span class="line-number">${lineIndex + 1}</span>
              <span class="line-content">${this.escapeHtml(line)}</span>
            </div>
          `);
        });
      }
      
      return processedLines.join('');
    }
  },
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
        this.processLogData();
      };
      reader.readAsText(file);
    },
    
    processLogData() {
      this.rawLogLines = this.logData.split(/\r?\n/);
      this.parseLogData();
    },
    
    parseLogData() {
      try {
        this.logParser = new LogParser();
        this.parsedEntries = this.logParser.parse(this.logData);
        this.extractTestCaseInfo();
      } catch (error) {
        console.warn('LogParser not available or error parsing:', error);
        this.parsedEntries = [];
        this.failedTestCases = [];
        this.passedTestCases = [];
        this.totalTestCases = 0;
      }
    },
    
    extactTestCaseInfo() {
      const failedTests = new Set();
      const passedTests = new Set();
      let totalTests = 0;
      
      this.parsedEntries.forEach((entry) => {
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
    
    applyHighlights(message, highlightTokens) {
      if (!highlightTokens || highlightTokens.length === 0) {
        return this.escapeHtml(message);
      }
      
      const sortedTokens = highlightTokens.sort((a, b) => b.start - a.start);
      let result = this.escapeHtml(message);
      
      sortedTokens.forEach(token => {
        const before = result.substring(0, token.start);
        const highlighted = result.substring(token.start, token.end);
        const after = result.substring(token.end);
        
        let cssClass = '';
        switch (token.type) {
          case 'assertion': cssClass = 'highlight-assertion'; break;
          case 'exception': cssClass = 'highlight-exception'; break;
          case 'error': cssClass = 'highlight-error'; break;
          case 'warning': cssClass = 'highlight-warning'; break;
          default: cssClass = 'highlight-default';
        }
        
        result = before + `<span class="${cssClass}">${highlighted}</span>` + after;
      });
      
      return result;
    },
    
    scrollToTestCase(testCaseName) {
      this.activeTestCase = testCaseName;
      
      // Scroll dans le contenu principal
      const entryIndex = this.parsedEntries.findIndex(entry => 
        entry.isTestCase && this.extractTestCaseName(entry.message) === testCaseName
      );
      
      if (entryIndex !== -1) {
        const element = document.getElementById(`testcase-${entryIndex}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          
          element.classList.add('highlighted');
          setTimeout(() => {
            element.classList.remove('highlighted');
          }, 2000);
        }
      }
      
      // Scroll dans la sidebar
      this.$nextTick(() => {
        const testCaseRef = this.$refs[`testCase-${testCaseName}`];
        if (testCaseRef && testCaseRef[0]) {
          testCaseRef[0].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      });
    },
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
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
  height: calc(100vh - 40px);
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
  height: calc(100% - 50px);
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
  max-height: calc(100% - 200px);
  overflow-y: auto;
}

.sidebar li {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  transition: all 0.2s;
  margin: 2px 0;
  border-radius: 4px;
}

.sidebar li:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar li.active-test {
  background: rgba(52, 152, 219, 0.3);
  font-weight: bold;
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
  margin: 0 0 15px 0;
}

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.legend-color.testcase-passed {
  background-color: #E6FFE6;
  border-color: #00AA00;
}

.legend-color.testcase-failed {
  background-color: #FFE6E6;
  border-color: #FF0000;
}

.legend-color.assertion-highlight {
  background-color: #FFE6CC;
  border-color: #FF8800;
}

.log-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.raw-log-line {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid #f1f3f4;
  min-height: 20px;
  transition: background-color 0.2s;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.raw-log-line:hover {
  background-color: #f8f9fa;
}

.line-number {
  background: #e9ecef;
  color: #6c757d;
  padding: 4px 12px;
  font-size: 11px;
  min-width: 60px;
  text-align: right;
  border-right: 1px solid #dee2e6;
  flex-shrink: 0;
  user-select: none;
}

.line-content {
  padding: 4px 12px;
  white-space: pre;
  word-break: break-all;
  flex-grow: 1;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  transition: all 0.3s ease;
  position: relative;
}

.log-entry.highlighted {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
  z-index: 10;
}

.entry-icon {
  margin-right: 8px;
  font-size: 14px;
}

.highlight-assertion {
  background-color: #FF8800;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.highlight-exception {
  background-color: #e74c3c;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.highlight-error {
  background-color: #c0392b;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.highlight-warning {
  background-color: #f39c12;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.highlight-default {
  background-color: #95a5a6;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
}

.testcase-passed {
  border-left-width: 6px !important;
}

.testcase-failed {
  border-left-width: 6px !important;
}

.assertion-line {
  border-left-width: 3px !important;
  margin-left: 10px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
}
</style>