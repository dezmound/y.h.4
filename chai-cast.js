/* eslint-disable no-invalid-this */
module.exports = (chai) => {
    const Assertion = chai.Assertion;
    Assertion.addChainableMethod('cast', function(callback) {
        if (this._obj instanceof Promise) {
            this._obj.then((data) => {
                this._obj = callback(data);
            });
            return this;
        }
        this._obj = callback(this._obj);
    });
};
