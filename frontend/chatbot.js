class Chatbot {
    constructor() {
        this.chatbox = document.querySelector('.chatbot-box');
        this.messages = document.querySelector('.chat-messages');
        this.chatButton = document.querySelector('.chatbot-button');
        this.closeButton = document.querySelector('.close-chat');
        
        this.responses = {
            "how to donate food": "To donate food:\n1. Register as a donor\n2. Log in to your account\n3. Click on 'Donate Food'\n4. Fill in the food details:\n   - Food type\n   - Quantity\n   - Preparation time\n   - Expiry time\n   - Pickup location\n5. Submit the form\nOur team will handle the pickup!",

            "documents required to register as both receiver and donor": "Required documents:\n\nFor Donors:\n- Business registration\n- FSSAI license\n\nFor Receivers:\n- NGO registration",

            "how do i register my restaurant as a donor": "To register your restaurant as a donor:\n1. Sign up on our platform\n2. Provide your business details\n3. Complete FSSAI verification\n4. Set up your profile\n5. Start donating!",
            
            "is there a minimum food quantity requirement": "No, you can donate any amount of food as long as it meets our quality guidelines. We accept both small and large donations.",
            
            "how is food safety ensured": "We ensure food safety through:\n1. Proper food handling guidelines\n2. Quality checks by NGOs\n3. Temperature monitoring\n4. Regular inspections\n5. Feedback system",
            
            "how can an ngo register": "NGOs can register by:\n1. Providing registration details\n2. Verifying credentials\n5. Starting to receive donations",
            
            "can ngos rate donors": "Yes, NGOs can:\n1. Rate donors after receiving food\n2. Provide quality feedback\n3. Share experience\n4. Help maintain standards\n5. Build trust in the community",
            
            "how to register as a receiver": "To register as a receiver:\n1. Click on 'Join as a Receiver'\n2. Fill in your organization details\n3. Verify your credentials\n4. Wait for approval\nOnce approved, you can start receiving donations!",
            
            "what types of food can i donate": "You can donate:\n- Packaged foods\n- Fresh fruits and vegetables\n- Cooked food (within 2-3 hours)\n- Bakery items\n- Beverages\nAll food must be fit for consumption and meet safety standards.",
            
            "how to contact support": "You can contact support through:\n1. Email: support@aaharlink.com\n2. \n4. Raise a complaint and chat with us\nWe're available 24/7!",

            "what are the food safety guidelines": "Our food safety guidelines include:\n- Food must be fresh and properly stored\n- Packaged food must be unopened and within expiry\n- Cooked food must be within 2-3 hours of preparation\n- All food must be properly labeled\n- Temperature control for perishable items\n- Regular quality checks by our team",

            "what happens to donated food": "After donation:\n1. Food is quality checked\n2. Properly packaged\n3. Assigned to nearest receiver\n4. Receiver goes and collects it\n5. Receipt confirmation\n6. Impact tracking",

            "what are the eligibility criteria": "Eligibility criteria:\nFor Donors:\n- Valid ID proof\n- Food business license (if applicable)\n- Compliance with safety standards\n\nFor Receivers:\n- Registered organization\n- Valid documentation\n- Storage facility\n- Distribution network",

            "what is the complaint resolution time": "We aim to resolve complaints within:\n- Critical issues: 2-4 hours\n- General issues: 24 hours\n- Complex issues: 48-72 hours\nYou'll receive updates via email and SMS.",

            "issues regarding donations": "Please raise a complaint and our customer care team will contact you as soon as possible. To raise a complaint:\n1. Log in to your account\n2. Go to 'Support' section\n3. Click 'Raise Complaint'\n4. Fill in the details\n5. Submit\nOur team will respond within 24 hours.",

            "default": "I understand your query. You can register a complaint and our customer care support will reach out to you as soon as possible. To raise a complaint:\n1. Log in to your account\n2. Go to 'Support' section\n3. Click 'Raise Complaint'\n4. Fill in the details\n5. Submit\nOur team will respond within 24 hours.\n\nIn the meantime, you can check our FAQ section for common questions or contact our support team directly."
        };

        this.initializeEventListeners();
        
        // Show welcome message immediately when chatbot is initialized
        this.showWelcomeMessage();
    }

    initializeEventListeners() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.toggleChat());
    }

    toggleChat() {
        this.chatbox.classList.toggle('active');
        if (this.chatbox.classList.contains('active') && this.messages.children.length === 0) {
            this.showWelcomeMessage();
        }
    }

    addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        content.textContent = message;
        content.style.color = sender === 'user' ? '#fff' : '#333';
        
        messageDiv.appendChild(content);
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    generateResponse(question) {
        const response = this.getResponse(question);
        this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
            if (!this.messages.querySelector('.suggestions')) {
                this.addSuggestions();
            }
        }, 1000);
    }

    getResponse(message) {
        const normalizedMessage = message.toLowerCase();
        
        // Check for exact matches first
        for (let key in this.responses) {
            if (normalizedMessage === key) {
                return this.responses[key];
            }
        }
        
        // Check for partial matches
        for (let key in this.responses) {
            if (normalizedMessage.includes(key)) {
                return this.responses[key];
            }
        }
        
        // Fuzzy matching for similar words
        const bestMatch = this.findBestMatch(normalizedMessage);
        if (bestMatch && bestMatch.score > 0.7) {
            return this.responses[bestMatch.key];
        }
        
        // If no match found, return default response
        return this.responses.default;
    }

    findBestMatch(message) {
        let bestMatch = { key: null, score: 0 };
        
        for (let key in this.responses) {
            const score = this.calculateSimilarity(message, key);
            if (score > bestMatch.score) {
                bestMatch = { key, score };
            }
        }
        
        return bestMatch;
    }

    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance implementation
        const track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i += 1) {
            track[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j += 1) {
            track[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1, // deletion
                    track[j - 1][i] + 1, // insertion
                    track[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        
        const distance = track[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - distance / maxLength;
    }

    addSuggestions() {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('suggestions');
        
        // Create array of all available questions from responses
        const allQuestions = Object.keys(this.responses)
            .filter(key => key !== 'default')
            .map(key => {
                // Convert response keys to question format
                return key.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ') + '?';
            });
        
        // Shuffle all questions
        const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
        
        // Show only 6 random questions at a time
        const displayQuestions = shuffledQuestions.slice(0, 6);
        
        displayQuestions.forEach(question => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.textContent = question;
            chip.style.color = '#333';
            chip.addEventListener('click', () => {
                this.addMessage(question, 'user');
                this.generateResponse(question);
            });
            suggestionsDiv.appendChild(chip);
        });
        
        this.messages.appendChild(suggestionsDiv);
    }

    showWelcomeMessage() {
        // Only show welcome message if chat is active and no messages exist
        if (this.chatbox.classList.contains('active') && this.messages.children.length === 0) {
            this.addMessage("Welcome to Aahar Link! 👋\nI'm your virtual assistant here to help you with:\n- Food donation\n- Registration process\n- Food collection\n- Safety guidelines\n- Support services\n\nHow can I assist you today?", 'bot');
            this.addSuggestions();
        }
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        this.messages.appendChild(typingDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = this.messages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Initialize chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 