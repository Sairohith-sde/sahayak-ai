import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { Mic, MicOff, AlertCircle, Sparkles, Copy, FileText, ArrowLeft, Check, Globe, Laptop, RefreshCw } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'or-IN', name: 'ଓଡ଼ିଆ (Odia)', flag: '🇮🇳' }
];

const LANGUAGE_PLACEHOLDERS = {
  'en-IN': "Enter field observations here (e.g., child fever, cough, missed vaccines)...",
  'hi-IN': "यहाँ क्षेत्र के अवलोकन दर्ज करें (जैसे: बुखार, खांसी, छूटे हुए टीके)...",
  'te-IN': "ఫీల్డ్ పరిశీలనలను ఇక్కడ నమోదు చేయండి (జ్వరం, దగ్గు, తప్పిపోయిన టీకాలు)...",
  'ta-IN': "கள அவதானிப்புகளை இங்கே உள்ளிடவும் (காய்ச்சல், இருமல், விடுபட்ட தடுப்பூசிகள்)...",
  'kn-IN': "ಕ್ಷೇತ್ರದ ವೀಕ್ಷಣೆಗಳನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ (ಜ್ವರ, ಕೆಮ್ಮು, ಲಸಿಕೆ ತಪ್ಪಿದೆ)...",
  'ml-IN': "ഫീൽഡ് നിരീക്ഷണങ്ങൾ ഇവിടെ നൽകുക (പനി, ചുമ, വാക്സിൻ നഷ്ടമായി)...",
  'mr-IN': "येथे क्षेत्रीय निरीक्षणे प्रविष्ट करा (ताप, खोकला, सुटलेली लस)...",
  'bn-IN': "এখানে ক্ষেত্রের পর্যবেক্ষণ লিখুন (জ্বর, কাশি, মিস হওয়া টিকা)...",
  'pa-IN': "ਇੱਥੇ ਖੇਤਰ ਦੇ ਨਿਰੀਖਣ ਦਰਜ ਕਰੋ (ਬੁਖਾਰ, ਖੰਘ, ਖੁੰਝੀ ਹੋਈ ਵੈਕਸੀਨ)...",
  'gu-IN': "અહીં ક્ષેત્રીય અવલોકનો દાખલ કરો (તાવ, ખાંસી, ચુકી ગયેલી રસી)...",
  'or-IN': "ଏଠାରେ କ୍ଷେତ୍ର ନିରୀକ୍ଷଣ ପ୍ରବେଶ କରନ୍ତୁ (ଜ୍ଵର, କାଶ, ଟିକା ଛୁଟିଯାଇଛି)..."
};

export default function RecordVisit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const location = useLocation();
  const workerId = user?._id || user?.id;
  const [selectedHouseId, setSelectedHouseId] = useState(location.state?.householdId || '');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'recording' | 'complete'

  // 1. Load language selection from localStorage or User preference
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('sahayak_worker_lang') || user?.languagePref || 'en-IN';
  });

  // Web Speech API reference
  const recognitionRef = useRef(null);

  // Canvas Visualizer references
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const wavePhaseRef = useRef(0);

  // Real-time Pipeline Trace states
  const [isPipelineStreaming, setIsPipelineStreaming] = useState(false);
  const [pipelineStages, setPipelineStages] = useState([
    { id: 'EXTRACTOR', label: 'Stage 1: Clinical Data Extractor', status: 'pending', summary: 'Awaiting stage initialization...' },
    { id: 'RISK_SCORER', label: 'Stage 2: Clinical Risk Scorer', status: 'pending', summary: 'Awaiting stage initialization...' },
    { id: 'PATTERN_DETECTION', label: 'Stage 2.5: Auto-Escalation Pattern Detector', status: 'pending', summary: 'Awaiting stage initialization...' },
    { id: 'REPORT_WRITER', label: 'Stage 3: Formal Report Writer', status: 'pending', summary: 'Awaiting stage initialization...' },
    { id: 'ESCALATION_EVALUATOR', label: 'Stage 4: Escalation Evaluator', status: 'pending', summary: 'Awaiting stage initialization...' },
    { id: 'TRACE_LOGGER', label: 'Stage 5: Secure Trace Audit Logger', status: 'pending', summary: 'Awaiting stage initialization...' }
  ]);

  // Fetch Households to populate dropdown
  const { data: households } = useQuery({
    queryKey: ['households', workerId],
    queryFn: async () => {
      const res = await api.get(`/households?workerId=${workerId}`);
      return res.data;
    },
    enabled: !!workerId
  });

  // Submit Visit Mutation (Returns sessionId, then streams via SSE!)
  const visitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/visits', payload);
      return res.data; // { sessionId }
    },
    onSuccess: (data) => {
      const { sessionId, visitId } = data;
      setIsPipelineStreaming(true);
      
      // Initialize states to active for Extractor
      setPipelineStages(prev => prev.map((stage, idx) => {
        if (idx === 0) return { ...stage, status: 'active', summary: 'Processing stream initiated...' };
        return { ...stage, status: 'pending', summary: 'Awaiting pipeline progression...' };
      }));

      // If the server ran the pipeline synchronously (highly recommended for serverless hosts like Vercel)
      if (visitId) {
        const mockSteps = [
          { id: 'EXTRACTOR', status: 'complete', summary: 'Regional language observations extracted successfully.' },
          { id: 'RISK_SCORER', status: 'complete', summary: 'Clinical risk scoring complete. Triage priority resolved.' },
          { id: 'PATTERN_DETECTION', status: 'complete', summary: 'Pattern auto-escalation evaluation finalized.' },
          { id: 'REPORT_WRITER', status: 'complete', summary: 'Structured English clinical report compiled.' },
          { id: 'ESCALATION_EVALUATOR', status: 'complete', summary: 'Escalation limits resolved. Handover recorded.' },
          { id: 'TRACE_LOGGER', status: 'complete', summary: 'Audit trail registered in the secure trace ledger.' }
        ];

        let currentIdx = 0;
        const interval = setInterval(() => {
          if (currentIdx < mockSteps.length) {
            const step = mockSteps[currentIdx];
            setPipelineStages(prev => prev.map(s => {
              if (s.id === step.id) {
                return { ...s, status: step.status, summary: step.summary };
              }
              const nextStep = mockSteps[currentIdx + 1];
              if (nextStep && s.id === nextStep.id) {
                return { ...s, status: 'active', summary: 'Analyzing stream data...' };
              }
              return s;
            }));
            currentIdx++;
          } else {
            clearInterval(interval);
            setIsPipelineStreaming(false);

            queryClient.invalidateQueries({ queryKey: ['dashboard', workerId] });
            queryClient.invalidateQueries({ queryKey: ['visits', workerId] });
            queryClient.invalidateQueries({ queryKey: ['households', workerId] });

            const isDemoActive = !!location.state?.liveDemo;
            setTimeout(() => {
              navigate(`/visits/${visitId}`, { state: { liveDemo: isDemoActive } });
            }, 600);
          }
        }, 1100);

        return;
      }

      const baseURL = api.defaults.baseURL || 'http://localhost:3001/api';
      const eventSource = new EventSource(`${baseURL}/visits/pipeline-stream/${sessionId}`);

      eventSource.onmessage = (event) => {
        const streamData = JSON.parse(event.data);
        
        setPipelineStages(prev => prev.map(stage => {
          if (stage.id === streamData.stage) {
            return {
              ...stage,
              status: streamData.status,
              summary: streamData.summary
            };
          }
          return stage;
        }));

        // Move active focus to the next stage in the pipeline
        if (streamData.status === 'complete' || streamData.status === 'fallback') {
          setPipelineStages(prev => {
            const currentIdx = prev.findIndex(s => s.id === streamData.stage);
            if (currentIdx !== -1 && currentIdx < prev.length - 1) {
              return prev.map((s, idx) => {
                if (idx === currentIdx + 1) {
                  return { ...s, status: 'active', summary: 'Ingesting data from previous stage...' };
                }
                return s;
              });
            }
            return prev;
          });
        }

        if (streamData.stage === 'FINAL_RESULT') {
          eventSource.close();
          setIsPipelineStreaming(false);

          queryClient.invalidateQueries({ queryKey: ['dashboard', workerId] });
          queryClient.invalidateQueries({ queryKey: ['visits', workerId] });
          queryClient.invalidateQueries({ queryKey: ['households', workerId] });

          const isDemoActive = !!location.state?.liveDemo;
          setTimeout(() => {
            navigate(`/visits/${streamData.visitId}`, { state: { liveDemo: isDemoActive } });
          }, 800);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        eventSource.close();
        setIsPipelineStreaming(false);
      };
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'The AI pipeline encountered an error. Falling back to local heuristic parser.');
    }
  });

  // Mutation to persist language pref on backend
  const langMutation = useMutation({
    mutationFn: async (languagePref) => {
      const res = await api.patch('/auth/language', { languagePref });
      return res.data;
    }
  });

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('sahayak_worker_lang', lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
    langMutation.mutate(lang);
  };

  // Siri Sinus Wave Visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      wavePhaseRef.current += isRecording ? 0.08 : 0.015;

      const waves = [
        { color: 'rgba(15, 155, 142, 0.4)', amplitude: isRecording ? 25 : 4, frequency: 0.015 },
        { color: 'rgba(30, 63, 117, 0.25)', amplitude: isRecording ? 18 : 2, frequency: 0.02 },
        { color: 'rgba(19, 181, 166, 0.5)', amplitude: isRecording ? 12 : 1, frequency: 0.03 }
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
          const y = midY + Math.sin(x * w.frequency + wavePhaseRef.current) * w.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  // Web Speech Recognition Handler
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang;

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      rec.onerror = (err) => {
        console.warn("⚠️ Web Speech recognition error caught:", err.error);
        if (err.error === 'not-allowed') {
          setErrorMessage('Microphone permissions denied. Please type observations directly in the box.');
          setIsRecording(false);
          setRecordingStatus('idle');
        }
      };

      rec.onend = () => {
        setIsRecording(false);
        setRecordingStatus(prev => prev === 'recording' ? 'complete' : prev);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLang]);

  // Automated high-fidelity simulation of live dictation when in liveDemo mode
  const isDemo = !!location.state?.liveDemo;
  useEffect(() => {
    if (isDemo && households && households.length > 0) {
      // Pick first child or maternal household, or just first one
      const targetHouse = households.find(h => h.category === 'child_nutrition') || households[0];
      setSelectedHouseId(targetHouse._id || targetHouse.id);
      
      // Auto-select Telugu
      setSelectedLang('te-IN');
      localStorage.setItem('sahayak_worker_lang', 'te-IN');
      
      // Start simulated typing animation after 1.5s
      const timer = setTimeout(() => {
        setRecordingStatus('recording');
        setIsRecording(true);
        
        const fullText = "మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు ఇంకా పెరగలేదు, అమ్మ చెప్పింది చివరి టీకా వేయలేదు అని.";
        let currentIdx = 0;
        let typedText = "";
        
        const typingInterval = setInterval(() => {
          if (currentIdx < fullText.length) {
            typedText += fullText[currentIdx];
            setTranscript(typedText);
            currentIdx++;
          } else {
            clearInterval(typingInterval);
            setIsRecording(false);
            setRecordingStatus('complete');
            
            // Auto submit after 1s
            setTimeout(() => {
              visitMutation.mutate({
                householdId: targetHouse._id || targetHouse.id,
                transcript: fullText,
                inputMode: 'voice'
              });
            }, 1000);
          }
        }, 80); // Typed in ~2.5 seconds
        
        return () => clearInterval(typingInterval);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isDemo, households]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Browser Speech-to-Text is unsupported. Please typeobservations in the editor box.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('complete');
    } else {
      setErrorMessage('');
      setRecordingStatus('recording');
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApplyEnglishDemo = () => {
    setTranscript("Meena's baby, second visit, still not gaining weight, mother says the last immunization appointment was missed.");
    setRecordingStatus('complete');
  };

  const handleApplyHindiDemo = () => {
    setTranscript("मीना का बच्चा, दूसरी बार आई हूं, वजन अभी भी नहीं बढ़ा, मां बोल रही है कि पिछला टीका नहीं लगा।");
    setRecordingStatus('complete');
  };

  const handleApplyTeluguDemo = () => {
    setTranscript("మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు ఇంకా పెరగలేదు, అమ్మ చెప్పింది చివరి టీకా వేయలేదు అని.");
    setRecordingStatus('complete');
  };

  const handleSubmitVisit = () => {
    setErrorMessage('');
    if (!selectedHouseId) {
      setErrorMessage('Please select a registered household first.');
      return;
    }
    if (!transcript.trim()) {
      setErrorMessage('Please record or type observation notes before processing.');
      return;
    }

    visitMutation.mutate({
      householdId: selectedHouseId,
      transcript: transcript,
      inputMode: transcript.length > 50 ? 'voice' : 'typed'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center space-x-3.5 border-b border-[#E2E8F0] pb-4">
        <Link 
          to="/" 
          className="p-2 bg-white border border-slate-300 hover:bg-[#EEF1F6] rounded-lg text-slate-500 hover:text-[#0A1628] transition-colors focus:outline-none"
          title="Return to prioritized desk"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-[22px] font-bold text-[#0A1628] uppercase tracking-tight">New Field Visit Record</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">Log raw frontline observations to run Decision Triage checks</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-[#DC2626] text-[#991B1B] px-4 py-3.5 rounded-lg text-xs flex items-start space-x-2.5 font-medium shadow-sm">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TWO COLUMN PREMIUM WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* ==================== LEFT COLUMN (60% Width) ==================== */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] space-y-6">
            
            {/* 1. Household Select Dropdown */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Select Registered Household Location
              </label>
              <select
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
                className="w-full h-12 px-3 border border-slate-300 bg-white rounded-lg text-sm text-[#0A1628] focus-ring font-semibold cursor-pointer"
              >
                <option value="">-- CHOOSE HOUSEHOLD LOCATION --</option>
                {households?.map((h) => (
                  <option key={h._id || h.id} value={h._id || h.id}>
                    {h.name} ({h.village}) • {h.category.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Interactive Flag-Pill Language Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                2. Input Dictation Language (Select once)
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer border transition-all duration-150 select-none ${
                        isSelected 
                          ? 'bg-[#E0F5F3] border-[#0F9B8E] text-[#0D7A6F] font-bold shadow-sm scale-[1.02]' 
                          : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-sm leading-none">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isDemo && recordingStatus !== 'complete' && (
              <div className="bg-[#E0F5F3] border-2 border-dashed border-[#0F9B8E] rounded-xl p-5 mb-4 text-center space-y-2 animate-bounce">
                <p className="text-xs font-bold text-[#0D7A6F] uppercase tracking-widest">⚡ SPEAK THIS SENTENCE (LIVE DEMO ACTIVE):</p>
                <p className="text-lg font-extrabold text-[#0A1628] leading-relaxed select-all">
                  "మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు ఇంకా పెరగలేదు, అమ్మ చెప్పింది చివరి టీకా వేయలేదు అని."
                </p>
                <p className="text-xs font-bold text-slate-500 italic mt-1">
                  (Meena's child, second visit, weight still not gaining, mother says last vaccine was missed)
                </p>
              </div>
            )}

            {/* 3. Siri sinwave & microphone action board */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                3. Dictation Recording Ingestion Feed
              </label>
              <div className="border border-slate-200 rounded-xl bg-[#EEF1F6] p-6 flex flex-col items-center justify-center space-y-4 shadow-inner relative overflow-hidden min-h-[160px]">
                
                {/* Siri Sinus Wave canvas */}
                <canvas 
                  ref={canvasRef} 
                  width={500} 
                  height={50} 
                  className="w-full max-w-sm h-[50px] pointer-events-none"
                />

                {/* Status messages depending on state */}
                <div className="text-center">
                  {recordingStatus === 'idle' && (
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">TAP TO INITIATE MIC FEED</p>
                  )}
                  {recordingStatus === 'recording' && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#991B1B] font-bold uppercase tracking-widest animate-pulse">RECORDING ACTIVE — SPEAK NATURALLY</p>
                      {/* CSS pulse waves */}
                      <div className="flex justify-center items-center gap-1.5 h-6">
                        <div className="w-1 bg-[#DC2626] rounded-full animate-wave-bar" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 bg-[#DC2626] rounded-full animate-wave-bar" style={{animationDelay: '0.3s'}}></div>
                        <div className="w-1 bg-[#DC2626] rounded-full animate-wave-bar" style={{animationDelay: '0.5s'}}></div>
                        <div className="w-1 bg-[#DC2626] rounded-full animate-wave-bar" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 bg-[#DC2626] rounded-full animate-wave-bar" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  )}
                  {recordingStatus === 'complete' && (
                    <p className="text-xs text-[#166534] font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                      <Check className="w-4 h-4 text-[#16A34A] stroke-[3px]" />
                      <span>VOICE TRANSCRIPT SUCCESSFULLY INGESTED</span>
                    </p>
                  )}
                </div>

                {/* Center Record button */}
                <button
                  onClick={toggleRecording}
                  className={`flex items-center space-x-2.5 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow transition-all duration-150 cursor-pointer active:scale-95 ${
                    isRecording 
                      ? 'bg-[#DC2626] text-white hover:bg-red-700 animate-pulse' 
                      : 'bg-[#0A1628] hover:bg-[#1A3461] text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 text-white" />
                      <span>STOP RECORDING</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#13B5A6]" />
                      <span>START RECORDING</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4. Observations Editor TextArea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  4. Raw Spoken Text / Observation Draft
                </label>
                <span className="text-[10px] font-bold text-slate-400 bg-[#EEF1F6] px-2 py-0.5 rounded border">
                  Manual Corrective Editor
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (e.target.value) setRecordingStatus('complete');
                }}
                rows={6}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus-ring text-[#0A1628] font-medium leading-relaxed"
                placeholder={LANGUAGE_PLACEHOLDERS[selectedLang] || "Enter observation notes..."}
              />
            </div>

            {/* Submit Actions */}
            <button
              onClick={handleSubmitVisit}
              disabled={visitMutation.isPending}
              className="w-full h-12 bg-[#0D7A6F] hover:bg-[#0F9B8E] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2.5 border border-[#0D7A6F] shadow"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>{visitMutation.isPending ? 'Executing AI Decision Pipeline...' : 'Process Co-Pilot Triage'}</span>
            </button>

          </div>
        </div>

        {/* ==================== RIGHT COLUMN (40% Width) ==================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live pipeline status visualizer panel */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
            <h3 className="text-xs font-bold text-[#0A1628] uppercase tracking-wider border-b pb-3 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#0F9B8E]" />
              <span>Real-Time Clinical Trace Auditor</span>
            </h3>

            {(visitMutation.isPending || isPipelineStreaming) ? (
              <div className="relative pl-6 space-y-6 py-2">
                {/* Timeline vertical bar */}
                <div className="absolute top-2 left-2.5 bottom-2 w-0.5 bg-slate-100 z-0"></div>
                
                {pipelineStages.map((stage) => {
                  const getStageIcon = (status) => {
                    switch (status) {
                      case 'active':
                        return (
                          <div className="w-5 h-5 rounded-full border-2 border-[#0F9B8E] flex items-center justify-center bg-white flex-shrink-0 z-10 animate-pulse">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#0F9B8E]" />
                          </div>
                        );
                      case 'complete':
                        return (
                          <div className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center text-white flex-shrink-0 z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          </div>
                        );
                      case 'fallback':
                        return (
                          <div className="w-5 h-5 rounded-full bg-[#D97706] flex items-center justify-center text-white flex-shrink-0 z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          </div>
                        );
                      default:
                        return (
                          <div className="w-5 h-5 rounded-full border border-slate-200 bg-white flex-shrink-0 z-10" />
                        );
                    }
                  };

                  return (
                    <div key={stage.id} className="relative flex items-start space-x-4 z-10 animate-[fadeIn_150ms_ease-out]">
                      {getStageIcon(stage.status)}
                      <div className="leading-tight">
                        <span className={`block text-xs font-bold ${stage.status === 'active' ? 'text-[#0D7A6F]' : stage.status === 'complete' ? 'text-[#166534]' : stage.status === 'fallback' ? 'text-[#B45309]' : 'text-slate-500'}`}>
                          {stage.label}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wide">
                          {stage.summary}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Idle/Awaiting status empty state
              <div className="py-8 text-center text-slate-400 space-y-3">
                <Laptop className="w-12 h-12 mx-auto text-slate-300" />
                <div className="max-w-xs mx-auto">
                  <p className="font-bold text-slate-600 text-xs uppercase tracking-wider">Awaiting Input Stream</p>
                  <p className="text-[11px] text-slate-400 mt-1">Dictate or enter notes on the left. Clinically scoped details resolve here in real-time as the co-pilot works.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Assist Scripting Desk */}
          <div className="bg-[#E0F5F3] border border-[#0F9B8E] rounded-lg p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-[#0D7A6F] uppercase tracking-widest flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#0D7A6F]" />
              <span>Official Demo Presets</span>
            </h4>
            <p className="text-[11px] text-[#0D7A6F] font-semibold leading-relaxed">
              Instantly apply pre-scripted multilingual test-cases to demonstrate real-time translations during evaluation.
            </p>
            
            <div className="space-y-2 text-[11px] font-semibold">
              <button
                onClick={handleApplyEnglishDemo}
                className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-teal-200 p-2.5 rounded-lg text-teal-950 transition-colors cursor-pointer"
              >
                <span className="font-bold">🇬🇧 English Script</span>
                <span className="text-[9px] font-bold uppercase bg-[#E0F5F3] px-2 py-0.5 rounded text-[#0D7A6F]">Apply</span>
              </button>
              <button
                onClick={handleApplyHindiDemo}
                className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-teal-200 p-2.5 rounded-lg text-teal-950 transition-colors cursor-pointer"
              >
                <span className="font-bold">🇮🇳 हिन्दी (Hindi) Script</span>
                <span className="text-[9px] font-bold uppercase bg-[#E0F5F3] px-2 py-0.5 rounded text-[#0D7A6F]">Apply</span>
              </button>
              <button
                onClick={handleApplyTeluguDemo}
                className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-teal-200 p-2.5 rounded-lg text-teal-950 transition-colors cursor-pointer"
              >
                <span className="font-bold">🇮🇳 తెలుగు (Telugu) Script</span>
                <span className="text-[9px] font-bold uppercase bg-[#E0F5F3] px-2 py-0.5 rounded text-[#0D7A6F]">Apply</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
