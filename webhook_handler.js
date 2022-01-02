const { STACK_TRACE_LINE_REGEX_INDEX_STACK_TRACE_LINE_ONLY } = require("./journalctl_parser");
const FormData                                               = require("form-data");
const axios                                                  = require("axios");

/**
 * Send the event to a Discord webhook URL
 *
 * @param webhookUrl {string}
 * @param serviceName {string}
 * @param stackTrace {array|null}
 * @param exception {object|null}
 * @param journalctlOutput {string}
 * @param includeAttachment {boolean}
 * @returns {Promise<void>}
 */
async function sendToDiscordWebhook(webhookUrl, serviceName, stackTrace, exception, journalctlOutput, includeAttachment = false) {
    let stackTraceJoined              = "*unavailable*";
    let stackTraceExceptionLine       = "*unavailable*";
    let stackTraceExceptionLineNumber = null;

    if (Array.isArray(stackTrace)) {
        stackTraceJoined = stackTrace.map((stackTraceLine) => stackTraceLine[STACK_TRACE_LINE_REGEX_INDEX_STACK_TRACE_LINE_ONLY]).join("\n\n");
    }

    if (exception) {
        stackTraceExceptionLine       = exception.exceptionLine;
        stackTraceExceptionLineNumber = exception.exceptionLineNumber;
    }

    const data = {
        "embeds": [
            {
                "title": `Service "${serviceName}" failed`,
                "color": 16711680,
                "fields": [
                    {
                        "name": `Exception line ${stackTraceExceptionLineNumber !== null ? `(log line #${stackTraceExceptionLineNumber})` : ""}`,
                        "value": stackTraceExceptionLine,
                        "inline": false
                    },
                    {
                        "name": `Last stack trace ${stackTraceJoined.length > 1024 ? '(trimmed - last 1024 characters)' : ''}`,
                        "value": stackTraceJoined.substr(stackTraceJoined.length - 1024),
                        "inline": false
                    },
                    {
                        "name": `Service log ${journalctlOutput.length > 1024 ? '(trimmed - last 1024 characters)' : ''}`,
                        "value": journalctlOutput.substr(journalctlOutput.length - 1024),
                        "inline": false
                    }
                ]
            }
        ]
    };

    const formData = new FormData();
    formData.append("payload_json", JSON.stringify(data));

    if (includeAttachment) {
        formData.append("files[0]", journalctlOutput, "journalctl_output.txt");

        if (Array.isArray(stackTrace)) {
            formData.append("files[1]", stackTraceJoined, "stack_trace.txt");
        }
    }


    await axios.post(webhookUrl, formData, { headers: formData.getHeaders() })
               .catch((err) => {
                   console.error(err);
                   console.log("Unable to send notification, please check the error given above for more information.");

                   process.exit();
               });
}

module.exports = {
    sendToDiscordWebhook
};
