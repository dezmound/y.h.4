const {spawn} = require('child_process');
const {fs} = require('fs');
const {util} = require('util');

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
        this._options = Object.assign({}, options);
    }

    /**
     * Возвращает имя текущей ветки. Если передан параметер,
     * переключится на эту ветку.
     * @param {string} branch Имя ветки на которую нужно переключится.
     * @return {Promise<string>}
     * @throws {GitError}
     */
    branch(branch) {
        if (branch !== undefined) {
            return this.checkout(branch);
        }
        return Promise.resolve(branch);
    }

    /**
     * Возвращает список веток в формате объекта.
     * @return {Promise<Array<GitBranch>>}
     */
    async branches() {
        return Promise.resolve([]);
    }

    /**
     * Переключает HEAD на указанную ветку/комит.
     * @param {GitBranch|GitCommit|string} where Имя ветки/комита.
     * @throws {GitError} В случае если не удалось переключить HEAD.
     * @return {Promise<string>}
     */
    async checkout(where) {
        return Promise.resolve(where);
    }

    /**
     * Возвращает историю коммитовв формате объектов.
     * @param {String} path Выводит историю коммитов по хаданному пути.
     * @return {Promise<Array<GitCommit>>}.
     */
    async log(path = '') {
        return Promise.resolve([]);
    }

    /**
     *
     * @return {Promise<Array<GitFile>>}
     */
    async workingCopy() {
        return Promise.resolve([]);
    }
}

/**
 * Базовый класс для ссылок в Git.
 * Ветки, коммиты.
 */
class GitRef {
    /**
     * Конструктор класса
     * @param {string} ref Имя ссылки
     */
    constructor(ref) {
        this._ref = ref;
    }

    /**
     * Возвращает ссылку на объект.
     * @return {string|*}
     */
    get ref() {
        return this._ref;
    }

    /**
     * @return {string|*}
     * @private
     */
    __toString() {
        return this._ref;
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
     * Конструктор класса.
     * @param {string} ref
     * @param {string} message
     * @param {int} date
     */
    constructor(ref, message, date) {
        super(ref);
        this._message = message;
        this._date = date;
    }

    /**
     * Сообщение комита.
     * @return {string|*}
     */
    get message() {
        return this._message;
    }

    /**
     * Дата комита.
     * @return {int|*}
     */
    get date() {
        return this._date;
    }
}

/**
 * Представляет сущность в рабочей копии репозитория.
 */
class GitFile {
    /**
     * Конструктор класса.
     * @param {string} path
     * @param {Boolean} isDir
     */
    constructor(path, isDir) {
        this._path = path;
        this._isDir = isDir || false;
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
     *
     * @return {Promise<GitFile>}
     */
    async children() {
        if (!this._isDir) {
            return Promise.resolve([]);
        }
        return util.promisfy(fs.readdir)(this._path)
            .then((files) => files.map(
                (f) => new GitFile(f, fs.statsSync(f).isDirectory())
            ));
    }

    /**
     * Возвращает дерево объектов для этого файла.
     * @return {Promise<Array<Array|GitFile>>}
     */
    async tree() {
        if (!this._isDir) {
            return Promise.resolve([]);
        }
        return this.children().map(async (f) => {
            if (!f.isDir) {
                return f;
            }
            return await f.tree();
        });
    }

    /**
     * @return {string | undefined}
     * @private
     */
    __toString() {
        return this._path.split('/').slice(-1).pop();
    }
}


module.exports = {
    Git,
    GitBranch,
    GitCommit,
};
