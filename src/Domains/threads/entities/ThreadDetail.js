// src/Domains/threads/entities/ThreadDetail.js
const CommentDetail = require('../../comments/entities/CommentDetail');

class ThreadDetail {
    constructor(payload) {
        this._verifyPayload(payload);

        const {
            id, title, body, date, username, comments,
        } = payload;

        this.id = id;
        this.title = title;
        this.body = body;
        this.date = date;
        this.username = username;
        // comments are expected to be an array of CommentDetail instances or raw data for it
        this.comments = comments;
    }

    _verifyPayload({
        id, title, body, date, username, comments,
    }) {
        if (!id || !title || !body || !date || !username || !comments) {
            throw new Error('THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
        }

        if (
            typeof id !== 'string'
            || typeof title !== 'string'
            || typeof body !== 'string'
            || !(date instanceof Date || typeof date === 'string') // Allow string for ISO date from DB
            || typeof username !== 'string'
            || !Array.isArray(comments)
        ) {
            throw new Error('THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
    }
}

module.exports = ThreadDetail;