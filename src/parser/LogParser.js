import { LogEntry } from "./LogEntry.js";
import { ParsingRule } from "./ParsingRule.js";

export class LogParser {
  constructor() {
    this.parsingRules = [
      new ParsingRule(
        "Test Case Start",
        /^(.+\.py::\w+::\w+)\s(?!.*live log finish)/
      ),
      new ParsingRule(
        "Detailed Log Line",
        /^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/
      ),
      new ParsingRule(
        "Failures",/^=+\s*FAILURES\s*=+$/),
      new ParsingRule(
        "Errors",/^=+\s*ERRORS\s*=+$/), 
      new ParsingRule(
        "warnings summary" ,/^\s*=+\s*warnings\s+summary\s*=+\s*$/),   
         new ParsingRule(
        "short test summary info" ,/^\s*=+\s*short\s+test\s+summary\s+info\s*=+\s*$/), 
        ];
      this.highlightDefinitions = []; 
      
    this.currentTestCase = null;
    this.testCaseResults = new Map();
    this.skipCurrentTestCaseLogs = false;
    this.isfisec = false;
    this.isfinalcontent = false;
    this.ready = this.loadHighlightRules();
  }

 async loadHighlightRules() {
      this.highlightDefinitions = [
        {
        name: "Error",
        pattern: "\\[ERR\\]",
        type: "error",
        color: "#f06d6dff",
        description: ""

      },
      {
        name: "AssertionFailed",
        pattern: "\\[Assert FAILED\\].*",
        type: "assertion",
        color: "#FF8800",
        description: ""

        },
        {
          name: "ExceptionFailed", 
          pattern: "\\[Expect FAILED\\].*",
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
  name: "ECUResetRES",
  pattern: "^.*Payload:\\s+00\\s+9[01](\\s+[0-9A-Fa-f]{2}){2}\\s+51\\s+01\\b.*$",
  type: "ECUResetRES",
  color: "#3294cdff" ,
  description: ""

},
{
  name: "SinceBootReset",
  pattern: "^.*Since Boot\\(Power On Reset\\).*$",
  type: "SinceBootReset",
  color: "#3294cdff",
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
  } ,
  {
    name: "Generating Tal for",
    pattern: "Generating Tal for.*$",
    type: "Generating Tal for",
    color: "#c2e0c6"
  },
  {
    name: "Check pdx template version",
    pattern: "Check pdx template version.*$",
    type: "Check pdx template version",
    color: "#d1ecf1"
  },
  {
    name: "Importing PDX Container:",
    pattern: "Importing PDX Container:.*$",
    type: "Importing PDX Container:",
    color: "#fff3cd"
  },
  {
    name: "Extracted VIN from FA file:",
    pattern: "Extracted VIN from FA file:.*$",
    type: "Extracted VIN from FA file:",
    color: "#f8d7da"
  },
  {
    name: "Check for cached signed NCDs",
    pattern: "Check for cached signed NCDs.*$",
    type: "Check for cached signed NCDs",
    color: "#e2e3e5"
  },
  {
    name: "Processed SVK:",
    pattern: "Processed SVK:.*$",
    type: "Processed SVK:",
    color: "#d4edda"
  },
  {
    name: "Read SVT before TAL execution started",
    pattern: "Read SVT before TAL execution started.*$",
    type: "Read SVT before TAL execution started",
    color: "#cce5ff"
  },
  {
    name: "Checking Mirror-Protocol started",
    pattern: "Checking Mirror-Protocol started.*$",
    type: "Checking Mirror-Protocol started",
    color: "#ffecd1"
  },
  {
    name: "Status readSecureEcuMode:",
    pattern: "Status readSecureEcuMode:.*$",
    type: "Status readSecureEcuMode:",
    color: "#e0c9a6"
  },
  {
    name: "Checking Programming Protection \"PLUS\" started",
    pattern: "Checking Programming Protection \"PLUS\" started.*$",
    type: "Checking Programming Protection \"PLUS\" started",
    color: "#fde2e2"
  },
  {
    name: "Checking Programming Protection \"BASIC\" started",
    pattern: "Checking Programming Protection \"BASIC\" started.*$",
    type: "Checking Programming Protection \"BASIC\" started",
    color: "#e2e8f0"
  },
  {
    name: "TAL execution started.",
    pattern: "TAL execution started.*$",
    type: "TAL execution started.",
    color: "#c7d2fe"
  },
  {
    name: "prepareECUforMirrorFlash started",
    pattern: "prepareECUforMirrorFlash started.*$",
    type: "prepareECUforMirrorFlash started",
    color: "#bbf7d0"
  },
  {
    name: "finalizeECUMirrorFlash finished",
    pattern: "finalizeECUMirrorFlash finished.*$",
    type: "finalizeECUMirrorFlash finished",
    color: "#bbf7d0"
  },
  {
name: "E-Sys ecuMirrorDeploy TA started",
  pattern: "\\[E-Sys\\] <\\[.*\\] Transaction type: ecuMirrorDeploy;  Message: TA started.*$",
  type: "E-Sys ecuMirrorDeploy TA started",
  color: "#a3d9ff"
},
{
  name: "cleanup_esys_process",
  pattern: "\\[cleanup_esys_process\\]",
  type: "cleanup_esys_process",
  color: "#ffe4b5"
},
{
  name: "DEBUG_PORT_AVAILABILITY",
  pattern: "\\[DEBUG PORT AVAILABILITY\\]",
  type: "DEBUG_PORT_AVAILABILITY",
  color: "#ffe4b5"
},
{
  name: "itf.pybus_sim.basic_rbs",
  pattern: "\\[itf.pybus_sim.basic_rbs\\]",
  type: "itf.pybus_sim.basic_rbs",
  color: "#ffe4b5"
},
{
  name: "setup_dut_certif",
  pattern: "\\[setup_dut_certif\\]",
  type: "setup_dut_certif",
  color: "#ffe4b5"
},
  {
name: "E-Sys ecuActivate TA started",
  pattern: "\\[E-Sys\\] <\\[.*\\] Transaction type: ecuActivate;  Message: TA started.*$",
  type: "E-Sys ecuActivate TA started",
  color: "#a3d9ff"
},
  {
name: "E-Sys ecuPoll TA started",
  pattern: "\\[E-Sys\\] <\\[.*\\] Transaction type: ecuPoll;  Message: TA started.*$",
  type: "E-Sys ecuPoll TA started",
  color: "#a3d9ff"
},
{
    name: "finalizeVehicleFlash finished",
    pattern: "finalizeVehicleFlash finished.*$",
    type: "finalizeVehicleFlash finished",
    color: "#bbf7d0"
  },
    {
name: "E-Sys cdDeploy TA started",
  pattern: "\\[E-Sys\\] <\\[.*\\] Transaction type: cdDeploy;  Message: TA started.*$",
  type: "E-Sys cdDeploy TA started",
  color: "#a3d9ff"
},
  {
    name: "prepareVehicleForCoding started",
    pattern: "prepareVehicleForCoding started.*$",
    type: "prepareVehicleForCoding started",
    color: "#bbf7d0"
  },
  {
    name: "finalizeVehicleCoding started",
    pattern: "finalizeVehicleCoding started.*$",
    type: "finalizeVehicleCoding started",
    color: "#bbf7d0"
  },
   {
    name: "MSM_checks summary report ",
    pattern: "---------- MSM_checks summary report ----------",
    type: "MSM_checks summary report",
    color: "#bbf7d0"
  },
  {
    name: "Your program receive_notification with data",
    pattern: "Your program receive_notification with data.*$",
    type: "Your program receive_notification with data",
    color: "#bbf7d0"
  },
   {
    name: "ipcClientsResponse",
    pattern: "ipcClientsResponse {",
    type: "ipcClientsResponse",
    color: "#bbf7d0"
  },
  {
    name: "TAS-SIM",
    pattern: "TAS-SIM.{3}.",
    type: "TAS-SIM",
    color: "#bbf7d0"
  },
  {
    name: "Send command: requestID:",
    pattern: "Send command: requestID:.*$",
    type: "Send command: requestID:",
    color: "#bbf7d0"
  },
  {
  name: "executionStatus: OK",
  pattern: "executionStatus:\\ OK",
  type: "executionStatusOK",
  color: "#00ffcc",
  description: ""
},
{
  name: "executionStatusOther",
  pattern: "executionStatus:\\ (?!OK)\\w+",
  type: "executionStatusOther",
  color: "#e64545f7",
  description: ""
},
{
  name: "libStatus:Done",
  pattern: "libStatus\\: Done",
  type: "libStatusDone",
  color: "#00ffcc",
  description: ""
},
{
  name: "libStatusOther",
  pattern: "libStatus\\: (?!Done)\\w+",
  type: "libStatusOther",
  color: "#e64545f7",
  description: ""
},
{
  name: "execution_result: SUCCESS",
  pattern: "execution_result\\: SUCCESS",
  type: "execution_result_SUCCESS",
  color: "#00ffcc",
  description: ""
},
{
  name: "execution_resultOther",
  pattern: "execution_result\\: (?!SUCCESS)\\w+",
  type: "execution_resultOther",
  color: "#e64545f7",
  description: ""
},
 {
    name: "prepareECUforMirrorFlash started",
    pattern: "prepareECUforMirrorFlash started.",
    type: "prepareECUforMirrorFlash started",
    color: "#bbf7d0"
  },
   {
    name: "There was an error during TAL execution, please check the log files.",
    pattern: "There was an error during TAL execution, please check the log files.",
    type: "There was an error during TAL execution, please check the log files.",
    color: "#bbf7d0"
  },
{
    name: "finalizeECUMirrorFlash finished",
    pattern: "finalizeECUMirrorFlash finished.",
    type: "finalizeECUMirrorFlash finished",
    color: "#bbf7d0"
  },
  {
    name: "TAL-Execution finished with status:",
    pattern: "TAL-Execution finished with status:.*$",
    type: "TAL-Execution finished with status:",
    color: "#bbf7d0"
  },
  {
    name: "finalizeECUMirrorFlash finished with error",
    pattern: "finalizeECUMirrorFlash finished with error.",
    type: "finalizeECUMirrorFlash finished with error",
    color: "#bbf7d0"
  },
{
  name: "MirrorProtocolPrepFailed",
  pattern: "^.*Mirror Protocol preparation failed for given ECU:\\s*(ECUId:[^\\s]+)\\s*with return code:\\s*(\\d{1,3}).*$",
  type: "MirrorProtocolPrepFailed",
  color: "#ffcccb",
  description: ((matches) => (parseInt(matches[2], 10).toString(16).toUpperCase().padStart(2, '0')))
},

]; }

  async parse(rawText) {
  await this.ready;
  
  if (typeof rawText !== 'string') {
    console.error('ERREUR: Donnée reçue non string:', rawText);
    throw new Error('rawText n\'est pas une chaîne de caractères');
  }
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
      } else if (rule.name === "Failures") {
        return this.processFailuresSection(line);
      } else if (rule.name === "Errors") {
        return this.processErrorsSection(line);
      } else if (rule.name === "warnings summary") {
        return this.processWarningsSection(line);
      } else if (rule.name === "short test summary info") {
        return this.processInfoSection(line);
      }
    }
    return this.processUnmatchedLine(line);
  }

  processTestCase(line, match) {
  const testCasePath = match[1];
  this.currentTestCase = testCasePath;

  const result = this.testCaseResults.get(testCasePath);
  if (result === "skipped") {
  this.skipCurrentTestCaseLogs = true;
  return null;
}
this.skipCurrentTestCaseLogs = false;

  const highlightType = result === "failed" ? "testcase-failed" : "testcase";
  const highlightTokens = this.detectHighlightsByType(line, highlightType);

  return new LogEntry({
    timestamp: "",
    level: "INFO",
    module: "",
    message: line,
    rawLine: line,
    category: "testcase",
    testCaseStatus: result,
    highlightTokens: highlightTokens,
    customColor: result === "failed" ? "#FF0000" : "#00AA00"
  });
}


  processDetailedLine(line, match) {
  if (this.skipCurrentTestCaseLogs) return null;

  const messageTokensRaw = this.detectHighlights(line);
  const messageTokens = messageTokensRaw.map(token => ({
    start: token.start,
    end: token.end,
    type: token.type,
    color: token.color,
    customDescription: token.customDescription || "",
  }));
  
  const category = this.determineCategory(messageTokensRaw);
  if (this.isfisec === true) {
    this.isfinalcontent = true;
  }
  return new LogEntry({
    timestamp: match[1],
    level: this.mapLevel(match[2]),
    module: match[3],
    message: match,
    rawLine: line,
    category: category,
    currentTestCase: this.currentTestCase,
    highlightTokens: messageTokens,
    isFinalSectionContent: this.isfinalcontent
  });

}


  processUnmatchedLine(line) {
    if (this.skipCurrentTestCaseLogs) return null;
    const highlightTokens = this.detectHighlights(line);
    const category = this.determineCategory(highlightTokens);
     if (this.isfisec === true) {
    this.isfinalcontent = true;
  }
    return new LogEntry({
      timestamp: "",
      level: "",
      module: "",
      message: line,
      category: category,
      currentTestCase: this.currentTestCase,
      highlightTokens: highlightTokens,
      isFinalSectionContent: this.isfinalcontent
    });
  }
  processFailuresSection(line) {
    this.isfisec=true;

    this.isfinalcontent=true;
    this.skipCurrentTestCaseLogs=false;
    const highlightTokens = this.detectHighlights(line);
    const category = "finalFAILURES";
    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: category,
      currentTestCase: null,
      highlightTokens: highlightTokens
    });
  }
  processErrorsSection(line) {
    this.isfisec=true;

    this.isfinalcontent = true;
    this.skipCurrentTestCaseLogs = false;
    this.currentTestCase = null;
    const highlightTokens = this.detectHighlights(line);
    const category = "finalERRORS";
    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: category,
      currentTestCase: null,
      highlightTokens: highlightTokens
    });
  }

  processWarningsSection(line) {
    this.isfisec=true;

    this.isfinalcontent=true;
    this.skipCurrentTestCaseLogs=false;
    this.currentTestCase=null;
    const highlightTokens = this.detectHighlights(line);
    const category = "finalWARNINGS";
    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: category,
      currentTestCase: null,
      highlightTokens: highlightTokens
    });
  }
  processInfoSection(line) {
            this.isfisec=true;

    this.skipCurrentTestCaseLogs=false;
    this.isfinalcontent=true;
    this.currentTestCase=null;
    const highlightTokens = this.detectHighlights(line);
    const category = "finalINFO";
    return new LogEntry({
      timestamp: "",
      level: "INFO",
      module: "",
      message: line,
      category: category,
      currentTestCase: null,
      highlightTokens: highlightTokens
    });
  }


  determineCategory(highlightTokens) {
  if (highlightTokens.some(t => t.type === "error")) return "error";
  if (highlightTokens.some(t => t.type === "negativeresponse")) return "negativeresponse";
  if (highlightTokens.some(t => t.type === "assertion")) return "assertion";
  if (highlightTokens.some(t => t.type === "exception")) return "exception";
  if (highlightTokens.some(t => t.type === "ECUReset")) return "ECUReset";
  if (highlightTokens.some(t => t.type === "ECUResetRES")) return "ECUResetRES";
  if (highlightTokens.some(t => t.type === "SinceBootReset")) return "SinceBootReset";
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
  if (highlightTokens.some(t => t.type === "Check pdx template version")) return "Check pdx template version";
  if (highlightTokens.some(t => t.type === "Importing PDX Container:")) return "Importing PDX Container:";
  if (highlightTokens.some(t => t.type === "Extracted VIN from FA file:")) return "Extracted VIN from FA file:";
  if (highlightTokens.some(t => t.type === "Check for cached signed NCDs")) return "Check for cached signed NCDs";
  if (highlightTokens.some(t => t.type === "Processed SVK:")) return "Processed SVK:";
  if (highlightTokens.some(t => t.type === "Read SVT before TAL execution started")) return "Read SVT before TAL execution started";
  if (highlightTokens.some(t => t.type === "Checking Mirror-Protocol started")) return "Checking Mirror-Protocol started";
  if (highlightTokens.some(t => t.type === "Status readSecureEcuMode:")) return "Status readSecureEcuMode:";
  if (highlightTokens.some(t => t.type === "Checking Programming Protection \"PLUS\" started")) return "Checking Programming Protection \"PLUS\" started";
  if (highlightTokens.some(t => t.type === "Checking Programming Protection \"BASIC\" started")) return "Checking Programming Protection \"BASIC\" started";
  if (highlightTokens.some(t => t.type === "TAL execution started.")) return "TAL execution started.";
  if (highlightTokens.some(t => t.type === "prepareECUforMirrorFlash started")) return "prepareECUforMirrorFlash started";
  if (highlightTokens.some(t => t.type === "Generating Tal for")) return "Generating Tal for";
  if (highlightTokens.some(t => t.type === "finalizeECUMirrorFlash finished")) return "finalizeECUMirrorFlash finished";
  if (highlightTokens.some(t => t.type === "E-Sys ecuMirrorDeploy TA started")) return "E-Sys ecuMirrorDeploy TA started";
  if (highlightTokens.some(t => t.type === "cleanup_esys_process")) return "cleanup_esys_process";
  if (highlightTokens.some(t => t.type === "DEBUG_PORT_AVAILABILITY")) return "DEBUG_PORT_AVAILABILITY";
  if (highlightTokens.some(t => t.type === "E-Sys ecuActivate TA started")) return "E-Sys ecuActivate TA started";
  if (highlightTokens.some(t => t.type === "E-Sys ecuPoll TA started")) return "E-Sys ecuPoll TA started";
  if (highlightTokens.some(t => t.type === "finalizeVehicleFlash finished")) return "finalizeVehicleFlash finished";
  if (highlightTokens.some(t => t.type === "finalizeVehicleCoding started")) return "finalizeVehicleCoding started";
  if (highlightTokens.some(t => t.type === "prepareVehicleForCoding started")) return "prepareVehicleForCoding started";
  if (highlightTokens.some(t => t.type === "MSM_checks summary report")) return "MSM_checks summary report";
  if (highlightTokens.some(t => t.type === "Your program receive_notification with data")) return "Your program receive_notification with data";
  if (highlightTokens.some(t => t.type === "ipcClientsResponse")) return "ipcClientsResponse";
  if (highlightTokens.some(t => t.type === "TAS-SIM")) return "TAS-SIM";
  if (highlightTokens.some(t => t.type === "E-Sys cdDeploy TA started")) return "E-Sys cdDeploy TA started";
  if (highlightTokens.some(t => t.type === "setup_dut_certif")) return "setup_dut_certif";
  if (highlightTokens.some(t => t.type === "itf.pybus_sim.basic_rbs")) return "itf.pybus_sim.basic_rbs";
  if (highlightTokens.some(t => t.type === "Send command: requestID:")) return "Send command: requestID:";
  if (highlightTokens.some(t => t.type === "executionStatusOK")) return "executionStatusOK";
  if (highlightTokens.some(t => t.type === "executionStatusOther")) return "executionStatusOther";
  if (highlightTokens.some(t => t.type === "libStatusDone")) return "libStatusDone";
  if (highlightTokens.some(t => t.type === "libStatusOther")) return "libStatusOther";
  if (highlightTokens.some(t => t.type === "execution_resultOther")) return "execution_resultOther";
  if (highlightTokens.some(t => t.type === "execution_result_SUCCESS")) return "execution_result_SUCCESS";
  if (highlightTokens.some(t => t.type === "prepareECUforMirrorFlash started")) return "prepareECUforMirrorFlash started";
  if (highlightTokens.some(t => t.type === "There was an error during TAL execution, please check the log files.")) return "There was an error during TAL execution, please check the log files.";
  if (highlightTokens.some(t => t.type === "finalizeECUMirrorFlash finished")) return "finalizeECUMirrorFlash finished";
  if (highlightTokens.some(t => t.type === "TAL-Execution finished with status:")) return "TAL-Execution finished with status:";
  if (highlightTokens.some(t => t.type === "finalizeECUMirrorFlash finished with error")) return "finalizeECUMirrorFlash finished with error";
  if (highlightTokens.some(t => t.type === "MirrorProtocolPrepFailed")) return "MirrorProtocolPrepFailed";
  return "standard";
}

 analyzeTestCases(lines) {
  let currentTestCase = null;
  let testCaseLines = [];

  for (const line of lines) {
    const testCaseMatch = line.match(/^([\w/\\.-]+\.py::[\w<>]+::[\w<>]+)\b/);

    if (testCaseMatch) {
      if (currentTestCase !== null) {
        
        this.testCaseResults.set(currentTestCase, this.hasTestFailed(testCaseLines));
      }

      currentTestCase = testCaseMatch[1];
      testCaseLines = [line];
    } else if (currentTestCase !== null) {
      
      testCaseLines.push(line);
    } else {
      
      if (line.includes("+++++++++ Timeout +++++++++")) {
        console.warn("⚠️ Timeout détecté hors test case. Ignoré :", line);
      }
    }
  }

  if (currentTestCase !== null) {
    this.testCaseResults.set(currentTestCase, this.hasTestFailed(testCaseLines));
  }
}

 hasTestFailed(lines) {
  const isSkipped = lines.some(line =>
    line.includes("setup result: skipped") || line.trim().startsWith("SKIPPED")
  );

  if (isSkipped) return "skipped";

  const hasFailure = lines.some(line => {
    const tokens = this.detectHighlights(line);
    const tokenFailure = tokens.some(t =>
      t.type === "assertion" || t.type === "exception"
    );

    const textFailure =
      line.includes("+++++++++ Timeout +++++++++")||
      line.includes("setup result: failed") ||
      line.includes("call result: failed") ||
      line.includes("teardown result: failed");

    return tokenFailure || textFailure;
  });

  return hasFailure ? "failed" : "passed";
}



 detectHighlights(text) {
  const tokens = [];
  for (const rule of this.highlightDefinitions) {
    try {
      const regex = new RegExp(rule.pattern, "gi");
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        let description = rule.description;
        if (rule.multiDescriptions && rule.subPatterns) {
          const descriptions = [];
          rule.subPatterns.forEach(subPattern => {
            const capturedValue = match[subPattern.captureGroup];
            if (capturedValue && subPattern.descriptions[capturedValue.toUpperCase()]) {
              descriptions.push(`${subPattern.name}: ${subPattern.descriptions[capturedValue.toUpperCase()]}`);
            }
            
          });
          if (descriptions.length > 0) {
            description = descriptions.join(' | ');

          }
        }

        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.type,
          color: rule.color,
          customDescription: description 
        });
      }
    } catch (e) {
      console.error("Erreur regex:", rule.pattern, e);
    }
  }
  
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

export function buildCollapseMap(entries) {
  const collapsedTestCases = {};
  const collapsedSections  = {};
  entries.forEach((e, idx) => {
    if (e.isTestCase) {
      collapsedTestCases[idx] = true;
      collapsedSections[idx]  = { setup: true, call: true, teardown: true };
    }
  });
  return { collapsedTestCases, collapsedSections };
}

export function buildFinalSections(entries) {
  const out = { finalFAILURES: [], finalERRORS: [], finalWARNINGS: [], finalINFO: [] };
  let cur = null;
  for (const e of entries) {
    if (e.category === "finalFAILURES") { 
      cur = "finalFAILURES"; 
      e.isFinalSection = true;
      e.currentTestCase=null;
      e.parentTestCase=null;
      continue; 
    }
    if (e.category === "finalERRORS") { 
      cur = "finalERRORS";   
      e.isFinalSection = true;
      e.currentTestCase=null;
      e.parentTestCase=null;
      continue; 
    }
    if (e.category === "finalWARNINGS") { 
      cur = "finalWARNINGS"; 
      e.isFinalSection = true;
      e.currentTestCase=null;
      e.parentTestCase=null;
      continue; 
    }
    if (e.category === "finalINFO") { 
      cur = "finalINFO"; 
      e.isFinalSection = true;
      e.currentTestCase=null;
      e.parentTestCase=null;
      continue; 
    }

    if (cur) {
      e.isFinalSectionContent = true;
      e.currentTestCase=null;
      e.parentTestCase=null;
      e.parentFinalSection = cur;
      out[cur].push(e);
    }
  }
  return out;
}

export function flagSectionsAndParents(entries) {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    e.section        = getSectionName(e.rawLine || e.message);
    e.hasFailure     = isFailureLine(e.rawLine || e.message);
    e.parentTestCase = findParentTestCaseName(e, entries, i);
  }
}

export function buildFailuresIndex(entries) {
  const map = new Map();          
  const re = /([\w/]+\.py)::(\w+)/;
  entries.forEach((e, idx) => {
    if (!e.hasFailure) return;
    const m = (e.rawLine || e.message).match(re);
    if (!m) return;
    const key = m[2];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(idx);
  });
  return Object.fromEntries(map);
}
export function buildSubEntriesByTcIdx(entries) {
  const map = {};
  let currentTcIdx = null;
  let currentSection = null;
  let currentLines = [];

  // États pour la détection de blocs
  let insideIsoc = false;
  let isocBuffer = [];
  let insideReset = false;
  let resetBuffer = [];

  const flushCurrentSection = () => {
    if (currentSection && currentLines.length) {
      if (!map[currentTcIdx]) map[currentTcIdx] = [];
      map[currentTcIdx].push({
        section: currentSection,
        lines: [...currentLines],
        hasFailure: currentLines.some(l => l.hasFailure)
      });
      currentLines = [];
    }
  };

  const resetContentPattern = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[INF\] \[\/dev\/ttyUSB_SIPDBG_02\]/;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const msg = String(e.message || '');

    // Détection de test case
    if (e.isTestCase) {
      if (insideIsoc) {
        currentLines.push({ isIsocBlock: true, lines: [...isocBuffer] });
        isocBuffer = [];
        insideIsoc = false;
      }
      if (insideReset) {
        currentLines.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
        resetBuffer = [];
        insideReset = false;
      }
      flushCurrentSection();

      currentTcIdx = i;
      currentSection = null;
      currentLines = [];
      map[currentTcIdx] = [];
      continue;
    }

    if (currentTcIdx === null) continue;

    // Détection de final section
    if (typeof e.isFinalSection === "function" ? e.isFinalSection() : e.isFinalSection) {
      if (insideIsoc) {
        currentLines.push({ isIsocBlock: true, lines: [...isocBuffer] });
        isocBuffer = [];
        insideIsoc = false;
      }
      if (insideReset) {
        currentLines.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
        resetBuffer = [];
        insideReset = false;
      }
      flushCurrentSection();

      currentTcIdx = null;
      currentSection = null;
      currentLines = [];
      continue;
    }

    // ----- iSOC logic -----
    if (
      msg.includes('***Start: iSOC Status Check before Test Setup***') ||
      msg.includes('***Start: iSOC Status Check after Test Teardown and peform corrective action if needed***')
    ) {
      insideIsoc = true;
      e.isFoldableHeader = true;
      isocBuffer = [e];
      continue;
    }

    if (
      /End:\s*iSOC Status Check before Test Setup.*\*\*\*/.test(msg) ||
      /End:\s*iSOC Status Check after Test Teardown.*\*\*\*/.test(msg)
    ) {
      insideIsoc = false;
      isocBuffer.push(e);
      currentLines.push({ isIsocBlock: true, lines: [...isocBuffer] });
      isocBuffer = [];
      continue;
    }

    if (insideIsoc) {
      // Reset start inside iSOC
      if (!insideReset && msg.includes('Since Boot(Power On Reset)') && /\[\/dev\/ttyUSB_SIPDBG_02\]/.test(msg)) {
        insideReset = true;
        e.isFoldableHeader = true;
        resetBuffer = [e];
        continue;
      }

      if (insideReset) {
        const endReset = msg.trim() === '' || e.isTestCase || (typeof e.isFinalSection === "function" ? e.isFinalSection() : e.isFinalSection);
        if (endReset) {
          insideReset = false;
          isocBuffer.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
          resetBuffer = [];

          if (!(e.isTestCase || (typeof e.isFinalSection === "function" ? e.isFinalSection() : e.isFinalSection)) && msg.trim() !== '') {
            isocBuffer.push(e);
          }
          continue;
        }

        if (resetContentPattern.test(msg)) {
          resetBuffer.push(e);
          continue;
        }

        insideReset = false;
        isocBuffer.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
        resetBuffer = [];
        isocBuffer.push(e);
        continue;
      }

      isocBuffer.push(e);
      continue;
    }
    // ----- end iSOC logic -----

    // ----- Reset logic outside iSOC -----
    if (!insideReset && msg.includes('Since Boot(Power On Reset)') && /\[\/dev\/ttyUSB_SIPDBG_02\]/.test(msg)) {
      insideReset = true;
      e.isFoldableHeader = true;
      resetBuffer = [e];
      continue;
    }

    if (insideReset) {
      const endReset = msg.trim() === '' || e.isTestCase || (typeof e.isFinalSection === "function" ? e.isFinalSection() : e.isFinalSection);
      if (endReset) {
        insideReset = false;
        currentLines.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
        resetBuffer = [];

        if (!(e.isTestCase || (typeof e.isFinalSection === "function" ? e.isFinalSection() : e.isFinalSection)) && msg.trim() !== '') {
          currentLines.push(e);
        }
        continue;
      }

      if (resetContentPattern.test(msg)) {
        resetBuffer.push(e);
        continue;
      }

      insideReset = false;
      currentLines.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
      resetBuffer = [];
      currentLines.push(e);
      continue;
    }
    // ----- end Reset logic -----

    // Gestion des sections
    const sec = e.section;
    if (sec && sec !== currentSection) {
      flushCurrentSection();
      currentSection = sec;
      currentLines = [e];
    } else {
      currentLines.push(e);
    }
  }

  if (currentTcIdx !== null) {
    if (insideIsoc) {
      currentLines.push({ isIsocBlock: true, lines: [...isocBuffer] });
    }
    if (insideReset) {
      currentLines.push({ isResetBlock: true, lines: [...resetBuffer], isFoldableHeader: true });
    }
    flushCurrentSection();
  }

  return map;
}

function getSectionName(line = "") {
  const msg = line.toLowerCase();
  if (msg.includes('live log setup'))   return 'setup';
  if (msg.includes('live log call'))    return 'call';
  if (msg.includes('live log teardown')) return 'teardown';
  return null;
}

function isFailureLine(line = "") {
  const triggers = [
    "setup result: failed",
    "call result: failed",
    "teardown result: failed"
  ];
  return triggers.some(t => line.includes(t));
}

function findParentTestCaseName(entry, entries, idx) {
  for (let i = idx; i >= 0; i--) {
    if (entries[i].isTestCase) {
      const parts = entries[i].message.split('::');
      return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    }
  }
  return "Unknown Test Case";
}