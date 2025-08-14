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
    currentTestCase = null,
    isFinalSectionContent = false
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
    this.isSecFail = category === "finalFAILURES";
    this.isSecERR = category === "finalERRORS";
    this.isSecWarr = category === "finalWARNINGS";
    this.isSecInfo = category === "finalINFO";
    this.isFinalSection= category === "finalFAILURES" || category === "finalERRORS" || category === "finalWARNINGS" || category === "finalINFO";
    this.isFinalSectionContent = isFinalSectionContent;
    this.parentFinalSection = null;


  }
  getBackgroundColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FFE6E6" : "#E6FFE6"; 
      default:
        return "#FFFFFF"; 
    }
  }

  getBorderColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FF0000" : "#00AA00";
      default:
        return "#CCCCCC"; 
    }
  }
}