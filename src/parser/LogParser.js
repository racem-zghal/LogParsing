import { LogEntry } from "./LogEntry.js";
import { ParsingRule } from "./ParsingRule.js";

export class LogParser {
  constructor() {
    this.parsingRules = [
      new ParsingRule(
        "Test Case Start",
        /^(.+\.py::\w+::\w+)\s/,
        "#00AA00" // Vert pour les succès
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
    
    this.loadHighlightRules();
  }

  async loadHighlightRules() {
    try {
      const response = await fetch('/config/highlight-rules.json');
      this.highlightDefinitions = await response.json();
    } catch (err) {
      console.error("Failed to load highlight rules:", err);
      this.highlightDefinitions = [
        {
          name: "AssertionFailed",
          pattern: "\\[Assert FAILED\\]|AssertionError|assertion.*failed",
          type: "assertion",
          color: "#FF8800"
        },
        {
          name: "ExceptionFailed",
          pattern: "\\[Expect FAILED\\]|Exception|expect.*failed",
          type: "exception",
          color: "#FF8800"
        }
      ];
    }
  }

  parse(rawText) {
    const lines = rawText.split(/\r?\n/);
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
    const highlightTokens = this.detectHighlights(line);

    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: "testcase",
      testCaseStatus: hasFailures ? "failed" : "passed",
      highlightTokens: highlightTokens,
      customColor: hasFailures ? "#FF0000" : "#00AA00"
    });
  }

  processDetailedLine(line, match) {
    const message = match[4];
    const highlightTokens = this.detectHighlights(message);
    const category = this.determineCategory(highlightTokens);

    return new LogEntry({
      timestamp: match[1],
      level: this.mapLevel(match[2]),
      module: match[3],
      message: message,
      category: category,
      currentTestCase: this.currentTestCase,
      highlightTokens: highlightTokens
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
    if (highlightTokens.some(t => t.type === "assertion")) return "assertion";
    if (highlightTokens.some(t => t.type === "exception")) return "exception";
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
      return tokens.some(t => t.type === "assertion" || t.type === "exception") ||
             line.includes("AssertionError") ||
             line.includes("assert failed") ||
             line.includes("expect failed") ||
             line.includes("Exception") ||
             line.includes("Error:");
    });
  }

  detectHighlights(text) {
    const tokens = [];
    for (const rule of this.highlightDefinitions) {
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
    return tokens;
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