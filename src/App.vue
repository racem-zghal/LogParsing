<template>
<div class="app-container">
    <div
  v-if="!logData && !loading"
  class="upload-area"
  @dragover.prevent="dragover = true"
  @dragleave="dragover = false"
  @drop="handleDrop($event); dragover = false"
  :class="{ 'drag-active': dragover }"
>
  <div class="upload-content">
    <div class="upload-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
      </svg>
    </div>
    <h2>Analysez vos logs en un clic</h2>
    <p class="subtitle">Glissez-déposez votre fichier log ou</p>
    <label class="file-upload-button">
      <input type="file" @change="handleFileUpload" hidden/>
      <span>Parcourir les fichiers</span>
    </label>
    <p class="file-types">Formats supportés: .log, .txt, .json</p>
  </div>
</div>
<div v-if="loading" class="loading-screen">
  <div class="progress-container">
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>
  </div>
  <p class="progress-text">Analyse en cours... {{ progress - 55 }}%</p>
</div>

    <div v-if="logData && !loading" class="main-content">
      
      <div class="log-display">
        <div class="log-header">
         <div class="left-controls">
    <select v-model="selectedLogLevel" class="log-level-filter">
      <option value="">📂 All Levels</option>
      <option value="DBG">🐛 DBG</option>
      <option value="INF">ℹ️ INF</option>
      <option value="WARN">⚠️ WARN</option>
    </select>
    <div class="legend">
      <span class="legend-item"></span>
      <span class="legend-item"></span>
      <span class="legend-item"></span>
    </div>
  </div>

  <input
    v-model="searchQuery"
    @input="handleSearch"
    placeholder="🔍 Search logs..."
    class="search-bar"
  />
        </div>
        
        <div class="log-raw-content">
<div class="button-group">
  <button @click="collapseAllSections" class="icon-btn btn-close"></button>
  <button @click="expandAllSections" class="icon-btn btn-open"></button>
</div>

  <div
  v-for="(entry, idx) in parsedEntries"
  :key="idx"
  :id="'testcase-' + idx"
>
  <div
    v-if="entry.isTestCase && entry.isFinalSection===false && entry.isFinalSectionContent===false"
    class="log-entry testcase-header"
    :class="'testcase-' + entry.testCaseStatus"
    @click="toggleTestCase(idx)"
    :style="{
      borderLeftColor: entry.getBorderColor(),
      background: entry.getBackgroundColor(),
    }"
  >
    <span class="toggle-icon">{{ isTestCaseClosed(idx) ? '▶' : '▼' }}</span>
    <strong>{{ entry.message }}</strong>
  </div>

  <div
    v-if="entry.isTestCase"
    v-show="!isTestCaseClosed(idx)"
    class="testcase-body"
  >
    <div
      v-for="(group, subIdx) in getTestCaseSubEntries(idx)"
      :key="subIdx"
    >
      <div
        v-if="group.section"
        class="log-entry testcase-header section-header"
        @click="toggleSection(idx, group.section)"
        style="padding-left: 20px; cursor: pointer; background-color: #f0f0f0;"
      >
        <span class="toggle-icon">
          {{ isSectionClosed(idx, group.section) ? '▶' : '▼' }}
        </span>
        <strong v-if="group.section">
          Live Log {{ group.section.charAt(0).toUpperCase() + group.section.slice(1) }}
        </strong>
        <strong v-else>Live Log</strong>
      </div>

      <template v-if="group.section">
        <div
          v-for="(entry, lineIdx) in group.lines"
          :key="lineIdx"
          v-show="!isSectionClosed(idx, group.section)"
          class="log-entry"
          v-html="renderLine(entry)"
          :class="{
            'failed-line': isFailureLine(entry.message)
          }"
          @click="handleLineClick(entry.message, getEntryIndex(entry, idx))"
          style="padding-left: 30px; cursor: pointer;"
        ></div>
      </template>

      <template v-if="!group.section">
        <div
          v-for="(entry, lineIdx) in group.lines"
          :key="lineIdx"
          class="log-entry"
          v-html="renderLine(entry)"
          :class="{
            'failed-line': isFailureLine(entry.message)
          }"
          @click="handleLineClick(entry.message, getEntryIndex(entry, idx))"
          style="cursor: pointer;"
        ></div>
      </template>
    </div>
  </div>

    
     <div
    v-if="entry.category === 'finalERRORS' && entry.isFinalSection"
    class="final-section"
  >
    <div @click="toggleFinalSection('finalERRORS')" class="log-entry testcase-header">
      <span class="toggle-icon">{{ collapsedFinalSections['finalERRORS'] ? '▶' : '▼' }}</span>
      <strong>{{ entry.message }}</strong>
    </div>
    <div v-show="!collapsedFinalSections['finalERRORS']" class="section-content">
      <div
        v-for="(line, index) in getLinesBetweenErrorsAndWarnings()"
        :key="'errors-content-' + index"
        class="log-entry final-section-content"
        v-html="renderLine(line)"
        style="padding-left: 20px;"
      ></div>
    </div>
  </div>
<div
    v-if="entry.category === 'finalFAILURES' && entry.isFinalSection"
    class="final-section"
  >
    <div @click="toggleFinalSection('finalFAILURES')" class="log-entry testcase-header">
      <span class="toggle-icon">{{ collapsedFinalSections['finalFAILURES'] ? '▶' : '▼' }}</span>
      <strong>{{ entry.message }}</strong>
    </div>
    <div v-show="!collapsedFinalSections['finalFAILURES']" class="section-content">
      <div
        v-for="(line, index) in getLinesBetweenFailuresAndErrors()"
        :key="'failures-content-' + index"
        class="log-entry final-section-content"
        v-html="renderLine(line)"
        style="padding-left: 20px;"
      ></div>
    </div>
  </div>



<div
    v-if="entry.category === 'finalWARNINGS' && entry.isFinalSection"
    class="final-section"
  >
    <div @click="toggleFinalSection('finalWARNINGS')" class="log-entry testcase-header">
      <span class="toggle-icon">{{ collapsedFinalSections['finalWARNINGS'] ? '▶' : '▼' }}</span>
      <strong>{{ entry.message }}</strong>
    </div>
    <div v-show="!collapsedFinalSections['finalWARNINGS']" class="section-content">
      <div
        v-for="(line, index) in getLinesAfterWarnings()"
        :key="'warnings-content-' + index"
        class="log-entry final-section-content"
        v-html="renderLine(line)"
        style="padding-left: 20px;"
      ></div>
    </div>
  </div>

       <div v-if="!entry.isTestCase && !isInsideTestCase(idx) && !entry.isFinalSection && !entry.isFinalSectionContent"
        class="log-entry"
        v-html="renderLine(entry)"
      ></div>
    </div>
  </div>
        </div>
        <footer v-if="searchFooterVisible && searchQuery" class="search-footer">
  <div class="search-footer-header">
    <h3 v-if="searchResults.length">{{ searchResults.length }} results found</h3>
    <h3 v-else>No results found</h3>
    <button class="close-footer" @click="searchFooterVisible = false">✖</button>
   
   
  </div>

  <div class="search-footer-content">
    <div
      v-for="(results, testCaseName) in groupedSearchResults"
      :key="testCaseName"
      class="search-result-group"
    >
      <div class="search-result-title"><strong>{{ testCaseName }}</strong></div>

      <div
        v-for="result in results"
        :key="result.entry.id || result.idx"
        class="search-highlight clickable"
        @click="scrollToSearchResult(result.entry)"
        v-html="renderSearchLine(result.entry, searchQuery)"
      ></div>
    </div>
  </div>
</footer>

  </div>
  </div>
    
  
  
</template>


<script>
import { LogEntry } from './parser/LogEntry';


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
      logParser: null,
      collapsedTestCases: {},
      collapsedSections: {},
      collapsedFinalSections: {
      finalFAILURES: true,
      finalERRORS: true,
      finalWARNINGS: true},
      loading: false,
      progress: 0,
      linesBetweenFailuresAndErrors: [],
      linesBetweenErrorsAndWarnings: [],
      linesAfterWarnings: [],
      searchFooterVisible: true,
      selectedLogLevel: '',
      searchQuery: '',
      searchResults: [],
      entries: [],
    };
  },

 computed: {
    groupedFilteredEntries() {
  const groups = {};
  let currentTestCase = 'Global';

  this.parsedEntries.forEach((entry, idx) => {
    const matchesLevel =
      !this.selectedLogLevel || new RegExp(`\\[${this.selectedLogLevel}\\]`).test(entry.rawLine || entry.message || '');

    if (!matchesLevel) return;

    if (entry.isTestCase) {
      currentTestCase = this.extractTestCaseName(entry.message);
    }

    if (!groups[currentTestCase]) {
      groups[currentTestCase] = [];
    }

    groups[currentTestCase].push({ entry, idx });
  });

  return groups;
}
,
  filteredEntries() {
    if (!this.selectedLogLevel) return this.parsedEntries;

    const levelPattern = new RegExp(`\\[${this.selectedLogLevel}\\]`);

    return this.parsedEntries.filter(entry => {
      const line = entry.rawLine || entry.message || '';
      return levelPattern.test(line);
    });
  },
  groupedSearchResults() {
    const groups = {};

    for (const result of this.searchResults) {
      const entry = result.entry;
      const idx = this.parsedEntries.indexOf(entry);

      let testCaseName = 'Unknown Test Case';
      for (let i = idx; i >= 0; i--) {
        if (this.parsedEntries[i].isTestCase) {
          testCaseName = this.parsedEntries[i].message;
          break;
        }
      }

      if (!groups[testCaseName]) {
        groups[testCaseName] = [];
      }

      groups[testCaseName].push(result);
    }

    return groups;
  },

  
},
methods: {
  collapseAllSections() {
  this.parsedEntries.forEach((entry, index) => {
    if (entry.isTestCase) {
      this.collapsedTestCases[index] = true;
      this.collapsedSections[index] = {
        setup: true,
        call: true,
        teardown: true,
      };
    }
  });

  this.collapsedFinalSections = {
    finalFAILURES: true,
    finalERRORS: true,
    finalWARNINGS: true,
  };
},
expandAllSections() {
  this.parsedEntries.forEach((entry, index) => {
    if (entry.isTestCase) {
      this.collapsedTestCases[index] = false;
      this.collapsedSections[index] = {
        setup: false,
        call: false,
        teardown: false,
      };
    }
  });

  this.collapsedFinalSections = {
    finalFAILURES: false,
    finalERRORS: false,
    finalWARNINGS: false,
  };
},
   findParentTestCaseName(entry) {
  const idx = this.parsedEntries.indexOf(entry);
  if (idx === -1) return "Unknown Test Case";

  for (let i = idx; i >= 0; i--) {
    const e = this.parsedEntries[i];
    if (e.isTestCase) {
      return this.extractTestCaseName(e.message);
    }
  }

  return "Unknown Test Case";
}
,
scrollToSearchResult(entry) {
  const idx = this.parsedEntries.indexOf(entry);
  if (idx === -1) return;

  let parentTestCaseIndex = null;
  for (let i = idx; i >= 0; i--) {
    if (this.parsedEntries[i].isTestCase) {
      parentTestCaseIndex = i;
      break;
    }
  }

  if (parentTestCaseIndex !== null) {
    // Step 1: Unfold the test case
    if (this.collapsedTestCases[parentTestCaseIndex]) {
      this.collapsedTestCases[parentTestCaseIndex] = false;
    }

    // Step 2: Unfold the section if needed
    const section = this.getSectionName(entry);
    if (section) {
      if (!this.collapsedSections[parentTestCaseIndex]) {
        this.collapsedSections[parentTestCaseIndex] = {};
      }
      if (this.collapsedSections[parentTestCaseIndex][section]) {
        this.collapsedSections[parentTestCaseIndex][section] = false;
      }
    }
  }

  // Step 3: Wait for DOM update *after* test case is unfolded
  this.$nextTick(() => {
    setTimeout(() => {
      const el = document.getElementById(`log-entry-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash-highlight');
        setTimeout(() => el.classList.remove('flash-highlight'), 1500);
      } else {
        console.warn(`Element log-entry-${idx} not found`);
      }
    }, 50); // Small delay gives Vue time to render the unfolded section
  });
},

renderSearchLine(entry, keyword) {
  const content = entry.rawLine || '';
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
  const regex = new RegExp(escapedKeyword, 'gi'); // global, case-insensitive
  const highlighted = content.replace(regex, (match) => `<mark>${match}</mark>`);
  return highlighted;
},

 handleSearch() {
  const query = this.searchQuery.trim().toLowerCase();

  if (!query) {
    this.searchResults = [];
    return;
  }

  // ✅ Automatically reopen the search footer
  this.searchFooterVisible = true;

  this.searchResults = this.parsedEntries
    .map((entry, idx) => ({ entry, idx }))
    .filter(({ entry }) =>
      String(entry.message || entry.rawLine || '').toLowerCase().includes(query)
    );
}
,

  
  scrollToEntry(index) {
  const el = document.getElementById(`testcase-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.backgroundColor = '#ffdddd';
    setTimeout(() => {
      el.style.backgroundColor = '';
    }, 1500);
  }
},


  getEntryIndex(entry, testCaseIndex) {
      for (let i = 0; i < this.parsedEntries.length; i++) {
        if (this.parsedEntries[i] === entry) {
          return i;
        }
      }
      return testCaseIndex;
    },

   handleLineClick(line, entryIndex) {
      console.log('Clic sur ligne:', line, 'Index:', entryIndex);
      
      let messageText = '';
      if (typeof line === 'string') {
        messageText = line;
      } else if (line && typeof line === 'object') {
        messageText = line[0] || line.input || line.message || '';
      }
      
      console.log('Message extrait:', messageText);
      
      if (this.isFailureLine(messageText)) {
        console.log('Ligne d\'échec détectée');
        let testCaseIndex = entryIndex;
        for (let i = entryIndex; i >= 0; i--) {
          if (this.parsedEntries[i] && this.parsedEntries[i].isTestCase) {
            testCaseIndex = i;
            break;
          }
        }
        
        console.log('Index du test case parent:', testCaseIndex);
        this.checkFailureTriggersAndScrollForEntry(testCaseIndex);
      }
    },
 isFailureLine(line) {
      if (!line) return false;
      let messageText = '';
      if (typeof line === 'string') {
        messageText = line;
      } else if (line && typeof line === 'object') {
        messageText = line[0] || line.input || line.message || '';
      }
      const failureTriggers = [
        "setup result: failed",
        "call result: failed",
        "teardown result: failed"
      ];
      return failureTriggers.some(trigger => messageText.includes(trigger));
    },
   getSectionName(entry) {
  const msg = (entry.rawLine || entry.message || '').toLowerCase();
  if (msg.includes('live log setup')) return 'setup';
  if (msg.includes('live log call')) return 'call';
  if (msg.includes('live log teardown')) return 'teardown';
  return null;
},
toggleFinalSection(sectionType) {
    this.collapsedFinalSections = {
      ...this.collapsedFinalSections,
      [sectionType]: !this.collapsedFinalSections[sectionType]
    };
  },

toggleTestCase(index) {
  if (this.collapsedTestCases[index] === undefined) {
    this.collapsedTestCases[index] = true;
  }
  
  this.collapsedTestCases = {
    ...this.collapsedTestCases,
    [index]: !this.collapsedTestCases[index]
  };
},

    getFinalSectionContent(sectionType) {
    const lines = [];
    let sectionIndex = -1;
    for (let i = 0; i < this.parsedEntries.length; i++) {
      if (this.parsedEntries[i].category === sectionType && this.parsedEntries[i].isFinalSection) {
        sectionIndex = i;
        break;
      }
    }
    if (sectionIndex === -1) return lines;
    let nextSectionIndex = this.parsedEntries.length;
    const finalSectionTypes = ["finalFAILURES", "finalERRORS", "finalWARNINGS"];
    for (let i = sectionIndex + 1; i < this.parsedEntries.length; i++) {
      const entry = this.parsedEntries[i];
      if (finalSectionTypes.includes(entry.category) && entry.isFinalSection) {
        nextSectionIndex = i;
        break;
      }
    }
    
    for (let i = sectionIndex + 1; i < nextSectionIndex; i++) {
      const entry = this.parsedEntries[i];
      if (!finalSectionTypes.includes(entry.category)) {
        lines.push(entry);
      }
    }
    
    return lines;
  },

  getLinesBetweenFailuresAndErrors() {
    return this.getFinalSectionContent('finalFAILURES');
  },

  getLinesBetweenErrorsAndWarnings() {
    return this.getFinalSectionContent('finalERRORS');
  },

  getLinesAfterWarnings() {
    return this.getFinalSectionContent('finalWARNINGS');
  },

   preprocessEntries() {
    const finalSectionTypes = ["finalFAILURES", "finalERRORS", "finalWARNINGS"];
    
    finalSectionTypes.forEach(sectionType => {
      if (!(sectionType in this.collapsedFinalSections)) {
        this.$set(this.collapsedFinalSections, sectionType, true);
      }
    });
    
    for (let i = 0; i < this.parsedEntries.length; i++) {
      const entry = this.parsedEntries[i];
      
      if (finalSectionTypes.includes(entry.category)) {
        entry.isFinalSection = true;
      }
    }
  },

    checkFailureTriggersAndScrollForEntry(testCaseIndex) {
      const entry = this.parsedEntries[testCaseIndex];
      
      if (!entry || !entry.isTestCase) {
        console.warn('Pas un test case valide à l\'index:', testCaseIndex);
        return;
      }

      console.log('Test case trouvé:', entry);
      
      // Extraire le message du test case
      let messageText = '';
      if (typeof entry.message === 'string') {
        messageText = entry.message;
      } else if (entry.message && typeof entry.message === 'object') {
        messageText = entry.message[0] || entry.message.input || entry.message.message || '';
      }

      console.log('Message du test case:', messageText);

      // Patterns pour extraire le nom de la classe
      const patterns = [
        /([\w/]+\.py)::(\w+)::/,  // Pattern principal
        /(\w+\.py)::(\w+)/,       // Pattern alternatif
        /::(\w+)::/,              // Pattern simple
        /class\s+(\w+)/,          // Pattern pour les classes
        /Test case (\w+)/         // Pattern spécifique aux messages de test
      ];

      for (const pattern of patterns) {
        const match = messageText.match(pattern);
        if (match) {
          const className = match[2] || match[1]; 
          console.log('Nom de classe extrait:', className);
          this.scrollToFailureDetails(className);
          return;
        }
      }
      
      console.warn('Impossible d\'extraire le nom de classe du message:', messageText);
    },
 scrollToFailureDetails(className) {
  const logLinesFailed = this.getLinesBetweenFailuresAndErrors();
  const logLinesErrors = this.getLinesBetweenErrorsAndWarnings();

  let sectionToToggle = null;
  let elementFound = null;

  for (const line of logLinesFailed) {
    let lineText = '';
    if (typeof line === 'string') {
      lineText = line;
    } else if (line && typeof line === 'object') {
      lineText = line[0] || line.input || line.message || '';
    }
    
    if (lineText && lineText.includes(className)) {
      sectionToToggle = 'finalERRORS';
      const elements = document.querySelectorAll('.log-line, .log-entry');
      for (const element of elements) {
        const elementText = element.textContent || element.innerText || '';
            if (elementText.includes(lineText.trim()) || 
            (elementText.includes(className) && elementText.includes('_____'))) {
          elementFound = element;
          break;
        }
      }
      
      if (!elementFound) {
        for (const element of elements) {
          const elementText = element.textContent || element.innerText || '';
          if (elementText.includes(className)) {
            elementFound = element;
            break;
          }
        }
      }
      
      if (elementFound) break;
    }
  }
  if (!elementFound) {
    for (const line of logLinesErrors) {
      let lineText = '';
      if (typeof line === 'string') {
        lineText = line;
      } else if (line && typeof line === 'object') {
        lineText = line[0] || line.input || line.message || '';
      }
      
      if (lineText && lineText.includes(className)) {
        sectionToToggle = 'finalFAILURES'; 

        const elements = document.querySelectorAll('.log-line, .log-entry');
        for (const element of elements) {
          const elementText = element.textContent || element.innerText || '';
          
          if (elementText.includes(lineText.trim()) || 
              (elementText.includes(className) && elementText.includes('_____'))) {
            elementFound = element;
            break;
          }
        }
        
        if (elementFound) break;
      }
    }
  }

  if (elementFound && sectionToToggle) {
      if (this.collapsedFinalSections[sectionToToggle]) {
      this.toggleFinalSection(sectionToToggle);
        setTimeout(() => {
        elementFound.scrollIntoView({ behavior: "smooth", block: "center" });
        elementFound.classList.add('highlight-failure');
        setTimeout(() => elementFound.classList.remove('highlight-failure'), 3000);
      }, 300);
    } else {
      elementFound.scrollIntoView({ behavior: "smooth", block: "center" });
      elementFound.classList.add('highlight-failure');
      setTimeout(() => elementFound.classList.remove('highlight-failure'), 3000);
    }
  } else {
    console.warn("Aucun élément DOM trouvé pour la classe :", className);

  }
},

getTestCaseSubEntries(startIndex) {
      const result = [];
      let currentSection = null;
      let currentSectionLines = [];

      for (let i = startIndex + 1; i < this.parsedEntries.length; i++) {
        const entry = this.parsedEntries[i];
  
        if (entry.isTestCase) break;
        if (entry.isFinalSection) break;
        if (entry.isFinalSectionContent) break;

        const section = this.getSectionName(entry);
        
        if (section) {
          if (currentSection && currentSectionLines.length > 0) {
            result.push({ 
              section: currentSection, 
              lines: currentSectionLines,
              hasFailure: currentSectionLines.some(line => this.isFailureLine(line.message))
            });
          }
          currentSection = section;
          currentSectionLines = [];
        }
        
        if (currentSection) {
          currentSectionLines.push(entry);
        } else {
          result.push({ 
            section: null, 
            lines: [entry],
            hasFailure: this.isFailureLine(entry.message)
          });
        }
      }
      if (currentSection && currentSectionLines.length > 0) {
        result.push({ 
          section: currentSection, 
          lines: currentSectionLines,
          hasFailure: currentSectionLines.some(line => this.isFailureLine(line.message))
        });
      }
      
      return result;
    },

toggleSection(tcIndex, section) {
  if (!this.collapsedSections[tcIndex]) {
    this.collapsedSections[tcIndex] = {
      'setup': true,
      'call': true,
      'teardown': true,
    };
  }
  
  if (this.collapsedSections[tcIndex][section] === undefined) {
    this.collapsedSections[tcIndex][section] = true;
  }
  
  this.collapsedSections[tcIndex][section] = !this.collapsedSections[tcIndex][section];
},
initializeCollapsedStates() {
  this.collapsedTestCases = {};
  this.parsedEntries.forEach((entry, index) => {
    this.collapsedTestCases[index] = true; 
  });
  this.collapsedSections = {};
  this.parsedEntries.forEach((entry, tcIndex) => {
    this.collapsedSections[tcIndex] = {
      'setup': true,
      'call': true,
      'teardown': true,
    };
  });
},
isTestCaseClosed(index) {
  return this.collapsedTestCases[index] !== false; 
},


isSectionClosed(tcIndex, section) {
  return this.collapsedSections[tcIndex]?.[section] !== false; 
},


isInsideTestCase(index) {
  for (let i = index - 1; i >= 0; i--) {
    if (this.parsedEntries[i].isTestCase && !(this.parsedEntries[i].isSecFailERR)) return true;
  }
  return false;
},

    renderLine(entry) {
  const text = escapeHtml(entry.rawLine || entry.message || '');
  if (entry.highlightTokens?.length) {
    return this.applyHighlights(text, entry.highlightTokens);
  }
  return text;
},
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
      console.log('logData:', this.logData);

      reader.readAsText(file);
    },
  async parseLogData() {
  this.loading = true;
  this.parsedEntries = [];
  this.stats = { startTime: Date.now() };

  const worker = new Worker(new URL('./parser/LogWorker.js', import.meta.url), {
    type: 'module',
  });

  if (typeof this.logData !== 'string') {
    this.logData = String(this.logData);
  }

  worker.postMessage({
    type: 'process',
    data: this.logData,
  });

  let globalIndex = 0; 
const decoder = new TextDecoder('utf-8');

  worker.onmessage = (e) => {
  const { type, data, error } = e.data;
  switch (type) {
    case 'progress':
      if (e.data.totalLines && e.data.processed) {
        this.progress = Math.floor((e.data.processed / e.data.totalLines) * 100);
        
      } else {
        this.progress = 0;
      }
      this.handleProgress(e.data);
      break;

    case 'batch':
      if (data instanceof ArrayBuffer) {
        const jsonStr = decoder.decode(new Uint8Array(data));
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed)) {
          const batch = parsed.map(obj => {
            const entry = new LogEntry(obj);
            entry.id = globalIndex++;
            return entry;
          });

          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              this.parsedEntries.push(...batch);
            
            });
          } else {
            this.parsedEntries.push(...batch);
            
          }
        }
      }
      break;

case 'complete':
  this.workerDone = true;

  // On attend un tout petit peu pour s’assurer que les batchs sont rendus
  setTimeout(async () => {
    await this.$nextTick(); // Attendre le rendu DOM complet
    this.progress = 100;
    this.loading = false;
    worker.terminate();
  }, 50); // ou 100 ms si tu veux être encore plus safe
  break;

    case 'error':
      console.error("❌ Erreur du worker:", error);
      this.loading = false;
      worker.terminate();
      break;
  }
};


  worker.onerror = (err) => {
    console.error("❌ Erreur dans le worker (onerror):", err);
    this.loading = false;
    worker.terminate();
  };
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


  if (!highlightTokens?.length) {
    return text;
  }
  const sortedTokens = [...highlightTokens].sort((a, b) => b.start - a.start);
  let result = text;
  sortedTokens.forEach(token => {
    const before = result.substring(0, token.start);
    const match = result.substring(token.start, token.end);
    const after = result.substring(token.end);
    const description = this.getHighlightDescription(token.type, token);
    if (description === "") {
      result = `${before}<span class="highlight-container"><span class="highlight" style="background:${token.color}">${match}</span></span>${after}`; 
    } else {
      result = `${before}<span class="highlight-container"><span class="highlight" style="background:${token.color}">${match}</span><span class="highlight-tooltip">${description}</span></span>${after}`;   
    }  });
  
  return result;
},


    getHighlightDescription(type, token = null) {
  if (token && typeof token.customDescription === 'string' && token.customDescription.trim() !== '') {
    return token.customDescription;
  }

  if (!this.logParser || !Array.isArray(this.logParser.highlightDefinitions)) {
    return ""; 
  }

  const rule = this.logParser.highlightDefinitions.find(r => r.type === type);

  return rule?.description || '';
},
handleProgress(progressData) {
    const { processed, total } = progressData;

    const elapsed = Date.now() - this.stats.startTime; // en ms
    const speed = processed / elapsed; // lignes/ms

    if (speed > 0) {
      const remaining = (total - processed) / speed; // ms
      console.log(`⏳ Temps restant estimé : ${Math.round(remaining / 1000)}s`);
    } else {
      console.log(`🔄 Calcul du temps restant en cours...`);
    }
  },
  },
  mounted() {
  this.initializeCollapsedStates();
  
}
  };
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.progress-container {
  width: 60%;
  height: 20px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  width: 0%;
  transition: width 0.2s ease-in-out;
}

.progress-text {
  font-size: 16px;
  color: #333;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-bottom: 0.25rem;
}

.icon-btn {
  position: relative;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  background-color: #444;
  color: white;
  overflow: hidden;
  transition: width 0.3s ease, background-color 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  padding-left: 36px;
}

.icon-btn::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-btn::after {
  content: attr(data-label);
  position: absolute;
  left: 36px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease 0.1s;
  font-size: 10px;
  font-weight: bold;
}

.icon-btn:hover {
  width: 100px;
}

.icon-btn:hover::after {
  opacity: 1;
}

.btn-close {
  background-color: #e53935;
}
.btn-close:hover {
  background-color: #c62828;
}
.btn-close::before {
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V8a6 6 0 10-12 0v2H4v12h16V10h-2zm-8-2a4 4 0 118 0v2H10V8z'/></svg>");
}
.btn-close::after {
  content: "CLOSE ALL";
}

.btn-open {
  background-color: #43a047;
}
.btn-open:hover {
  background-color: #2e7d32;
}
.btn-open::before {
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V8a6 6 0 00-12 0h2a4 4 0 118 0v2H4v12h16V10h-2z'/></svg>");
}
.btn-open::after {
  content: "OPEN ALL";
}


.search-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  min-height: 120px;
  max-height: 70vh;
  background-color: #fff;
  border-top: 1px solid #ccc;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
  resize: vertical;
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
  font-family:'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}

.search-footer-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  position: relative;
  font-size: 13px;
}

.search-footer-content {
  overflow-y: auto;
  padding: 10px 20px;
  flex-grow: 1;
}

.close-footer {
  border: none;
  background: transparent;
  font-size: 18px;
  color: #888;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-footer:hover {
  color: #000;
}

.search-result-title {
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 5px;
}

.search-highlight.clickable {
  cursor: pointer;
  padding: 6px;
  border-bottom: 1px solid #eee;
}

.search-highlight.clickable:hover {
  background-color: #f9f9f9;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.log-level-filter {
  margin-left: 0; 
  margin-right: 10px; 
  padding: 6px 10px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
}


.search-result-group {
  margin-bottom: 1rem;
}

.search-result-title {
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #444;
}

.flash-highlight {
  animation: flashHighlight 5s ease-out;
}
@keyframes flashHighlight {
  0% { background-color: #ffffcc; }
  100% { background-color: transparent; }
}




.search-highlight.clickable {
  cursor: pointer;
  padding: 6px;
  border-bottom: 1px solid #eee;
}

.search-highlight.clickable:hover {
  background-color: #f5f5f5;
}


.search-bar {
  padding: 4px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100px;
  margin-bottom: 10px;
}

.search-results {
  background-color: #fcfcfc;
  border-bottom: 1px solid #ddd;
  padding: 10px 20px;
}

.highlight-search {
  background-color: yellow;
  font-weight: bold;
}

.return-to-origin-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.failed-line {
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
}

.failed-line:hover {
  background-color: #ffcdd2;
}

.highlight-failure {
  background-color: #fff3cd !important;
  border: 2px solid #ffc107 !important;
  transition: all 0.3s ease;
}
.highlight-origin {
  background-color: #d1ecf1 !important;
  border: 2px solid #bee5eb !important;
  transition: all 0.3s ease;
}
.log-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-list {
  height: 100%;
  flex: 1;
  overflow-y: auto;
}
.log-line-number {
  color: #888;
  margin-right: 8px;
}
.testcase-header {
  cursor: pointer;
  padding: 6px 10px;
  background-color: #f4f4f4;
  font-weight: bold;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  border-left: 3px solid;
}
.testcase-body {
  padding-left: 15px;
}
.toggle-icon {
  font-weight: bold;
  width: 16px;
}
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
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px dashed #E0E0E0;
  transition: all 0.3s ease;
  max-width: 480px;
}

.upload-area.drag-active {
  border-color: #4361EE;
  background-color: rgba(67, 97, 238, 0.05);
  transform: translateY(-2px);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F6F8FF;
  border-radius: 50%;
  color: #4361EE;
  margin-bottom: 8px;
}

.upload-icon svg {
  width: 32px;
  height: 32px;
}

h2 {
  font-size: 1.5rem;
  color: #2B2D42;
  margin: 0;
  font-weight: 600;
}

.subtitle {
  color: #6B7280;
  margin: 0;
  font-size: 0.95rem;
}

.file-upload-button {
  background: #4361EE;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  margin-top: 8px;
}

.file-upload-button:hover {
  background: #3A56D4;
}

.file-types {
  font-size: 0.85rem;
  color: #9CA3AF;
  margin-top: 16px;
}
.upload-area input[type='file'] {
  margin-top: 15px;
}
.main-content {
  display: flex;
  height: 100vh;
  position: relative;
}


.log-display {
  flex: 1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.log-scroller-container {
  flex: 1;
  min-height: 0; 
}
.log-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #34495e;
  color: white;
  padding: 8px 16px;
  border-bottom: 1px solid #2c3e50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
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
  height: 100%;
}
.log-raw-content {
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.2;
  white-space: pre; 
  overflow: auto;   
  height: 100%; 
  overflow-y: auto;
  max-width: 100%;  
  padding: 20px;
  margin: 0;
  background: #ffffff;
  color: #000000;
}
.log-entry {
  position: relative;
  overflow: visible;
  white-space: pre;
  font-family: monospace;
  transition: 0.3s ease;
  white-space: pre;
  margin: 0 !important;
  padding: 4px 10px;
  border-bottom: 1px solid #eee;
  background-color: white;
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
.highlight {
  border-radius: 2px;
  padding: 0 2px;
  cursor: help;
  position: relative;
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

.highlight-container {
  display: inline-block;
  position: relative;
  line-height: 1.2; 
}

::v-deep(.highlight-container) {
  position: relative;
  display: inline-block;
  line-height: 1.2;
}

::v-deep(.highlight-tooltip) {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background-color: #2a4365;
  color: #ebf8ff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000; 
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none; 
  min-width: max-content;
}

::v-deep(.highlight-tooltip)::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #2a4365 transparent transparent transparent;
}

::v-deep(.highlight-container:hover) .highlight-tooltip {
  opacity: 1;
}

</style>
