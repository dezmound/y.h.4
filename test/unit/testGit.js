const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiCast = require('../../chai-cast.js');
const {Git, GitCodes} = require('../../modules/git');
chai.use(chaiAsPromised);
chai.use(chaiCast);
chai.should();

/**
 * Возвращает последовательность значений, из генератора.
 * @param {Generator|IterableIterator<*>} generator
 * @return {*}
 */
function returnSequence(generator) {
    return function() {
        return this.next().value;
    }.bind(generator);
}

describe('Git Unit', () => {
    it('можно распарсить историю комитов', async () => {
        const _git = new Git({
            /* eslint-disable max-len */
            getCommandPromise: () => Promise.resolve([`
                {"commit":"12f86dcb791830fd038466b55a16cd0097bc065e","abbreviated_commit":"12f86dc","refs":"HEAD -> dev, origin/dev","subject":"README #7","body":"","author":{"name":"dezmound","email":"profacorp@gmail.com","date":"Sun Mar 25 11:56:25 2018 +0300"},"commiter":{"name":"dezmound","email":"profacorp@gmail.com","date":"Sun Mar 25 11:56:25 2018 +0300"}},
                {"commit":"dc9dfc4a978cf2fe05ed777c8cffb879da1c1eec","abbreviated_commit":"dc9dfc4","refs":"","subject":"README #6","body":"","author":{"name":"dezmound","email":"profacorp@gmail.com","date":"Sun Mar 25 11:51:48 2018 +0300"},"commiter":{"name":"dezmound","email":"profacorp@gmail.com","date":"Sun Mar 25 11:51:48 2018 +0300"}},
            `, GitCodes.OK]),
            /* eslint-enable max-len */
        });
        return _git.log().should.eventually.to.be.an('array').that
            .have.own.property('length').that.equal(2);
    });
    it('можно распарсить содержимое папки', async () => {
        const _git = new Git({
            getCommandPromise: returnSequence((function* () {
                yield Promise.resolve(['tree', GitCodes.OK]);
                yield Promise.resolve([`
                    .file
                    .dir
                `, GitCodes.OK]);
                yield Promise.resolve(['blob', GitCodes.OK]);
                yield Promise.resolve(['tree', GitCodes.OK]);
            })()),
        });
        return _git.open('HEAD:.dir').should.eventually.to.be
            .an('array').that.have.own.property('length').that.equal(2);
    });
});
