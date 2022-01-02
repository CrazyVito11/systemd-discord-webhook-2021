// Index meaning for each stack trace line regex match
const STACK_TRACE_LINE_REGEX_INDEX_FULL_LINE             = 0;
const STACK_TRACE_LINE_REGEX_INDEX_STACK_TRACE_LINE_ONLY = 1;


/**
 * Get the stack trace from the journalctl command output
 *
 * @param journalctlOutput {string}
 * @param stackTraceConfig {object}
 * @param stackTraceBlockDetection {boolean}
 * @returns {array|null}
 */
function getStackTraceFromOutput(journalctlOutput, stackTraceConfig, stackTraceBlockDetection = true) {
    if (!stackTraceConfig) {
        return null;
    }

    const rawStackTraceLines = Array.from(journalctlOutput.matchAll(stackTraceConfig.stackTraceLineRegex));
    let stackTraceLines      = rawStackTraceLines;

    if (stackTraceBlockDetection) {
        let stackTraceBlobs = [];
        let blobIndex       = 0;

        for(let stackTraceLineIndex = 0; stackTraceLineIndex < rawStackTraceLines.length; stackTraceLineIndex++) {
            const stackTraceLine         = rawStackTraceLines[stackTraceLineIndex];
            const previousStackTraceLine = rawStackTraceLines[stackTraceLineIndex - 1];

            if (previousStackTraceLine) {
                const lineNumberCurrentStackTraceLine  = lineOf(journalctlOutput, stackTraceLine[STACK_TRACE_LINE_REGEX_INDEX_FULL_LINE]);
                const lineNumberPreviousStackTraceLine = lineOf(journalctlOutput, previousStackTraceLine[STACK_TRACE_LINE_REGEX_INDEX_FULL_LINE]);

                if (lineNumberCurrentStackTraceLine !== (lineNumberPreviousStackTraceLine + 1)) {
                    blobIndex++;
                }
            }

            if (!stackTraceBlobs[blobIndex]) {
                stackTraceBlobs[blobIndex] = [];
            }

            stackTraceBlobs[blobIndex].push(stackTraceLine);
        }


        // Use the most recent stack trace blob
        stackTraceLines = stackTraceBlobs[stackTraceBlobs.length - 1];
    }

    return stackTraceLines;
}

/**
 * Get the exception from the journalctl command output
 *
 * @param journalctlOutput {string}
 * @param stackTraceConfig {object}
 * @param stackTraceBlockDetection {boolean}
 * @returns {object|null}
 */
function getExceptionFromOutput(journalctlOutput, stackTraceConfig, stackTraceBlockDetection = true) {
    if (!stackTraceConfig) {
        return null;
    }

    const stackTrace = getStackTraceFromOutput(journalctlOutput, stackTraceConfig, stackTraceBlockDetection);

    if (!stackTrace || !Array.isArray(stackTrace)) {
        return null;
    }

    const exceptionLineNumber = lineOf(journalctlOutput, stackTrace[0][STACK_TRACE_LINE_REGEX_INDEX_FULL_LINE]);
    const exceptionLine       = journalctlOutput.split("\n")[exceptionLineNumber - 1];

    return {
        exceptionLineNumber,
        exceptionLine
    };
}


/**
 * Find the line number of a string in another string (-1 if no results)
 *
 * @param text {string}
 * @param substring {string}
 * @returns {number}
 */
function lineOf(text, substring) {
    let line         = 0;
    let matchedChars = 0;

    for(let i = 0; i < text.length; i++) {
        text[i] === substring[matchedChars] ? matchedChars++ : matchedChars = 0;

        if (matchedChars === substring.length) {
            return line;
        }
        if (text[i] === '\n') {
            line++;
        }
    }

    return -1;
}

module.exports = {
    STACK_TRACE_LINE_REGEX_INDEX_FULL_LINE,
    STACK_TRACE_LINE_REGEX_INDEX_STACK_TRACE_LINE_ONLY,
    getStackTraceFromOutput,
    getExceptionFromOutput
};
