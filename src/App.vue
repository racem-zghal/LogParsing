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
        <div class="log-content">
          <pre class="log-raw-content" v-html="formattedLog"></pre>
        </div>
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
      
      // Retourner le contenu brut du fichier avec juste les highlights essentiels
      let content = this.escapeHtml(this.logData);
      
      // Appliquer uniquement les highlights pour les éléments critiques si nécessaire
      if (this.parsedEntries.length > 0) {
        this.parsedEntries.forEach((entry, index) => {
          if (entry.isTestCase) {
            const testCaseId = `testcase-${index}`;
            const originalMessage = this.escapeHtml(entry.message);
            const backgroundColor = entry.getBackgroundColor();
            const borderColor = entry.getBorderColor();
            
            // Remplacer la ligne originale par une version avec ID pour la navigation
            content = content.replace(
              originalMessage,
              `<span class="log-entry" id="${testCaseId}" style="background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; display: block; padding-left: 8px;">${originalMessage}</span>`
            );
          }
        });
      }
      
      return content;
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
        this.parseLogData();
      };
      reader.readAsText(file);
    },
    
    parseLogData() {
      // Initialiser le parser seulement pour extraire les informations des tests
      // sans modifier le contenu original
      this.logParser = new LogParser();
      
      // Parser les données pour extraire les informations nécessaires à la navigation
      this.parsedEntries = this.logParser.parse(this.logData);
      
      // Extraire les informations des test cases pour la sidebar
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
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    applyHighlights(message, highlightTokens) {
      if (!highlightTokens || highlightTokens.length === 0) {
        return message;
      }
      
      // Trier les tokens par position pour éviter les conflits
      const sortedTokens = highlightTokens.sort((a, b) => b.start - a.start);
      
      let result = message;
      sortedTokens.forEach(token => {
        const before = result.substring(0, token.start);
        const highlighted = result.substring(token.start, token.end);
        const after = result.substring(token.end);
        
        let cssClass = '';
        switch (token.type) {
          case 'assertion':
            cssClass = 'highlight-assertion';
            break;
          case 'exception':
            cssClass = 'highlight-exception';
            break;
          case 'error':
            cssClass = 'highlight-error';
            break;
          case 'warning':
            cssClass = 'highlight-warning';
            break;
          default:
            cssClass = 'highlight-default';
        }
        
        result = before + `<span class="${cssClass}">${highlighted}</span>` + after;
      });
      
      return result;
    },
    
    scrollToTestCase(testCaseName) {
      // Trouver l'entrée correspondante dans le contenu original
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
          
          // Ajouter un effet de surbrillance temporaire
          element.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
          element.style.transition = 'background-color 0.3s';
          
          setTimeout(() => {
            const entry = this.parsedEntries[entryIndex];
            element.style.backgroundColor = entry.getBackgroundColor();
          }, 2000);
        } else {
          // Si l'élément avec ID n'est pas trouvé, chercher dans le texte brut
          const logContent = document.querySelector('.log-raw-content');
          if (logContent && logContent.textContent.includes(testCaseName)) {
            // Faire défiler vers le début du contenu contenant le test case
            const textPosition = logContent.textContent.indexOf(testCaseName);
            if (textPosition !== -1) {
              // Calculer approximativement la position de défilement
              const lines = logContent.textContent.substring(0, textPosition).split('\n').length;
              const lineHeight = 14.4; // 12px * 1.2 line-height
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
  overflow: auto;
  padding: 0;
  position: relative;
}

/* Styles pour préserver le format exact du fichier log */
.log-raw-content {
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.2;
  margin: 0;
  padding: 20px;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
  background: #ffffff;
  color: #000000;
  border: none;
  outline: none;
  position: relative;
  tab-size: 4;
  -moz-tab-size: 4;
}

/* Styles pour les entrées de log identifiées (pour navigation uniquement) */
.log-entry {
  transition: background-color 0.3s ease;
}

/* Pas d'autres modifications visuelles pour préserver l'aspect original */

/* Suppression des styles de highlight pour préserver le texte original */
/* Seuls les éléments de test case auront une bordure subtile pour la navigation */

/* Styles spécifiques pour les types de test cases - très subtils */
.testcase-passed {
  border-left: 3px solid rgba(46, 204, 113, 0.3) !important;
}

.testcase-failed {
  border-left: 3px solid rgba(231, 76, 60, 0.3) !important;
}

/* Animation pour les nouveaux éléments */
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

/* Responsive design */
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
    font-size: 11px;
    padding: 15px;
  }
}

/* Scrollbar styling pour WebKit browsers */
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
</style>