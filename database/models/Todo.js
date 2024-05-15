const { SQLContext } = require('rey-common');

const { Model, DataTypes } = SQLContext.getORMProvider();

class Todo extends Model {}

Todo.init({
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
}, {
    underscored: true,
    sequelize: SQLContext.getContext(),
    tableName: 'todos'
});

Todo.associate = (models) => { };

module.exports = Todo;
