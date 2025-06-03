class NewReply {
    constructor(payload) {
        this._verifyPayload(payload);
        this.content = payload.content;
    }

    _verifyPayload({ content }) {
        if (content === undefined || content === null) {
            throw new Error('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
        }
        if (typeof content !== 'string') {
            throw new Error('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
        if (content.trim() === '') {
            throw new Error('NEW_REPLY.CANNOT_BE_EMPTY_STRING');
        }
    }
}

module.exports = NewReply;