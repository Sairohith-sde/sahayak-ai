import bcrypt from 'bcryptjs';
import { repository } from '../utils/repository.js';
import { isMongoMode } from '../config/db.js';

let isSeedingInProgress = false;

export async function seedData() {
  if (isSeedingInProgress) {
    console.log("ℹ️ Auto-seeding already in progress. Skipping duplicate request.");
    return;
  }
  isSeedingInProgress = true;
  try {
    const seedEnabled = process.env.SEED_SAMPLE_DATA === 'true' || !isMongoMode();
    if (!seedEnabled) {
      console.log("ℹ️ Auto-seeding skipped (SEED_SAMPLE_DATA is not true and database is in MongoDB mode).");
      isSeedingInProgress = false;
      return;
    }

    // Check if seeding is already done (by checking if Rani exists)
    const existingWorker = await repository.getOne('User', { email: 'rani.worker@sahayak.ai' });
    if (existingWorker) {
      console.log("ℹ️ Database already seeded. Skipping seeder.");
      isSeedingInProgress = false;
      return;
    }

    console.log("🌱 Database empty. Starting automatic database seeder...");

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Create Supervisor
    const supervisor = await repository.create('User', {
      _id: "sharma_supervisor_static_id_2026",
      name: "Dr. Sharma",
      email: "sharma.supervisor@sahayak.ai",
      password: passwordHash,
      role: "supervisor",
      supervisorId: null,
      languagePref: "en"
    });
    const supervisorId = supervisor._id || supervisor.id;

    // 2. Create Worker
    const worker = await repository.create('User', {
      _id: "rani_worker_static_id_2026",
      name: "Rani Devi",
      email: "rani.worker@sahayak.ai",
      password: passwordHash,
      role: "worker",
      supervisorId: supervisorId,
      languagePref: "en"
    });
    const workerId = worker._id || worker.id;

    // 3. Create Households & Visits
    const seedHouses = [
      { id: "meena_devi_house_static_id_2026", visitId: "mr38rzumsaiqhja", escalationId: "meena_escalation_static_id_2026", name: "Meena Devi", village: "Chandanpur", category: "child_nutrition", transcript: "Meena's baby, second visit, still not gaining weight, mother says the last immunization appointment was missed.", risk: "critical", just: "Severe pediatric stunting/wasting indicated by zero weight gain and missed vaccinations." },
      { id: "sita_devi_house_static_id_2026", visitId: "kof0o8jmsaiqhja", escalationId: "sita_escalation_static_id_2026", name: "Sita Devi", village: "Ramapuram", category: "maternal", transcript: "Sita reports extreme swelling in her feet and complains of blurred vision when walking. High risk signs.", risk: "critical", just: "Late-term pregnancy-related pre-eclampsia risk indicated by vision blur and limb swelling." },
      { id: "rohan_kumar_house_static_id_2026", visitId: "tpqzk12msaiqhja", escalationId: "rohan_escalation_static_id_2026", name: "Rohan Kumar", village: "Chandanpur", category: "immunization", transcript: "Rohan is 12 months old, missed the last vital polio and MMR immunization appointment, mother wants to reschedule.", risk: "high", just: "Missed vital childhood polio and MMR immunizations require immediate catch-up." },
      { id: "rajesh_patel_house_static_id_2026", visitId: "lbcfkg5msaiqhja", escalationId: "rajesh_escalation_static_id_2026", name: "Rajesh Patel", village: "Haripura", category: "TB_HIV", transcript: "Rajesh has stopped taking his TB medication since last 5 days because he says he felt some fatigue.", risk: "high", just: "TB treatment non-compliance observed; patient stopped critical regimen due to minor fatigue." },
      { id: "kavita_bai_house_static_id_2026", visitId: "kavita_visit_static_id_2026", name: "Kavita Bai", village: "Ramapuram", category: "maternal", transcript: "Kavita is feeling slightly tired today and reports minor lower back pain. Vital checkups are standard.", risk: "medium", just: "Mild pregnancy-related fatigue and back pain; worth secondary monitoring." },
      { id: "vikram_singh_house_static_id_2026", visitId: "vikram_visit_static_id_2026", name: "Vikram Singh", village: "Haripura", category: "general", transcript: "Vikram reports mild seasonal throat itchiness, but otherwise healthy. Standard blood pressure checked and it is fine.", risk: "medium", just: "Mild seasonal upper respiratory itch; standard vital signs are within normal limits." },
      { id: "pooja_sharma_house_static_id_2026", visitId: "pooja_visit_static_id_2026", name: "Pooja Sharma", village: "Chandanpur", category: "general", transcript: "Routine visit for Pooja. Reports excellent health, active, eating well and sleeping on time.", risk: "low", just: "Standard wellness checkup; child is active with excellent health indicators." },
      { id: "anil_gupta_house_static_id_2026", visitId: "anil_visit_static_id_2026", name: "Anil Gupta", village: "Haripura", category: "immunization", transcript: "Administered booster vaccine to Anil today. Child was cooperative, no redness or fever noted.", risk: "low", just: "Standard immunization booster administered; patient reports no adverse reactions." }
    ];

    for (let idx = 0; idx < seedHouses.length; idx++) {
      const data = seedHouses[idx];
      // Create Household
      const house = await repository.create('Household', {
        _id: data.id,
        name: data.name,
        village: data.village,
        category: data.category,
        workerId
      });
      const householdId = house._id || house.id;

      // Compile Report Structure
      const report = {
        title: "Sahayak AI Government Health Report",
        institution: "National Health Mission, Community Care Initiative",
        householdName: data.name,
        healthWorker: "Rani Devi",
        date: new Date(Date.now() - (idx + 1) * 12 * 3600 * 1000).toLocaleDateString('en-IN'),
        riskLevel: data.risk.toUpperCase(),
        summary: `Household visit recorded. System priority registered as ${data.risk.toUpperCase()}. Observations extracted: ${data.transcript}`,
        extractedDetails: {
          observations: [data.transcript],
          indicators: data.risk !== 'low' ? [data.just] : ["None"],
          followUp: data.risk !== 'low' ? `Yes, urgency: ${data.just}` : "No immediate follow-up required"
        },
        source: 'seed'
      };

      // Create Visit
      const visit = await repository.create('Visit', {
        _id: data.visitId,
        householdId,
        workerId,
        timestamp: new Date(Date.now() - (idx + 1) * 12 * 3600 * 1000), // deterministic 12h intervals spread backwards
        inputMode: "typed",
        rawTranscript: data.transcript,
        extractedData: {
          observations: [data.transcript],
          riskIndicators: data.risk !== 'low' ? [data.just] : [],
          followUpNeeded: data.risk !== 'low' ? 'yes' : 'no',
          followUpReason: data.risk !== 'low' ? data.just : ''
        },
        riskLevel: data.risk,
        riskJustification: data.just,
        report,
        status: ['high', 'critical'].includes(data.risk) ? 'escalated' : 'reviewed',
        trace: [
          { stage: "Extractor", input: { transcript: data.transcript }, output: { observations: [data.transcript] } },
          { stage: "Risk Scorer", input: { observations: [data.transcript] }, output: { riskLevel: data.risk, riskJustification: data.just } },
          { stage: "Report Writer", input: {}, output: report },
          { stage: "Escalation Evaluator", input: { riskLevel: data.risk }, output: { escalated: ['high', 'critical'].includes(data.risk) } }
        ]
      });

      // Create Escalation for high/critical cases
      if (['high', 'critical'].includes(data.risk)) {
        await repository.create('Escalation', {
          _id: data.escalationId,
          visitId: visit._id || visit.id,
          supervisorId: supervisorId,
          resolved: false,
          createdAt: visit.timestamp
        });
      }
    }

    console.log("✨ Database successfully auto-seeded with 1 Supervisor, 1 Worker, 8 Households, 8 Visits, and 4 Escalations!");
  } catch (error) {
    console.error(`❌ Failed to seed database: ${error.message}`);
  } finally {
    isSeedingInProgress = false;
  }
}
