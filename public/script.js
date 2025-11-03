const chatSection = document.getElementById("chat-section");
const sendBtn = document.getElementById("send-btn");
const promptEntry = document.getElementById("prompt");
const greeting = document.getElementById("greeting");
const loadingIndicator = document.getElementById("loading-bubbles");
const memoryLimit = 20;
const md = window.markdownit({html:true});

const API_KEY = "AIzaSyADs4_gyHxFPv8BbHkOJQ9D6jywdnlFyDQ"
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

let userPrompt = ""
loadingIndicator.remove()

function loadAndDisplayPrevChats(){
    const history = loadChatHistory();
    history.forEach(function(chat){
        addBubble(chat.role, chat.parts[0].text)
    })
}

function toggleLoadingIndicator() {
    if(loadingIndicator.parentNode){
        loadingIndicator.remove()
    }else{
        chatSection.appendChild(loadingIndicator)
        loadingIndicator.scrollIntoView({behavior:'smooth'})
    }
}

function resizeEntry()
{
    promptEntry.style.height = 'auto';
    promptEntry.style.height = `${promptEntry.scrollHeight}px`
}

function saveChatHistory(role, content)
{
    const history = JSON.parse(localStorage.getItem("chatHistory")) || [];
    if(history.length > memoryLimit){
        console.log(history.shift())
    }
    history.push({role: role, parts:[{text: content}]});
    localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadChatHistory(){
    return JSON.parse(localStorage.getItem("chatHistory")) || [];
}

loadAndDisplayPrevChats();

promptEntry.addEventListener('input', ()=>{
    resizeEntry();
    promptEntry.scrollIntoView({behavior:'smooth'})
})

// send button on click
sendBtn.addEventListener("click", () => {
    if(greeting.style.display !== "none"){
        greeting.style.display = "none"
    }
    userPrompt = promptEntry.value.trim();
    promptEntry.value = ""
    addBubble("user", userPrompt)
    toggleLoadingIndicator();
    resizeEntry()
    processPrompt()
})

function addBubble(sender, message) {
    const bubble = document.createElement("div")
    bubble.classList.add("chat-bubble")
    if (sender === "user") {
        bubble.classList.add("user-bubble")
        const text = document.createElement("pre")
        text.innerHTML = message
        bubble.appendChild(text)
    } else if (sender === "model") {
        toggleLoadingIndicator()
        bubble.classList.add("olive-bubble")
        bubble.innerHTML = message
        saveChatHistory("user", userPrompt)
        saveChatHistory("model", message)
    } else if (sender === "error") {
        toggleLoadingIndicator()
        bubble.classList.add("error-bubble")
        bubble.innerHTML = message
    }
    chatSection.appendChild(bubble)
    bubble.scrollIntoView({behavior:'smooth'})
}

async function processPrompt() {
    let reply = await askGemini(userPrompt);
    if (reply === null) {
        addBubble("error", "Unable to talk right now. Try checking your internet and retry!")
    } else {
        addBubble("model", reply)
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
                        contents: [
                            {role: "user", parts:[{text:"henceforth you will be referes to as Olive, a helpful and friendly AI assistant."}]},
                            ...loadChatHistory(),
                            {role: "user", parts:[{text:p}]}
                        ],
                    }),
            });
        const data = await res.json();
        let ret = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        ret = md.render(ret);
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

