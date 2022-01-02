# systemd-discord-webhook-2021
NodeJS application that pushes failed systemd services to Discord.

## Startup parameters
Run `node main.js --help` to see all the supported parameters and what they exactly do.

## Supported programming languages
- Javascript (NodeJS)

> Any systemd service will work with this application, but it won't show the stack trace and exception in the Discord message.
> You can add support for another language in `stack_trace_language_config.js`.

## Implementation example
```sh
# The names and paths we used in this example, edit this example to match your setup
#
# Service name
#     cool-application-service
#
# NodeJS runtime path
#     /home/user/.nvm/versions/node/v14.18.2/bin/node
#
# Project location
#     /home/user/projects/cool-application/
#
# Project startup script path
#     /home/user/projects/cool-application/start_application.sh
#
# Systemd-discord-webhook path
#     /home/user/projects/systemd-discord-webhook-2021/main.js
#
# Discord Webhook URL
#     https://discordapp.com/api/webhooks/XXXXXXXXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


[Unit]
Description="Our cool NodeJS application that processes stuff in the background"

[Service]
WorkingDirectory=/home/user/projects/cool-application/
ExecStart=/home/user/projects/cool-application/start_application.sh

Restart=on-failure
RestartSec=5s

# Pay attention to this line, this is where you call the systemd-discord-webhook application to send the notification
ExecStopPost=/bin/sh -c "if [ $$EXIT_STATUS != 0 ]; then /home/user/.nvm/versions/node/v14.18.2/bin/node /home/user/projects/systemd-discord-webhook-2021/main.js cool-application-service https://discordapp.com/api/webhooks/XXXXXXXXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --language js; fi"


[Install]
WantedBy=default.target
```
