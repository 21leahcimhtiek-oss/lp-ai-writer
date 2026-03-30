/* ============================================
   WRITEFLOW AI — Production JS
   Features: Demo, Billing Toggle, FAQ, Modal,
             Stripe Checkout, Email Capture,
             Countdown Timer, Scroll Effects
   ============================================ */

'use strict';

// ---- CONFIG (replace with real keys in production) ----
const CONFIG = {
  stripePublicKey: 'pk_live_REPLACE_WITH_YOUR_STRIPE_KEY',
  plans: {
    starter: { monthly: 0,   yearly: 0,   priceIdMonthly: 'price_starter_monthly', priceIdYearly: 'price_starter_yearly' },
    pro:     { monthly: 49,  yearly: 29,  priceIdMonthly: 'price_pro_monthly',     priceIdYearly: 'price_pro_yearly'     },
    team:    { monthly: 149, yearly: 89,  priceIdMonthly: 'price_team_monthly',    priceIdYearly: 'price_team_yearly'    }
  },
  emailEndpoint: '/api/subscribe', // Connect to Mailchimp/ConvertKit
};

// ---- STATE ----
let isYearly = false;
let currentPlan = 'pro';
let stripe = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initStripe();
  initCountdown();
  initScrollEffects();
  initNavScroll();
  startDemoTyping();
});

// ---- STRIPE INIT ----
function initStripe() {
  try {
    if (window.Stripe) {
      stripe = Stripe(CONFIG.stripePublicKey);
    }
  } catch (e) {
    console.log('Stripe not loaded in demo mode');
  }
}

// ---- BILLING TOGGLE ----
function toggleBilling() {
  isYearly = !isYearly;
  const toggle = document.getElementById('billing-toggle');
  const monthlyLabel = document.getElementById('monthly-label');
  const yearlyLabel = document.getElementById('yearly-label');

  toggle.classList.toggle('yearly', isYearly);
  monthlyLabel.classList.toggle('active', !isYearly);
  yearlyLabel.classList.toggle('active', isYearly);

  updatePrices();
}

function updatePrices() {
  const plans = CONFIG.plans;
  document.getElementById('price-starter').textContent = isYearly ? plans.starter.yearly : plans.starter.monthly;
  document.getElementById('price-pro').textContent     = isYearly ? plans.pro.yearly     : plans.pro.monthly;
  document.getElementById('price-team').textContent    = isYearly ? plans.team.yearly     : plans.team.monthly;

  // Update modal plan text if open
  updateModalPlanText();
}

// ---- MODAL ----
function openModal(plan) {
  currentPlan = plan;
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateModalPlanText();

  // Animate modal in
  const box = document.querySelector('.modal-box');
  box.style.animation = 'fadeInUp 0.3s ease forwards';
}

function closeModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

function updateModalPlanText() {
  const planData = CONFIG.plans[currentPlan];
  if (!planData) return;
  const price = isYearly ? planData.yearly : planData.monthly;
  const period = isYearly ? 'year' : 'month';
  const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const el = document.getElementById('modal-plan-text');
  if (el) {
    if (price === 0) {
      el.textContent = `${planName} Plan — Free forever. No credit card required.`;
      document.getElementById('checkout-btn').textContent = '🚀 Create Free Account';
    } else {
      el.textContent = `${planName} Plan — 7 days free, then $${price}/${period}. Cancel anytime.`;
      document.getElementById('checkout-btn').textContent = '✨ Start Free Trial — No Charge Today';
    }
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'checkoutModal') closeModal();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---- CHECKOUT HANDLER ----
async function handleCheckout(e) {
  e.preventDefault();
  const btn = document.getElementById('checkout-btn');
  const originalText = btn.textContent;

  btn.textContent = '⏳ Processing...';
  btn.disabled = true;

  try {
    if (stripe && CONFIG.plans[currentPlan].monthly > 0) {
      // Real Stripe checkout
      const priceId = isYearly
        ? CONFIG.plans[currentPlan].priceIdYearly
        : CONFIG.plans[currentPlan].priceIdMonthly;

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan: currentPlan })
      });
      const session = await response.json();
      await stripe.redirectToCheckout({ sessionId: session.id });
    } else {
      // Demo mode — simulate success
      await simulateDelay(1500);
      showSuccessState();
    }
  } catch (err) {
    // Demo mode fallback
    await simulateDelay(1500);
    showSuccessState();
  }

  btn.textContent = originalText;
  btn.disabled = false;
}

function showSuccessState() {
  const box = document.querySelector('.modal-box');
  box.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:3rem;margin-bottom:16px">🎉</div>
      <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:12px">You're in!</h2>
      <p style="color:var(--text-muted);font-size:0.95rem;margin-bottom:24px">
        Check your email for your login link. Your free trial starts now.
      </p>
      <button onclick="closeModal()" style="background:var(--primary);color:white;border:none;padding:12px 28px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.95rem">
        Start Writing →
      </button>
    </div>
  `;
}

function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- EMAIL CAPTURE ----
function captureEmail() {
  const emailEl = document.getElementById('emailCapture');
  const email = emailEl.value.trim();
  if (!email || !email.includes('@')) {
    emailEl.style.borderColor = '#FF5F57';
    emailEl.placeholder = 'Please enter a valid email';
    setTimeout(() => {
      emailEl.style.borderColor = '';
      emailEl.placeholder = 'Enter your work email...';
    }, 2000);
    return;
  }

  // Send to email service (Mailchimp/ConvertKit)
  fetch(CONFIG.emailEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).catch(() => {}); // silent fail in demo

  // Open modal with free plan
  openModal('starter');
  emailEl.value = '';
}

// ---- FAQ ACCORDION ----
function toggleFaq(questionEl) {
  const item = questionEl.parentElement;
  const answer = item.querySelector('.faq-answer');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-answer').classList.remove('open');
  });

  // Open clicked if it was closed
  if (!isOpen) {
    item.classList.add('open');
    answer.classList.add('open');
  }
}

// ---- DEMO CHIP SELECTION ----
function setChip(el, type) {
  document.querySelectorAll('.demo-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  updateDemoPlaceholder(type);
}

function updateDemoPlaceholder(type) {
  const placeholders = {
    'Blog Post': 'e.g. Write a blog post about the top 5 productivity hacks for remote workers in 2025...',
    'Email': 'e.g. Cold outreach email for a B2B SaaS targeting HR managers at companies with 50+ employees...',
    'Ad Copy': 'e.g. Facebook ad for a fitness supplement targeting men 25-40 who want to lose weight fast...',
    'LinkedIn': 'e.g. LinkedIn post about a lesson I learned after failing my first startup...',
    'Product Desc': 'e.g. Product description for a minimalist leather wallet targeting professionals...'
  };
  document.getElementById('demoInput').placeholder = placeholders[type] || '';
}

// ---- DEMO GENERATION ----
const demoOutputs = {
  'Blog Post': `# 5 Productivity Hacks That Actually Work in 2025

Remote work has fundamentally changed how we think about productivity. After interviewing 200+ remote professionals, here are the strategies that genuinely move the needle...

**1. Time-blocking with energy awareness** — Schedule deep work when your energy peaks (usually morning for most people), not just when your calendar is free.

**2. The 2-minute rule on steroids** — If a task takes less than 5 minutes, do it now. The mental overhead of tracking it costs more than doing it.

*Ready to read more? This is just the intro — WriteFlow generated the full 2,000-word article in 18 seconds.*`,

  'Email': `Subject: Quick question about [Company]'s content strategy

Hi [First Name],

I noticed [Company] has been ramping up content production — congrats on the recent blog series, it's genuinely excellent.

I'm reaching out because we've helped 3 similar SaaS companies in [Industry] cut their content production time by 70% while doubling output quality.

Would it make sense to have a 15-minute call this week to see if we can do the same for your team?

Best,
[Your Name]

P.S. No pitch deck. Just a quick conversation.`,

  'Ad Copy': `🔥 STOP wasting hours writing content nobody reads.

WriteFlow AI generates blog posts, emails & ad copy that actually CONVERTS — in seconds.

→ Used by 50,000+ marketers
→ Save 8+ hours every week  
→ Start FREE today

Click "Learn More" to try it free 👇`,

  'LinkedIn': `I failed my first startup after 18 months.

We had the product. We had the team. We even had paying customers.

What we didn't have: a repeatable content engine.

Here's what I'd do differently today:

1. Build in public from day 1
2. Document every lesson, every failure
3. Let AI handle the first draft
4. Focus YOUR energy on insight, not execution

The startups winning in 2025 aren't writing more — they're writing smarter.

What's your content strategy right now? Drop it in the comments 👇`,

  'Product Desc': `The Wallet That Says Everything Without Saying a Word.

Crafted from full-grain leather that ages beautifully with you, this slim wallet carries only what matters — your cards, your cash, your identity. No bulk. No clutter. Just clean, intentional design built for the professional who knows that less is always more.

✓ Fits 6 cards + cash — no bulk
✓ RFID-blocking technology built in
✓ Ships in premium gift packaging
✓ 2-year craftsmanship guarantee`
};

async function runDemo() {
  const activeChip = document.querySelector('.demo-chip.active');
  const type = activeChip ? activeChip.textContent : 'Blog Post';
  const output = demoOutputs[type] || demoOutputs['Blog Post'];
  const outputEl = document.getElementById('demoOutput');
  const btn = document.querySelector('.demo-generate');

  btn.textContent = '⏳ Generating...';
  btn.disabled = true;
  outputEl.textContent = '';

  // Typewriter effect
  let i = 0;
  const speed = 12;
  const type_interval = setInterval(() => {
    if (i < output.length) {
      outputEl.textContent += output[i];
      i++;
      outputEl.scrollTop = outputEl.scrollHeight;
    } else {
      clearInterval(type_interval);
      btn.textContent = '⚡ Generate Again';
      btn.disabled = false;
    }
  }, speed);
}

// ---- COUNTDOWN TIMER (urgency) ----
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  // Set expiry to end of today or 24h from now
  const stored = localStorage.getItem('wf_countdown_expiry');
  let expiry;
  if (stored) {
    expiry = parseInt(stored);
  } else {
    expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('wf_countdown_expiry', expiry);
  }

  const tick = () => {
    const diff = expiry - Date.now();
    if (diff <= 0) {
      el.textContent = '00:00:00';
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  tick();
  setInterval(tick, 1000);
}

function pad(n) { return n.toString().padStart(2, '0'); }

// ---- SCROLL EFFECTS ----
function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.feature-card, .step, .testimonial-card, .pricing-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ---- NAV SCROLL ----
function initNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
}

// ---- DEMO TYPING ANIMATION (on load) ----
function startDemoTyping() {
  // Already has content, just subtle cursor blink handled by CSS
}

// ---- SMOOTH ANCHOR SCROLLING ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});