export const mockUsers = [
  {
    _id: "rani_worker_static_id_2026",
    name: "Rani Devi",
    email: "rani.worker@sahayak.ai",
    password: "hashed_password_123",
    role: "worker",
    supervisorId: "sharma_supervisor_static_id_2026",
    languagePref: "en"
  },
  {
    _id: "sharma_supervisor_static_id_2026",
    name: "Dr. Sharma",
    email: "sharma.supervisor@sahayak.ai",
    password: "hashed_password_123",
    role: "supervisor",
    supervisorId: null,
    languagePref: "en"
  }
];

export const mockHouseholds = [
  {
    _id: "hh_meena_devi_1",
    name: "Meena Devi",
    village: "Chandanpur",
    category: "Child Nutrition",
    headOfHousehold: "Rajesh Kumar",
    phone: "9876543210"
  },
  {
    _id: "hh_sita_devi_2",
    name: "Sita Devi",
    village: "Ramapuram",
    category: "Maternal Health",
    headOfHousehold: "Amit Devi",
    phone: "9123456789"
  }
];

export const mockVisits = [
  {
    _id: "visit_meena_1",
    householdId: "hh_meena_devi_1",
    healthWorkerId: "rani_worker_static_id_2026",
    riskLevel: "medium",
    status: "audited",
    rawTranscript: "Baby is doing well, but missed last vaccine.",
    report: {
      date: "2026-08-01",
      healthWorker: "Rani Devi",
      summary: "Baby has mild weakness and missed vaccine.",
      extractedDetails: {
        observations: ["Missed vital immunization", "Normal activity level"],
        indicators: ["vaccine lapse"],
        followUp: "Schedule vaccine catch-up"
      }
    }
  }
];
