const mongoose = require('mongoose');
const argon2 = require('argon2');
const jose = require('jose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    walletAddress: {
        type: String,
        trim: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await argon2.hash(this.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
            saltLength: 32
        });
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods.generateAuthToken = async function() {
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-fallback-secret-key-change-this'
        );

        const token = await new jose.SignJWT({
            _id: this._id.toString(),
            email: this.email,
            name: this.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .setIssuer('ivs-testing-vercel')
            .setAudience('user')
            .sign(secret);

        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Error generating authentication token');
    }
};

userSchema.statics.verifyToken = async function(token) {
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-fallback-secret-key-change-this'
        );

        const { payload } = await jose.jwtVerify(token, secret, {
            issuer: 'ivs-testing-vercel',
            audience: 'user'
        });

        return payload;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;