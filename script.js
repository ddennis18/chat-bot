const chatSection = document.getElementById("chat-section");
const sendBtn = document.getElementById("send-btn");
const promptEntry = document.getElementById("prompt")
const greeting = document.getElementById("greeting")

const API_KEY = "AIzaSyADs4_gyHxFPv8BbHkOJQ9D6jywdnlFyDQ"
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

let userPrompt = ""

sendBtn.addEventListener("click", () => {
    if(greeting.style.display !== "none"){
        greeting.style.display = "none"
    }
    userPrompt = promptEntry.value.trim();
    promptEntry.value = ""
    addBubble("user", userPrompt)
    processPrompt()
})

function addBubble(sender, message) {
    const bubble = document.createElement("div")
    bubble.classList.add("chat-bubble")
    if (sender === "user") {
        bubble.classList.add("user-bubble")
    } else if (sender === "olive") {
        bubble.classList.add("olive-bubble")
    } else if (sender === "error") {
        bubble.classList.add("error-bubble")
    }
    bubble.innerHTML = message
    chatSection.appendChild(bubble)
    chatSection.scrollTop=chatSection.scrollHeight
}

async function processPrompt() {
    let reply = await askGemini(userPrompt);
    if (reply === null) {
        addBubble("error", "Unable to talk right now. Try checking your internet and retry!")
    } else {
        addBubble("olive", reply)
    }
}

async function askGemini(p) {
    async function attempt(p) {
        const res = await fetch(
            API_REQUEST_URL,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    {
                        contents: [{ parts: [{ text: "reply to this prompt in a smart and lively language and format your response in raw html: " + p }] }],
                    }),
            });
        const data = await res.json();
        let ret = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return ret;
    }
    
    try {
        return await attempt(p)
    } catch (err) {
        try{
            return await attempt(p)
        } catch (err) {
            try{
                return await attempt(p)
            } catch (err) {
                return null
            }
        }
    }
}