module.exports = (config) => {
    const moment = require('moment-timezone');
    moment.tz.setDefault('0');
    const notFound = (res) => {
        res.status(404).render('not_found');
    };
    const {Git} = require('../modules/git');
    const fileType = require('file-type');
    const git = new Git({
        pwd: config.pwd,
    });
    const appConfig = {
        app: {
            name: config.name,
        },
    };
    return (req, res) => {
        const [ref] = Object.values(req.params);
        let [_, path] = Object.values(req.params).slice(1);
        path = (path || './');
        git.open(`${ref}:${path}`)
            .then(async (data) => {
                let commitInfo = (await git.log(ref, ['-1'])).pop().info;
                let date = commitInfo.author.date.split(' ');
                commitInfo.author.date = moment.unix(Number.parseInt(date[0]))
                    .utcOffset(moment(date[1], 'ZZ').utcOffset())
                    .format(config.dateFormat);
                let breadcrumbs = [];
                path.split('/')
                    .filter((s) => s)
                    .forEach((p, i, arr) => {
                        if (i === arr.length - 1) {
                            breadcrumbs.push({
                                title: p,
                            });
                            return;
                        }
                        breadcrumbs.push({
                            title: p,
                            href: `/${ref}:./${arr.slice(0, i + 1).join('/')}/`
                                .replace(/:\.$/, ':'),
                        });
                    });
                path = path.split('/').slice(0, -1).join('/') + '/';
                const _isFile = data instanceof Buffer;
                let _isImage = false;
                let _contains = _isFile ? data.toString() : [];
                let _type = {mime: ''};
                if (_isFile) {
                    _type = fileType(data) || {mime: ''};
                    if (
                        _type.mime && ['jpeg', 'png', 'webm']
                            .includes(_type.ext)
                    ) {
                        _contains = data.toString('base64');
                        _isImage = true;
                    }
                } else {
                    _contains = [{
                        name: '..',
                        isDir: true,
                        href: `/${ref}:` + path.split('/')
                            .filter((s) => s && s !== '.')
                            .slice(0, -1).join('/'),
                    }].concat(data.map((f) => Object.assign(f, {
                        href: f.href || `/${ref}:${path}${f.name}` +
                        (f.isDir ? '/' : ''),
                    })));
                }
                let branches = (await git.branches())
                    .map((b) => {
                        return {
                            name: b,
                            href: `/${b}`,
                            isActive: b.toString()
                                .toLowerCase() === ref.toLowerCase()
                            || (b.toString()
                                .toLowerCase() === 'master'
                            && ref.toLowerCase() === 'head'),
                        };
                    });
                let commits = (await git.log(ref))
                    .map((c) => {
                        const info = c.info;
                        return {
                            name: info.subject,
                            href: `/${info.abbreviated_commit}`,
                            isActive: info.abbreviated_commit
                                .toLowerCase() === ref.toLowerCase(),
                            abbr: info.abbreviated_commit,
                        };
                    });
                res.render('index', Object.assign({
                    contents: _contains,
                    directory: !_isFile,
                    blob: _isFile,
                    isImage: _isImage,
                    mime: _type.mime,
                    commits,
                    commitInfo,
                    branches,
                    breadcrumbs,
                }, appConfig));
            })
            .catch((e) => {
                console.log(e);
                notFound(res);
            });
    };
};
