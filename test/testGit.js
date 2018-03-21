const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const tmpDir = require('os').tmpdir();
const crypto = require('crypto');
const {Git, GitBranch, GitFile, GitCommit} = require('../modules/git');
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
    await git.checkout('-b test');
    fs.writeFileSync(git.options.pwd + '/.3', '.3');
    fs.mkdirSync(git.options.pwd + '/.dir3');
    fs.writeFileSync(git.options.pwd + '/.dir3/.4', '.4');
    await git.add('.');
    await git.commit('Test commit', 'Test commit');
    await git.checkout('master');
};

describe('Git', () => {
    it('should init repo', () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        return _git.init().should.eventually.equal(true);
    });
    it('should add files to commit', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await _git.init();
        fs.writeFileSync(path + '/.0', '.0');
        return _git.add('.').should.eventually.to.equal(true);
    });
    it('should show status', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await _git.init();
        fs.writeFileSync(path + '/.0', '.0');
        return _git.status().should.eventually
            .to.be.an('array').that.does.include('.0');
    });
    it('should change branch', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await initTest(_git);
        _git.branch('test');
        return _git.branch().should.eventually.to.equal('test');
    });
    it('show file structure', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await initTest(_git);
        return _git.fileStructure().should.eventually.to
            .be.an('array').that.does.include('.0');
    });
    it('should checkout HEAD', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        _git.checkout('-b test');
        return _git.branch().should.eventually.to.equal('test');
    });
    it('should return log', async () => {
        const path = tmpDir + '/' + crypto.randomBytes(16).toString('hex');
        fs.mkdirSync(path);
        const _git = new Git({
            pwd: path,
        });
        await initTest(_git);
        return _git.log().should.eventually.to.be.an('array').that
            .have.own.property('length').that.equal(1);
    });
});
