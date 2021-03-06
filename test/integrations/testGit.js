const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiCast = require('../../chai-cast.js');
const fs = require('fs');
const tmpDir = require('os').tmpdir();
const crypto = require('crypto');
const {Git} = require('../../modules/git');
chai.use(chaiAsPromised);
chai.use(chaiCast);
chai.should();

const init = async () => {
    const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
    fs.mkdirSync(path);
    const _git = new Git({
        pwd: path,
    });
    await initTest(_git);
    return _git;
};

const initTest = async (git) => {
    /**
     * @var {Git} git
     */
    await git.init();
    fs.writeFileSync(git.options.pwd + '/.0', '.0');
    fs.mkdirSync(git.options.pwd + '/.dir');
    fs.writeFileSync(git.options.pwd + '/.dir/.1', '.1');
    fs.mkdirSync(git.options.pwd + '/.dir/dir1');
    fs.writeFileSync(git.options.pwd + '/.dir/dir1/.2', '.2');
    await git.add('.');
    await git.commit('Test commit', 'Test commit message');
    await git.checkout('test', ['-b']);
    fs.writeFileSync(git.options.pwd + '/.3', '.3');
    fs.mkdirSync(git.options.pwd + '/.dir3');
    fs.writeFileSync(git.options.pwd + '/.dir3/.4', '.4');
    await git.add('.');
    await git.commit('Test commit', 'Test commit');
    await git.checkout('master');
};

describe('Git Integrations', () => {
    it('можно инициализировать репозиторий', () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        return _git.init().should.eventually.equal(true);
    });
    it('можно добавить файлы в комит', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await _git.init();
        fs.writeFileSync(path + '/.0', '.0');
        return _git.add('.').should.eventually.to.equal(true);
    });
    it('можно проверить статус', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await _git.init();
        fs.writeFileSync(path + '/.0', '.0');
        return _git.status().should.eventually
            .to.be.an('string').that.does.include('.0');
    });
    it('можно переключить ветку', async () => {
        const _git = await init();
        await _git.branch('test');
        return _git.branch().should.eventually.to.equal('test');
    });
    it('можно получить список веток', async () => {
        const _git = await init();
        return _git.branches().should.eventually.to.be.an('array')
            .with.property('length').that.equal(2);
    });
    it('можно получить содержимое папки по ссылке', async () => {
        const _git = await init();
        return _git.fileStructure().should.eventually.to
            .be.an('array').cast((a) => a.map((f) => f.toString()))
            .that.does.include('.0');
    });
    it('можно создать ветку', async () => {
        const _git = await init();
        await _git.checkout('test-branch', ['-b']);
        return _git.branch().should.eventually.to.equal('test-branch');
    });
    it('можно посмотреть историю комитов', async () => {
        const _git = await init();
        return _git.log().should.eventually.to.be.an('array').that
            .have.own.property('length').that.equal(1);
    });
    it('можно получить содержимое папки', async () => {
        const _git = await init();
        return _git.open('HEAD:.dir').should.eventually.to.be
            .an('array').that.have.own.property('length').that.equal(2);
    });
    it('можно получить тип ссылки', async () => {
        const _git = await init();
        return _git.thisIs('HEAD:.0').should.eventually.to.be
            .an('string').that.equal('blob');
    });
    it('можно получить содержимое файла', async () => {
        const _git = await init();
        return _git.open('HEAD:.0').should.eventually.to.be
            .cast((b) => b.toString()).an('string').that.equal('.0');
    });
});
