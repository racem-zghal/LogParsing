// LogEntry.js
export class LogEntry {
  constructor({ 
    timestamp = "", 
    level = "INFO", 
    module = "", 
    message = "", 
    category = "standard", 
    highlightTokens = [],
    testCaseStatus = null,
    currentTestCase = null
  }) {
    this.timestamp = timestamp;
    this.level = level;
    this.module = module;
    this.message = message;
    this.category = category;
    this.highlightTokens = highlightTokens;
    this.testCaseStatus = testCaseStatus;
    this.currentTestCase = currentTestCase;
    this.isTestCase = category === "testcase";
    this.isTestFailure = this.isTestCase ? 
      testCaseStatus === "failed" : 
      (category === "assertion" || category === "exception");
  }

  getBackgroundColor() {
    const colors = {
      testcase: {
        failed: "#FFE6E6",
        passed: "#E6FFE6"
      },
      assertion: "#FFE6CC",
      exception: "#FFE6CC",
      standard: "#FFFFFF"
    };
    
    return this.isTestCase ? 
      colors.testcase[this.testCaseStatus] : 
      colors[this.category] || colors.standard;
  }

  getBorderColor() {
    const colors = {
      testcase: {
        failed: "#FF0000",
        passed: "#00AA00"
      },
      assertion: "#FF8800",
      exception: "#FF8800",
      standard: "#CCCCCC"
    };
    
    return this.isTestCase ? 
      colors.testcase[this.testCaseStatus] : 
      colors[this.category] || colors.standard;
  }

  getIcon() {
    const icons = {
      testcase: {
        failed: "❌",
        passed: "✅"
      },
      assertion: "⚠️",
      exception: "🔥",
      standard: ""
    };
    
    return this.isTestCase ? 
      icons.testcase[this.testCaseStatus] : 
      icons[this.category] || icons.standard;
  }
}