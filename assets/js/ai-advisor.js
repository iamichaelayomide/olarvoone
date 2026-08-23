/**
 * Olarvo One - Contextual AI Business Advisor Module
 * Provides intelligent insights, reorder suggestions, and promotion drafting tailored to African retail.
 */

let aiChatMessages = [];

function initAIAdvisor() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  if (aiChatMessages.length === 0) {
    const settings = window.db.getSettings();
    aiChatMessages = [
      {
        sender: 'ai',
        text: `👋 Hello! I'm your **Olarvo AI Business Assistant** for **${settings.shopName}**.\n\nI analyze your live inventory, sales velocity, and local African shopping trends. How can I assist your business growth today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }

  renderAIChatMessages();
}

function renderAIChatMessages() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  container.innerHTML = aiChatMessages.map(msg => {
    const isAI = msg.sender === 'ai';
    return `
      <div class="flex gap-3 ${isAI ? '' : 'flex-row-reverse'} mb-4 animate-fade-in">
        <div class="w-8 h-8 rounded-xl ${isAI ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white' : 'bg-slate-700 text-white'} flex items-center justify-center flex-shrink-0 shadow-sm">
          <i data-lucide="${isAI ? 'sparkles' : 'user'}" class="w-4 h-4"></i>
        </div>
        <div class="max-w-[80%]">
          <div class="p-3.5 rounded-2xl text-xs leading-relaxed ${
            isAI 
              ? 'chat-bubble-ai text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm' 
              : 'bg-blue-600 text-white rounded-tr-none shadow-md'
          }">
            ${formatAIMessageMarkdown(msg.text)}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 ${isAI ? 'text-left' : 'text-right'}">
            ${msg.timestamp}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

function formatAIMessageMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/• (.*?)(?=(\n|$))/g, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function askAIPrompt(promptText) {
  const input = document.getElementById('ai-chat-input');
  if (input) input.value = promptText;
  handleSendAIMessage();
}

function handleSendAIMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const query = input ? input.value.trim() : '';

  if (!query) return;

  // Add User Message
  aiChatMessages.push({
    sender: 'user',
    text: query,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  input.value = '';
  renderAIChatMessages();

  // Show Typing Indicator
  showAITypingIndicator();

  setTimeout(() => {
    removeAITypingIndicator();
    const responseText = generateAIResponse(query);
    aiChatMessages.push({
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderAIChatMessages();
  }, 750);
}

function showAITypingIndicator() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'ai-typing-indicator';
  typingDiv.className = 'flex gap-3 mb-4';
  typingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
      <i data-lucide="sparkles" class="w-4 h-4"></i>
    </div>
    <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5">
      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
    </div>
  `;
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

function removeAITypingIndicator() {
  const el = document.getElementById('ai-typing-indicator');
  if (el) el.remove();
}

// Intelligent Context-Aware Engine
function generateAIResponse(prompt) {
  const q = prompt.toLowerCase();
  const products = window.db.getProducts();
  const sales = window.db.getSales();
  const customers = window.db.getCustomers();
  const settings = window.db.getSettings();

  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const debtors = customers.filter(c => (c.debtBalance || 0) > 0);

  if (q.includes('restock') || q.includes('inventory') || q.includes('stock')) {
    if (lowStockItems.length === 0) {
      return `📦 **Inventory Analysis:**\n\nAll your catalog items are currently within safe stock thresholds! You don't have urgent stock shortages.\n\n💡 **Recommendation:** Keep monitoring high-velocity items before the coming weekend rush.`;
    }
    const list = lowStockItems.map(p => `• **${p.name}**: Only **${p.stock} ${p.unit}** remaining (Threshold: ${p.lowStockThreshold})`).join('\n');
    return `🚨 **Urgent Restock Recommendation:**\n\nYou have **${lowStockItems.length} items** running low on stock:\n\n${list}\n\n💡 **Action Step:** Contact your suppliers to restock these items before peak weekend sales to prevent stockout losses!`;
  }

  if (q.includes('promo') || q.includes('whatsapp') || q.includes('discount') || q.includes('campaign')) {
    return `📢 **Recommended Weekend Promotion Strategy (Lagos & Urban Hubs):**\n\nBased on local shopping behaviors, Friday afternoon and Saturday mornings show 35% higher foot traffic.\n\n*Suggested WhatsApp Broadcast Template:*\n\n"🎉 *WEEKEND SPECIAL AT ${settings.shopName.toUpperCase()}!* 🛍️\nStock up on quality household essentials & provisions this weekend!\n\n✨ *Semovita (10kg)* + *Milo Refill Pack* bundle deals\n⚡ *Oraimo Power Banks* & fast-charging accessories at special discount!\n\n📍 Visit us at: ${settings.address}\n📞 Order via WhatsApp: ${settings.phone}\n_Fast in-store pickup & dispatch available!_"`;
  }

  if (q.includes('best selling') || q.includes('profit') || q.includes('performance') || q.includes('margin')) {
    return `📊 **Shop Performance & Profit Insights:**\n\n• **Total Recorded Revenue:** ${formatCurrency(totalSalesRevenue)}\n• **Estimated Net Profit:** ${formatCurrency(totalProfit)}\n• **Average Profit Margin:** ~${totalSalesRevenue > 0 ? ((totalProfit / totalSalesRevenue) * 100).toFixed(1) : 0}%\n\n💡 **Top Margin Tip:** Electronics and Fashion categories in your catalog carry a **30-40% margin**, while Groceries provide rapid turnover volume. Bundle high-margin accessories with popular fast-moving items!`;
  }

  if (q.includes('debt') || q.includes('debtor') || q.includes('credit') || q.includes('owing')) {
    if (debtors.length === 0) {
      return `✅ **Debtor Health:** Excellent news! None of your customers currently have outstanding credit balances.`;
    }
    const debtorList = debtors.map(d => `• **${d.name}**: ${formatCurrency(d.debtBalance)} (${d.phone})`).join('\n');
    const totalDebt = debtors.reduce((sum, d) => sum + d.debtBalance, 0);
    return `⚠️ **Outstanding Credit Review:**\n\nYou currently have **${debtors.length} customer(s)** with unpaid balances totaling **${formatCurrency(totalDebt)}**:\n\n${debtorList}\n\n💡 **Tip:** Use the one-click WhatsApp Reminder feature in the Customers tab to politely follow up on outstanding payments.`;
  }

  // Default intelligent response
  return `🤖 **Olarvo AI Shop Intelligence:**\n\nHere is a quick snapshot for **${settings.shopName}**:\n\n• **Catalog Size:** ${products.length} products (${lowStockItems.length} low in stock)\n• **Completed Sales:** ${sales.length} transactions (${formatCurrency(totalSalesRevenue)})\n• **Registered Customers:** ${customers.length} profiles\n\nAsk me anything specific like:\n- *"Which items should I reorder?"*\n- *"Draft a customer promo message"*\n- *"How can I increase my grocery turnover?"*`;
}
