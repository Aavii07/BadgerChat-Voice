import createChatDelegator from "./ChatDelegator";
import { ofRandom, getLoggedInUsername, isLoggedIn, logout } from "./Util"
import AIEmoteType from '../components/chat/messages/AIEmoteType';

const createChatAgent = () => {
    const CS571_WITAI_ACCESS_TOKEN = "YX7XIYQ7GTKP7BTYGHGC2SWBWUTOGKMB";

    const delegator = createChatDelegator();

    let chatrooms = [];

    const handleInitialize = async () => {
        const resp = await fetch("https://cs571api.cs.wisc.edu/rest/su24/hw12/chatrooms", {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });
        const data = await resp.json();
        chatrooms = data;

        return "Welcome to BadgerChat! My name is Bucki, how can I help you?";
    }

    const handleReceive = async (prompt) => {
        if (delegator.hasDelegate()) { return delegator.handleDelegation(prompt); }
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0) {
            switch (data.intents[0].name) {
                case "get_help": return handleGetHelp();
                case "get_chatrooms": return handleGetChatrooms();
                case "get_messages": return handleGetMessages(data);
                case "login": return handleLogin();
                case "register": return handleRegister();
                case "create_message": return handleCreateMessage(data);
                case "logout": return handleLogout();
                case "whoami": return handleWhoAmI();
            }
        }
        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const handleGetHelp = async () => {
        return ofRandom([
            "Try asking 'give the 3 latest messages', or ask for more help!",
            "Try asking 'get a list of chatrooms' to see where you can post or read more messages from, or ask for more help!",
            "New to badgerChat? Try asking me to register for an account!",
            "You can ask me to 'login' or 'register,' and then 'create a message'. Try it out!",
            "Need assistance? Try asking me to register or log into an account!.",
            "Ask 'who am I' to find out more about your current status as a user, or ask for more help!"
        ])
    }

    const handleGetChatrooms = async () => {
        return `There are ${chatrooms.length} chatrooms available: ${chatrooms.join(', ')}`;
    }

    const handleGetMessages = async (data) => {
        // extract entities
        let numMessages = data.entities["wit$number:number"]?.[0]?.value || 1;
        let chatroom = data.entities["chatrooms:chatrooms"]?.[0]?.value || null;

        // building URL
        let url = "https://cs571api.cs.wisc.edu/rest/su24/hw12/messages?"; // general; all messages
        if (chatroom) {
            url += `chatroom=${encodeURIComponent(chatroom)}&`; // add specific chatroom if specified
        }
        url += `num=${numMessages}`; // add number of messages (defaulted to 1)

        const resp = await fetch(url, {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });
        const messagesData = await resp.json();

        // response
        if (messagesData.messages && messagesData.messages.length > 0) {
            const responses = messagesData.messages.map(msg => {
                return `In ${msg.chatroom}, ${msg.poster} made a post titled ${msg.title} which reads: ${msg.content}`;
            });
            return responses;
        } else {
            return ["It seems like nobody has posted anything here yet."];
        }
    }

    const handleLogin = async () => {
        return await delegator.beginDelegation("LOGIN");
    }

    const handleRegister = async () => {
        return await delegator.beginDelegation("REGISTER");
    }

    const handleCreateMessage = async (data) => {
        return await delegator.beginDelegation("CREATE", data);
    }

    const handleLogout = async () => {
        if (!(await isLoggedIn())){
            return "You are already logged out.";
        }
        await logout();
        return ({ msg: "You have been logged out.", emote: AIEmoteType.SUCCESS});
    }

    const handleWhoAmI = async () => {
        if (await isLoggedIn()) {
            return `You are currently logged in as ${await getLoggedInUsername()}.`
        } else {
            return "You are currently not logged in.";
        }
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createChatAgent;