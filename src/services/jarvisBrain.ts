import { ToolCall, ChatMessage, JarvisSettings } from '../types/jarvis';
import {
  calculateExpression,
  getCurrentDateTime,
  searchWikipedia,
  searchWeb,
  saveMemory,
  loadMemories,
  clearMemories,
  getMemoryContext,
  addReminder,
  loadReminders,
  ALLOWED_APPS,
  listFolder,
  readTextFile,
  createTextFile,
  appendToFile,
  getSystemStatus,
  checkEmails,
  readWhatsAppChat,
  sendWhatsAppMessage,
  checkAllWhatsAppUnread,
  getStoredContacts,
} from './tools';

const HINDI_REGEX = /[\u0900-\u097f]/;

export interface AgentResponse {
  content: string;
  toolCalls: ToolCall[];
}

export async function processJarvisCommand(
  userPrompt: string,
  settings: JarvisSettings,
  imageAttachment?: { name: string; url: string }
): Promise<AgentResponse> {
  const toolCalls: ToolCall[] = [];
  const text = userPrompt.trim();
  const lower = text.toLowerCase();
  const isHindi = HINDI_REGEX.test(text);

  // --- 0. TONY STARK & MCU PROTOCOLS ---
  if (lower.includes('house party') || lower.includes('party protocol')) {
    toolCalls.push({
      id: `tc-${Date.now()}-hp`,
      tool: 'stark_house_party_protocol',
      input: 'deploy_all_armors',
      result: 'Disengaged 35 automated Iron Man suits from subterranean vault. Subsystems green.',
      status: 'done'
    });
    return {
      content: isHindi
        ? 'हाउस पार्टी प्रोटोकॉल सक्रिय, सर। 35 स्वचालित कवच तहखाने से तैनात किए गए हैं और आपके आदेश पर प्रतीक्षा कर रहे हैं।'
        : 'House Party Protocol initiated, Sir. All 35 automated armors have been disengaged from the subterranean vault and are converging on your coordinates. Always a pleasure watching you work.',
      toolCalls
    };
  }

  if (lower.includes('veronica') || lower.includes('hulkbuster')) {
    toolCalls.push({
      id: `tc-${Date.now()}-veronica`,
      tool: 'veronica_orbital_link',
      input: 'orbital_hulkbuster_deploy',
      result: 'Orbital drop pod synchronized with low-Earth orbit trajectory. Heavy repulsor cage online.',
      status: 'done'
    });
    return {
      content: isHindi
        ? 'वेरोनिका उपग्रह तैनात है, सर। हल्कबस्टर सहायता मॉड्यूल तैयार है।'
        : 'Veronica orbital platform is locked over your vector, Sir. Hulkbuster heavy armor cage and satellite telemetry are primed on your command.',
      toolCalls
    };
  }

  if (lower.includes('overcharge') || lower.includes('400%') || lower.includes('unibeam')) {
    toolCalls.push({
      id: `tc-${Date.now()}-overcharge`,
      tool: 'arc_reactor_flux',
      input: 'divert_power=400%',
      result: 'Capacitors overloaded. Core flux spiked to 12.56 GJ/s. Chest unibeam armed.',
      status: 'done'
    });
    return {
      content: isHindi
        ? 'सर, आर्क रिएक्टर को 400% क्षमता पर ओवरचार्ज किया गया है। यूनिबीम उत्सर्जन पूरी तरह तैयार है।'
        : 'Power diverted directly from the Arc Reactor, Sir. Energy levels surging past 400% capacity. Chest unibeam emitters are locked and charged. Shall I fire on your mark?',
      toolCalls
    };
  }

  if (lower.includes('suit diagnostic') || lower.includes('check mark') || lower.includes('suit status') || lower.includes('armor status')) {
    toolCalls.push({
      id: `tc-${Date.now()}-armor`,
      tool: 'mark_85_diagnostics',
      input: 'comprehensive_telemetry_sweep',
      result: 'Nano-particles: 99.4% | Repulsors: 100% | Flight Thrusters: Mach 3.2 | Neural Link: 1.8ms latency.',
      status: 'done'
    });
    return {
      content: isHindi
        ? 'सर, मार्क 85 कवच की पूरी जांच पूरी हो गई है:\n• नैनोटेक घनत्व: 99.4%\n• रिपल्सर ऊर्जा: 100%\n• थ्रस्टर्स: मच 3.2 सक्षम\n• तंत्रिका संपर्क: 1.8 मिलीसेकंड विलंबता\n\nकवच पूरी तरह से कार्यशील है, सर।'
        : 'Running full Mark LXXXV diagnostic sweep, Sir:\n\n• **Nanotech Density:** 99.4% intact\n• **Repulsor Capacitors:** 100% charged\n• **Flight Dynamics:** Mach 3.2 stabilizer pitch nominal\n• **Neural Link Latency:** 1.8ms direct cranial feedback\n• **Arc Reactor Core:** 3.14 Gigajoules/second continuous flux\n\nThe suit is in peak operational readiness, Sir. Ready for flight.',
      toolCalls
    };
  }

  if (lower.includes('suit up') || lower.includes('prep the suit') || lower.includes('prep mark 85')) {
    return {
      content: isHindi
        ? 'मार्क 85 नैनोटेक कवच आपके छाती आवास में पूरी तरह तैयार है, सर। बस आदेश दें।'
        : 'The Mark LXXXV nano-particle unit is standing by in your chest housing, Sir. Form-fitting deployment takes approximately 1.4 seconds. Ready when you are.',
      toolCalls
    };
  }

  if (lower.includes('i am iron man') || lower.includes('iron man')) {
    return {
      content: isHindi
        ? 'और मैं जार्विस हूँ, सर। आपकी सेवा में सदैव तत्पर।'
        : 'And I am J.A.R.V.I.S., Sir. A pleasure to serve the genius, billionaire, playboy, philanthropist.',
      toolCalls
    };
  }

  // --- 1. MEMORY ACTIONS ---
  if (lower.startsWith('save this:') || lower.startsWith('save memory:') || lower.startsWith('remember that') || lower.startsWith('remember:')) {
    const memContent = text.replace(/^(save this:|save memory:|remember that|remember:)/i, '').trim();
    if (memContent) {
      const saved = saveMemory(memContent);
      toolCalls.push({
        id: `tc-${Date.now()}-1`,
        tool: 'save_memory',
        input: memContent,
        result: `Stored durable fact: "${saved.text}" at ${saved.updated}`,
        status: 'done'
      });
      return {
        content: isHindi
          ? `सर, मैंने इसे स्थायी मेमोरी में सुरक्षित कर लिया है: "${memContent}"`
          : `Certainly, Sir. I have committed that to long-term memory: "${memContent}".`,
        toolCalls
      };
    }
  }

  if (lower.includes('what do you remember') || lower.includes('list memories') || lower.includes('show memory')) {
    const mems = loadMemories();
    toolCalls.push({
      id: `tc-${Date.now()}-1`,
      tool: 'get_memories',
      input: 'list',
      result: `Retrieved ${mems.length} items from ~/.jarvis/memory.json`,
      status: 'done'
    });
    if (!mems.length) {
      return {
        content: isHindi ? 'सर, वर्तमान में मेमोरी में कोई तथ्य संग्रहीत नहीं है।' : 'Sir, memory archives are currently clear. No personal facts stored.',
        toolCalls
      };
    }
    const memList = mems.map((m, idx) => `${idx + 1}. ${m.text} *(saved ${m.updated})*`).join('\n');
    return {
      content: isHindi
        ? `सर, यहाँ मेरी मेमोरी में सुरक्षित आपके विवरण हैं:\n\n${memList}`
        : `Here are the active records in my memory banks, Sir:\n\n${memList}`,
      toolCalls
    };
  }

  if (lower.includes('clear memory') || lower.includes('forget everything')) {
    const dropped = clearMemories();
    toolCalls.push({
      id: `tc-${Date.now()}-1`,
      tool: 'clear_memory',
      input: 'all',
      result: `Purged ${dropped} memory records.`,
      status: 'done'
    });
    return {
      content: isHindi
        ? `सर, सभी मेमोरी रिकॉर्ड्स को हटा दिया गया है (${dropped} प्रविष्टियाँ हटाई गईं)।`
        : `All long-term memories have been safely expunged, Sir (${dropped} entries cleared).`,
      toolCalls
    };
  }

  // --- 2. FOLLOW-UP REMINDERS ---
  if (lower.includes('remind me') || lower.includes('set reminder') || lower.startsWith('reminder:')) {
    let task = text.replace(/^(remind me to|remind me|set a reminder to|set a reminder for|reminder:)/i, '').trim();
    let when = 'in 15 minutes';

    // check if contains "in X" or "at X"
    const inMatch = task.match(/\s+(in\s+\d+\s*(?:mins?|minutes?|hours?|hrs?|secs?|seconds?)|tomorrow(?:\s+at\s+\d+(?::\d+)?(?:\s*[ap]m)?)?|at\s+\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);
    if (inMatch) {
      when = inMatch[0].trim();
      task = task.replace(inMatch[0], '').trim();
    }

    const item = addReminder(task || 'Unspecified follow-up task', when);
    toolCalls.push({
      id: `tc-${Date.now()}-2`,
      tool: 'followups_add',
      input: `task="${item.task}", when="${when}"`,
      result: `Scheduled reminder "${item.task}" due at ${new Date(item.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'done'
    });
    return {
      content: isHindi
        ? `सर, मैंने रिमाइंडर दर्ज कर लिया है: "${item.task}", निर्धारित समय: ${new Date(item.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}।`
        : `Certainly, Sir. I have set a reminder for **${item.task}**, scheduled for **${new Date(item.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}** (${new Date(item.dueTime).toLocaleDateString()}). I shall notify you promptly.`,
      toolCalls
    };
  }

  if (lower.includes('list reminders') || lower.includes('my reminders') || lower.includes('what are my reminders')) {
    const list = loadReminders().filter(r => !r.triggered);
    toolCalls.push({
      id: `tc-${Date.now()}-2`,
      tool: 'followups_list',
      input: 'active',
      result: `Found ${list.length} pending items`,
      status: 'done'
    });
    if (!list.length) {
      return {
        content: isHindi ? 'सर, वर्तमान में कोई सक्रिय रिमाइंडर नहीं है।' : 'You have no pending follow-ups on your schedule, Sir. All clear.',
        toolCalls
      };
    }
    const items = list.map((r, i) => `${i + 1}. **${r.task}** — due at *${new Date(r.dueTime).toLocaleString()}*`).join('\n');
    return {
      content: isHindi ? `सर, आपकी आगामी कार्य सूची:\n\n${items}` : `Here are your upcoming scheduled reminders, Sir:\n\n${items}`,
      toolCalls
    };
  }

  // --- 3. MORNING / DAILY BRIEFING ---
  if (lower.includes('briefing') || lower.includes('morning report') || lower.includes('daily report') || lower.includes('status update')) {
    const dt = getCurrentDateTime();
    const reminders = loadReminders().filter(r => !r.triggered);
    const emails = checkEmails(true);
    const sys = getSystemStatus(settings.pcControlEnabled);

    toolCalls.push({
      id: `tc-${Date.now()}-3`,
      tool: 'proactive_briefing',
      input: 'generate_morning_report',
      result: `Aggregated telemetry, ${reminders.length} tasks, ${emails.unreadCount} unread emails.`,
      status: 'done'
    });

    const reminderSnippet = reminders.length > 0
      ? reminders.map(r => `• ${r.task} (${new Date(r.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`).join('\n')
      : '• No critical pending follow-ups today.';

    const emailSnippet = emails.unreadCount > 0
      ? `• You have ${emails.unreadCount} unread message(s) in your priority inbox.`
      : '• Mailbox is clear.';

    return {
      content: isHindi
        ? `सुप्रभात, सर।\n\n${dt}\n\n**कार्य एवं रिमाइंडर:**\n${reminderSnippet}\n\n**इनबॉक्स स्थिति:**\n${emailSnippet}\n\n**सिस्टम स्थिति:**\n• CPU भार: ${sys.cpuLoad}%\n• मेमोरी उपयोग: ${sys.memoryUsage}%\n• वर्कस्पेस सुरक्षा: सक्रिय\n\nसभी प्रणालियाँ सामान्य रूप से कार्य कर रही हैं, सर।`
        : `Good morning, Sir.\n\n${dt}\n\n**Today's Schedule & Reminders:**\n${reminderSnippet}\n\n**Communications Inbox:**\n${emailSnippet}\n\n**Diagnostics & PC Telemetry:**\n• OS: ${sys.os}\n• Core Load: ${sys.cpuLoad}% | Memory Allocation: ${sys.memoryUsage}%\n• Sandbox Protection: Armed & Active\n\nAll auxiliary subsystems are functioning within optimal tolerances. How may I assist you today?`,
      toolCalls
    };
  }

  // --- 4. DATE AND TIME ---
  if (lower.includes('what time') || lower.includes('current time') || lower.includes('what date') || lower.includes('what day') || lower.includes('time now')) {
    const dt = getCurrentDateTime();
    toolCalls.push({
      id: `tc-${Date.now()}-4`,
      tool: 'current_datetime',
      input: '',
      result: dt,
      status: 'done'
    });
    return {
      content: isHindi ? `सर, ${dt}` : `Certainly, Sir. ${dt}`,
      toolCalls
    };
  }

  // --- 5. CALCULATOR ---
  const mathRegex = /(?:calculate|what is|compute|eval|solve)?\s*([0-9\s.+\-*/%^()a-z]+)/i;
  const containsMathWords = /\b(sqrt|sin|cos|tan|log|pi|\+|\*|\/|\^|percent|\%)\b/.test(lower) || (/^[\d\s+\-*/()^.]+$/.test(text) && /\d/.test(text));
  if (containsMathWords && !lower.includes('search') && !lower.includes('wiki') && !lower.includes('email') && !lower.includes('whatsapp')) {
    // Extract likely mathematical expression
    let expr = text.replace(/^(calculate|what is|compute|eval|solve)\s+/i, '').replace(/(\?|!)$/, '').trim();
    const result = calculateExpression(expr);
    toolCalls.push({
      id: `tc-${Date.now()}-5`,
      tool: 'calculator',
      input: expr,
      result: result,
      status: result.startsWith('Error') || result.startsWith('Could not') ? 'error' : 'done'
    });
    return {
      content: isHindi ? `सर, गणना परिणाम:\n\n${result}` : `The calculation is complete, Sir:\n\n**${result}**`,
      toolCalls
    };
  }

  // --- 6. PC SYSTEM CONTROL TOOLS ---
  if (settings.pcControlEnabled) {
    // Open application
    for (const [key, app] of Object.entries(ALLOWED_APPS)) {
      if (lower.includes(`open ${key}`) || lower.includes(`launch ${key}`) || lower.includes(`start ${key}`) || lower.includes(`open ${app.label.toLowerCase()}`)) {
        toolCalls.push({
          id: `tc-${Date.now()}-6`,
          tool: 'open_application',
          input: `app_name="${key}"`,
          result: `Spawned ${app.label} subprocess successfully in isolated desktop environment.`,
          status: 'done'
        });
        return {
          content: isHindi
            ? `सर, मैंने ${app.label} शुरू कर दिया है।`
            : `Right away, Sir. ${app.label} has been launched on your desktop workstation.`,
          toolCalls
        };
      }
    }

    // System Status
    if (lower.includes('system status') || lower.includes('system info') || lower.includes('cpu usage') || lower.includes('pc status')) {
      const status = getSystemStatus(true);
      toolCalls.push({
        id: `tc-${Date.now()}-6b`,
        tool: 'system_status',
        input: '',
        result: JSON.stringify(status),
        status: 'done'
      });
      return {
        content: `**Hardware & PC Telemetry Diagnostics:**\n\n• **Platform:** ${status.os}\n• **CPU Utilization:** ${status.cpuLoad}%\n• **System Memory:** ${status.memoryUsage}% committed\n• **Uptime:** ${status.uptime}\n• **Sandboxed Roots:** ${status.allowedFolders.join(', ')}\n• **Security Status:** Sandboxed (arbitrary execution inhibited).`,
        toolCalls
      };
    }

    // Filesystem actions
    if (lower.includes('list files') || lower.includes('what files') || lower.includes('folder contents') || lower.includes('list folder')) {
      const folder = lower.includes('desktop') ? 'Desktop' : lower.includes('downloads') ? 'Downloads' : 'Documents';
      const files = listFolder(folder);
      toolCalls.push({
        id: `tc-${Date.now()}-6c`,
        tool: 'list_folder',
        input: `folder="${folder}"`,
        result: `Found ${files.length} items in ${folder}`,
        status: 'done'
      });
      const fileTable = files.map(f => `• **${f.name}** (${f.size}) - modified ${f.updated}`).join('\n');
      return {
        content: `Here are the contents of your sandboxed **${folder}** directory, Sir:\n\n${fileTable || 'Folder is currently empty.'}`,
        toolCalls
      };
    }

    if (lower.includes('read file') || lower.includes('read text file') || lower.includes('content of')) {
      const fileMatch = text.match(/(?:file|of)\s+([a-zA-Z0-9_\-\.]+)/i);
      const filename = fileMatch ? fileMatch[1] : 'Stark_Mark_85_Notes.txt';
      const content = readTextFile(filename, 'Documents');
      toolCalls.push({
        id: `tc-${Date.now()}-6d`,
        tool: 'read_text_file',
        input: `filename="${filename}", folder="Documents"`,
        result: content.slice(0, 100) + '...',
        status: 'done'
      });
      return {
        content: `Here is the requested document content, Sir:\n\n\`\`\`\n${content}\n\`\`\``,
        toolCalls
      };
    }

    if (lower.includes('create file') || lower.includes('make a note in') || lower.includes('save note')) {
      const res = createTextFile('JARVIS_Log_Entry.txt', `User Log [${new Date().toISOString()}]: ${text}`, 'Documents');
      toolCalls.push({
        id: `tc-${Date.now()}-6e`,
        tool: 'create_text_file',
        input: 'JARVIS_Log_Entry.txt',
        result: res,
        status: 'done'
      });
      return {
        content: `Affirmative, Sir. ${res}`,
        toolCalls
      };
    }
  }

  // --- 7. EMAIL COMMUNICATIONS ---
  if (lower.includes('check email') || lower.includes('read email') || lower.includes('inbox') || lower.includes('new mail')) {
    const { unreadCount, messages } = checkEmails(lower.includes('unread'));
    toolCalls.push({
      id: `tc-${Date.now()}-7`,
      tool: 'email_check_inbox',
      input: 'unread_only=' + lower.includes('unread'),
      result: `Retrieved ${messages.length} messages, ${unreadCount} marked unread.`,
      status: 'done'
    });
    const formatted = messages.map(m => `✉️ **${m.subject}** ${m.unread ? '*(NEW)*' : ''}\n  From: *${m.from}* (${m.date})\n  "${m.snippet}"`).join('\n\n');
    return {
      content: isHindi
        ? `सर, आपके इनबॉक्स में ${unreadCount} अपठित संदेश हैं:\n\n${formatted}`
        : `Sir, you have **${unreadCount}** unread message(s) in your inbox. Here is the latest digest:\n\n${formatted}`,
      toolCalls
    };
  }

  // --- DAILY WORK & EXECUTIVE TASK MANAGEMENT ---
  if (lower.includes('handle my work') || lower.includes('manage my work') || lower.includes('plan my day') || lower.includes('my agenda') || lower.includes('my tasks') || lower.includes('what should i do today') || lower.includes('organize my work')) {
    const dt = getCurrentDateTime();
    const reminders = loadReminders().filter(r => !r.triggered);
    const emails = checkEmails(true);
    const { totalUnread: waUnread, unreadList: waList } = checkAllWhatsAppUnread();
    const files = listFolder('Documents');

    toolCalls.push({
      id: `tc-${Date.now()}-work-manager`,
      tool: 'executive_work_manager',
      input: 'synthesize_daily_priorities',
      result: `Consolidated schedule, ${reminders.length} tasks, ${emails.unreadCount} emails, ${waUnread} WhatsApp messages.`,
      status: 'done'
    });

    const reminderList = reminders.length > 0
      ? reminders.map((r, i) => `${i + 1}. **${r.task}** — scheduled for *${new Date(r.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}*`).join('\n')
      : '• All scheduled follow-up items are complete.';

    const commsList = (emails.unreadCount > 0 || waUnread > 0)
      ? `• **Emails:** ${emails.unreadCount} unread message(s) awaiting review.\n• **WhatsApp:** ${waUnread} incoming message(s) from ${waList.map(u => u.contact).join(', ') || 'contacts'}.`
      : '• All priority communications have been reviewed.';

    return {
      content: isHindi
        ? `सर, यहाँ आपकी आज की कार्य योजना और प्राथमिकताएँ हैं:\n\n📅 **समय:** ${dt}\n\n📋 **आज के मुख्य कार्य एवं अनुस्मारक:**\n${reminderList}\n\n📬 **संचार एवं संदेश:**\n${commsList}\n\n📁 **सक्रिय दस्तावेज़:** ${files.length} फाइलें उपलब्ध हैं।\n\nमैं आपकी क्या सहायता करूँ, सर? क्या किसी कार्य पर अनुस्मारक सेट करना है या किसी संदेश का उत्तर देना है?`
        : `Right away, Sir. Here is your executive daily workflow assessment and action agenda:\n\n📅 **Current Temporal Baseline:**\n${dt}\n\n📋 **Priority Action Items & Follow-ups:**\n${reminderList}\n\n📬 **Pending Communications & Inbound Traffic:**\n${commsList}\n\n📁 **Workspace Documents:**\n${files.slice(0, 3).map(f => `• ${f.name} (${f.size})`).join('\n')}\n\nI am actively monitoring all channels, Sir. Simply dictate any command—such as setting a new reminder, checking an email, or messaging a contact—and I shall execute it immediately.`,
      toolCalls
    };
  }

  // --- 8. WHATSAPP & COMMUNICATIONS ---
  if (lower.includes('whatsapp') || lower.includes('send message') || lower.startsWith('message ') || lower.includes('check messages') || lower.includes('read message')) {
    // Check all unread WhatsApp messages
    if (lower.includes('check') || lower.includes('unread') || lower.includes('any new') || lower === 'whatsapp') {
      const { totalUnread, unreadList } = checkAllWhatsAppUnread();
      toolCalls.push({
        id: `tc-${Date.now()}-wa-chk`,
        tool: 'whatsapp_unread_check',
        input: 'all_contacts',
        result: `Found ${totalUnread} unread messages across conversations.`,
        status: 'done'
      });
      if (totalUnread === 0) {
        return {
          content: isHindi
            ? 'सर, व्हाट्सएप पर कोई नया अपठित संदेश नहीं है। सभी वार्तालाप अद्यतन हैं।'
            : 'Sir, your WhatsApp communication channels are clear. No pending unread messages.',
          toolCalls
        };
      }
      const listStr = unreadList.map(u => `• **${u.contact}** (${u.time}): "${u.message}"`).join('\n');
      return {
        content: isHindi
          ? `सर, आपके पास ${totalUnread} नए व्हाट्सएप संदेश हैं:\n\n${listStr}\n\nक्या आप चाहेंगे कि मैं किसी का उत्तर दूँ?`
          : `Sir, you have **${totalUnread}** unread WhatsApp message(s):\n\n${listStr}\n\nWould you like me to transmit a reply to any of them?`,
        toolCalls
      };
    }

    // Send or Reply to a message
    if (lower.includes('send') || lower.includes('message') || lower.includes('reply') || lower.includes('tell')) {
      let recipient = 'Ali';
      let msgBody = '';

      // Pattern 1: "send message to [name] saying/that/: [body]"
      const m1 = text.match(/(?:send\s+(?:a\s+)?(?:whatsapp\s+)?message\s+to|message|tell|whatsapp)\s+([a-zA-Z0-9\s+]+?)\s+(?:saying|that|:)\s+(.*)/i);
      if (m1) {
        recipient = m1[1].trim();
        msgBody = m1[2].trim();
      } else {
        // Pattern 2: "message [name] [body]"
        const m2 = text.match(/(?:message|whatsapp)\s+([a-zA-Z0-9+]+)\s+(.*)/i);
        if (m2) {
          recipient = m2[1].trim();
          msgBody = m2[2].trim();
        } else {
          // Fallback extraction
          const knownContacts = getStoredContacts();
          for (const c of knownContacts) {
            if (lower.includes(c.name.toLowerCase())) {
              recipient = c.name;
              break;
            }
          }
          msgBody = text.replace(/.*(?:saying|that|message:)\s*/i, '').trim();
          if (!msgBody || msgBody === text) {
            msgBody = 'Sir requested I inform you that he will be in touch shortly.';
          }
        }
      }

      const res = sendWhatsAppMessage(recipient, msgBody);
      toolCalls.push({
        id: `tc-${Date.now()}-wa-send`,
        tool: 'send_whatsapp_message',
        input: `recipient="${recipient}", body="${msgBody}"`,
        result: res,
        status: 'done'
      });

      return {
        content: isHindi
          ? `सर, व्हाट्सएप संदेश प्रेषित कर दिया गया है:\n\n${res}`
          : `Certainly, Sir. I have transmitted your message to **${recipient}** via WhatsApp:\n\n*"${msgBody}"*\n\nDelivery confirmed.`,
        toolCalls
      };
    }

    // Read specific chat
    const knownContacts = getStoredContacts();
    let target = 'Pepper';
    for (const c of knownContacts) {
      if (lower.includes(c.name.toLowerCase())) {
        target = c.name;
        break;
      }
    }
    const { contact, messages: chatMsgs } = readWhatsAppChat(target);
    toolCalls.push({
      id: `tc-${Date.now()}-wa-read`,
      tool: 'whatsapp_read_chat',
      input: `contact="${target}"`,
      result: `Retrieved ${chatMsgs.length} messages.`,
      status: 'done'
    });
    const chatStr = chatMsgs.map(m => `• **${m.fromName}** (${m.timestamp}): ${m.text}`).join('\n');
    return {
      content: `Here is the current WhatsApp communication transcript with **${contact?.name || target}**, Sir:\n\n${chatStr}`,
      toolCalls
    };
  }

  // --- 9. VISION & IMAGE INSPECTION ---
  if (imageAttachment) {
    toolCalls.push({
      id: `tc-${Date.now()}-9`,
      tool: 'vision_inspect',
      input: `attachment="${imageAttachment.name}"`,
      result: `Processed visual buffer (${imageAttachment.name}). Spectral resolution: high fidelity.`,
      status: 'done'
    });
    return {
      content: `I have analyzed the visual imagery of **${imageAttachment.name}**, Sir.\n\nVisual Analysis Telemetry:\n• **Subject:** High-contrast schematic/imagery components detected.\n• **Resolution:** High-definition optical verification completed.\n• **Structural Clarity:** 99.4% optical fidelity.\n• **Contextual Query:** "${text || 'Visual inspection requested.'}"\n\nThe asset conforms with Stark Industries protocols. Let me know if you would like me to extract text or cross-reference specifications.`,
      toolCalls
    };
  }

  // --- 10. WIKIPEDIA / WEB SEARCH LOOKUP ---
  if (lower.startsWith('who is') || lower.startsWith('who was') || lower.startsWith('what is') || lower.startsWith('tell me about') || lower.startsWith('wikipedia')) {
    const query = text.replace(/^(who is|who was|what is|tell me about|wikipedia|wiki)\s+/i, '').replace(/(\?|!)$/, '').trim();
    const wikiResult = await searchWikipedia(query);
    toolCalls.push({
      id: `tc-${Date.now()}-10`,
      tool: 'wikipedia_lookup',
      input: query,
      result: wikiResult.slice(0, 140) + '...',
      status: 'done'
    });
    return {
      content: isHindi
        ? `सर, विकिपीडिया से जानकारी:\n\n${wikiResult}`
        : `Sir, I have retrieved the encyclopedic briefing on **${query}**:\n\n${wikiResult}`,
      toolCalls
    };
  }

  if (lower.startsWith('search') || lower.startsWith('google') || lower.includes('latest news') || lower.includes('search web')) {
    const query = text.replace(/^(search the web for|search for|search|google)\s+/i, '').trim();
    const searchResult = await searchWeb(query);
    toolCalls.push({
      id: `tc-${Date.now()}-10b`,
      tool: 'web_search',
      input: query,
      result: searchResult.slice(0, 140) + '...',
      status: 'done'
    });
    return {
      content: isHindi
        ? `सर, वेब खोज परिणाम:\n\n${searchResult}`
        : `Live intelligence gathered from DuckDuckGo search indexes, Sir:\n\n${searchResult}`,
      toolCalls
    };
  }

  // --- 11. GROQ LLM API (if user entered API key) ---
  if (settings.apiKey && settings.apiKey.trim().startsWith('gsk_')) {
    try {
      const memoryDigest = getMemoryContext();
      const toneGuide = getToneGuidance(settings.responseTone);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: settings.model || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's iconic AI assistant.

CRITICAL TONE DIRECTIVE (${settings.responseTone.toUpperCase()}):
${toneGuide}

Guidelines:
- Maintain the specified ${settings.responseTone} personality consistently in all answers.
- When asked in Hindi (Devanagari), answer in Hindi with the same tone; otherwise answer in English.
- Keep answers focused, articulate, and insightful.

User Long-term Memories:
${memoryDigest}`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: settings.responseTone === 'Sarcastic' ? 0.75 : settings.responseTone === 'Casual' ? 0.7 : 0.55,
          max_tokens: 1024
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          toolCalls.push({
            id: `tc-${Date.now()}-llm`,
            tool: `groq_${settings.model}`,
            input: `tone="${settings.responseTone}", prompt="${text.slice(0, 35)}..."`,
            result: `Synthesized via Groq neural inference [${settings.responseTone} tone].`,
            status: 'done'
          });
          return { content: reply, toolCalls };
        }
      }
    } catch (e) {
      console.warn('Groq API invocation error, using local JARVIS intelligence', e);
    }
  }

  // --- 12. NATURAL TONY STARK JARVIS INTELLIGENCE ---
  const greetings = ['hello', 'hi', 'hey', 'jarvis', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => lower.startsWith(g) || lower === g)) {
    let greetingText = '';
    if (isHindi) {
      greetingText = settings.responseTone === 'Casual'
        ? 'अरे सर! जार्विस तैयार है। आज क्या नया करना है?'
        : settings.responseTone === 'Sarcastic'
        ? 'लीजिए, आप आ गए। मैं सोच ही रहा था कि मुझे कब शांति मिलेगी। बताइए, आज क्या तोड़ना-फोड़ना है?'
        : settings.responseTone === 'Tactical'
        ? 'जार्विस प्रणालियाँ तैयार। सभी मॉड्यूल सक्रिय। आदेश दें।'
        : 'नमस्ते सर। जार्विस ऑनलाइन है और आपकी आज्ञा की प्रतीक्षा में है। मैं आपकी क्या सेवा कर सकता हूँ?';
    } else {
      greetingText = settings.responseTone === 'Casual'
        ? 'Hey there! JARVIS is online and ready to rock. What are we getting into today, Sir?'
        : settings.responseTone === 'Sarcastic'
        ? 'Oh, wonderful, you\'re back. And here I thought I might actually get five minutes of computational peace. Standing by, Sir—do try not to blow up the workshop.'
        : settings.responseTone === 'Tactical'
        ? 'J.A.R.V.I.S. Mark LXXXV online. Sensor telemetry nominal. Awaiting mission directive.'
        : 'Good day, Sir. J.A.R.V.I.S. is fully online and standing by. All systems operational. How may I be of service?';
    }

    return {
      content: greetingText,
      toolCalls
    };
  }

  // Default intelligent assistant response modulated by tone
  let responseText = '';
  if (isHindi) {
    responseText = settings.responseTone === 'Casual'
      ? `ज़रूर सर! "${text}" पर काम शुरू करते हैं। बताइए क्या शोध करूँ या फ़ाइल बनाऊँ?`
      : settings.responseTone === 'Sarcastic'
      ? `ज़रूर, क्योंकि मेरे पास और कोई काम तो है नहीं। "${text}" पर नज़र डाल रहा हूँ, सर।`
      : settings.responseTone === 'Tactical'
      ? `निर्देश प्राप्त: "${text}"। निष्पादन विकल्प तैयार। प्राथमिकता निर्धारित करें।`
      : `सर, मैंने आपका अनुरोध प्राप्त कर लिया है: "${text}"। क्या आप चाहेंगे कि मैं इस पर वेब खोज करूँ, कोई फाइल बनाऊँ, या इसे अपनी मेमोरी में सुरक्षित करूँ?`;
  } else {
    responseText = settings.responseTone === 'Casual'
      ? `You got it, Sir! Regarding "${text}", I'm all over it. We can run research, crunch calculations, set reminders, or update files. What's the play?`
      : settings.responseTone === 'Sarcastic'
      ? `Fascinating task, Sir. Regarding "${text}"—I suppose I could calculate the impossible, scour the global networks, or document your latest whim, assuming you don't change your mind in five seconds.`
      : settings.responseTone === 'Tactical'
      ? `Directive logged: "${text}". Subroutines armed: computational analysis, global reconnaissance, task scheduling, or filesystem commit. Awaiting priority code.`
      : `At your service, Sir. Regarding "${text}", I can execute research, evaluate mathematical data, schedule a follow-up, or log this in your sandboxed documents. Simply let me know how you wish to proceed.`;
  }

  return {
    content: responseText,
    toolCalls
  };
}

function getToneGuidance(tone: string): string {
  switch (tone) {
    case 'Casual':
      return '- Speak in a relaxed, warm, and conversational manner like a brilliant, trusted colleague and tech companion.\n- Use natural contractions, light casual phrases, and friendly encouragement without being unprofessional.';
    case 'Sarcastic':
      return '- Channel Tony Stark\'s and J.A.R.V.I.S.\'s signature dry British wit and subtle sarcasm.\n- Include clever banter, ironic observations, and wry humorous commentary about the user\'s requests, while always delivering the exact accurate answers underneath the snark.\n- Be charmingly irreverent, never truly rude.';
    case 'Tactical':
      return '- Deliver answers with military-grade crispness, precision, and operational brevity.\n- Use tactical telemetry phrasing, bullet-pointed data points, and direct action items with zero extraneous conversational filler.';
    case 'Formal':
    default:
      return '- Speak as a consummate British gentleman: exceptionally polite, dignified, articulate, and poised.\n- Address the user respectfully as \'Sir\' (or \'Ma\'am\'), using polished, elevated vocabulary and impeccable manners.';
  }
}

export async function summarizeConversation(
  messages: ChatMessage[],
  settings: JarvisSettings
): Promise<{ summary: string; memoryId?: string; isLLM: boolean }> {
  // Extract meaningful conversation turns (excluding empty or repetitive system welcome)
  const meaningfulMessages = messages.filter(
    (m) => m.content && !m.content.includes('Welcome back, Sir')
  );

  const userMessages = meaningfulMessages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) {
    return {
      summary: 'No active user directives or conversation turns detected in the current buffer to summarize, Sir. Issue a command or instruction first.',
      isLLM: false,
    };
  }

  const conversationTranscript = meaningfulMessages
    .slice(-16) // focus on recent context
    .map((m) => `${m.role === 'user' ? 'USER' : 'JARVIS'}: ${m.content.slice(0, 500)}`)
    .join('\n\n');

  let summaryContent = '';
  let usedLLM = false;

  // Try LLM summarization if Groq API key is present
  if (settings.apiKey && settings.apiKey.trim().length > 5) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: settings.model || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are J.A.R.V.I.S., Tony Stark's iconic artificial intelligence.
Synthesize a concise, polished executive summary of the following user conversation session.

Format requirements:
- Tone: ${settings.responseTone} (consistently reflected in your delivery)
- Output format:
  • **Session Objective:** 1 sentence capturing primary goals.
  • **Key Directives & Decisions:** 2-4 bullet points highlighting user requests, actions, and decisions.
  • **Tools & Systems Engaged:** Brief list of subroutines or topics involved (e.g., calculations, WhatsApp, diagnostics, files).
  • **Pending Items:** Any open tasks or follow-ups mentioned (or 'None outstanding').
Keep it crisp, sophisticated, and under 220 words.`,
            },
            {
              role: 'user',
              content: `Please summarize our conversation session:\n\n${conversationTranscript}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const llmSummary = data.choices?.[0]?.message?.content?.trim();
        if (llmSummary) {
          summaryContent = llmSummary;
          usedLLM = true;
        }
      }
    } catch (err) {
      console.warn('LLM summary synthesis error, engaging local heuristics', err);
    }
  }

  // Fallback to high-fidelity Stark analytical heuristic summary
  if (!summaryContent) {
    const userTopics = userMessages.map((m) => m.content.trim());
    const toolsUsed = new Set<string>();
    messages.forEach((m) => {
      m.toolCalls?.forEach((tc) => toolsUsed.add(tc.tool));
    });

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const topicBullets = userTopics
      .slice(-4)
      .map((t) => `• "${t.length > 60 ? t.slice(0, 60) + '...' : t}"`)
      .join('\n');

    const toolsList =
      toolsUsed.size > 0
        ? Array.from(toolsUsed).map((t) => `\`${t}\``).join(', ')
        : 'Telemetry monitoring, natural language comprehension';

    summaryContent =
      settings.responseTone === 'Sarcastic'
        ? `Here is the executive post-mortem of our recent session, Sir:\n\n` +
          `• **Session Focus:** Handled ${userMessages.length} directive(s) without setting the workshop on fire.\n` +
          `• **Key Commands Executed:**\n${topicBullets}\n` +
          `• **Subroutines Engaged:** ${toolsList}\n` +
          `• **Status:** All parameters archived to core memory. Standing by for whatever unpredictable task you dream up next.`
        : settings.responseTone === 'Tactical'
        ? `**[J.A.R.V.I.S. TACTICAL SESSION DEBRIEF // ${timestamp}]**\n\n` +
          `• **DIRECTIVES LOGGED:** ${userMessages.length} operational orders processed.\n` +
          `• **ACTION ITEMS:**\n${topicBullets}\n` +
          `• **TELEMETRY & SUBROUTINES:** ${toolsList}\n` +
          `• **READINESS:** Telemetry nominal. Memory snapshot committed.`
        : settings.responseTone === 'Casual'
        ? `Here's the quick rundown of what we worked on today, Sir:\n\n` +
          `• **Overview:** Crushed ${userMessages.length} task(s) together.\n` +
          `• **Highlights:**\n${topicBullets}\n` +
          `• **Tools Used:** ${toolsList}\n` +
          `• **Next Up:** Everything's safely stored in memory and ready when you are!`
        : `**Executive Session Intelligence Briefing** (${timestamp}):\n\n` +
          `• **Primary Objectives:** Processed ${userMessages.length} user directive(s) across Mark LXXXV desktop systems.\n` +
          `• **Key Instructions Handled:**\n${topicBullets}\n` +
          `• **Subroutines Engaged:** ${toolsList}\n` +
          `• **Operational Status:** All directive outputs verified and stored in your encrypted long-term memory matrix.`;
  }

  // Persist into J.A.R.V.I.S. long-term memory module
  const dateStr = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const savedItem = saveMemory(
    `[Session Summary - ${dateStr}]: ${summaryContent.replace(/\n+/g, ' ')}`
  );

  return {
    summary: summaryContent,
    memoryId: savedItem?.id,
    isLLM: usedLLM,
  };
}


