const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {

    try {

        const { name, email, password } = req.body;


        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Name, email and password are required"
            });

        }


        const existingUser = await User.findOne({ email });


        if (existingUser) {

            return res.status(400).json({
                message: "User already exists"
            });

        }


        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        const user = await User.create({

            name,
            email,
            password: hashedPassword

        });


        return res.status(201).json({

            message: "User registered successfully",

            user: {

                id: user._id,
                name: user.name,
                email: user.email

            }

        });

    }
    catch (error) {

        console.log(
            "REGISTER ERROR:",
            error.message
        );


        return res.status(500).json({

            message: error.message

        });

    }

};

const login = async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required"
            });

        }


        const user = await User.findOne({ email });


        if (!user) {

            return res.status(400).json({
                message: "Invalid email or password"
            });

        }


        const isMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!isMatch) {

            return res.status(400).json({
                message: "Invalid email or password"
            });

        }

        const token = jwt.sign(

            {
                id: user._id.toString(),
                email: user.email
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );


        console.log(
            "LOGIN SUCCESS:",
            user.email
        );


        return res.status(200).json({

            success: true,

            message: "Login successful",

            token,

            user: {

                id: user._id,
                name: user.name,
                email: user.email

            }

        });

    }
    catch (error) {

        console.log(
            "LOGIN ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {

    register,
    login

};