import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';   //  package for hashing paswword
import jwt from 'jsonwebtoken';   //JSON web token are standardized way to securely send data between 2 parties
//and it contains header,payload,signature
//header- algorithum and type AUTO INJECTED
//payload- data
//signature- key   used to verify sender JWT it contains secret 

const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true           //index is used to make that field searchable this is not require compalsory but it is optimized technique and als expensive give load on db
    },
    role: {
        type: String,
        required: true,
        enum: ['superadmin', 'admin', 'user']
    },
    permissions: [{
        type: String,
        default: []
    }],
    password: {
        type: String,
        required: [true, 'Password is Required']
    },

    refreshToken: {
        type: String
    },
    incentive: {
        type: Number,
        default: 0,
    },
    referralCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true
})

//direct encriptions is not possible 
//so we need to use mongoose hooks 
//pre middleware(hook) execute just before data is saving
//save is event pre hook execute before save
//arrow function is not used  because in arrow function this refrance is not available 
//like arrow function dont know context so normal function(){} is used  
//encription take some time thats why async fun created

adminSchema.pre('save', async function (next) {
    //check if password is not modified then return otherwise encript new password
    if (!this.isModified('password')) return next()
    //bcrypt hash method encrpt password 1st arg is password and 2nd arg is saltValue (rounds-8,10,)
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//check password 
//mongoose provide methods as well as we can add new methods 
//compare method return boolean value 
adminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// jwt token are bearer token like anyone have that token can get data 

//sign method is for creating token
//access tokens are short lived
//access token are used for authentication in application for features in app
adminSchema.methods.genrateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            mobile: this.mobile,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
//refresh toekn are long lived
//in access token if expiry is only 15 min then after 15min user has to login again that time refresh token comes in 
//refresh token is store on db as well as client side using this token user does not have to enter password again 
//hit endpint to server if client refreshtoken and sever refresh token is same then server give new accesstoken to user mdavli karun gheychi 

adminSchema.methods.genrateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const Admin = mongoose.model("Admin", adminSchema);

//Usre varibale directaly communicate with database
// in model method User is given mongodb conver it into pural form like users 