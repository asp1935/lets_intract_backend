import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';   //  package for hashing paswword
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[0-9]{10}$/, // Ensures exactly 10 digits
        index: true,
    },
    state: {
        type: String,
        trim: true,
        default: null
    },
    district: {
        type: String,
        trim: true,
        default: null

    },
    taluka: {
        type: String,
        trim: true,
        default: null

    },
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    verified: {
        type: Boolean,
        required: true,
        default:false
    },
    userKey: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['business', 'political'],
        default: 'business'
    },

    role: {
        type: String,
        enum: ['user', 'member'],
        default: 'user'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Reference to the Admin (Self-referencing)
        default: null
    },
    email: {   
        type: String,
        // unique: true,
        lowercase: true,
        trim: true,
        index: true,
        required: function () {
            return this.role === 'user';  // Email required only for admin
        }
    }
}, {
    timestamps: true
});

// jwt token are bearer token like anyone have that token can get data 

//sign method is for creating token
//access tokens are short lived
//access token are used for authentication in application for features in app
userSchema.methods.genrateAccessToken = function () {

    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            mobile: this.mobile,
            type: this.type,
            role: this.role,
            userKey: this.userKey,
            status: this.status,
            userId: this.userId
        },

        process.env.ACCESS_TOKEN_SECRET_USER,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY_USER
        }
    );
};

//direct encriptions is not possible 
//so we need to use mongoose hooks 
//pre middleware(hook) execute just before data is saving
//save is event pre hook execute before save
//arrow function is not used  because in arrow function this refrance is not available 
//like arrow function dont know context so normal function(){} is used  
//encription take some time thats why async fun created

userSchema.pre('save', async function (next) {
    //check if password is not modified then return otherwise encript new password
    if (!this.isModified('password')) return next()
    //bcrypt hash method encrpt password 1st arg is password and 2nd arg is saltValue (rounds-8,10,)
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//check password 
//mongoose provide methods as well as we can add new methods 
//compare method return boolean value 
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}




export const User = mongoose.model("User", userSchema);

//Usre varibale directaly communicate with database
// in model method User is given mongodb conver it into pural form like users 