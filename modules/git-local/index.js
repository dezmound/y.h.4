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
        this._git = new Git(this._options.git);
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
     * @return {Array<Array|string>}
     */
    async fileStructure(ref) {
        let _oldRef = await this._git.checkout(ref);
        let _result = await this._git.workingCopy();
        await this._git.checkout(_oldRef);
        return _result;
    }

    /**
     * Возвращает историю коммитов.
     * @param {GitBranch|string} branch
     * @return {Promise<Array<GitCommit>>}
     */
    async commitHistory(branch) {
        return this._git.log(branch);
    }
}

module.exports = GitLocal;
