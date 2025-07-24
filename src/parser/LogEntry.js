export class LogEntry {
  constructor({ 
    timestamp, 
    level, 
    module, 
    message, 
    rawLine,
    category = "standard", 
    highlightTokens = [],
    testCaseStatus = null,
    currentTestCase = null
  }) {
    this.timestamp = timestamp;
    this.level = level;
    this.module = module;
    this.message = message;
    this.rawLine = rawLine || `${timestamp} ${level} ${module} ${message}`;
    this.category = category;
    this.highlightTokens = highlightTokens;
    this.testCaseStatus = testCaseStatus; 
    this.currentTestCase = currentTestCase; 
    this.isTestFailure = category === "assertion" || category === "exception";
    this.isTestCase = category === "testcase";
  }
  getBackgroundColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FFE6E6" : "#E6FFE6"; 
      case "assertion":
      case "exception":
        return "#FFE6CC"; 
      case "error":
        return "#FF0000";
      case "warning":
        return "#00ff7bff";
      case "debug":
        return "#a0ab04ff";
      default:
        return "#FFFFFF"; 
    }
  }

  getBorderColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FF0000" : "#00AA00";
      case "assertion":
      case "exception":
        return "#FF8800"; 
      case "error":
        return "#FF0000";
      case "warning":
        return "#00ff7bff";
      case "debug":
        return "#a0ab04ff";
      default:
        return "#CCCCCC"; 
    }
  }
}