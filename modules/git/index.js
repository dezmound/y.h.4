const {spawn} = require('child_process');
const fs = require('fs');
const util = require('util');
const path = require('path');

const GitCodes = {
    OK: 0x0,
    ERR: 0x1,
};

const logFormat = `
{
%n  "commit": "%H",
%n  "abbreviated_commit": "%h",
%n  "refs": "%D",
%n  "subject": "%s",
%n  "body": "%b",
%n  "author": {
        %n    "name": "%aN",
        %n    "email": "%aE",
        %n    "date": "%aD"%n  
    },
%n  "commiter": {
        %n    "name": "%cN",
        %n    "email": "%cE",
        %n    "date": "%cD"%n 
     }
%n},`;

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
        }, options);
        this._pwd = this._options.pwd;
        this._git = this._options.git;
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
     * @return {Promise<boolean>}
     */
    async init() {
        const _process = spawn('git', ['init'], {
            pwd: this._pwd,
        });
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Делает комит в локальный git репозиторий.
     * @param {string} commitTitle Заголовок комита
     * @param {string} commitMessage Сообщение
     * @return {Promise<boolean>}
     */
    async commit(commitTitle, commitMessage) {
        const _process = spawn('git', [
            'commit',
            `-m "$( printf '${commitTitle}\n\n${commitMessage}')"`,
        ], {
            pwd: this._pwd,
        });
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Добавляет файлы, переданные в строке к текущему состоянию.
     * @param {string} names
     * @return {Promise<void>}
     */
    async add(names) {
        const _process = spawn('git', ['add', names]);
        return promisifyMethod(_process, _process.on)('exit')
            .then((code) => code === GitCodes.OK);
    }

    /**
     * Запращивает статус репозитория
     * @throws {GitError} В случае если репозиторий не инициализирован
     * @return {Promise<string>}
     */
    async status() {
        const _process = spawn('git', ['status'], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _process.stdout, _process.stdout.on, 'on'
        );
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString();
            }
            throw new TypeError('Ошибка при проверке статуса: ' + data);
        });
    }

    /**
     * Возвращает имя текущей ветки. Если передан параметер,
     * переключится на эту ветку.
     * @param {string|undefined} [branch] Имя ветки на которую
     * нужно переключится.
     * @return {Promise<string>}
     * @throws {GitError}
     */
    async branch(branch) {
        if (branch !== undefined) {
            return this.checkout(branch);
        }
        const _process = spawn('git', ['branch'], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _process.stdout, _process.stdout.on, 'on'
        );
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString().split(/\R+/ig).filter((s) => {
                    return s.indexOf('*') >= 0;
                }).pop().replace(/^[*\s]+|[*\s]+$/g, '');
            }
            throw new TypeError('Ошибка при получении ветки: ' + data);
        });
    }

    /**
     * Возвращает список веток в формате объекта.
     * @return {Promise<Array<GitBranch>>}
     */
    async branches() {
        const _process = spawn('git', ['branch'], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _process.stdout, _process.stdout.on, 'on'
        );
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return data.toString().split(/\R+/ig).map((s) => {
                    return s.replace(/^[*\s]+|[*\s]+$/g, '');
                });
            }
            throw new TypeError('Ошибка при получении списка веток: ' + data);
        });
    }

    /**
     * Переключает HEAD на указанную ветку/комит.
     * @param {GitRef|string} where Имя ветки/комита.
     * @throws {GitError} В случае если не удалось переключить HEAD.
     * @return {Promise<string>}
     */
    async checkout(where) {
        const _process = spawn('git', ['checkout', where], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _process.stdout, _process.stdout.on, 'on'
        );
        const _oldBranch = await this.branch();
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK && data.toString().indexOf(where) >= 0) {
                return _oldBranch;
            }
            throw new TypeError('Ошибка при переключении HEAD: ' + data);
        });
    }

    /**
     * Возвращает историю коммитовв формате объектов.
     * @param {String} path Выводит историю коммитов по заданному пути.
     * @return {Promise<Array<GitCommit>>}.
     */
    async log(path = '') {
        const _process = spawn('git', [
            'log', `--pretty=format:${logFormat}`, path,
        ], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _process.stdout, _process.stdout.on, 'on'
        );
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return JSON.parse(`[${data.toString().replace(/,+$/g, '')}]`)
                    .map((c) => new GitCommit(c));
            }
            throw new TypeError(
                'Ошибка при получении истории комитов: ' + data
            );
        });
    }

    /**
     * Возвращает структуру файловой системы по ссылке.
     * @param {GitRef|string} ref
     * @return {Promise<Array<GitFile>>}
     */
    async fileStructure(ref = 'HEAD') {
        const _process = spawn('git', [
            'ls-tree', '--name-only', ref.toString(),
        ], {
            pwd: this._pwd,
        });
        const _promisified = promisifyMethod(_process, _process.on);
        const _promisifiedData = promisifyMethod(
            _promisified.stdout, _promisified.stdout.on, 'on'
        );
        return Promise.all([
            _promisifiedData('data').then((data) => data),
            _promisified('exit').then((code) => code),
        ]).then(([data, code]) => {
            if (code === GitCodes.OK) {
                return JSON.parse(`[${data.toString().replace(/,+$/g, '')}]`)
                    .map((c) => new GitCommit(c));
            }
            throw new TypeError(
                'Ошибка при получении истории комитов: ' + data
            );
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
     * Парсит название файла, возвращает объект GitFile.
     * @param {string} name
     * @return {self}
     */
    static parse(name) {
        return new this(
            name.split('/').slice(-1).pop(),
            name,
            fs.statSync(name).isDirectory()
        );
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
    promisifyMethod,
};
