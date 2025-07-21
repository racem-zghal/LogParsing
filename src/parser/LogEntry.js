export class LogEntry {
  constructor({ 
    timestamp, 
    level, 
    module, 
    message, 
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
    this.testCaseStatus = testCaseStatus; // "passed", "failed", or null
    this.currentTestCase = currentTestCase; // Le test case actuel en cours
    this.isTestFailure = category === "assertion" || category === "exception";
    this.isTestCase = category === "testcase";
  }

  // Méthode pour obtenir la couleur de fond selon la catégorie
  getBackgroundColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FFE6E6" : "#E6FFE6"; // Rouge clair ou vert clair
      case "assertion":
      case "exception":
        return "#FFE6CC"; // Orange clair
      default:
        return "#FFFFFF"; // Blanc par défaut
    }
  }

  // Méthode pour obtenir la couleur de bordure
  getBorderColor() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "#FF0000" : "#00AA00"; // Rouge ou vert
      case "assertion":
      case "exception":
        return "#FF8800"; // Orange
      default:
        return "#CCCCCC"; // Gris par défaut
    }
  }

  // Méthode pour obtenir l'icône appropriée
  getIcon() {
    switch (this.category) {
      case "testcase":
        return this.testCaseStatus === "failed" ? "❌" : "✅";
      case "assertion":
        return "⚠️";
      case "exception":
        return "🔥";
      default:
        return "";
    }
  }
}