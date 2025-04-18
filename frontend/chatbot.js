class Chatbot {
    constructor() {
        this.chatbox = document.querySelector('.chatbot-box');
        this.messages = document.querySelector('.chat-messages');
        this.input = document.querySelector('.chat-input input');
        this.sendButton = document.querySelector('.chat-input button');
        this.chatButton = document.querySelector('.chatbot-button');
        this.closeButton = document.querySelector('.close-chat');
        
        // Load chat history from localStorage
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        
        // Track if this is the first visit
        this.isFirstVisit = !localStorage.getItem('chatHistory');
        
        // Set input text color to dark
        this.input.style.color = '#333';
        
        this.suggestions = [
            "How to donate food?",
            "Documents required to register as both receiver and donor",
            "How to submit complaint?",
            "How do I register my restaurant as a donor?",
            "Is there a minimum food quantity requirement?",
            "Can I schedule donations in advance?",
            "What if an NGO doesn't pick up the food?",
            "How is food safety ensured?",
            "How can an NGO register?",
            "Can I schedule food pickups?",
            "Can NGOs rate donors?",
            "What happens if a donation is cancelled?",
            "How to register as a receiver?",
            "What types of food can I donate?",
            "Is my data secure?",
            "How to contact support?",
            "What are the food safety guidelines?",
            "How is food transported?",
            "What happens to donated food?",
            "Can I track my donation?",
            "What are the eligibility criteria?",
            "How do I raise a complaint?",
            "What is the complaint resolution time?",
            "Can I get a refund?",
            "How do I update my profile?",
            "How do I change my password?",
            "Can I delete my account?",
            "How do I report misuse?",
            "What are the service areas?",
            "How do I become a volunteer?"
        ];

        this.responses = {
            "how to donate food": "To donate food:\n1. Register as a donor\n2. Log in to your account\n3. Click on 'Donate Food'\n4. Fill in the food details:\n   - Food type\n   - Quantity\n   - Preparation time\n   - Expiry time\n   - Pickup location\n5. Submit the form\nOur team will handle the pickup!",

            "documents required to register as both receiver and donor": "Required documents:\n\nFor Donors:\n- Business registration\n- FSSAI license\n- Address proof\n- ID proof\n- Bank details\n- Food safety certificate\n- Tax registration\n\nFor Receivers:\n- NGO registration\n- Tax exemption certificate\n- Bank details\n- Address proof\n- ID proof\n- Storage facility proof\n- Distribution network proof\n- Food handling license",

            "how to submit complaint": "To submit a complaint:\n1. Log in to your account\n2. Go to 'Support' section\n3. Click 'Submit Complaint'\n4. Fill in the details:\n   - Complaint type\n   - Description\n   - Date and time\n   - Evidence (if any)\n5. Submit\nOur team will respond within 24 hours.",

            "how do i register my restaurant as a donor": "To register your restaurant as a donor:\n1. Sign up on our platform\n2. Provide your business details\n3. Complete FSSAI verification\n4. Set up your profile\n5. Start donating!",
            
            "is there a minimum food quantity requirement": "No, you can donate any amount of food as long as it meets our quality guidelines. We accept both small and large donations.",
            
            "can i schedule donations in advance": "Yes! You can:\n1. Set preferred donation schedules\n2. Plan regular pickups\n3. Coordinate with NGOs\n4. Manage your donation calendar\nThis helps NGOs plan their operations better.",
            
            "what if an ngo doesn't pick up the food": "If an NGO doesn't collect within the scheduled time:\n1. You can cancel the donation\n2. Reassign to another NGO\n3. Contact our support team\n4. Update the pickup schedule",
            
            "how is food safety ensured": "We ensure food safety through:\n1. Proper food handling guidelines\n2. Quality checks by NGOs\n3. Temperature monitoring\n4. Regular inspections\n5. Feedback system",
            
            "how can an ngo register": "NGOs can register by:\n1. Providing registration details\n2. Verifying credentials\n3. Setting up profile\n4. Defining service areas\n5. Starting to receive donations",
            
            "can i schedule food pickups": "Yes! After claiming a donation:\n1. Coordinate with donor\n2. Set pickup time\n3. Arrange transportation\n4. Confirm details\n5. Complete the pickup",
            
            "can ngos rate donors": "Yes, NGOs can:\n1. Rate donors after receiving food\n2. Provide quality feedback\n3. Share experience\n4. Help maintain standards\n5. Build trust in the community",
            
            "what happens if a donation is cancelled": "If a donation is cancelled:\n1. You'll receive notification\n2. Look for alternative donations\n3. Check other available options\n4. Contact support if needed",
            
            "how to register as a receiver": "To register as a receiver:\n1. Click on 'Join as a Receiver'\n2. Fill in your organization details\n3. Verify your credentials\n4. Wait for approval\nOnce approved, you can start receiving donations!",
            
            "what types of food can i donate": "You can donate:\n- Packaged foods\n- Fresh fruits and vegetables\n- Cooked food (within 2-3 hours)\n- Bakery items\n- Beverages\nAll food must be fit for consumption and meet safety standards.",
            
            "is my data secure": "Yes, your data is secure! We use:\n- End-to-end encryption\n- Secure servers\n- Regular security audits\n- No sharing with third parties\nYour privacy is our priority!",
            
            "how to contact support": "You can contact support through:\n1. Email: support@aaharlink.com\n2. Phone: 1800-XXX-XXXX\n3. Chat with us here\n4. Visit our help center\nWe're available 24/7!",

            "what are the food safety guidelines": "Our food safety guidelines include:\n- Food must be fresh and properly stored\n- Packaged food must be unopened and within expiry\n- Cooked food must be within 2-3 hours of preparation\n- All food must be properly labeled\n- Temperature control for perishable items\n- Regular quality checks by our team",

            "how is food transported": "Our food transportation process:\n1. Temperature-controlled vehicles\n2. Trained delivery personnel\n3. Real-time tracking\n4. Quick delivery within 2 hours\n5. Regular vehicle maintenance\n6. Safety protocols followed",

            "what happens to donated food": "After donation:\n1. Food is quality checked\n2. Properly packaged\n3. Assigned to nearest receiver\n4. Delivered within 2 hours\n5. Receipt confirmation\n6. Impact tracking",

            "can i track my donation": "Yes! You can track your donation through:\n1. Your donor dashboard\n2. Real-time status updates\n3. Delivery confirmation\n4. Impact reports\n5. Receiver feedback",

            "what are the eligibility criteria": "Eligibility criteria:\nFor Donors:\n- Valid ID proof\n- Food business license (if applicable)\n- Compliance with safety standards\n\nFor Receivers:\n- Registered organization\n- Valid documentation\n- Storage facility\n- Distribution network",

            "how do i raise a complaint": "To raise a complaint:\n1. Log in to your account\n2. Go to 'Support' section\n3. Click 'Raise Complaint'\n4. Fill in the details\n5. Submit\nOur team will respond within 24 hours.",

            "what is the complaint resolution time": "We aim to resolve complaints within:\n- Critical issues: 2-4 hours\n- General issues: 24 hours\n- Complex issues: 48-72 hours\nYou'll receive updates via email and SMS.",

            "can i get a refund": "Refund policies:\n1. Processing fee: Refundable within 24 hours\n2. Subscription: Pro-rated refund available\n3. Special cases: Contact support\nPlease note: Donation amounts are non-refundable.",

            "how do i update my profile": "To update your profile:\n1. Log in to your account\n2. Click on 'Profile Settings'\n3. Edit required information\n4. Upload new documents if needed\n5. Save changes",

            "how do i change my password": "To change password:\n1. Log in to your account\n2. Go to 'Security Settings'\n3. Click 'Change Password'\n4. Enter current password\n5. Set new password\n6. Confirm new password",

            "can i delete my account": "To delete your account:\n1. Log in to your account\n2. Go to 'Account Settings'\n3. Click 'Delete Account'\n4. Confirm deletion\nNote: This action is irreversible.",

            "how do i report misuse": "To report misuse:\n1. Click 'Report' button\n2. Select type of misuse\n3. Provide details\n4. Add evidence if available\n5. Submit report\nWe take all reports seriously.",

            "what are the service areas": "We currently serve:\n- Major metropolitan cities\n- Tier 1 and 2 cities\n- Selected rural areas\nCheck our coverage map for details.",

            "how do i become a volunteer": "To become a volunteer:\n1. Register on our platform\n2. Complete verification\n3. Attend training\n4. Choose service area\n5. Start helping!\nJoin our community of changemakers!",

            "default": "I understand your query. You can register a complaint and our customer care support will reach out to you as soon as possible. To raise a complaint:\n1. Log in to your account\n2. Go to 'Support' section\n3. Click 'Raise Complaint'\n4. Fill in the details\n5. Submit\nOur team will respond within 24 hours.\n\nIn the meantime, you can check our FAQ section for common questions or contact our support team directly."
        };

        this.initializeEventListeners();
        this.loadChatHistory();
        this.addSuggestions();
        
        // Show welcome message immediately when chatbot is initialized
        this.showWelcomeMessage();
    }

    initializeEventListeners() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.toggleChat());
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
        
        // Add event listener for input focus
        this.input.addEventListener('focus', () => {
            this.chatbox.classList.add('active');
        });
    }

    toggleChat() {
        this.chatbox.classList.toggle('active');
        if (this.chatbox.classList.contains('active') && this.messages.children.length === 0) {
            this.showWelcomeMessage();
        }
    }

    handleSend() {
        const message = this.input.value.trim();
        if (message) {
            this.addMessage(message, 'user');
            this.saveToHistory(message, 'user');
            this.input.value = '';
            this.showTypingIndicator();
            this.generateResponse(message);
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

    generateResponse(message) {
        const response = this.getResponse(message);
        setTimeout(() => {
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
            this.saveToHistory(response, 'bot');
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
        
        // If no match found, return default response with complaint suggestion
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
        
        // Shuffle suggestions for variety
        const shuffledSuggestions = [...this.suggestions].sort(() => Math.random() - 0.5);
        
        // Show only 6 random suggestions at a time
        const displaySuggestions = shuffledSuggestions.slice(0, 6);
        
        displaySuggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.textContent = suggestion;
            chip.style.color = '#333';
            chip.addEventListener('click', () => {
                this.input.value = suggestion;
                this.handleSend();
            });
            suggestionsDiv.appendChild(chip);
        });
        
        this.messages.appendChild(suggestionsDiv);
    }

    saveToHistory(message, sender) {
        this.chatHistory.push({ message, sender, timestamp: new Date().toISOString() });
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        if (this.chatHistory.length > 0 && !this.isFirstVisit) {
            // Only show the last 5 messages from history
            const recentHistory = this.chatHistory.slice(-5);
            recentHistory.forEach(item => {
                this.addMessage(item.message, item.sender);
            });
        }
    }

    showWelcomeMessage() {
        // Only show welcome message if chat is active and no messages exist
        if (this.chatbox.classList.contains('active') && this.messages.children.length === 0) {
            this.addMessage("Welcome to Aahar Link! 👋\nI'm your virtual assistant here to help you with:\n- Food donation\n- Registration process\n- Food collection\n- Safety guidelines\n- Support services\n\nHow can I assist you today?", 'bot');
            this.addSuggestions();
        }
    }
}

// Initialize chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 