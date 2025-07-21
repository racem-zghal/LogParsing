import { LogEntry } from "./LogEntry.js";
import { ParsingRule } from "./ParsingRule.js";

export class LogParser {
  constructor() {
    this.parsingRules = [
      new ParsingRule(
        "Test Case Start",
        /^(.+\.py::\w+::\w+)\s/,
        "#00FF00" 
      ),
      new ParsingRule(
        "Detailed Log Line",
        /^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/,
        "#FF0000"
      )
    ];
    this.highlightDefinitions = [];
    this.currentTestCase = null;
    this.testCaseResults = new Map(); 
    
    fetch('public/config/highlight-rules.json').then(res => res.json()).then(data => {
      this.highlightDefinitions = data;
    });
  }

  parse(rawText) {
    const lines = rawText.split(/\r?\n/);
    const entries = [];
    
    // Premier passage : identifier tous les test cases et leurs résultats
    this.analyzeTestCases(lines);

    for (const line of lines) {
      let matched = false;

      for (const rule of this.parsingRules) {
        const match = line.match(rule.regex);
        if (match) {
          
          // Vérifier si c'est un début de test case
          if (rule.name === "Test Case Start") {
            const testCasePath = match[1];
            this.currentTestCase = testCasePath;
            
            const highlightTokens = this.detectHighlights(line);
            const hasFailures = this.testCaseResults.get(testCasePath) || false;
            
            entries.push(
              new LogEntry({
                timestamp: "",
                level: "INFO",
                module: "",
                message: line,
                category: "testcase",
                testCaseStatus: hasFailures ? "failed" : "passed",
                highlightTokens: highlightTokens
              })
            );
            
            console.log(`[testcase-${hasFailures ? 'failed' : 'passed'}] ${line}`);
            matched = true;
            break;
          }
          
          // Traitement des lignes de log détaillées
          if (rule.name === "Detailed Log Line") {
            const level = match[2];
            const message = match[4];
            const highlightTokens = this.detectHighlights(message);
            let category = "standard";
            
            if (highlightTokens.find(t => t.type === "assertion")) {
              category = "assertion";
            } else if (highlightTokens.find(t => t.type === "exception")) {
              category = "exception";
            }

            entries.push(
              new LogEntry({
                timestamp: match[1],
                level: this.mapLevel(level),
                module: match[3],
                message: message,
                category: category,
                currentTestCase: this.currentTestCase,
                highlightTokens: highlightTokens
              })
            );
            
            console.log(`[${category}] ${message}`);
            matched = true;
            break;
          }
        }
      }

      if (!matched && line.trim()) {
        const highlightTokens = this.detectHighlights(line);

        let category = "standard";
        if (highlightTokens.find(t => t.type === "assertion")) {
          category = "assertion";
        } else if (highlightTokens.find(t => t.type === "exception")) {
          category = "exception";
        }

        entries.push(
          new LogEntry({
            timestamp: "",
            level: "INFO",
            module: "",
            message: line,
            category: category,
            currentTestCase: this.currentTestCase,
            highlightTokens: highlightTokens
          })
        );
        
        console.log(`[${category}] ${line}`);
      }
    }

    return entries;
  }

  // Nouvelle méthode pour analyser les test cases et leurs résultats
  analyzeTestCases(lines) {
    let currentTestCase = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détecter le début d'un test case
      const testCaseMatch = line.match(/^(.+\.py::\w+::\w+)\s/);
      if (testCaseMatch) {
        currentTestCase = testCaseMatch[1];
        this.testCaseResults.set(currentTestCase, false); // Initialement pas d'échec
        continue;
      }
      
      // Si on est dans un test case, vérifier les échecs
      if (currentTestCase) {
        const hasAssertion = this.detectHighlights(line).find(t => t.type === "assertion");
        const hasException = this.detectHighlights(line).find(t => t.type === "exception");
        
        if (hasAssertion || hasException) {
          this.testCaseResults.set(currentTestCase, true); // Marquer comme échoué
        }
        
        // Détecter le début d'un nouveau test case pour arrêter l'analyse du précédent
        const nextTestCaseMatch = line.match(/^(.+\.py::\w+::\w+)\s/);
        if (nextTestCaseMatch && nextTestCaseMatch[1] !== currentTestCase) {
          currentTestCase = nextTestCaseMatch[1];
          this.testCaseResults.set(currentTestCase, false);
        }
      }
    }
  }

  detectHighlights(text) {
    const tokens = [];
    for (const rule of this.highlightDefinitions) {
      const regex = new RegExp(rule.pattern, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.type
        });
      }
    }
    return tokens;
  }

  mapLevel(level) {
    switch (level.toUpperCase()) {
      case "ERR":
        return "ERROR";
      case "INF":
        return "INFO";
      case "WRN":
        return "WARNING";
      case "DBG":
        return "DEBUG";
      default:
        return level;
    }
  }
}