const mongoose = require("mongoose");


const voiceAnalysisSchema =
    new mongoose.Schema(

        {

            user: {

                type: mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true

            },


            transcript: {

                type: String,

                default: ""

            },


            riskScore: {

                type: Number,

                default: 0,

                min: 0,

                max: 100

            },


            riskLevel: {

                type: String,

                enum: [
                    "LOW",
                    "MEDIUM",
                    "HIGH"
                ],

                default: "LOW"

            },


            prediction: {

                type: String,

                default: ""

            },


            confidence: {

                type: Number,

                default: 0,

                min: 0,

                max: 100

            },


            reasons: {

                type: [String],

                default: []

            },


            recommendedAction: {

                type: String,

                default: ""

            },
            notificationRead: {

                type: Boolean,

                default: false

            }

        },

        {

            timestamps: true

        }

    );


module.exports =
    mongoose.model(
        "VoiceAnalysis",
        voiceAnalysisSchema
    );