const {Git, GitBranch, GitCommit} = require('../git');

/**
 * Предоставляет интерфейс к информации о локальном репозитории git.
 */
class GitLocal {
    /**
     * Конструктор класса.
     * @param {Object} [options] Конфигурация
     */
    constructor(options) {
        this._options = Object.assign({
            git: {},
        }, options);
        this._git = this._options.git instanceof Git ?
            this._options.git : new Git(this._options.git);
    }

    /**
     * Возвращает список веток локального git репозитория.
     * @return {Promise<Array<GitBranch>>}
     */
    get branches() {
        return this._git.branches();
    }

    /**
     * Возвращает структуру файловой системы для переданной ссылки.
     * @param {GitCommit|GitBranch|string} ref Ссылка на объект.
     * @return {Promise<Array<GitFile>>}
     */
    async fileStructure(ref) {
        return this._git.fileStructure(ref);
    }

    /**
     * Возвращает историю коммитов.
     * @param {GitBranch|string} branch
     * @return {Promise<Array<GitCommit>>}
     */
    async commitHistory(branch) {
        return this._git.log(branch);
    }

    /**
     * Открыват файл/директорию.
     * @param {GitRef|string} ref
     * @return {Promise<Array<GitFile>|Buffer>}
     */
    async open(ref) {
        return this._git.open(ref);
    }
}

module.exports = GitLocal;
