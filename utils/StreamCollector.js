const EventEmiter = require('events');

/**
 * Собирает данные из потока.
 * Триггерит событие `end` при закрытии потока.
 * Возвращает в обработчик собранные данные.
 */
class StreamCollector extends EventEmiter {
    /**
     * Конструктор класса.
     * @param {Readable} stream
     */
    constructor(stream) {
        super();
        this._stream = stream;
        this._data = new Buffer([]);
        this._stream.on('data', this._onData.bind(this));
        this._stream.on('end', this._onEnd.bind(this));
    }

    /**
     * Коллектор данных из потока.
     * @param {Buffer} data
     * @private
     */
    _onData(data) {
        this._data = Buffer.concat([this._data, data]);
    }

    /**
     * Обработчик конца потока данных.
     * @private
     */
    _onEnd() {
        this.emit('end', this._data);
    }

    /**
     * Резолвит окончание поток данных.
     * @return {Promise<Buffer>}
     */
    get promise() {
        return new Promise((resolve) => {
            this.on('end', (data) => {
                resolve(data);
            });
        });
    }
}

module.exports = StreamCollector;
