// src/Domains/comments/entities/CommentDetail.js
class CommentDetail {
    constructor(payload) {
        this._verifyPayload(payload);

        const {
            id, username, date, content, isDeleted, replies, likeCount = 0
        } = payload;

        this.id = id;
        this.username = username;
        this.date = date;
        this.content = isDeleted ? '**komentar telah dihapus**' : content;
        this.replies = replies;
        this.likeCount = likeCount;
    }

    _verifyPayload({
        id, username, date, content,
        isDeleted, replies, likeCount
    }) {
        if (!id || !username || !date || content === undefined || content === null || isDeleted === undefined || !replies) {
            throw new Error('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
        }

        if (
            typeof id !== 'string'
            || typeof username !== 'string'
            || !(date instanceof Date || typeof date === 'string') // Allow string for ISO date from DB
            || typeof content !== 'string'
            || typeof isDeleted !== 'boolean'
            || !Array.isArray(replies)
            || (likeCount !== undefined && typeof likeCount !== 'number')
        ) {
            throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
    }
}

module.exports = CommentDetail;