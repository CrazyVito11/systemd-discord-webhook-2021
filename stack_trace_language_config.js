/*
    This file is responsible for hosting the configuration on how to read the stack traces of different programming languages.
    To add support for another programming language, you'll have to configure it here in order to read the stack trace and exception.


    ---[ Configuration meaning ]---

    stackTraceLineRegex
        The regex that is responsible for finding the stack trace lines
        Regex result should be
            match = whole line, capture group = stack trace line
        Because the application will read it like this
            stackTraceLine = [string, string]
                stackTraceLine[0] = whole line
                stackTraceLine[1] = stack trace line

    stackTraceBlockDetection
        Search for stack trace blobs in order to get the most recent stack trace
        Returns all rows of all stack traces if this is disabled
 */


module.exports = {
    js: {
        stackTraceLineRegex: /^.*\    at (.*)$/mg,
        stackTraceBlockDetection: true,
    }
};
