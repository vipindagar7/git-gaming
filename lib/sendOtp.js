// utils/sendOtp.js
import axios from "axios";

export const sendOTP = async (contact, otp) => {
    try {
        const message = `Thank you for registering. Your OTP is ${otp}. Echelon Institute of Technology! visit www.eitfaridabad.com or call +919999753763 for more updates..`;

        const response = await axios.get(
            "http://bulksms.saakshisoftware.in/api/mt/SendSMS",
            {
                params: {
                    user: process.env.SMS_USER || "demo",
                    password: process.env.SMS_PASS || "demo",
                    senderid: process.env.SENDER_ID || "WEBSMS",
                    channel: "Trans",
                    DCS: 0,
                    flashsms: 0,
                    number: `91${contact}`, // no +, just 91 prefix
                    text: message,
                    route: 1,
                },
            }
        );

        console.log("SMS Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("SMS Error:", error.message);
        throw new Error("Failed to send OTP");
    }
};