const tableOpts = {
    tableName: 'users'
};

module.exports = {
    up: async (queryInterface, DataTypes) => queryInterface.createTable(tableOpts, {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        fullname: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        password: {
            type: DataTypes.STRING,
        },
        refresh_token: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        refresh_token_valid_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reset_password_token: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        reset_password_token_valid_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        otp: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        otp_valid_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        otp_retry_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        otp_penalty_until: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }).then(() => Promise.all([
        queryInterface.addIndex(tableOpts, ['email'])
    ])),
    down: async (queryInterface) => queryInterface.dropTable(tableOpts)
};
