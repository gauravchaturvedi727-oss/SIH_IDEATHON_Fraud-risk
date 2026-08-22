const mongoose = require("mongoose");


const phishingSchema = new mongoose.Schema(

    {

        user: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },


        message: {

            type: String,

            required: true,

            trim: true

        },


        riskScore: {

            type: Number,

            required: true,

            default: 0,

            min: 0,

            max: 100

        },


        riskLevel: {

            type: String,

            required: true,

            enum: [
                "LOW",
                "MEDIUM",
                "HIGH"
            ],

            default: "LOW"

        },


        prediction: {

            type: String,

            default: "Safe / Low Risk"

        },


        confidence: {

            type: Number,

            default: 0,

            min: 0,

            max: 100

        }

    },

    {

        timestamps: true

    }

);


module.exports =
    mongoose.model(
        "Phishing",
        phishingSchema
    );