# Sahayak AI Live Demonstration Script

This document contains pre-scripted clinical test cases and spoken voice-note paths designed to demonstrate the real-time capabilities of Sahayak AI.

Use these scenarios during live hackathon evaluations, client presentations, or local end-to-end sandbox testing.

---

## Scenario 1: Severe Infant Nutrition Risk (Critical Triage)

**Objective**: Show how ASHA worker Rani Devi uses her voice to log a critical child-nutrition checkup, triggering immediate decision support, a structured government report, and a supervisor escalation alert.

### Step-by-Step Flow:
1. Authenticate as **Rani Devi (ASHA Worker)** on the login screen using the Quick Bypass button.
2. Select **Meena Devi (Chandanpur)** from the dropdown list.
3. Click **Start Voice Ingestion** or click **Apply Demo Script** to paste the following pre-scripted phrase:
   - **English**: *"Meena's baby, second visit, still not gaining weight, mother says the last immunization appointment was missed."*
   - **Hindi**: *"मीना का बच्चा, दूसरी बार आई हूं, वजन अभी भी नहीं बढ़ा, मां बोल रही है कि पिछला टीका नहीं लगा।"*
   - **Telugu**: *"మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు ఇంకా పెరగలేదు, అమ్మ చెప్పింది చివరి టీకా వేయలేదు అని."*
4. Click **Process Co-Pilot Triage** to execute the 5-Stage Agentic Pipeline.
5. **Observe the Results (Regional to English Audit Flow)**:
   - The screen transitions automatically to the **Visit Detail File**.
   - **Step 3 (Multilingual Source vs. English Document Layout)**: Show the Visit Detail page. Point out that the worker's original Telugu/Hindi spoken note is preserved at the top (Section A - Screen-only for auditing), and the formal English report is generated below it automatically (Section B - Official document).
   - Click **Print / Export PDF** to show the clean English-only report preview that a supervisor or PHC doctor would receive (Section A is automatically excluded from the printed layout).
   - Note the **CRITICAL** triage level badge.
   - Look at the **Section III: Justification** box. It explains the high risk in English due to weight stunting and missed infant vaccinations.
   - Exit back to the **Prioritized Task Desk** and verify that Meena Devi's household has instantly moved to the top of the ledger with a glowing red critical badge!

---

## Scenario 2: Late-term Pregnancy Signs (Critical Triage)

**Objective**: Demonstrate voice logs catching maternal risk signs, leading to high-priority triage.

### Spoken Voice Transcript:
> *"Sita reports extreme swelling in her feet and complains of blurred vision when walking. High risk signs."*

### Step-by-Step Flow:
1. Select **Sita Devi (Ramapuram)** from the dropdown.
2. Dictate or paste the above transcript into the observations box.
3. Click **Process Co-Pilot Triage**.
4. **Observe the Results**:
   - Triage is graded as **CRITICAL**.
   - Justification highlights severe pre-eclampsia warnings (blurred vision and limb swelling).
   - Sign out of the worker portal.

---

## Scenario 3: Supervisor Alert Resolution

**Objective**: Show how Primary Health Center (PHC) Supervising Medical Officer Dr. Sharma receives critical alerts in real-time, reviews the worker's case file, and resolves the issue.

### Step-by-Step Flow:
1. Authenticate as **Dr. Sharma (Supervisor)** on the login screen.
2. Observe the **Critical Alerts Action Queue** containing Meena Devi and Sita Devi's active escalations.
3. Click **Review File** on Meena Devi's alert to review the official generated report.
4. Go to the **Pipeline Audit** tab to see the active stages lit up green, showcasing complete audit-trail transparency.
5. Return to the dashboard and click **Resolve** on the Meena Devi alert.
6. **Observe the Results**:
   - The alert is cleared instantly from the queue.
   - The database updates the associated Visit status back to standard "reviewed."
