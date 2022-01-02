const { promisify }                                       = require('util');
const validUrl                                            = require('valid-url');
const execPromised                                        = promisify(require('child_process').exec);
const { program }                                         = require('commander');
const { getStackTraceFromOutput, getExceptionFromOutput } = require('./journalctl_parser');
const { sendToDiscordWebhook }                            = require('./webhook_handler');
const stackTraceLanguageConfigs                           = require('./stack_trace_language_config');

program
    .argument("service name", "The name of the service that you want to use")
    .argument("webhook URL", "The Discord webhook URL where the message needs to be send")
    .option("-i, --include-attachment", "Include full stack trace and journalctl log as attachment")
    .option("-l, --language <language>", "The programming language stack trace format to read")
    .parse(process.argv);

const startupOptions = program.opts();


// Only allow service names that match this regex
const validServiceNameRegex = /^[a-zA-Z0-9\-_]*$/;


const serviceName         = program.args[0];
const webhookUrl          = program.args[1];
const includeAttachment   = !!startupOptions.includeAttachment;
const programmingLanguage = startupOptions.language;
const stackTraceConfig    = stackTraceLanguageConfigs[programmingLanguage];

if (process.platform !== "linux") {
    console.error("Sorry, this application only works on Linux...");

    process.exit();
}

if (!serviceName || !webhookUrl) {
    console.error("Missing service name or webhook url parameter");

    process.exit();
}

if (!validServiceNameRegex.test(serviceName)) {
    console.error(`The given service name "${serviceName}" is not allowed\n\nThe service name must pass this regex\n  ${validServiceNameRegex}`);

    process.exit();
}

if (!validUrl.isUri(webhookUrl)) {
    console.error("The given webhook URL doesn't seem like a valid URL.");

    process.exit();
}

if (!programmingLanguage) {
    console.warn("No programming language is selected, the stack trace and exception won't be parsed!");
}

if (programmingLanguage && !stackTraceConfig) {
    console.warn(`The given programming language "${programmingLanguage}" is not supported, the stack trace and exception won't be parsed!`);
}


(async() => {
    const commandOutput    = await execPromised(`journalctl --unit=${serviceName} -n 99999 --no-pager`);
    const journalctlOutput = commandOutput.stdout;

    const stackTrace = getStackTraceFromOutput(journalctlOutput, stackTraceConfig, stackTraceConfig?.stackTraceBlockDetection);
    const exception  = getExceptionFromOutput(journalctlOutput, stackTraceConfig, stackTraceConfig?.stackTraceBlockDetection);

    await sendToDiscordWebhook(webhookUrl, serviceName, stackTrace, exception, journalctlOutput, includeAttachment);

    console.log("The event has been send to Discord");
})();
