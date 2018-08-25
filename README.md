# rainier-ui

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Install Dependencies

Please refer to the readme in ui/shasta

http://git.mcp.com/ui/shasta

Run `gem install compass`

## Build & development

Run `grunt` for building.

Run `grunt serve --proxy-host=localhost --proxy-use-https=true` for preview with a local rainier server.

Run `grunt servemock` for preview with ui mock data.

Run `grunt serve:dist --proxy-host=<somewhere> --proxy-use-https=true --allow-remote` for testing IE.

## Testing

Running `grunt test` will run the unit tests with karma.

Running `grunt jshint` will run the jshint to analyze code.

## Branding

Run 'grunt brand' to list all supported brands.
Run 'grunt switch-brand --brand ${brandName}' to switch brand to the wanted brand.
After switch to wanted brand, run 'grunt serve' or 'grunt servemock' to run UI.
Before checkin, always switch to default brand.

## Troubleshooting
When running 'grunt serve' it gets stuck in the 'Running "watch" task' loop:
Run the following command to increase the max number of watches:
$ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
