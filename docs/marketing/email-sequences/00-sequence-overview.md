# Email Marketing Sequences Overview

**Date:** January 9, 2026
**Status:** Ready for Implementation
**Platform:** Recommended: Resend, Mailchimp, or ConvertKit

---

## Sequence Architecture

We have 6 email sequences designed to move prospects through the customer journey:

1. **Waitlist Nurture Sequence** (6 emails) - Pre-launch engagement and education
2. **Welcome Onboarding Sequence** (7 emails) - New user activation (first 14 days)
3. **Trial Conversion Sequence** (5 emails) - Free trial to paid conversion
4. **Abandoned Cart Sequence** (4 emails) - Pricing page visitors who didn't sign up
5. **Winback Sequence** (4 emails) - Re-engage dormant users
6. **Launch Announcement Sequence** (5 emails) - Product launch week blast

---

## Key Metrics & Goals

### Sequence Performance Targets

- **Open Rate:** 25-35% (industry average: 17-28%)
- **Click-Through Rate:** 3-5% (industry average: 2-3%)
- **Conversion Rate:** 2-4% (industry average: 1-3%)
- **Unsubscribe Rate:** <0.5% (industry average: 0.5-1%)

### Sequence-Specific Goals

| Sequence | Primary Goal | Success Metric |
|----------|-------------|----------------|
| Waitlist Nurture | Build excitement | 50% open rate, 10% referral rate |
| Welcome Onboarding | First workflow created | 70% activation rate |
| Trial Conversion | Free → Paid | 20-30% conversion rate |
| Abandoned Cart | Recover signups | 5-10% recovery rate |
| Winback | Reactivate users | 3-5% reactivation rate |
| Launch Announcement | Drive initial signups | 100+ waitlist signups week 1 |

---

## Brand Voice & Tone

### Core Voice Attributes

- **Empathetic:** We understand your pain (AI tool overload)
- **Empowering:** You can do this (no technical skills required)
- **Direct:** No fluff, just value (short, scannable emails)
- **Human:** Conversational, not corporate (use contractions, ask questions)
- **Results-Oriented:** Every email has a clear purpose and CTA

### Style Guidelines

- **Subject Lines:** 40-60 characters, urgent but not clickbait
- **Preheader Text:** Reinforce value, not repeat subject line
- **Email Length:** 150-250 words (scannable in 60 seconds)
- **Paragraphs:** Max 2-3 sentences, 1-2 lines each
- **CTA:** One primary call-to-action per email
- **Personalization:** Use {{first_name}} when available
- **Sign-off:** Casual ("Cheers," "Best," not "Sincerely")

---

## Sending Strategy

### Optimal Send Times (Based on B2B SaaS Data)

- **Best Day:** Tuesday or Wednesday
- **Best Time:** 10:00 AM or 2:00 PM in recipient's timezone
- **Frequency:** 1 email every 2-3 days (not daily, not weekly)
- **Sequence Spacing:** 2-3 days between emails

### Trigger Rules

- **Immediate:** Welcome emails (send immediately after signup)
- **Time-Based:** Nurture sequences (send every 2-3 days)
- **Behavior-Based:** Abandoned cart (send 1 hour, 24 hours, 72 hours after visit)
- **Lifecycle:** Trial conversion (send on days 1, 3, 7, 10, 13 of 14-day trial)

---

## Technical Implementation

### Email Service Provider (ESP) Recommendations

**Best for Startup Phase: Resend**
- Modern API-first ESP
- Great developer experience
- Built-in analytics and A/B testing
- $50/month for up to 50,000 emails
- Webhook integration for behavioral triggers

**Alternative: Mailchimp**
- Familiar interface, good non-technical teams
- $23/month for up to 500 contacts
- Visual automation builder
- Good template library

**Alternative: ConvertKit**
- Creator-focused, simple automation
- $29/month for up to 1,000 subscribers
- Tag-based segmentation
- Good for content-led approach

### Required Data Fields

```json
{
  "email": "required",
  "first_name": "optional",
  "company": "optional",
  "signup_date": "required",
  "subscription_tier": "calculated",
  "last_active": "tracked",
  "workflows_created": "tracked",
  "trial_start_date": "conditional",
  "pricing_page_visits": "tracked"
}
```

---

## A/B Testing Framework

### Test Priority Queue

**Priority 1 (Test First):**
1. Subject line variations (urgency vs. curiosity vs. benefit)
2. CTA button text ("Start Free Trial" vs. "Get Started Now" vs. "Build Your First Workflow")
3. Send time (10:00 AM vs. 2:00 PM vs. 6:00 PM)
4. Email length (short 150 words vs. longer 300 words)

**Priority 2 (Test Later):**
5. Preheader text presence/absence
6. Personalization ({{first_name}} vs. generic)
7. From name (founder vs. company name vs. "Founder at Company")
8. HTML vs. plain text format

### Statistical Significance

- Minimum sample size: 1,000 subscribers per variant
- Test duration: Minimum 7 days
- Confidence level: 95%
- Minimum detectable effect: 20% relative lift

---

## Compliance & Deliverability

### CAN-SPAM & GDPR Compliance

- ✅ Clear physical mailing address in footer
- ✅ One-click unsubscribe link
- ✅ Accurate subject line (not misleading)
- ✅ Clear "this is an advertisement" disclosure
- ✅ Consent obtained at signup (checkbox not pre-checked)
- ✅ Data stored securely (EU data in EU region)

### Deliverability Best Practices

- Warm up new IP domains (send 50/day → 200/day → 1,000/day over 2 weeks)
- Keep bounce rate under 2%
- Keep spam complaint rate under 0.1%
- Authenticate with SPF, DKIM, and DMARC
- Use double opt-in for waitlist signups
- Regularly clean inactive subscribers (>180 days inactive)

---

## Success Tracking

### Key Performance Indicators (KPIs)

**Email-Level Metrics:**
- Open rate (subject line effectiveness)
- Click-through rate (content engagement)
- Conversion rate (CTA effectiveness)
- Unsubscribe rate (audience fatigue)
- Spam complaint rate (relevance)

**Business-Level Metrics:**
- Waitlist → Trial signup rate
- Trial → Paid conversion rate
- Customer Acquisition Cost (CAC) from email channel
- Lifetime Value (LTV) of email-acquired customers
- Email channel revenue attribution

### Reporting Cadence

- **Daily:** Automated alert if open rate <20% or unsubscribe >1%
- **Weekly:** Review sequence performance, top/bottom performers
- **Monthly:** Full audit, A/B test insights, optimization roadmap
- **Quarterly:** Comprehensive strategy review, list hygiene cleanup

---

## Quick Start Checklist

### Pre-Launch (Week 1-2)
- [ ] Choose ESP (Resend recommended)
- [ ] Set up authentication (SPF, DKIM, DMARC)
- [ ] Create email templates (HTML + plain text)
- [ ] Build subscriber segments (waitlist, trial, paid, dormant)
- [ ] Set up behavioral tracking (pricing page visits, workflow creation)
- [ ] Write and schedule all sequences

### Launch Week (Week 3)
- [ ] Send Launch Announcement Sequence (5 emails in 7 days)
- [ ] Monitor deliverability (spam score, bounce rate)
- [ ] Respond to replies within 2 hours
- [ ] A/B test subject lines in real-time

### Post-Launch (Week 4+)
- [ ] Optimize based on data
- [ ] Expand template library
- [ ] Set up automated drip campaigns
- [ ] Launch winback and abandoned cart sequences

---

## Next Steps

1. **Implement Waitlist Sequence** - Start building pre-launch buzz
2. **Set Up ESP** - Configure Resend/Mailchimp with templates
3. **Test Send** - Send test emails to internal team
4. **Launch** - Activate sequences and monitor performance
5. **Iterate** - A/B test and optimize based on data

---

**This document provides the strategic foundation. Individual email sequences are in separate files:**
- `01-waitlist-nurture-sequence.md`
- `02-welcome-onboarding-sequence.md`
- `03-trial-conversion-sequence.md`
- `04-abandoned-cart-sequence.md`
- `05-winback-sequence.md`
- `06-launch-announcement-sequence.md`
