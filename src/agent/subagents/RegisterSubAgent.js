import { isLoggedIn } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createRegisterSubAgent = (end) => {

    let stage;
    let username, pin, confirmPin;

    const handleInitialize = async () => {
        if (await isLoggedIn()) {
            return end("Try to log out before registering for a new account.");
        } else{
            stage = "GET_USERNAME";
            return "What username are you planning on having?";
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "GET_USERNAME": return await getUsername(prompt);
            case "GET_PIN": return await getPin(prompt);
            case "GET_CONFIRM_PIN": return await getConfirmPin(prompt);
            case "REGISTER": return await handleRegister();
        }
    }

    const getUsername = async (prompt) => {
        username = prompt;
        stage = "GET_PIN";
        return { msg: "Got it, now what is going to be your new PIN? Make sure it is exactly 7 digits.", nextIsSensitive: true };
    }

    const getPin = async (prompt) => {
        pin = prompt;
        if (pin.length != 7) {
            return end({ msg: "Your new pin was not 7 digits. Please try registering again.", emote: AIEmoteType.ERROR});
        }
        stage = "GET_CONFIRM_PIN";
        return { msg: "Can you enter your new PIN a second time?", nextIsSensitive: true };
    }

    const getConfirmPin = async (prompt) => {
        confirmPin = prompt;
        if (pin !== confirmPin) {
            return end({ msg: "Your pins do not match. Please try registering again.", emote: AIEmoteType.ERROR});
        }
        stage = "REGISTER";
        return await handleRegister();
    }

    const handleRegister = async () => {
        const resp = await fetch("https://cs571api.cs.wisc.edu/rest/su24/hw12/register", {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "X-CS571-ID": CS571.getBadgerId()
            },
            body: JSON.stringify({
                username: username,
                pin: pin
            })
        });

        if (resp.status === 200) {
            return end({ msg: `You have been successfully registered and logged in! Welcome ${username}.`, emote: AIEmoteType.SUCCESS});
        } else if (resp.status === 400) {
            stage = "GET_USERNAME";
            return end({ msg: "Sorry, but your pin must entirely be a number.", emote: AIEmoteType.ERROR});
        } else if (resp.status === 409) {
            stage = "GET_USERNAME";
            return end({ msg: "The username is already taken. Please choose a different username.", emote: AIEmoteType.ERROR});
        } else if (resp.status === 413) {
            stage = "GET_USERNAME";
            return end({ msg: "The username you picked is too long. Try to register again with one under 65 characters.", emote: AIEmoteType.ERROR});
        } else {
            return end({ msg: "An unexpected error occurred.", emote: AIEmoteType.ERROR});
        }
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createRegisterSubAgent;