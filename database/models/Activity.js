const { SQLContext } = require('rey-common');

const { Model, DataTypes } = SQLContext.getORMProvider();

class Activity extends Model {}

Activity.init({
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
}, {
    underscored: true,
    sequelize: SQLContext.getContext(),
    tableName: 'activities'
});

Activity.associate = (models) => {
    Activity.hasMany(models.Todo, {
        foreignKey: {
            name: 'activity_id',
            allowNull: false
        }
    });
};

module.exports = Activity;
