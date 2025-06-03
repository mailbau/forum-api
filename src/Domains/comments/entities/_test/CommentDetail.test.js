const CommentDetail = require('../CommentDetail');
const ReplyDetail = require('../../../replies/entities/ReplyDetail');

describe('CommentDetail entity', () => {
    it('should create CommentDetail object correctly for non-deleted comment with replies', () => {
        const replyPayload = {
            id: 'reply-123',
            username: 'user_reply',
            date: new Date().toISOString(),
            content: 'a reply',
            isDeleted: false,
        };
        const mockReplyDetail = new ReplyDetail(replyPayload);

        const payload = {
            id: 'comment-123',
            username: 'johndoe',
            date: new Date().toISOString(),
            content: 'sebuah comment',
            isDeleted: false,
            replies: [mockReplyDetail],
        };
        const commentDetail = new CommentDetail(payload);

        expect(commentDetail.id).toEqual(payload.id);
        expect(commentDetail.username).toEqual(payload.username);
        expect(commentDetail.date).toEqual(payload.date);
        expect(commentDetail.content).toEqual(payload.content);
        expect(commentDetail.replies).toEqual([mockReplyDetail]);
        expect(commentDetail.replies[0]).toBeInstanceOf(ReplyDetail);
    });

    it('should create CommentDetail object correctly for deleted comment with empty replies', () => {
        const payload = {
            id: 'comment-456',
            username: 'dicoding',
            date: new Date().toISOString(),
            content: 'original content, should be replaced',
            isDeleted: true,
            replies: [], // Empty replies array
        };
        const commentDetail = new CommentDetail(payload);

        expect(commentDetail.id).toEqual(payload.id);
        expect(commentDetail.username).toEqual(payload.username);
        expect(commentDetail.date).toEqual(payload.date);
        expect(commentDetail.content).toEqual('**komentar telah dihapus**');
        expect(commentDetail.replies).toEqual([]);
    });

    it('should throw error if payload does not contain replies property', () => {
        const payload = {
            id: 'comment-123',
            username: 'johndoe',
            date: new Date().toISOString(),
            content: 'sebuah comment',
            isDeleted: false,
            // replies is missing
        };
        expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if replies is not an array', () => {
        const payload = {
            id: 'comment-123',
            username: 'johndoe',
            date: new Date().toISOString(),
            content: 'sebuah comment',
            isDeleted: false,
            replies: 'not-an-array',
        };
        expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });
});