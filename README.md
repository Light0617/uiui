# rainier-ui

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Install Dependencies

Please refer to the readme in ui/shasta

http://git.mcp.com/ui/shasta

## Build & development

Run `grunt` for building and `grunt serve` for preview.

Run `grunt servemock` for preview with ui mock data.

## Testing

Running `grunt test` will run the unit tests with karma.

## Branding

Run 'grunt brand' to list all supported brands.
Run 'grunt switch-brand --brand ${brandName}' to switch brand to the wanted brand.
After switch to wanted brand, run 'grunt serve' or 'grunt servemock' to run UI.
Before checkin, always switch to default brand.

## Troubleshooting
When running 'grunt serve' it gets stuck in the 'Running "watch" task' loop:
Run the following command to increase the max number of watches:
$ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
