class NewComment {
    constructor(payload) {
        this._verifyPayload(payload);
        this.content = payload.content;
    }

    _verifyPayload({ content }) {
        if (content === undefined || content === null) { // Check for undefined or null specifically
            throw new Error('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
        }
        if (typeof content !== 'string') {
            throw new Error('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
        if (content.trim() === '') { // Check for empty string after trimming
            throw new Error('NEW_COMMENT.CANNOT_BE_EMPTY_STRING');
        }
    }
}

module.exports = NewComment;