import { isLoggedIn } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createPostSubAgent = (end) => {

    let stage;
    let chatroom;
    let title, content;
    const CS571_WITAI_ACCESS_TOKEN = "YX7XIYQ7GTKP7BTYGHGC2SWBWUTOGKMB";

    const handleInitialize = async (promptData) => {
        if (!(await isLoggedIn())) {
            return end("Try to log in first before making a post.");
        } else {
            chatroom = promptData.entities["chatrooms:chatrooms"]?.[0]?.value || null;
            if (chatroom) {
                stage = "GET_TITLE";
                return "What should the title of your new post be?";
            }
            return end({ msg: "Sorry, it seems like there was no valid chatroom specified along with yout request."
                + " If you want to see which chatrooms you can post to, just ask about it", emote: AIEmoteType.ERROR});
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "GET_TITLE": return await getTitle(prompt);
            case "GET_CONTENT": return await getContent(prompt);
            case "GET_CONFIRMATION_AND_SEND": return await handleConfirmAndSend(prompt);
        }
    }

    const getTitle = async (prompt) => { 
        title = prompt;
        stage = "GET_CONTENT";
        return "Alright, and what should the contents of your new post be?";
    }
    
    const getContent = async (prompt) => { 
        content = prompt;
        stage = "GET_CONFIRMATION_AND_SEND";
        return `Excellent! Just to confirm, do you want to make a post titled "${title}" in ${chatroom}?`;
    }
    
    const handleConfirmAndSend = async (prompt) => { 
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0 && data.intents[0].name === "wit$confirmation") {
            stage = "GET_CONFIRMATION";
            const resp = await fetch(`https://cs571api.cs.wisc.edu/rest/su24/hw12/messages?chatroom=${encodeURIComponent(chatroom)}`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "X-CS571-ID": CS571.getBadgerId()
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            });

            if (resp.status === 200) {
                return end({ msg: `All set! The post was successfully sent to ${chatroom}`, emote: AIEmoteType.SUCCESS});
            } else if (resp.status === 400) {
                stage = "GET_TITLE";
                return end({ msg: "Your request must contain a title and contents.", emote: AIEmoteType.ERROR});
            } else if (resp.status === 413) {
                stage = "GET_TITLE";
                return end({ msg: "The title or contents of the post are too large. Limit the title to 128 max characters or the content to 1024 max characters.", emote: AIEmoteType.ERROR});
            } else {
                return end({ msg: "An unexpected error occurred.", emote: AIEmoteType.ERROR});
            }
        }

        return end("No problem, feel free to make a post again later if you change your mind.");
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createPostSubAgent;