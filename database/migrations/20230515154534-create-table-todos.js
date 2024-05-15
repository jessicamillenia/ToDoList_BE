const tableOpts = {
    tableName: 'todos'
};

module.exports = {
    up: async (queryInterface, DataTypes) => queryInterface.createTable(tableOpts, {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        activity_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: {
                    tableName: 'activities'
                },
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        priority: {        
            type: DataTypes.STRING(20),
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
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
        queryInterface.addIndex(tableOpts, ['activity_id'])
    ])),
    down: async (queryInterface) => queryInterface.dropTable(tableOpts)
};
