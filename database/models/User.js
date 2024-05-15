const { SQLContext } = require('../../src/base/database');

const { Model, DataTypes } = SQLContext.getORMProvider();

const bcrypt = require('bcrypt');

class User extends Model { }

User.init({
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
}, {
    sequelize: SQLContext.getContext(),
    underscored: true,
    paranoid: true,
    tableName: 'users',
    hooks: {
        async beforeSave(user) {
            if (!user.changed('password')) {
                return;
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(user.password, salt);
            user.password = hashedPassword;
        }
    },
});

User.associate = (models) => {
    User.hasMany(models.Activity, {
        foreignKey: {
            name: 'user_id',
            allowNull: false
        }
    });
};

module.exports = User;
