const tableOpts = {
    tableName: 'activities'
};

module.exports = {
    up: async (queryInterface, DataTypes) => queryInterface.createTable(tableOpts, {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: {
                    tableName: 'users'
                },
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
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
        queryInterface.addIndex(tableOpts, ['user_id'])
    ])),
    down: async (queryInterface) => queryInterface.dropTable(tableOpts)
};
