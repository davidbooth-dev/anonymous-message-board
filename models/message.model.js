const mongoose = require('mongoose')
const schema = mongoose.Schema;

const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const MessageSchema = new schema({
    board: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    created_on: {
        type: Date,
        required: true
    },
    bumped_on: {
        type: Date,
        required: true
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply"
    }],
    reported: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    delete_password: {
        type: String,
        required: true
    }
});

MessageSchema.pre("save", function(next) {
    var user = this;
    // Only hash the password if it has been modified or is new
    if (!user.isModified('delete_password')) return next();

    // Generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // Hash the password using the new salt
        bcrypt.hash(user.delete_password, salt, function(err, hash) {
            if (err) return next(err);
            // Override the clear text password with the hash
            user.delete_password = hash;
            next();
        });
    });
});

/**
 * Methods
 */
MessageSchema.methods.comparePassword = function(userPassword) {
    let result = bcrypt.compareSync(userPassword, this.delete_password);
    /*, (err, res) => {
        console.log(err, res)
        if (err) console.log(err);
        return res;
    });*/
    return result;
};

const Model = mongoose.model("Message", MessageSchema);

module.exports = Model;