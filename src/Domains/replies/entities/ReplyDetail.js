class ReplyDetail {
    constructor(payload) {
        this._verifyPayload(payload);

        const {
            id, username, date, content, isDeleted,
        } = payload;

        this.id = id;
        this.username = username;
        this.date = date; // Should be ISO string or Date object
        this.content = isDeleted ? '**balasan telah dihapus**' : content;
    }

    _verifyPayload({
        id, username, date, content, isDeleted,
    }) {
        if (id === undefined || username === undefined || date === undefined || content === undefined || isDeleted === undefined) {
            throw new Error('REPLY_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
        }

        if (
            typeof id !== 'string'
            || typeof username !== 'string'
            || !(date instanceof Date || typeof date === 'string')
            || typeof content !== 'string'
            || typeof isDeleted !== 'boolean'
        ) {
            throw new Error('REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
    }
}

module.exports = ReplyDetail;