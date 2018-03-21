const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const tmpDir = require('os').tmpdir();
const crypto = require('crypto');
const {Git, GitBranch, GitFile, GitCommit} = require('../modules/git');
const GitLocal = require('../modules/git-local');
chai.use(chaiAsPromised);
const expect = chai.expect;
chai.should();

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
    await git.commit('Test commit', 'Test commit');
    await git.checkout('test', ['-b']);
    fs.writeFileSync(git.options.pwd + '/.3', '.3');
    fs.mkdirSync(git.options.pwd + '/.dir3');
    fs.writeFileSync(git.options.pwd + '/.dir3/.4', '.4');
    await git.add('.');
    await git.commit('Test commit', 'Test commit');
    await git.checkout('master');
};

describe('Git local', () => {
    it('should return branches', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        const _gitLocal = new GitLocal({
            git: _git,
        });
        await initTest(_git);
        return _gitLocal.branches.should.eventually.to
            .be.an('array').with.property('length').that.equal(2);
    });
    it('should return file structure', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        const _gitLocal = new GitLocal({
            git: _git,
        });
        await initTest(_git);
        return _gitLocal.fileStructure('master').should.eventually.to
            .be.an('array').cast((a) => a.map((f) => f.toString()))
            .that.contains('.0');
    });
    it('should return commits for branch', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        const _gitLocal = new GitLocal({
            git: _git,
        });
        await initTest(_git);
        return _gitLocal.commitHistory('master').should.eventually.to
            .be.an('array').with.property('length').that.equal(1);
    });
});
