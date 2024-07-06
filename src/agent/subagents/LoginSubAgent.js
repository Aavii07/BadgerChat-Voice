import { isLoggedIn } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createLoginSubAgent = (end) => {

    let stage;
    let username, pin;

    const handleInitialize = async () => {
        if (await isLoggedIn()) {
            return end("You are already logged in.");
        } else {
            stage = "GET_USERNAME";
            return "Got it, what is your username?";
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "GET_USERNAME": return await getUsername(prompt);
            case "GET_PIN": return await getPin(prompt);
            case "LOG_IN": return await handleLogin();
        }
    }

    const getUsername = async (prompt) => {
        username = prompt;
        stage = "GET_PIN";
        return { msg: "Got it, now what is your PIN?", nextIsSensitive: true };
    }

    const getPin = async (prompt) => {
        pin = prompt;
        stage = "LOG_IN";
        return await handleLogin();
    }

    const handleLogin = async () => {
        const resp = await fetch("https://cs571api.cs.wisc.edu/rest/su24/hw12/login", {
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
            return end({ msg: `Logged in! Welcome ${username}.`, emote: AIEmoteType.SUCCESS});
        } else if (resp.status === 400) {
            stage = "GET_USERNAME";
            return end({ msg: "Your request does not contain a username and pin.", emote: AIEmoteType.ERROR});
        } else if (resp.status === 401) {
            stage = "GET_USERNAME";
            return end({ msg: "Sorry, your username or pin was incorrect.", emote: AIEmoteType.ERROR});
        } else {
            return end({ msg: "An unexpected error occurred.", emote: AIEmoteType.ERROR});
        }
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createLoginSubAgent;