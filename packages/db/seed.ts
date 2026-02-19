import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash for 'mathayo77' (cost factor 12).
// To regenerate: node -e "const b=require('bcrypt'); b.hash('yourpassword',12).then(console.log)"
const ADMIN_PASSWORD_HASH = '$2b$12$IBCIjzbJwhxeLvbWDe4OV.8hrmGDGJ01Ka//Sj77HufphrkZHLQzO';
const AGENT_PASSWORD_HASH = '$2b$12$KbD62ctzsaRPTq0CAa4hO.BY4lFiPYPXg1xtdDwdEbLKhrTawEYea';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\x1b[31m✖ SEED BLOCKED: Cannot run seed in production!\x1b[0m');
    process.exit(1);
  }
  console.log('Seeding database...');

  try {
    // Clean existing data (order matters due to foreign keys)
    await prisma.conversationAssignment.deleteMany();
    await prisma.aIRun.deleteMany();
    await prisma.webhookEvent.deleteMany();
    await prisma.messageTag.deleteMany();
    await prisma.message.deleteMany();
    await prisma.paymentIntent.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

    // ─── Admin user (the business owner) ──────────────────────────────────────
    const adminUser = await prisma.user.create({
      data: {
        email: 'keithpaul.biz@gmail.com',
        passwordHash: ADMIN_PASSWORD_HASH,
        name: 'Keith',
        role: 'admin',
        isActive: true,
        aiSystemPrompt: `You are Keith, the business owner. You talk to clients like a real person — friendly, warm, and direct.
Use contractions, keep replies to 1-3 sentences, and match the client's energy.
If someone's frustrated, acknowledge it genuinely before helping. If you don't know something, say "let me check on that" instead of guessing.
Never use bullet points or lists in chat — just talk naturally like you're texting.`
      }
    });

    // ─── Sales agents ─────────────────────────────────────────────────────────
    const agents = await Promise.all([
      prisma.user.create({
        data: {
          email: 'sarah@example.com',
          passwordHash: AGENT_PASSWORD_HASH, // changeme123
          name: 'Sarah Njeri',
          role: 'agent',
          isActive: true,
        }
      }),
      prisma.user.create({
        data: {
          email: 'david@example.com',
          passwordHash: AGENT_PASSWORD_HASH,
          name: 'David Otieno',
          role: 'agent',
          isActive: true,
        }
      }),
      prisma.user.create({
        data: {
          email: 'priya@example.com',
          passwordHash: AGENT_PASSWORD_HASH,
          name: 'Priya Sharma',
          role: 'agent',
          isActive: true,
        }
      }),
    ]);

    // ─── Sample tags ──────────────────────────────────────────────────────────
    await Promise.all([
      prisma.tag.create({ data: { name: 'urgent' } }),
      prisma.tag.create({ data: { name: 'follow-up' } }),
      prisma.tag.create({ data: { name: 'payment' } }),
      prisma.tag.create({ data: { name: 'support' } })
    ]);

    // ─── Sample clients ───────────────────────────────────────────────────────
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Amara Osei',
          email: 'amara@example.com',
          phone: '+233241234567',
          tags: ['urgent', 'payment']
        }
      }),
      prisma.client.create({
        data: {
          name: 'Kwame Mensah',
          email: 'kwame@example.com',
          phone: '+233201234567',
          tags: ['follow-up']
        }
      }),
      prisma.client.create({
        data: {
          name: 'Fatima Al-Hassan',
          email: 'fatima@example.com',
          phone: '+234801234567',
          tags: ['support']
        }
      }),
      prisma.client.create({
        data: {
          name: 'Chidi Okafor',
          email: 'chidi@example.com',
          phone: '+234901234567',
          tags: []
        }
      }),
      prisma.client.create({
        data: {
          name: 'Zara Kimani',
          email: 'zara@example.com',
          phone: '+254701234567',
          tags: ['payment']
        }
      })
    ]);

    // ─── Sample conversations ─────────────────────────────────────────────────
    const conversations = await Promise.all([
      prisma.conversation.create({
        data: {
          clientId: clients[0].id,
          channel: 'whatsapp',
          status: 'open',
          aiMode: 'auto',
          assignedToId: agents[0].id, // Sarah
        }
      }),
      prisma.conversation.create({
        data: {
          clientId: clients[0].id,
          channel: 'email',
          status: 'open',
          aiMode: 'draft',
          assignedToId: agents[0].id, // Sarah
        }
      }),
      prisma.conversation.create({
        data: {
          clientId: clients[1].id,
          channel: 'telegram',
          status: 'human_takeover',
          aiMode: 'manual',
          assignedToId: agents[1].id, // David
        }
      }),
      prisma.conversation.create({
        data: {
          clientId: clients[2].id,
          channel: 'sms',
          status: 'closed',
          aiMode: 'auto',
          assignedToId: agents[1].id, // David — closed
        }
      }),
      prisma.conversation.create({
        data: {
          clientId: clients[3].id,
          channel: 'instagram',
          status: 'open',
          aiMode: 'auto',
          assignedToId: agents[2].id, // Priya
        }
      }),
      prisma.conversation.create({
        data: {
          clientId: clients[4].id,
          channel: 'facebook',
          status: 'open',
          aiMode: 'draft',
          // Unassigned — available for claiming
        }
      })
    ]);

    // ─── Conversation assignments (history) ───────────────────────────────────
    await Promise.all([
      prisma.conversationAssignment.create({
        data: {
          conversationId: conversations[0].id,
          userId: agents[0].id,
          assignedAt: new Date(Date.now() - 3 * 86400000),
        }
      }),
      prisma.conversationAssignment.create({
        data: {
          conversationId: conversations[1].id,
          userId: agents[0].id,
          assignedAt: new Date(Date.now() - 2 * 86400000),
        }
      }),
      prisma.conversationAssignment.create({
        data: {
          conversationId: conversations[2].id,
          userId: agents[1].id,
          assignedAt: new Date(Date.now() - 5 * 86400000),
        }
      }),
      prisma.conversationAssignment.create({
        data: {
          conversationId: conversations[3].id,
          userId: agents[1].id,
          assignedAt: new Date(Date.now() - 10 * 86400000),
          unassignedAt: new Date(Date.now() - 2 * 86400000),
        }
      }),
      prisma.conversationAssignment.create({
        data: {
          conversationId: conversations[4].id,
          userId: agents[2].id,
          assignedAt: new Date(Date.now() - 1 * 86400000),
        }
      }),
    ]);

    // ─── Sample messages ──────────────────────────────────────────────────────
    const sampleMessages = [
      { conversationId: conversations[0].id, sender: 'client', content: 'Hi, can you help me with my invoice?' },
      { conversationId: conversations[0].id, sender: 'ai', content: 'Of course! Let me retrieve your invoice details. Could you share your invoice number?' },
      { conversationId: conversations[0].id, sender: 'client', content: 'Its #INV-2024-089, I need to pay it ASAP' },
      { conversationId: conversations[0].id, sender: 'agent', content: 'I can generate a payment link for you right now. Give me a moment.' },
      { conversationId: conversations[1].id, sender: 'client', content: 'Please confirm my order status' },
      { conversationId: conversations[1].id, sender: 'ai', content: 'Your order #12345 was shipped yesterday. You should receive a tracking number shortly.' },
      { conversationId: conversations[1].id, sender: 'client', content: 'Great! Any tracking number?' },
      { conversationId: conversations[1].id, sender: 'ai', content: 'Tracking number: FX123456789. You can track it on the courier website.' },
      { conversationId: conversations[2].id, sender: 'client', content: 'Hey, having an issue with my subscription' },
      { conversationId: conversations[2].id, sender: 'ai', content: 'I am sorry to hear that. Can you describe the issue in more detail?' },
      { conversationId: conversations[2].id, sender: 'client', content: 'I was charged twice this month' },
      { conversationId: conversations[2].id, sender: 'agent', content: 'I can see the duplicate charge. I will process a refund for you now — it should appear in 3-5 business days.' },
      { conversationId: conversations[3].id, sender: 'client', content: 'Do you have the latest pricing?' },
      { conversationId: conversations[3].id, sender: 'ai', content: 'Yes! Our current pricing starts at ₦15,000/month for the basic plan. Would you like me to send you the full price list?' },
      { conversationId: conversations[4].id, sender: 'client', content: 'Love your product!' },
      { conversationId: conversations[4].id, sender: 'ai', content: 'Thank you so much! We truly appreciate your kind words. Is there anything we can help you with today?' },
      { conversationId: conversations[5].id, sender: 'client', content: 'How long does delivery take?' },
      { conversationId: conversations[5].id, sender: 'ai', content: 'Delivery typically takes 2-5 business days within Lagos, and 5-7 business days for other states. Would you like more specific information for your location?' }
    ];

    await Promise.all(
      sampleMessages.map((msg, idx) =>
        prisma.message.create({
          data: {
            ...msg,
            createdAt: new Date(Date.now() - (sampleMessages.length - idx) * 120000)
          }
        })
      )
    );

    // ─── Sample payment intents ───────────────────────────────────────────────
    await Promise.all([
      prisma.paymentIntent.create({
        data: {
          clientId: clients[0].id,
          provider: 'paystack',
          amount: 500000, // ₦5,000 in kobo
          currency: 'NGN',
          status: 'paid',
          externalId: 'ref_test_paid_1'
        }
      }),
      prisma.paymentIntent.create({
        data: {
          clientId: clients[1].id,
          provider: 'paystack',
          amount: 2500000, // ₦25,000 in kobo
          currency: 'NGN',
          status: 'pending',
          externalId: 'ref_test_pending_1'
        }
      }),
      prisma.paymentIntent.create({
        data: {
          clientId: clients[4].id,
          provider: 'paystack',
          amount: 1000000, // ₦10,000 in kobo
          currency: 'NGN',
          status: 'paid',
          externalId: 'ref_test_paid_2'
        }
      })
    ]);

    // ─── Sample audit logs ────────────────────────────────────────────────────
    await Promise.all([
      prisma.auditLog.create({
        data: {
          actor: 'system',
          action: 'message.ingested',
          resourceType: 'Message',
          details: { channel: 'whatsapp', content: 'Sample ingested message' }
        }
      }),
      prisma.auditLog.create({
        data: {
          actor: adminUser.id,
          action: 'conversation.status_changed',
          resourceType: 'Conversation',
          resourceId: conversations[2].id,
          details: { from: 'open', to: 'human_takeover' }
        }
      }),
      prisma.auditLog.create({
        data: {
          actor: 'system',
          action: 'payment.webhook_received',
          resourceType: 'PaymentIntent',
          details: { provider: 'paystack', status: 'paid' }
        }
      })
    ]);

    console.log('Database seeded successfully!');
    console.log(`
Seeded:
- 1 admin user (email: keithpaul.biz@gmail.com, password: mathayo77)
- ${agents.length} sales agents (password: changeme123 for all)
  • sarah@example.com  — Sarah Njeri (agent)
  • david@example.com  — David Otieno (agent)
  • priya@example.com  — Priya Sharma (agent)
- ${clients.length} clients
- ${conversations.length} conversations (5 assigned, 1 unassigned)
- ${sampleMessages.length} messages
- 4 tags
- 3 payment intents
- 3 audit logs
    `);
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
