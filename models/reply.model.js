const mongoose = require('mongoose')
const schema = mongoose.Schema;

const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const ReplySchema = new schema({
    text: {
        type: String,
        required: true
    },
    created_on: {
        type: Date,
        required: true,
        default: Date.now
    },
    delete_password: {
        type: String,
        required: true
    },
    reported: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
})

ReplySchema.pre("save", function(next) {
    var reply = this;
    // Only hash the password if it has been modified or is new
    if (!reply.isModified('delete_password')) return next();

    // Generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // Hash the password using the new salt
        bcrypt.hash(reply.delete_password, salt, function(err, hash) {
            if (err) return next(err);
            // Override the clear text password with the hash
            reply.delete_password = hash;
            next();
        });
    });
});

/**
 * Methods
 */
ReplySchema.methods.comparePassword = function(userPassword) {
    let result = bcrypt.compareSync(userPassword, this.delete_password);
    /*, (err, res) => {
        console.log(err, res)
        if (err) console.log(err);
        return res;
    });*/
    return result;
};

const Model = mongoose.model("Reply", ReplySchema);

module.exports = Model;