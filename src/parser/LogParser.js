import { LogEntry } from "./LogEntry.js";
import { ParsingRule } from "./ParsingRule.js";

export class LogParser {
  constructor() {
    this.parsingRules = [
      new ParsingRule(
        "Test Case Start",
        /^(.+\.py::\w+::\w+)\s/
      ),
      new ParsingRule(
        "Detailed Log Line",
        /^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/
      )
    ];
      this.highlightDefinitions = []; 
    this.currentTestCase = null;
    this.testCaseResults = new Map();
    this.ready = this.loadHighlightRules(); 
  }

 async loadHighlightRules() {
    try {
      const response = await fetch('highlight-rules.json');
      if (!response.ok) throw new Error('HTTP error');
      const rules = await response.json();
      console.log('Règles chargées:', rules);
      this.highlightDefinitions = rules;
    } catch (err) {
      console.warn("Using default rules:", err);
      this.highlightDefinitions = [
        {
        name: "Error",
        pattern: "\\[ERR\\]",
        type: "error",
        color: "#FF0000"
      },
      {
        name: "AssertionFailed",
        pattern: "\\[Assert FAILED\\]",
        type: "assertion",
        color: "#FF8800"
        },
        {
          name: "ExceptionFailed", 
          pattern: "\\[Expect FAILED\\]",
          type: "exception",
          color: "#FF8800"
        },
        {
  name: "negativeresponse",
  pattern: "7F(?:\\s+[0-9A-Fa-f]{2}){2}",
  type: "negativeresponse",
  color: "#e844faff" 
},

{
  name: "ECUReset",
  pattern: "Payload:.*\\b(?:[0-9A-Fa-f]{2}\\s+){2}00\\s+9[01]\\s+11\\s+01\\b",
  type: "ECUReset",
  color: "#3294cdff" 
},
{
  name: "statustokenINITIALLY_DISABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){4}\\s+00\\b",
  type: "statustokenINITIALLY_DISABLED",
  color: "#b0ff1eff"
},
{
  name: "statustokenENABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){4}\\s+01\\b",
  type: "statustokenENABLED",
  color: "#b0ff1eff"
},
{
  name: "statustokenDISABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){4}\\s+02\\b",
  type: "statustokenDISABLED",
  color: "#b0ff1eff"
},
{
  name: "statustokenEXPIRED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){4}\\s+03\\b",
  type: "statustokenEXPIRED",
  color: "#b0ff1eff"
},
{
  name: "statustokenINVALID_VALUE",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){4}\\s+FF\\b",
  type: "statustokenINVALID_VALUE",
  color: "#b0ff1eff"
},
{
  name: "EsysReturnCodeOK",
  pattern: "EsysReturnCode\\.OK",
  type: "EsysReturnCodeOK",
  color: "#00ffcc"
}

        
      ];
    }
  }

  async parse(rawText) {
    await this.ready;
    console.log('Texte brut reçu :', rawText.substring(0, 100) + '...'); 
    const lines = rawText.split(/\r?\n/);
    console.log(`${lines.length} lignes à traiter`); 
    const entries = [];
    this.analyzeTestCases(lines);
    for (const line of lines) {
      if (!line.trim()) continue;
      let entry = this.processLine(line);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  processLine(line) {
    console.log('Traitement ligne :', line); 
    for (const rule of this.parsingRules) {
      const match = line.match(rule.regex);
      if (!match) continue;
      if (rule.name === "Test Case Start") {
        return this.processTestCase(line, match);
      } else if (rule.name === "Detailed Log Line") {
        return this.processDetailedLine(line, match);
      }
    }
    return this.processUnmatchedLine(line);
  }

  processTestCase(line, match) {
  const testCasePath = match[1];
  this.currentTestCase = testCasePath;
  const hasFailures = this.testCaseResults.get(testCasePath) || false;
  const highlightType = hasFailures ? "testcase-failed" : "testcase";
  const highlightTokens = this.detectHighlightsByType(line, highlightType);

  return new LogEntry({
    timestamp: "",
    level: "INFO",
    module: "",
    message: line,
    rawLine: line,
    category: "testcase",
    testCaseStatus: hasFailures ? "failed" : "passed",
    highlightTokens: highlightTokens,
    customColor: hasFailures ? "#FF0000" : "#00AA00"
  });
}

  processDetailedLine(line, match) {
  const messageTokensRaw = this.detectHighlights(line);
  const messageTokens = messageTokensRaw.map(token => ({
    start: token.start,
    end: token.end,
    type: token.type,
    color: token.color
  }));
  const category = this.determineCategory(messageTokensRaw);
  return new LogEntry({
    timestamp: match[1],
    level: this.mapLevel(match[2]),
    module: match[3],
    message: match,
    rawLine: line,
    category: category,
    currentTestCase: this.currentTestCase,
    highlightTokens: messageTokens 
  });
}


  processUnmatchedLine(line) {
    const highlightTokens = this.detectHighlights(line);
    const category = this.determineCategory(highlightTokens);
    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: category,
      currentTestCase: this.currentTestCase,
      highlightTokens: highlightTokens
    });
  }

  determineCategory(highlightTokens) {
  if (highlightTokens.some(t => t.type === "error")) return "error";
  if (highlightTokens.some(t => t.type === "negativeresponse")) return "negativeresponse";
  if (highlightTokens.some(t => t.type === "assertion")) return "assertion";
  if (highlightTokens.some(t => t.type === "exception")) return "exception";
  if (highlightTokens.some(t => t.type === "ECUReset")) return "ECUReset";
  if (highlightTokens.some(t => t.type === "statustokenINITIALLY_DISABLED")) return "statustokenINITIALLY_DISABLED";
  if (highlightTokens.some(t => t.type === "statustokenENABLED")) return "statustokenENABLED";
  if (highlightTokens.some(t => t.type === "statustokenDISABLED")) return "statustokenDISABLED";
  if (highlightTokens.some(t => t.type === "statustokenEXPIRED")) return "statustokenEXPIRED";
  if (highlightTokens.some(t => t.type === "statustokenINVALID_VALUE")) return "statustokenINVALID_VALUE";
  if (highlightTokens.some(t => t.type === "EsysReturnCodeOK")) return "EsysReturnCodeOK";
  return "standard";
}

  analyzeTestCases(lines) {
    let currentTestCase = null;
    let testCaseLines = [];
    
    for (const line of lines) {
      const testCaseMatch = line.match(/^(.+\.py::\w+::\w+)\s/);
      if (testCaseMatch) {
        if (currentTestCase !== null) {
          this.testCaseResults.set(currentTestCase, this.hasTestFailed(testCaseLines));
        }
        currentTestCase = testCaseMatch[1];
        testCaseLines = [line];
      } else if (currentTestCase !== null) {
        testCaseLines.push(line);
      }
    }
    
    if (currentTestCase !== null) {
      this.testCaseResults.set(currentTestCase, this.hasTestFailed(testCaseLines));
    }
  }

  hasTestFailed(lines) {
    return lines.some(line => {
      const tokens = this.detectHighlights(line);
      return tokens.some(t => t.type === "assertion" || t.type === "exception") ;
    });
  }

 detectHighlights(text) {
  console.log('----- Nouvelle détection -----');
  console.log('Texte analysé:', text);
  console.log('Règles disponibles:', this.highlightDefinitions);
  
  const tokens = [];
  for (const rule of this.highlightDefinitions) {
    try {
      const regex = new RegExp(rule.pattern, "gi");
      console.log(`Test pattern "${rule.pattern}" sur "${text}"`);
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        console.log('MATCH TROUVÉ:', {
          rule: rule.name,
          matched: match[0],
          index: match.index
        });
        tokens.push({
          start: match.index,
          end: match.index + (match[0].length),
          type: rule.type,
          color: rule.color
        });
      }
    } catch (e) {
      console.error("Erreur regex:", rule.pattern, e);
    }
  }
  
  console.log('Tokens générés:', tokens);
  return tokens;
}
  detectHighlightsByType(text, targetType) {
  const tokens = [];
  for (const rule of this.highlightDefinitions) {
    if (rule.type !== targetType) continue;
    try {
      const regex = new RegExp(rule.pattern, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.type,
          color: rule.color
        });
      }
    } catch (e) {
      console.error("Invalid regex pattern:", rule.pattern, e);
    }
  }
  const mergedTokens = [];
  tokens.sort((a, b) => a.start - b.start).forEach(token => {
    const last = mergedTokens[mergedTokens.length - 1];
    if (last && token.start <= last.end) {
      last.end = Math.max(last.end, token.end);
    } else {
      mergedTokens.push(token);
    }
  });

  console.log('Tokens fusionnés:', mergedTokens);
  return mergedTokens;
}


  mapLevel(level) {
    const levelMap = {
      "ERR": "ERROR",
      "INF": "INFO",
      "WRN": "WARNING",
      "DBG": "DEBUG"
    };
    return levelMap[level.toUpperCase()] || level;
  }
}