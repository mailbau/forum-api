/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createTable('comments', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        content: {
            type: 'TEXT',
            notNull: true,
        },
        owner: {
            type: 'VARCHAR(50)',
            notNull: true,
            references: '"users"', // References users table
            onDelete: 'CASCADE',
        },
        thread_id: {
            type: 'VARCHAR(50)',
            notNull: true,
            references: '"threads"', // References threads table
            onDelete: 'CASCADE',
        },
        date: {
            type: 'TIMESTAMPTZ',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        is_deleted: { // For potential soft delete feature later
            type: 'BOOLEAN',
            notNull: true,
            default: false,
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable('comments');
};