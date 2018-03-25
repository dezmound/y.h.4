const {spawn} = require('child_process');
const util = require('util');
const path = require('path');
const StreamCollector = require('../../utils/StreamCollector');

const GitCodes = {
    OK: 0x0,
    ERR: 0x1,
};

const logFormat = `
{
"commit": "%H",
"abbreviated_commit": "%h",
"refs": "%D",
"subject": "%s",
"body": "%b",
"author": {
        "name": "%aN",
        "email": "%aE",
        "date": "%ad"  
    },
"commiter": {
        "name": "%cN",
        "email": "%cE",
        "date": "%cd" 
     }
},`.replace(/\s+/g, '');

/**
 * Преобразует метод класса, для работы на Promise вместо callback.
 * @param {Object} object
 * @param {function} method
 * @param {string} [methodName] Лучше задавать явно, например,
 * в случае если передается лямда-функция.
 * @return {*|any}
 */
const promisifyMethod = (object, method, methodName = '') => {
    method[util.promisify.custom] = (..._args) => {
        return new Promise((resolve) => {
            object[method.name || methodName](
                ..._args, (...args) => resolve(...args)
            );
        });
    };
    return util.promisify(method).bind(object);
};

/**
 * Возвращает промис для bash команды.
 * @param {Array<*>} args
 * @return {Promise<*>}
 */
const getCommandPromise = (args) => {
    const _process = spawn(...args);
    const _promisified = promisifyMethod(_process, _process.on);
    const _promisifiedData = (new StreamCollector(_process.stdout)).promise;
    const _promisifiedErr = promisifyMethod(
        _process.stderr, _process.stderr.on, 'on'
    );
    return Promise.all([
        Promise.race([
            _promisifiedData,
            _promisifiedErr('data'),
        ]),
        _promisified('exit'),
    ]);
};

/**
 * Исключение, возникающае при работе модуля git.
 */
class GitError extends Error {
    /**
     * Конструктор исключения Git.
     * @param {Array<string>} args
     */
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, GitError);
        this.name = 'Git Error:';
        this.message = args[0];
    }
}

/**
 * Предоставляет интерфейс к управлению локальным репозиторием git.
 */
class Git {
    /**
     * Конструктор класса.
     * @param {Object} [options] Первичная конфигурация.
     */
    constructor(options) {
        this._options = Object.assign({
            pwd: path.resolve(__dirname),
            git: 'git',
            getCommandPromise,
        }, options);
        this._pwd = this._options.pwd;
        this._git = this._options.git;
        this._getCommandPromise = this._options.getCommandPromise;
    }

    /**
     * Возвращает опции для локального git репозитория.
     * @return {Object}
     */
    get options() {
        return this._options;
    }

    /**
     * Инициализуерт в директории пустой репозиторий.
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<boolean>}
     */
    async init(flags = []) {
        const _process = spawn(this._git, ['init', ...flags], {
            cwd: this._pwd,
        });
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Делает комит в локальный git репозиторий.
     * @param {string} commitTitle Заголовок комита
     * @param {string} commitMessage Сообщение
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<boolean>}
     */
    async commit(commitTitle, commitMessage, flags = []) {
        const _process = spawn(this._git, [
            'commit',
            '-m',
            `${commitTitle}\n\n${commitMessage}`,
            ...flags,
        ], {
            cwd: this._pwd,
        });
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Добавляет файлы, переданные в строке к текущему состоянию.
     * @param {Array<string>|string} names
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<void>}
     */
    async add(names, flags = []) {
        names = typeof names === 'string' ? [names] : names;
        const _process = spawn(this._git, ['add', ...names, ...flags], {
            cwd: this._pwd,
        });
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Запращивает статус репозитория
     * @throws {GitError} В случае если репозиторий не инициализирован
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<string>}
     */
    async status(flags = []) {
        return this._getCommandPromise([this._git, [
            '--no-pager', 'status', ...flags,
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString();
            }
            throw new GitError('Ошибка при проверке статуса: ' + data);
        });
    }

    /**
     * Возвращает имя текущей ветки. Если передан параметер,
     * переключится на эту ветку.
     * @param {string|undefined} [branch] Имя ветки на которую
     * нужно переключится.
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<string>}
     * @throws {GitError}
     */
    async branch(branch, flags = []) {
        if (branch !== undefined) {
            return this.checkout(branch, flags);
        }
        return this._getCommandPromise([this._git, [
            '--no-pager', 'branch', ...flags,
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString().split(/[\n\r]+/ig).filter((s) => {
                    return s.indexOf('*') >= 0;
                }).pop().replace(/^[*\s]+|[*\s]+$/g, '');
            }
            throw new GitError('Ошибка при получении ветки: ' + data);
        });
    }

    /**
     * Возвращает список веток в формате объекта.
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<Array<GitBranch>>}
     */
    async branches(flags = []) {
        return this._getCommandPromise([this._git, [
            '--no-pager', 'branch', ...flags,
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString()
                    .split(/[\n\r]+/ig)
                    .filter((s) => s)
                    .map((s) => {
                        return s.replace(/^[*\s]+|[*\s]+$/g, '');
                    });
            }
            throw new GitError('Ошибка при получении списка веток: ' + data);
        });
    }

    /**
     * Переключает HEAD на указанную ветку/комит.
     * @param {GitRef|string} where Имя ветки/комита.
     * @param {Array<string>} [flags] Флаги
     * @throws {GitError} В случае если не удалось переключить HEAD.
     * @return {Promise<string>}
     */
    async checkout(where, flags = []) {
        const _oldBranch = await this.branch();
        return this._getCommandPromise([this._git, [
            'checkout', ...flags, where.toString(),
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK && data.toString().indexOf(where) >= 0) {
                return _oldBranch;
            }
            throw new GitError('Ошибка при переключении HEAD: ' + data);
        });
    }

    /**
     * Возвращает историю коммитовв формате объектов.
     * @param {String} path Выводит историю коммитов по заданному пути.
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<Array<GitCommit>>}.
     */
    async log(path = 'HEAD', flags = []) {
        return this._getCommandPromise([this._git, [
            '--no-pager', 'log', `--pretty=format:${logFormat}`,
            '--date=raw',
            path, ...flags, '--',
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return JSON.parse(`[${
                    data.toString()
                        .trim()
                        .replace(/([\n\r]+)/g, '')
                        .replace(/,+$/g, '')
                    }]`).map((c) => new GitCommit(c));
            }
            throw new GitError(
                'Ошибка при получении истории комитов: ' + data
            );
        });
    }

    /**
     * Возвращает структуру файловой системы по ссылке.
     * @param {GitRef|string} ref
     * @param {string} root Корень текущей директории относительно ссылки ref.
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<Array<GitFile>>}
     */
    async fileStructure(ref = 'HEAD', root='/', flags = []) {
        return this._getCommandPromise([this._git, [
            '--no-pager', 'ls-tree', '--name-only',
            `${ref.toString()}:${root.replace(/^\//, '')}`,
            ...flags,
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return Promise.all(data.toString()
                    .trim()
                    .split(/[\n\r]+/g)
                    .filter((s) => s)
                    .map(async (s) => {
                        let _isDir =
                            (await
                                this.thisIs(`${ref}:${root}${s}`)
                            ) === 'tree';
                        return GitFile.parse(`${ref}:${root}${s}`, _isDir);
                    }));
            }
            throw new GitError(
                'Ошибка при получении списка файлов: ' + data
            );
        });
    }

    /**
     * Возвращает содержимое объекта.
     * @param {GitRef|string} ref
     * @param {Array<string>} [flags] Флаги
     * @return {Promise<Buffer>}
     */
    async contents(ref, flags = []) {
        return this._getCommandPromise([this._git, [
            '--no-pager', 'cat-file', '-p', ref.toString(),
            ...flags,
        ], {
            cwd: this._pwd,
        }]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data;
            }
            throw new GitError(
                'Ошибка при получении содержимого файлов: ' + data
            );
        });
    }

    /**
     * Возвращает тип ссылки.
     * @param {GitRef|string} ref
     * @return {Promise<string>} tree|blob|commit
     */
    async thisIs(ref) {
        ref = ref.toString()
            .replace(/^(\/+)|(\:)+$/g, '')
            .replace(/:\.?\//, ':');
        return this._getCommandPromise([this._git, [
            '--no-pager', 'cat-file', '-t', ref,
        ], {
            cwd: this._pwd,
        }]).then(async ([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString().trim();
            }
            throw new GitError(
                'Ошибка при получении типа ссылки: ' + data
            );
        });
    }

    /**
     * Возвращает содержимое файла/директории
     * @param {GitRef|string} ref
     * @return {Promise<Array<GitFile>|Buffer>}
     */
    async open(ref) {
        ref = ref.toString()
            .replace(/^(\/+)|(\:)+$/g, '')
            .replace(/:\.?\//, ':');
        let [_ref, _path] = ref.split(':');
        _ref = _ref.replace(/^\/+/, '');
        _path = _path || '';
        _path = `/${_path}/`.replace('//', '/');
        return this.thisIs(ref).then(async (data) => {
            switch (data) {
                case 'tree':
                    return await this.fileStructure(_ref, _path);
                case 'commit':
                    return await this.fileStructure(_ref, _path);
                case 'blob':
                    return await this.contents(ref);
                default:
                    throw new GitError('Неизвестный тип объекта');
            }
        });
    }
}

/**
 * Базовый класс для ссылок в Git.
 * Ветки, коммиты.
 */
class GitRef {
    /**
     * Конструктор класса
     * @param {Object} options Имя ссылки
     */
    constructor(options) {
        this._options = Object.assign({
            ref: '',
        }, options);
    }

    /**
     * Возвращает ссылку на объект.
     * @return {string|*}
     */
    get ref() {
        return this._options.ref;
    }

    /**
     * @return {string|*}
     */
    toString() {
        return this.ref;
    }
}

/**
 * Представляет ветку в локальном репозитории.
 */
class GitBranch extends GitRef {}

/**
 * Представляет commit в локальном репозитории.
 */
class GitCommit extends GitRef {
    /**
     * @inheritDoc
     */
    constructor(options) {
        super(options);
        this._options = Object.assign({
            commit: '',
            abbreviated_commit: '',
            refs: '',
            subject: '',
            author: {},
            commiter: {},
        }, this._options, options);
    }

    /**
     * Возвращает информацию о коммите.
     * @return {Object}
     */
    get info() {
        return Object.assign({}, this._options);
    }

    /**
     * @return {string}
     */
    toString() {
        return `${this.info.abbreviated_commit} 
        ${this.info.title} 
        ${this.info.commiter.date}`;
    }
}

/**
 * Представляет сущность в рабочей копии репозитория.
 */
class GitFile {
    /**
     * Конструктор класса.
     * @param {string} name
     * @param {string} path
     * @param {Boolean} isDir
     */
    constructor(name, path, isDir) {
        this._name = name;
        this._path = path;
        this._isDir = isDir || false;
    }

    /**
     * Парсит путь файла, возвращает объект GitFile.
     * @param {string} name
     * @param {boolean} isDir
     * @return {self}
     */
    static parse(name, isDir = false) {
        return new this(
            name.split('/').slice(-1).pop(),
            name,
            isDir
        );
    }

    /**
     * Возвращает имя файла
     * @return {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Возвращает путь к файлу.
     * @return {string|*}
     */
    get path() {
        return this._path;
    }

    /**
     * В случае если путь является файлом вернет false.
     * @return {Boolean|boolean|*}
     */
    get isDir() {
        return this._isDir;
    }

    /**
     * @return {string | undefined}
     */
    toString() {
        return this._name;
    }
}


module.exports = {
    Git,
    GitBranch,
    GitCommit,
    GitCodes,
};
