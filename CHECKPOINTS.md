# VendiPro — Oversight Checkpoints (Claude / GPT)

This doc defines review prompts + cadence.  
Claude Opus 4.1 = top-level review. GPT-5 Thinking = step-by-step build.

---

## 🔎 When to Check
- **End of each batch** (before commit/push).  
- **Every 2–3 steps** inside a batch if scope is large.  
- **Pre-deploy** (final sanity check).

---

## 📝 Review Prompts
Claude should answer:
1. Is this step aligned with the roadmap + best practices?  
2. Any architectural concerns to address now (before tech debt builds)?  
3. Are dependencies/config handled in the smartest way?  
4. Is security/auth/data model sound so far?  
5. Does pacing make sense for ADHD-friendly workflow?  

---

## ✅ Review Flow
- Dev (me + GPT) finish a batch.  
- Copy latest `CHECKPOINTS.md` + relevant code diffs to Claude.  
- Claude reviews, suggests corrections.  
- Apply corrections in next step before moving forward.

---

## 🎯 Goal
Keep project **smart, lean, ADHD-friendly**, without drift or tech debt.
