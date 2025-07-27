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
        color: "#FF0000",
        description: ""

      },
      {
        name: "AssertionFailed",
        pattern: "\\[Assert FAILED\\]",
        type: "assertion",
        color: "#FF8800",
        description: ""

        },
        {
          name: "ExceptionFailed", 
          pattern: "\\[Expect FAILED\\]",
          type: "exception",
          color: "#FF8800",
          description: ""

        },
        {
  name: "negativeresponse",
  pattern: "7F(?:\\s+[0-9A-Fa-f]{2}){2}",
  type: "negativeresponse",
  color: "#e844faff" ,
  description: ""

},

{
  name: "ECUReset",
  pattern: "^.*Payload:.*\\b(?:[0-9A-Fa-f]{2}\\s+){2}00\\s+9[01]\\s+11\\s+01\\b.*$",
  type: "ECUReset",
  color: "#3294cdff" ,
  description: ""

},
{
  name: "statustokenINITIALLY_DISABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){3}\\s+00\\b",
  type: "statustokenINITIALLY_DISABLED",
  color: "#b0ff1eff",
  description: "INITIALLY_DISABLED"

},
{
  name: "statustokenENABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){3}\\s+01\\b",
  type: "statustokenENABLED",
  color: "#b0ff1eff",
  description: "ENABLED"

},
{
  name: "statustokenDISABLED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){3}\\s+02\\b",
  type: "statustokenDISABLED",
  color: "#b0ff1eff",
  description: "DISABLED"

},
{
  name: "statustokenEXPIRED",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){3}\\s+03\\b",
  type: "statustokenEXPIRED",
  color: "#b0ff1eff",
  description: "EXPIRED"

},
{
  name: "statustokenINVALID_VALUE",
  pattern: "71\\s+01\\s+0F\\s+29(\\s+[0-9A-Fa-f]{2}){3}\\s+FF\\b",
  type: "statustokenINVALID_VALUE",
  color: "#b0ff1eff",
  description: "INVALID_VALUE"

},
{
  name: "EsysReturnCodeOK",
  pattern: "EsysReturnCode\\.OK",
  type: "EsysReturnCodeOK",
  color: "#00ffcc",
  description: ""
},
{
  name: "EsysReturnCodeOther",
  pattern: "EsysReturnCode\\.(?!OK)\\w+",
  type: "EsysReturnCodeOther",
  color: "#e64545f7",
  description: ""
},

{
  name: "RSU_POSITIVE_RESPONSE_CODES_00",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+00",
  type: "RSU_POSITIVE_RESPONSE_CODES_00",
  color: "#67f3b9f7",
  description: "SUCCESS"
},
{
  name: "RSU_POSITIVE_RESPONSE_CODES_11",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+11",
  type: "RSU_POSITIVE_RESPONSE_CODES_11",
  color: "#67f3b9f7",
  description: "FILE_TRANSFER_RUNNING"
},
{
  name: "RSU_POSITIVE_RESPONSE_CODES_12",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+12",
  type: "RSU_POSITIVE_RESPONSE_CODES_12",
  color: "#67f3b9f7",
  description: "PREPROCESSING_RUNNING"
},

{
  name: "RSU_POSITIVE_RESPONSE_CODES_40",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+40",
  type: "RSU_POSITIVE_RESPONSE_CODES_40",
  color: "#67f3b9f7",
  description: "CHECKMEMORY_RUNNING"
},
{
  name: "RSU_POSITIVE_RESPONSE_CODES_41",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+41",
  type: "RSU_POSITIVE_RESPONSE_CODES_41",
  color: "#67f3b9f7",
  description: "CHECK_PROGRAMMING_DEPENDENCIES_RUNNING"
},

{
  name: "RSU_NIGATIVE_RESPONSE_CODES_01",
  pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+01",
  type: "RSU_NIGATIVE_RESPONSE_CODES_01",
  color: "#d72b2bf7",
  description: "ACCESS_CONFIGURATION_TABLE_FAILED"
},

  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_02",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+02",
    type: "RSU_NIGATIVE_RESPONSE_CODES_02",
    color: "#d72b2bf7",
    description: "CHECK_PROGRAMMING_DEPENDENCY_FLAGS_NOT_PRESENT"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_03",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+03",
    type: "RSU_NIGATIVE_RESPONSE_CODES_03",
    color: "#d72b2bf7",
    description: "PREPROCESSING_FLAG_NOT_PRESENT"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_04",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+04",
    type: "RSU_NIGATIVE_RESPONSE_CODES_04",
    color: "#d72b2bf7",
    description: "ACCESS_TO_WRITING_FLAGS_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_07",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+07",
    type: "RSU_NIGATIVE_RESPONSE_CODES_07",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_NOT_VALID_TIME"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_08",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+08",
    type: "RSU_NIGATIVE_RESPONSE_CODES_08",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_VERSION_NOT_SUPPORTED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_09",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+09",
    type: "RSU_NIGATIVE_RESPONSE_CODES_09",
    color: "#d72b2bf7",
    description: "WRONG_ECU_UID"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_0A",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+0A",
    type: "RSU_NIGATIVE_RESPONSE_CODES_0A",
    color: "#d72b2bf7",
    description: "DOWNLOAD_CANNOT_BE_STOPPED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_10",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+10",
    type: "RSU_NIGATIVE_RESPONSE_CODES_10",
    color: "#d72b2bf7",
    description: "FILE_ACCESS_DENIED_BY_MASTER"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_13",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+13",
    type: "RSU_NIGATIVE_RESPONSE_CODES_13",
    color: "#d72b2bf7",
    description: "MEMORY_ACCESS_ERROR"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_14",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+14",
    type: "RSU_NIGATIVE_RESPONSE_CODES_14",
    color: "#d72b2bf7",
    description: "MEMORY_INITIALIZATION_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_15",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+15",
    type: "RSU_NIGATIVE_RESPONSE_CODES_15",
    color: "#d72b2bf7",
    description: "NOT_ENOUGH_MEMORY"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_16",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+16",
    type: "RSU_NIGATIVE_RESPONSE_CODES_16",
    color: "#d72b2bf7",
    description: "ACCESS_TO_SWE_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_17",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+17",
    type: "RSU_NIGATIVE_RESPONSE_CODES_17",
    color: "#d72b2bf7",
    description: "NO_CONSISTENT_SWE_SET_FOUND"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_19",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+19",
    type: "RSU_NIGATIVE_RESPONSE_CODES_19",
    color: "#d72b2bf7",
    description: "SWE_DECRYPTION_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_20",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+20",
    type: "RSU_NIGATIVE_RESPONSE_CODES_20",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_LIST_EXISTING_SWES_INCORRECT"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_21",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+21",
    type: "RSU_NIGATIVE_RESPONSE_CODES_21",
    color: "#d72b2bf7",
    description: "SWE_DELTA_ALGORITHM_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_22",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+22",
    type: "RSU_NIGATIVE_RESPONSE_CODES_22",
    color: "#d72b2bf7",
    description: "SWE_SIGNATURE_CHECK_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_23",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+23",
    type: "RSU_NIGATIVE_RESPONSE_CODES_23",
    color: "#d72b2bf7",
    description: "SWE_SIGNATURE_ERROR_AND_DELETION_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_24",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+24",
    type: "RSU_NIGATIVE_RESPONSE_CODES_24",
    color: "#d72b2bf7",
    description: "NO_CONSISTENT_SWE_SET_FOUND_AND_DELETION_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_26",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+26",
    type: "RSU_NIGATIVE_RESPONSE_CODES_26",
    color: "#d72b2bf7",
    description: "PROTOCOL_VERSION_NOT_SUPPORTED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_27",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+27",
    type: "RSU_NIGATIVE_RESPONSE_CODES_27",
    color: "#d72b2bf7",
    description: "FLAGS_SIGNATURE_CHECK_PRESENT"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_28",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+28",
    type: "RSU_NIGATIVE_RESPONSE_CODES_28",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_SIGNATURE_CHECK_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_29",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+29",
    type: "RSU_NIGATIVE_RESPONSE_CODES_29",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_WRONG_VIN"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_2A",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+2A",
    type: "RSU_NIGATIVE_RESPONSE_CODES_2A",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_SIGNATURE_ALGORITHM_NOT_SUPPORTED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_2B",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+2B",
    type: "RSU_NIGATIVE_RESPONSE_CODES_2B",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_ECU_ID_DOES_NOT_MATCH"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_2C",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+2C",
    type: "RSU_NIGATIVE_RESPONSE_CODES_2C",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_NOT_SECURE_TOKEN_MODE_STORED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_2D",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+2D",
    type: "RSU_NIGATIVE_RESPONSE_CODES_2D",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_NO_HASH_VALUES_MODE_STORED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_2E",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+2E",
    type: "RSU_NIGATIVE_RESPONSE_CODES_2E",
    color: "#d72b2bf7",
    description: "PROGRAMMING_TOKEN_HASH_VALUES_MODE_DIFFER"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_30",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+30",
    type: "RSU_NIGATIVE_RESPONSE_CODES_30",
    color: "#d72b2bf7",
    description: "CONNECTION_MASTER_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_31",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+31",
    type: "RSU_NIGATIVE_RESPONSE_CODES_31",
    color: "#d72b2bf7",
    description: "TRANSMISSION_ABORTED_BY_CLIENT"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_32",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+32",
    type: "RSU_NIGATIVE_RESPONSE_CODES_32",
    color: "#d72b2bf7",
    description: "TRANSMISSION_ABORTED_BY_MASTER"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_33",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+33",
    type: "RSU_NIGATIVE_RESPONSE_CODES_33",
    color: "#d72b2bf7",
    description: "WRITING_FINGERPRINT_FAILED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_34",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+34",
    type: "RSU_NIGATIVE_RESPONSE_CODES_34",
    color: "#d72b2bf7",
    description: "RESET_START_DOWNLOAD_AGAIN"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_35",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+35",
    type: "RSU_NIGATIVE_RESPONSE_CODES_35",
    color: "#d72b2bf7",
    description: "FILE_NOT_FOUND"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_50",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+50",
    type: "RSU_NIGATIVE_RESPONSE_CODES_50",
    color: "#d72b2bf7",
    description: "REMAINING_SWES_CANNOT_BE_COPIED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_60",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+60",
    type: "RSU_NIGATIVE_RESPONSE_CODES_60",
    color: "#d72b2bf7",
    description: "SVK_ABGLEICH_NOT_POSSIBLE"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_61",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+61",
    type: "RSU_NIGATIVE_RESPONSE_CODES_61",
    color: "#d72b2bf7",
    description: "RESUME_AFTER_INTERRUPT_NOT_POSSIBLE"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_70",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+70",
    type: "RSU_NIGATIVE_RESPONSE_CODES_70",
    color: "#d72b2bf7",
    description: "PREVIOUS_STEP_NOT_FINISHED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_71",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+71",
    type: "RSU_NIGATIVE_RESPONSE_CODES_71",
    color: "#d72b2bf7",
    description: "PROGRAMMING_COUNTER_EXEEDED"
  },
  {
    name: "RSU_NIGATIVE_RESPONSE_CODES_72",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+72",
    type: "RSU_NIGATIVE_RESPONSE_CODES_72",
    color: "#d72b2bf7",
    description: "TARGET_SW_CONF_ACCORDING_PROG_PROTECTION_NOT_ADMISSIBLE"
  },
    {
    name: "RSU_NIGATIVE_RESPONSE_CODES_80",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+80",
    type: "RSU_NIGATIVE_RESPONSE_CODES_80",
    color: "#d72b2bf7",
    description: "ACTIVATION_NOT_POSSIBLE"
  },
    {
    name: "RSU_NIGATIVE_RESPONSE_CODES_90",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+90",
    type: "RSU_NIGATIVE_RESPONSE_CODES_90",
    color: "#d72b2bf7",
    description: "STREAM_TOO_LONG"
  },
    {
    name: "RSU_NIGATIVE_RESPONSE_CODES_FC",
    pattern: "71\\s+(01|03)\\s+10\\s+7[0-4](\\s+[0-9A-Fa-f]{2}){6}\\s+FC",
    type: "RSU_NIGATIVE_RESPONSE_CODES_FC",
    color: "#d72b2bf7",
    description: "FATAL_INTERNAL_ERROR"
  },
  {
    name: "RSU_RESPONSE_WITH_MULTI_DESC",
    pattern: "71\\s+01\\s+10\\s+AC\\s+([0-9A-Fa-f]{2})\\s+([0-9A-Fa-f]{2})",
    type: "RSU_RESPONSE_WITH_MULTI_DESC",
    color: "#ff6b35",
    description: "Response with multiple descriptions",
    multiDescriptions: true,
    subPatterns: [
      {
        name: "FIRST_OCTET",
        captureGroup: 1, 
        descriptions: {
          "00": "OK",
  "01": "UNCHECKED",
  "02": "MALFORMED",
  "03": "EMPTY",
  "04": "INCOMPLETE",
  "05": "SECURITY_ERROR",
  "06": "WRONG_VIN17",
  "07": "CHECK_RUNNING",
  "08": "ISSUER_CERT_ERROR",
  "09": "WRONG_ECU_UID",
  "0A": "DECRYPTION_ERROR",
  "0B": "OWN_CERT_NOT_PRESENT",
  "0C": "OUTDATED",
  "0D": "KEY_ERROR",
  "FE": "NOT_USED",
  "FF": "OTHER"
        }
      },
      {
        name: "SECOND_OCTET", 
        captureGroup: 2, 
        descriptions: {
          "00": "OK",
  "01": "UNCHECKED",
  "02": "MALFORMED",
  "03": "EMPTY",
  "04": "INCOMPLETE",
  "05": "SECURITY_ERROR",
  "06": "WRONG_VIN17",
  "07": "CHECK_RUNNING",
  "08": "ISSUER_CERT_ERROR",
  "09": "WRONG_ECU_UID",
  "0A": "DECRYPTION_ERROR",
  "0B": "OWN_CERT_NOT_PRESENT",
  "0C": "OUTDATED",
  "0D": "KEY_ERROR",
  "FE": "NOT_USED",
  "FF": "OTHER"
          
        }
      }
    ]
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
    color: token.color,
    customDescription: token.customDescription || "",
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
  if (highlightTokens.some(t => t.type === "EsysReturnCodeOther")) return "EsysReturnCodeOther";
  if (highlightTokens.some(t => t.type === "RSU_POSITIVE_RESPONSE_CODES_00")) return "RSU_POSITIVE_RESPONSE_CODES_00";
  if (highlightTokens.some(t => t.type === "RSU_POSITIVE_RESPONSE_CODES_11")) return "RSU_POSITIVE_RESPONSE_CODES_11";
  if (highlightTokens.some(t => t.type === "RSU_POSITIVE_RESPONSE_CODES_12")) return "RSU_POSITIVE_RESPONSE_CODES_12";
  if (highlightTokens.some(t => t.type === "RSU_POSITIVE_RESPONSE_CODES_40")) return "RSU_POSITIVE_RESPONSE_CODES_40";
  if (highlightTokens.some(t => t.type === "RSU_POSITIVE_RESPONSE_CODES_41")) return "RSU_POSITIVE_RESPONSE_CODES_41";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_01")) return "RSU_NIGATIVE_RESPONSE_CODES_01";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_02")) return "RSU_NIGATIVE_RESPONSE_CODES_02";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_03")) return "RSU_NIGATIVE_RESPONSE_CODES_03";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_04")) return "RSU_NIGATIVE_RESPONSE_CODES_04";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_07")) return "RSU_NIGATIVE_RESPONSE_CODES_07";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_08")) return "RSU_NIGATIVE_RESPONSE_CODES_08";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_09")) return "RSU_NIGATIVE_RESPONSE_CODES_09";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_0A")) return "RSU_NIGATIVE_RESPONSE_CODES_0A";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_10")) return "RSU_NIGATIVE_RESPONSE_CODES_10";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_13")) return "RSU_NIGATIVE_RESPONSE_CODES_13";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_14")) return "RSU_NIGATIVE_RESPONSE_CODES_14";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_15")) return "RSU_NIGATIVE_RESPONSE_CODES_15";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_16")) return "RSU_NIGATIVE_RESPONSE_CODES_16";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_17")) return "RSU_NIGATIVE_RESPONSE_CODES_17";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_19")) return "RSU_NIGATIVE_RESPONSE_CODES_19";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_20")) return "RSU_NIGATIVE_RESPONSE_CODES_20";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_21")) return "RSU_NIGATIVE_RESPONSE_CODES_21";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_22")) return "RSU_NIGATIVE_RESPONSE_CODES_22";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_23")) return "RSU_NIGATIVE_RESPONSE_CODES_23";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_24")) return "RSU_NIGATIVE_RESPONSE_CODES_24";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_27")) return "RSU_NIGATIVE_RESPONSE_CODES_27";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_28")) return "RSU_NIGATIVE_RESPONSE_CODES_28";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_29")) return "RSU_NIGATIVE_RESPONSE_CODES_29";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_2A")) return "RSU_NIGATIVE_RESPONSE_CODES_2A";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_2B")) return "RSU_NIGATIVE_RESPONSE_CODES_2B";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_2C")) return "RSU_NIGATIVE_RESPONSE_CODES_2C";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_2D")) return "RSU_NIGATIVE_RESPONSE_CODES_2D";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_2E")) return "RSU_NIGATIVE_RESPONSE_CODES_2E";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_30")) return "RSU_NIGATIVE_RESPONSE_CODES_30";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_31")) return "RSU_NIGATIVE_RESPONSE_CODES_31";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_32")) return "RSU_NIGATIVE_RESPONSE_CODES_32";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_33")) return "RSU_NIGATIVE_RESPONSE_CODES_33";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_34")) return "RSU_NIGATIVE_RESPONSE_CODES_34";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_35")) return "RSU_NIGATIVE_RESPONSE_CODES_35";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_50")) return "RSU_NIGATIVE_RESPONSE_CODES_50";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_60")) return "RSU_NIGATIVE_RESPONSE_CODES_60";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_61")) return "RSU_NIGATIVE_RESPONSE_CODES_61";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_70")) return "RSU_NIGATIVE_RESPONSE_CODES_70";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_71")) return "RSU_NIGATIVE_RESPONSE_CODES_71";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_72")) return "RSU_NIGATIVE_RESPONSE_CODES_72";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_80")) return "RSU_NIGATIVE_RESPONSE_CODES_80";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_90")) return "RSU_NIGATIVE_RESPONSE_CODES_90";
  if (highlightTokens.some(t => t.type === "RSU_NIGATIVE_RESPONSE_CODES_FC")) return "RSU_NIGATIVE_RESPONSE_CODES_FC";
  if (highlightTokens.some(t => t.type === "RSU_RESPONSE_WITH_MULTI_DESC")) return "RSU_RESPONSE_WITH_MULTI_DESC";
  
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
        let description = rule.description;
        
        if (rule.multiDescriptions && rule.subPatterns) {
          const descriptions = [];
          rule.subPatterns.forEach(subPattern => {
            const capturedValue = match[subPattern.captureGroup];
            if (capturedValue && subPattern.descriptions[capturedValue.toUpperCase()]) {
              descriptions.push(`${subPattern.name}: ${subPattern.descriptions[capturedValue.toUpperCase()]}`);
            }
            console.log("***********"+descriptions);
          });
          if (descriptions.length > 0) {
            description = descriptions.join(' | ');
            console.log('Descriptions multi trouvées:', description);

          }
        }

        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.type,
          color: rule.color,
          customDescription: description 
        });
        console.log("+++++++++++++++++++"+tokens.type);
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