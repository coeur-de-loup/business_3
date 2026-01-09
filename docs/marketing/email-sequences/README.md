# Email Marketing Sequences - Quick Reference

**Last Updated:** January 9, 2026
**Status:** Complete - Ready for Implementation

---

## 📚 All Sequences Overview

| Sequence | Purpose | Audience | Emails | Goal |
|----------|---------|----------|--------|------|
| [Waitlist Nurture](./01-waitlist-nurture-sequence.md) | Pre-launch engagement | Waitlist signups | 6 over 18 days | 50% open, 10% referral |
| [Welcome Onboarding](./02-welcome-onboarding-sequence.md) | New user activation | New signups | 7 over 14 days | 70% activation |
| [Trial Conversion](./03-trial-conversion-sequence.md) | Free → Paid | Trial users | 5 during 14-day trial | 25% conversion |
| [Abandoned Cart](./04-abandoned-cart-sequence.md) | Recover pricing visitors | Pricing page visitors | 4 over 72 hours | 8% recovery |
| [Winback](./05-winback-sequence.md) | Re-engage dormant users | Inactive 30-90+ days | 4 over 90 days | 4% reactivation |
| [Launch Announcement](./06-launch-announcement-sequence.md) | Launch week drive | Entire list | 5 over 7 days | 100+ signups week 1 |

---

## 🎯 Recommended Implementation Order

### Phase 1: Pre-Launch (Week 1-2)
1. **Waitlist Nurture Sequence** - Start building buzz immediately
2. **Launch Announcement Sequence** - Prepare for launch week

### Phase 2: Launch (Week 3)
3. **Welcome Onboarding Sequence** - Activate new users from day 1
4. **Abandoned Cart Sequence** - Recover pricing page visitors

### Phase 3: Post-Launch (Week 4+)
5. **Trial Conversion Sequence** - Maximize trial-to-paid conversion
6. **Winback Sequence** - Re-engage dormant users

---

## 📊 Performance Benchmarks

### Open Rate Targets

| Sequence Type | Target | Industry Avg |
|--------------|--------|--------------|
| Waitlist Nurture | 45% | 25-35% |
| Welcome Onboarding | 50% | 30-40% |
| Trial Conversion | 55% | 25-35% |
| Abandoned Cart | 40% | 20-30% |
| Winback | 35% | 15-25% |
| Launch Announcement | 50% | 20-30% |

### Click Rate Targets

| Sequence Type | Target | Industry Avg |
|--------------|--------|--------------|
| Waitlist Nurture | 8% | 3-5% |
| Welcome Onboarding | 10% | 4-6% |
| Trial Conversion | 12% | 3-5% |
| Abandoned Cart | 6% | 2-4% |
| Winback | 4% | 1-3% |
| Launch Announcement | 10% | 3-5% |

### Conversion Rate Targets

| Sequence Type | Target | Industry Avg |
|--------------|--------|--------------|
| Waitlist Nurture | 10% referral | 2-5% |
| Welcome Onboarding | 70% activation | 40-60% |
| Trial Conversion | 25% paid | 15-25% |
| Abandoned Cart | 8% recovery | 5-10% |
| Winback | 4% reactivation | 3-5% |
| Launch Announcement | 15% signup | 5-10% |

---

## 🛠️ Technical Implementation

### Email Service Provider (ESP) Options

**Option 1: Resend (Recommended)**
- Modern API-first ESP
- Great developer experience
- $50/month for up to 50,000 emails
- [resend.com](https://resend.com)

**Option 2: Mailchimp**
- Familiar interface
- $23/month for up to 500 contacts
- [mailchimp.com](https://mailchimp.com)

**Option 3: ConvertKit**
- Creator-focused
- $29/month for up to 1,000 subscribers
- [convertkit.com](https://convertkit.com)

---

## 🔑 Required Data Fields

```json
{
  "email": "required",
  "first_name": "optional",
  "last_name": "optional",
  "company": "optional",
  "signup_date": "required",
  "subscription_tier": "calculated",
  "last_active": "tracked",
  "last_login_date": "tracked",
  "workflows_created": "tracked",
  "workflows_executed": "tracked",
  "time_saved": "calculated",
  "trial_start_date": "conditional",
  "trial_end_date": "conditional",
  "pricing_page_visits": "tracked",
  "pricing_page_last_visit": "tracked",
  "referral_count": "tracked",
  "referral_code": "generated"
}
```

---

## 🎨 Brand Voice Guidelines

### Core Attributes
- **Empathetic** - We understand your pain
- **Empowering** - You can do this
- **Direct** - No fluff, just value
- **Human** - Conversational, not corporate
- **Results-Oriented** - Every email has a clear purpose

### Style Rules
- Subject lines: 40-60 characters
- Email length: 150-250 words
- Paragraphs: Max 2-3 sentences
- One primary CTA per email
- Use {{first_name}} personalization
- Casual sign-offs ("Cheers," "Best")

---

## 📈 A/B Testing Framework

### Priority 1 Tests (Do These First)
1. Subject lines (urgency vs. curiosity vs. benefit)
2. CTA button text
3. Send times (10 AM vs. 2 PM vs. 6 PM)
4. Email length (short vs. long)

### Priority 2 Tests (Do These Later)
5. Preheader text
6. Personalization ({{first_name}} vs. generic)
7. From name (founder vs. company)
8. HTML vs. plain text

### Statistical Significance
- Minimum sample: 1,000 per variant
- Test duration: 7 days minimum
- Confidence level: 95%
- Minimum detectable effect: 20% lift

---

## ✅ Pre-Launch Checklist

### 2 Weeks Before Launch
- [ ] Choose and set up ESP
- [ ] Configure authentication (SPF, DKIM, DMARC)
- [ ] Create email templates (HTML + plain text)
- [ ] Build subscriber segments
- [ ] Set up behavioral tracking
- [ ] Write and schedule all sequences
- [ ] Test all email flows internally
- [ ] Set up analytics and tracking

### 1 Week Before Launch
- [ ] Warm up email sending domain
- [ ] Double-check all links and CTAs
- [ ] Test on multiple email clients
- [ ] Set up automated alerts
- [ ] Prepare support team for volume
- [ ] Create launch week calendar

### Launch Day
- [ ] Send first email at 9 AM Pacific
- [ ] Monitor deliverability closely
- [ ] Respond to replies within 1 hour
- [ ] Track metrics in real-time
- [ ] Be ready to pivot if something breaks

---

## 🚨 Common Issues & Solutions

### Issue: Low Open Rates
**Solutions:**
- A/B test subject lines
- Clean your email list regularly
- Segment by engagement level
- Send at optimal times (10 AM or 2 PM)
- Improve preheader text

### Issue: Low Click Rates
**Solutions:**
- Strengthen CTAs (make them specific and urgent)
- Reduce email length (get to the point faster)
- Add more/better social proof
- Improve segmentation (send more relevant content)
- Test different CTA placements

### Issue: High Unsubscribe Rates
**Solutions:**
- Reduce send frequency
- Improve content relevance
- Better segmentation (don't send everything to everyone)
- Check for deliverability issues
- Survey unsubscribes to understand why

### Issue: Low Conversion Rates
**Solutions:**
- Strengthen the offer (discount, bonus, urgency)
- Improve landing page (email's job is to get the click)
- Add more social proof and testimonials
- Reduce friction in signup process
- Better targeting (right offer to right people)

---

## 📞 Support Resources

### Need Help with Email Marketing?

**Content & Copy:**
- Check individual sequence files for detailed email copy
- Review [Sequence Overview](./00-sequence-overview.md) for strategy
- Reference brand voice guidelines above

**Technical Implementation:**
- ESP documentation (Resend/Mailchimp/ConvertKit)
- Email deliverability resources (Mailgun, SendGrid)
- HTML email templates (Litmus, Email on Acid)

**Analytics & Optimization:**
- ESP analytics dashboards
- Google Analytics (utm tracking)
- Mixpanel/Amplitude (behavioral analytics)

---

## 🔄 Maintenance & Updates

### Monthly Tasks
- [ ] Review sequence performance metrics
- [ ] Identify top/bottom performing emails
- [ ] A/B test at least 1 element
- [ ] Clean inactive subscribers (180+ days)
- [ ] Update any outdated information

### Quarterly Tasks
- [ ] Full audit of all sequences
- [ ] Survey inactive subscribers
- [ ] Refresh outdated copy
- [ ] Add new templates/examples
- [ ] Optimize send times and frequency

### Annual Tasks
- [ ] Comprehensive strategy review
- [ ] List hygiene cleanup
- [ ] ESP evaluation (should we switch?)
- [ ] Budget review and optimization
- [ ] Competitive analysis (what are others doing?)

---

## 📚 Additional Resources

### Internal Documentation
- [Landing Page Copy](../landing-page.md)
- [Business Model](../../strategy/business-model.md)
- [Go-to-Market Strategy](../../strategy/go-to-market.md)

### External Resources
- [Email Marketing Benchmark Report](https://mailchimp.com/resources/email-marketing-benchmarks/)
- [A/B Testing Guide](https://help.mailchimp.com/learn/a-b-testing)
- [Email Deliverability Guide](https://www.sendgrid.com/blog/email-deliverability/)

---

**Ready to launch!** 🚀

If you have questions or need help implementing these sequences, don't hesitate to reach out.

**Remember:** The best email sequence is the one that gets sent. Start with one sequence, measure results, iterate, and expand.

Good luck! 🍀
