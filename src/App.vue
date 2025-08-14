<template>
<div class="app-container">
  <div class="upload-block">
    <div
      v-if="showUpload"
      class="upload-area"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop="handleDrop($event); dragover = false"
      :class="{ 'drag-active': dragover }"
    >
      <div class="upload-content">
        <div class="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
          </svg>
        </div>
        <h2>One-click log analysis</h2>
        <p class="subtitle">Drag and drop your log file or</p>
        <label class="file-upload-button">
          <input type="file" @change="handleFileUpload" hidden />
          <span>Explore files</span>
        </label>
        <p class="file-types">Supported formats: .log, .txt, .json</p>
      </div>
    </div>

    <div v-show="loading" class="loading-inline" aria-live="polite">
      <div class="loading-dot"></div>  
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">Analyzing... {{ Math.floor(progress) }}%</p>
    </div>
  </div>

  <div v-if="!loading && logData" class="results">
  </div>


    <div v-if="logData && !loading" class="main-content">
      
      <div class="log-display">
        <div class="log-header">
          <div class="header-left">
            <div class="button-group">
              <button @click="collapseAllSections" class="icon-btn btn-close"></button>
              <button @click="expandAllSections" class="icon-btn btn-open"></button>
            </div>
          </div>

  
  <div class="header-right">
    <select v-model="selectedLogLevel" class="log-level-filter">
      <option value="">📂 All Levels</option>
      <option value="DBG">🐛 DBG</option>
      <option value="INF">ℹ️ INF</option>
      <option value="WARN">⚠️ WARN</option>
      <option value="ERR">❗ ERR</option>
    </select>
    

    <div class="search-container">
  <input
    v-model="searchQuery"
    @input="handleSearch"
    @focus="showSuggestions = true"
    @blur="hideSuggestions"
    placeholder="🔍 Search logs..."
    class="search-bar"
  />
  <div v-if="showSuggestions && suggestions.length" class="suggestions-list">
    <div 
      v-for="(suggestion, index) in suggestions" 
      :key="index"
      @mousedown="selectSuggestion(suggestion)"
      class="suggestion-item"
    >
      {{ suggestion }}
    </div>
  </div>
</div>
  </div>
</div>

        
        <div class="log-raw-content">

        
          
  <div
  v-for="(entry, idx) in parsedEntries"
  :key="entry.id"
  :id="'testcase-' + idx"
>

  <div
    v-if="entry.isTestCase && entry.isFinalSection===false && entry.isFinalSectionContent===false && subEntriesByTcIdx[idx]"
    class="log-entry testcase-header"
    :class="'testcase-' + entry.testCaseStatus"
    @click="toggleTestCase(idx)"
    :style="{
      borderLeftColor: entry.getBorderColor(),
      background: entry.getBackgroundColor(),
    }"
  >
    <span class="toggle-icon">{{ isTestCaseClosed(idx) ? '▼' : '▶' }}</span>
    <strong>{{ entry.message }}</strong>
  </div>

  <div
    v-if="entry.isTestCase && subEntriesByTcIdx[idx]"
    v-show="isTestCaseClosed(idx)"
    class="testcase-body"
  >
    <template v-for="(group, subIdx) in getSafeArray(subEntriesByTcIdx[idx])" :key="`group-${idx}-${subIdx}`">
  <div
    v-if="group && 'section' in group && group.section"
    class="log-entry testcase-header section-header"
    @click="toggleSection(idx, group.section)"
    style="padding-left: 20px; cursor: pointer; background-color: #f0f0f0;"
  >
    <span class="toggle-icon">
      {{ isSectionClosed(idx, group.section) ? '▶' : '▼' }}
    </span>
    <strong>
      Live Log {{ group.section.charAt(0).toUpperCase() + group.section.slice(1) }}
    </strong>
  </div>

  
  <template v-if="group.section">
    <template v-for="(lineEntry, lineIdx) in filteredLines(group.lines)" :key="`line-${idx}-${subIdx}-${lineIdx}`">

      <template v-if="lineEntry.isIsocBlock">
        <div
    class="log-entry"
    style="padding-left: 30px; cursor: pointer; border-left: 3px solid #ccc;"
    @click="toggleSection(idx, `${group.section}-isoc-${subIdx}-${lineIdx}`)"
  >
    <span class="toggle-icon" style="margin-right: 4px;">
      {{ isSectionClosed(idx, `${group.section}-isoc-${subIdx}-${lineIdx}`) ? '▸' : '▾' }}
    </span>
    <span v-html="renderLine(lineEntry.lines[0])"></span>
  </div>

        <template v-for="(isocLine, isoIdx) in lineEntry.lines.slice(1)" :key="`isoc-${lineIdx}-${isoIdx}`">
          <template v-if="isocLine.isResetBlock">
           <div
          class="log-entry"
          style="padding-left: 40px; cursor: pointer; border-left: 3px solid #4fc3f7;"
          @click="toggleSection(idx, `${group.section}-isoc-${subIdx}-${lineIdx}-reset-${isoIdx}`)"
        >
          <span class="toggle-icon" style="margin-right: 4px;">
            {{ isSectionClosed(idx, `${group.section}-isoc-${subIdx}-${lineIdx}-reset-${isoIdx}`) ? '▸' : '▾' }}
          </span>
          <span v-html="renderLine(isocLine.lines[0])"></span>
        </div>

            <div
              v-for="(resetLine, rIdx) in isocLine.lines.slice(1)"
              :key="`reset-${lineIdx}-${isoIdx}-${rIdx}`"
              v-show="!isSectionClosed(idx, `${group.section}-isoc-${subIdx}-${lineIdx}-reset-${isoIdx}`)"
              class="log-entry"
              style="padding-left: 60px;"
              v-html="renderLine(resetLine)"
              :class="{ 'failed-line': resetLine.hasFailure }"
              @click="scrollToFailureDetails(resetLine.rawLine, resetLine.parentTestCase)"
            ></div>
          </template>

          <template v-else>
            <div
              v-show="!isSectionClosed(idx, `${group.section}-isoc-${subIdx}-${lineIdx}`)"
              class="log-entry"
              style="padding-left: 50px;"
              v-html="renderLine(isocLine)"
              :class="{ 'failed-line': isocLine.hasFailure }"
              @click="scrollToFailureDetails(isocLine.rawLine, isocLine.parentTestCase)"
            ></div>
          </template>
        </template>
      </template>

      <template v-else-if="lineEntry.isResetBlock">
     <div
    class="log-entry"
    style="padding-left: 30px; cursor: pointer; border-left: 3px solid #4fc3f7;"
    @click="toggleSection(idx, `${group.section}-reset-${subIdx}-${lineIdx}`)"
  >
    <span class="toggle-icon" style="margin-right: 4px;">
      {{ isSectionClosed(idx, `${group.section}-reset-${subIdx}-${lineIdx}`) ? '▸' : '▾' }}
    </span>
    <span v-html="renderLine(lineEntry.lines[0])"></span>
  </div>

        <div
          v-for="(resetLine, rIdx) in lineEntry.lines.slice(1)"
          :key="`reset-${lineIdx}-${rIdx}`"
          v-show="!isSectionClosed(idx, `${group.section}-reset-${subIdx}-${lineIdx}`)"
          class="log-entry"
          style="padding-left: 50px;"
          v-html="renderLine(resetLine)"
          :class="{ 'failed-line': resetLine.hasFailure }"
          @click="scrollToFailureDetails(resetLine.rawLine, resetLine.parentTestCase)"
        ></div>
      </template>

      <template v-else>
        <div
          v-show="!isSectionClosed(idx, group.section)"
          class="log-entry"
          v-html="renderLine(lineEntry)"
          :class="{ 'failed-line': lineEntry.hasFailure }"
          @click="scrollToFailureDetails(lineEntry.rawLine, lineEntry.parentTestCase)"
          style="padding-left: 30px; cursor: pointer;"
        ></div>
      </template>

    </template>
  </template>

  <template v-else>
    <div
      v-for="(lineEntry, lineIdx) in group.lines"
      :key="`line-${idx}-${lineIdx}`"
      class="log-entry"
      v-html="renderLine(lineEntry)"
    ></div>
  </template>
</template>
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
        v-for="(line, index) in finalSections.finalERRORS"
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
        v-for="(line, index) in 	finalSections.finalFAILURES"
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
        v-for="(line, index) in finalSections.finalWARNINGS"
        :key="'warnings-content-' + index"
        class="log-entry final-section-content"
        v-html="renderLine(line)"
        style="padding-left: 20px;"
      ></div>
    </div>
  </div>
  <div
    v-if="entry.category === 'finalINFO' && entry.isFinalSection"
    class="final-section"
  >
    <div @click="toggleFinalSection('finalINFO')" class="log-entry testcase-header">
      <span class="toggle-icon">{{ collapsedFinalSections['finalINFO'] ? '▶' : '▼' }}</span>
      <strong>{{ entry.message }}</strong>
    </div>
    <div v-show="!collapsedFinalSections['finalINFO']" class="section-content">
      <div
        v-for="(line, index) in finalSections.finalINFO"
        :key="'info-content-' + index"
        class="log-entry final-section-content"
        v-html="renderLine(line)"
        style="padding-left: 20px;"
      ></div>
    </div>
  </div>

       <div v-if="((entry.isTestCase===false)  && (entry.isFinalSection === false) && (entry.isFinalSectionContent === false) && (entry.currentTestCase === null))"
        class="log-entry"
        v-html="renderLine(entry)"
      >
      
      
    </div>

    </div>
  </div>
        </div>
        <footer v-if="searchFooterVisible && searchQuery" class="search-footer"  :style="{ height: footerHeight + 'px' }">
           <div class="resize-handle" @mousedown="startResize"></div>

  <div class="search-footer-header">
    <h3 v-if="searchResults.length">{{ searchResults.length }} results found</h3>
    <h3 v-else>No results found</h3>
    <button class="close-footer" @click="searchFooterVisible = false">✖</button>
   
   
  </div>

  <div ref="scrollContainer" class="search-footer-content">
    <div
      v-for="group in groupedSearchResults"
      :key="group.tcIdx"
      class="search-result-group"
    >
      <div class="search-result-title"><strong>{{ group.testCaseName }}</strong></div>

    <div v-for="r in group.results" :key="`${r.tcIdx}-${r.lineIdx}`"
      :id="`main-line-${tcIdx}-${lineIdx}`"
       @click="scrollToLine(r.tcIdx, r.section, r.lineIdx)"
       v-html="r.line.rawLine.replace(new RegExp(searchQuery, 'gi'), '<mark>$&</mark>')"
       class="line">
  </div>
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
      finalSections: { finalFAILURES: [], finalERRORS: [], finalWARNINGS: [] },
    subEntriesByTcIdx: {},   
      logData: '',
      dragover: false,
      parsedEntries: [],
      logParser: null,
      collapsedTestCases: {},
      collapsedSections: {},
      collapsedFinalSections: {
      finalFAILURES: true,
      finalERRORS: true,
      finalWARNINGS: true,
      finalINFO: true
    },
      loading: false,
      progress: 0,
      searchFooterVisible: true,
      selectedLogLevel: '',
      searchQuery: '',
      searchResults: [],
      entries: [],
      footerHeight: 260,           
      isResizing: false,
      startY: 0,
      startHeight: 0,
      showSuggestions: false,
      suggestions: [
      'erreur',
      'avertissement',
      'info',
      'debug',
      'succès',
      'connexion',
      'déconnexion'
    ]
    }
  },

 computed: {
   showUpload() {
      return this.loading || !this.logData;
    },
  groupedSearchResults() {
  const groups = {};

  for (const result of this.searchResults) {
    const { tcIdx, line } = result;
    const testCaseName = line?.currentTestCase || 'Unknown Test Case';

    const key = `${testCaseName}_${tcIdx}`;

    if (!groups[key]) {
      groups[key] = {
        testCaseName,
        tcIdx,
        results: [],
      };
    }

    groups[key].results.push(result);
  }

  return Object.values(groups);
},
  
},
methods: {
   hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false
    }, 200)
  },
  selectSuggestion(suggestion) {
    this.searchQuery = suggestion
    this.showSuggestions = false
    this.handleSearch()
  },
  startResize(e) {
    this.isResizing = true;
    this.startY = e.clientY;
    this.startHeight = this.footerHeight;

    document.addEventListener('mousemove', this.doResize);
    document.addEventListener('mouseup', this.stopResize);
    e.preventDefault();
  },
  doResize(e) {
    if (!this.isResizing) return;
    const dy = this.startY - e.clientY;   
    let newH = this.startHeight + dy;
    newH = Math.max(120, Math.min(newH, 600)); 
    this.footerHeight = newH;
  },
  stopResize() {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.doResize);
    document.removeEventListener('mouseup', this.stopResize);
  },

  filteredLines(lines) {

  if (!this.selectedLogLevel) {
    return lines;
  }

  const levelPattern = new RegExp(`\\[${this.selectedLogLevel}\\]`);
  const filtered = lines.filter(line =>
    levelPattern.test(line.rawLine || line.level || '')
  );

  return filtered;
},

    getSafeArray(arrayLike) {
    if (!arrayLike) return [];
    return Array.isArray(arrayLike) ? arrayLike : Array.from(arrayLike);
  },

scrollToLine(tcIdx, section, lineIdx) {
  this.collapsedTestCases[tcIdx] = true;
  this.collapsedSections[tcIdx][section] = true;

  this.$nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const id = `main-line-${tcIdx}-${lineIdx}`;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('flash');
          setTimeout(() => el.classList.remove('flash'), 4000);
        } else {
          console.warn('scrollToLine: ligne introuvable', id);
        }
      });
    });
  });
},



handleSearch() {
  const query = this.searchQuery.trim().toLowerCase();
  if (!query) {
    this.searchResults = [];
    return;
  }

  this.searchFooterVisible = true;

  const results = [];

  for (let tcIdx = 0; tcIdx < this.parsedEntries.length; tcIdx++) {
    for (const [subIdx, group] of Object.entries(this.subEntriesByTcIdx[tcIdx] || {})) {
      console.log( subIdx);
      const section = group.section;
      if (!section) continue;
    const lines = group.lines || [];
    
    lines.forEach((line, lineIdx) => {
      const content = line.rawLine || '';
      if (content.toLowerCase().includes(query)) {
          results.push({ tcIdx, section, lineIdx, line });
        }
        
      });
    tcIdx=tcIdx+lines.length;
    }
    }
    this.searchResults = results;
},
collapseAllSections() {
  const newCollapsedTestCases = {};
  for (const idx in this.collapsedTestCases) {
    newCollapsedTestCases[idx] = false;
  }
  this.collapsedTestCases = newCollapsedTestCases;
  const newCollapsedSections = {};
  for (const tcIdx in this.collapsedSections) {
    newCollapsedSections[tcIdx] = {};
    for (const section in this.collapsedSections[tcIdx]) {
      newCollapsedSections[tcIdx][section] =true;
    }
  }
  this.collapsedSections = newCollapsedSections;
   const newCollapsedFinalSections = {};
  for (const sectionType in this.collapsedFinalSections) {
    newCollapsedFinalSections[sectionType] = true; // fermé
  }
  this.collapsedFinalSections = newCollapsedFinalSections;
},

expandAllSections() {
  const newCollapsedTestCases = {};
  for (const idx in this.collapsedTestCases) {
    newCollapsedTestCases[idx] = true;
  }
  this.collapsedTestCases = newCollapsedTestCases;

  const newCollapsedSections = {};
  for (const tcIdx in this.collapsedSections) {
    newCollapsedSections[tcIdx] = {};
    for (const section in this.collapsedSections[tcIdx]) {
      newCollapsedSections[tcIdx][section] =false; 
    }
  }
  this.collapsedSections = newCollapsedSections;
  const newCollapsedFinalSections = {};
  for (const sectionType in this.collapsedFinalSections) {
    newCollapsedFinalSections[sectionType] = false; 
  }
  this.collapsedFinalSections = newCollapsedFinalSections;
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
  this.collapsedTestCases[index] = !this.collapsedTestCases[index];

  this.collapsedTestCases = { ...this.collapsedTestCases };
},


 
scrollToFailureDetails(e ,className) {
  const triggers = [
    "setup result: failed",
    "call result: failed",
    "teardown result: failed"
  ];
  if (triggers.some(t => e.includes(t))) {


  const sections = ["finalERRORS", "finalFAILURES", "finalWARNINGS"];
  let sectionToToggle = null;
  let elementFound = null;

  const testCaseRegex = /([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)/;

  for (const section of sections) {
    const entries = this.finalSections[section] || [];
    for (const entry of entries) {
      let rawText = entry.rawLine || entry.message || "";

      if (rawText.includes(className)) {
        sectionToToggle = section;

        const match = rawText.match(testCaseRegex);
        const extractedTestCaseName = match ? match[1] : null;

        const elements = document.querySelectorAll('.log-line, .log-entry');
        for (const element of elements) {
          const elementText = element.textContent || element.innerText || '';
          if (
            elementText.includes(rawText.trim()) ||
            (extractedTestCaseName && elementText.includes(extractedTestCaseName))
          ) {
            elementFound = element;
            break;
          }
        }

        if (elementFound) break;
      }
    }
    if (elementFound) break;
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
  }} else {
    console.warn("Aucun déclencheur de failure trouvé dans le message :", e);
  }
},

toggleSection(tcIndex, section) {
  // Initialiser l’objet de sections pour ce test case s’il n’existe pas
  if (!this.collapsedSections[tcIndex]) {
    this.collapsedSections[tcIndex] = {};
  }

  // Initialiser la section si absente
  if (this.collapsedSections[tcIndex][section] === undefined) {
    this.collapsedSections[tcIndex][section] = true;
  }

  // Inverser la valeur
  this.collapsedSections[tcIndex][section] = !this.collapsedSections[tcIndex][section];

  // Forcer la réactivité
  this.collapsedSections = { ...this.collapsedSections };
},

isTestCaseClosed(index) {
  return this.collapsedTestCases[index] !== false;
},

isSectionClosed(tcIndex, section) {
  return this.collapsedSections[tcIndex]?.[section] !== false;
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

      reader.readAsText(file);
    },
  async parseLogData() {
  this.loading = true;
  this.parsedEntries = [];
  this.stats = { startTime: Date.now() };

  this.finalSections = {
    finalFAILURES: [],
    finalERRORS: [],
    finalWARNINGS: [],
    finalInfo: [],
  };
  this.subEntriesByTcIdx = {};
  this.collapsedTestCases = {};
  this.collapsedSections = {};
  this.failuresIndex = {};

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
  const { type, ...payload } = e.data;   

  switch (type) {
    case 'progress':
      this.progress = payload.totalLines
        ? Math.floor((payload.processed || 0) / payload.totalLines * 100)
        : 0;
      this.handleProgress(payload);
      break;

    case 'batch':
  if (payload.data instanceof ArrayBuffer) {
    const jsonStr = decoder.decode(new Uint8Array(payload.data));
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      const batch = parsed.map(obj => {
        const entry = new LogEntry(obj);
        entry.id = globalIndex++;
        return entry;
      });
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.parsedEntries.push(...batch));
      } else {
        this.parsedEntries.push(...batch);
      }
    }
  }
  break;

    case 'meta':
      

      this.finalSections     = payload.finalSections     || { finalFAILURES: [], finalERRORS: [], finalWARNINGS: [], finalINFO: [] };
      this.subEntriesByTcIdx = payload.subEntriesByTcIdx || {};
      this.collapsedTestCases = payload.collapseMap?.collapsedTestCases || {};
      this.collapsedSections  = payload.collapseMap?.collapsedSections  || {};
      this.failuresIndex      = payload.failuresIndex || {};
      break;

    case 'complete':
      this.workerDone = true;
      setTimeout(async () => {
        await this.$nextTick();
        this.progress = 100;
        this.loading = false;
        worker.terminate();
      }, 50);
      break;

    case 'error':
      console.error('❌ Erreur du worker:', payload.error);
      this.loading = false;
      worker.terminate();
      break;
  }
};

  worker.onerror = (err) => {
    console.error('❌ Erreur dans le worker (onerror):', err);
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

    const elapsed = Date.now() - this.stats.startTime; 
    const speed = processed / elapsed; 

    if (speed > 0) {
      const remaining = (total - processed) / speed; 
      console.log(`⏳ Temps restant estimé : ${Math.round(remaining / 1000)}s`);
    } else {
      console.log(`🔄 Calcul du temps restant en cours...`);
    }
  },
  },

};
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
}

.search-bar {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #424242; 
  border: 1px solid #333; 
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  color: white; 
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #555; 
}

.suggestion-item:hover {
  background-color: #5c5c5c;
}

.suggestion-item:last-child {
  border-bottom: none;
}
@keyframes flash {
  0%   { background-color: #f8ec83; }
  100% { background-color: transparent; }
}

::v-deep(.flash) {
  background-color: #f3e781 !important;
  transition: background-color 1.5s;
  animation: flash 1.5s ease-in-out 3; 
}
.upload-block {
  max-width: 900px;
  margin: 0 auto;
}

.loading-inline,
.loading-screen {
  --c1: #667eea;
  --c2: #764ba2;
  --c3: #f093fb;
  --radius: 12px;
  --shadow: 0 8px 32px rgba(102, 126, 234, .18);
  --font: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-family: var(--font);
  letter-spacing: .02em;
}

.loading-inline {
  margin-top: 16px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%);
  border: 1px solid rgba(102, 126, 234, .15);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
  transition: transform .25s ease;
}

.loading-inline:hover {
  transform: translateY(-2px);
}

.loading-screen {
  padding: 0;
  margin: 0;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 50%, 
              rgba(255, 255, 255, .8) 0%, 
              rgba(240, 243, 255, .95) 100%);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.progress-container {
  width: clamp(200px, 50vw, 420px);
  height: 8px;
  background: rgba(255, 255, 255, .6);
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, .1),
              0 0 0 1px rgba(255, 255, 255, .5);
  margin-bottom: 14px;
  position: relative;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3));
  background-size: 200% 100%;
  border-radius: inherit;
  transition: width .4s cubic-bezier(.4, 0, .2, 1);
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c2);
  opacity: .9;
  animation: pulse 2.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: .7; }
  50%      { opacity: 1;   }
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  margin-bottom: 24px;
  animation: float 1.6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1);   opacity: 1; }
  50%      { transform: translateY(-10px) scale(1.2); opacity: .7; }
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
  padding: 8px 12px;
  flex-grow: 1;
}
 .resize-handle {
    width: 100%;
    height: 6px;
    background: #e0e0e0;
    cursor: ns-resize;
    flex-shrink: 0;
    &:hover {
      background: #bbb;
    }
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
  padding: 4px 8px; 
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  height: 28px; 
  box-sizing: border-box;
  width: 140px; 
  margin-bottom: 0; 
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
  background: #e5e6e7;
  color: white;
  padding: 8px 16px;
  border-bottom: 1px solid #5af1b2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
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
