// import mongoose, { Schema } from "mongoose";
// import jwt from 'jsonwebtoken'; 

// const memberSchema = new Schema({
//     memberName: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     memberMobile: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//         match: /^[0-9]{10}$/, // Ensures exactly 10 digits
//         index: true,
//     },
//     memberKey: {
//         type: String,
//         default: null,
//     },
//     status: {
//         type: String,
//         required: true,
//         enum: ['verified', 'unverified'],
//         default: 'unverified'
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is Required']
//     },
//     userId: {
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//     }
// }, {
//     timestamps: true,
// });


// memberSchema.methods.genrateAccessToken = function () {
    
//     return jwt.sign(
//         { 
//             _id: this._id, 
//             memberMobile: this.memberMobile, 
//             memberKey:this.memberKey,
//             status:this.status,
//             userId:this.userId
//         },

//         process.env.ACCESS_TOKEN_SECRET_USER,
//         { 
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRY_USER 
//         }
//     );
// };

// // memberSchema.pre('save', async function (next) {
// //     //check if password is not modified then return otherwise encript new password
// //     if (!this.isModified('password')) return next()
// //     //bcrypt hash method encrpt password 1st arg is password and 2nd arg is saltValue (rounds-8,10,)
// //     this.password = await bcrypt.hash(this.password, 10)
// //     next()
// // })

// // memberSchema.methods.isPasswordCorrect = async function (password) {
// //     return await bcrypt.compare(password, this.password)
// // }

// memberSchema.methods.isPasswordCorrect = async function (password) {
//     return password===this.password; 
// }


// export const Member = mongoose.model('Member', memberSchema);