# Agile Gitlab CE

[![Launch Repo Now](https://img.shields.io/badge/gh--pages-Launch%20Now!-ff69b4.svg?maxAge=2592000)](https://lilyheart.github.io/agile-gitlabce/)

This project is to fill in the missing gaps regarding the Agile workflow in a CE Gitlab installation.

<!-- [![Gitter](https://img.shields.io/gitter/room/Lilyheart/repo.js.svg?maxAge=2592000)](https://gitter.im/Lilyheart/LilyPrograms) [![GitHub issues](https://img.shields.io/github/issues/Lilyheart/repo.svg?maxAge=2592000)](https://github.com/Lilyheart/repo/issues) [![license](https://img.shields.io/github/license/Lilyheart/repo.svg?maxAge=2592000)](https://github.com/Lilyheart/repo/blob/gh-pages/LICENSE) -->

## Deployed

The website is deployed [here](https://lilyheart.github.io/agile-gitlabce/) on GitHub pages.

## To code

- [x] Report by milestone
- [x] Add [Progress Bar](https://getbootstrap.com/docs/4.1/components/progress/) for loading issues and burndown.
- [ ] Fix the [API Tooltip](https://getbootstrap.com/docs/4.1/components/tooltips/)
- [x] Handle issues that used `/remove_time_spent `
- [x] Handle issues that used `/remove_estimate `

- [ ] Reduce issueListArr and JSON to just issueList
- [x] Recode restart() to actually reset the code while keeping the API key (i.e. not reloading the entire page)
- [ ] Determine if there is a better way to handle start/end dates?
- [x] Change tick level of x axis if to many dates to display
- [ ] [Update](https://getbootstrap.com/docs/4.1/components/input-group/) Input fields
- [x] Change to [OAuth](https://docs.gitlab.com/ee/api/oauth2.html)

## To decide

- [ ] Handle issues w/ spend and no estimate?
- [ ] Handle issues w/ more spend than estimate?
- [ ] Handle issues with spend dates outside of milestone

## Usage

TODO: Write usage instructions

## Contributing :revolving_hearts:

Not current accepting pull requests.

<!-- 1. Fork the repo
2. Create a branch for the feature: `git checkout -b new-feature-name`
3. Commit: `git commit -am 'Add a cool thing'`
4. Push to the branch: `git push origin new-feature-name`
5. Submit a pull request -->

## History

TODO: Write history

## Credits

TODO: Write credits

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
