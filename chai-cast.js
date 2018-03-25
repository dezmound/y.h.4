/* eslint-disable no-invalid-this */
/**
 * Добавляет в chai конструкцию типа .cast(callback),
 * Колбек которой получает данные на вход первым параметром
 * и возвращает преобразованные данные.
 * Полезно в случае, например, если функция возвращает массив
 * обеъктов которые нужно преобразовать в массив строк и проверить
 * что в этом массиве присутствует строка.
 * @param {Object} chai
 */
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
