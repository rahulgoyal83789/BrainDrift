const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistmodel = require("../models/blacklist.model");

/**
 * @name  registerUserController
 * @description Register a new user expects username,email,password in request body
 * @access Public 
 */

async function registerUserController(req,res){

    const {username , email , password} = req.body;

    if(!username||!email||!password){
        return res.status(400).json({
            message: "Please provide username, email and password"
        });
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{username},{email}]
    });

    if(isUserAlreadyExists){
        if(isUserAlreadyExists.username===username){
            return res.status(400).json({
                message: "Account already exists with this username"
            });
        }
        if(isUserAlreadyExists.email===email){
            return res.status(400).json({
                message: "Account already exists with this email address"
            });
        }
        return res.status(400).json({
            message: "Account already exists"
        });
    }

    const hash = await bcrypt.hash(password,10);
    const user = await userModel.create({
        username,
        email,
        password : hash,
    });

    const token = jwt.sign(
        {id:user._id,username:user.username},
        process.env.JWT_SECRET,
        {expiresIn: "3d"}
    );
    res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
});

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    });
}

/**
 * 
 * @name loginUserController
 * @description Login a user expects email,password in request body
 * @access Public 
 */

async function loginUserController(req,res){
    const {email,password} = req.body;

    const user = await userModel.findOne({email});
    if(!user){
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const isPasswordValid = await bcrypt.compare(password,user.password);

    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        {id:user._id,username:user.username},
        process.env.JWT_SECRET,
        {expiresIn: "3d"},
    );
    res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
});
    res.status(200).json({
        message: "User loggedIn successfully",
        user:{
            id: user._id,
            username: user.username,
            email : user.email,
        }
    });
}

/**
 * 
 * @name logoutUserController
 * @description clear token from user cookie and add token to blacklist
 * @access Public
 */

async function logoutUserController(req,res){
    const token = req.cookies.token;
    if(token){
        await tokenBlacklistmodel.create({token});
    }

    res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
});
    res.status(200).json({
        message: "User logged out successfully"
    });
}

/**
 * @name getMeController
 * @description Get the current logged in user details
 * @access private
 */

async function getMeController(req,res){
    const user = await userModel.findById(req.user.id);
    res.status(200).json({
        message: "User details fetched successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email,
        }
    });
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
}