import * as React from "react";
import { 
  Activity, 
  Stethoscope, 
  ClipboardList, 
  BrainCircuit, 
  User, 
  MapPin, 
  Thermometer, 
  HeartPulse, 
  Wind, 
  Droplets, 
  AlertCircle, 
  Pill, 
  History, 
  Send,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  GraduationCap,
  PlusCircle,
  LogIn,
  ChevronRight,
  Plus,
  Trash2,
  Lightbulb,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IncidentData, HandoverProtocol, UserSession, Finding } from "../types";
import { generateHandoverProtocol, getAiAssistance, suggestMeasures } from "../services/geminiService";
import { cn } from "@/lib/utils";

const initialData: IncidentData = {
  patientName: "",
  patientAge: "",
  location: "",
  diagnosticValues: "",
  vitalSigns: {
    bloodPressure: "",
    heartRate: "",
    oxygenSaturation: "",
    temperature: "",
    respiratoryRate: "",
    glucose: "",
  },
  problems: "",
  xabcde: {
    criticalBleeding: [],
    airway: 'unknown',
    breathing: {
      rate: "",
      sounds: "",
    },
    disability: [],
    exposure: [],
  },
  sampler: {
    symptoms: [],
    allergies: [],
    medication: [],
    pastHistory: [],
    lastMeal: "",
    events: [],
    riskFactors: [],
  },
  befast: {
    balance: "",
    eyes: "",
    face: "",
    arms: "",
    speech: "",
    time: "",
  },
  medicationsAdministered: "",
  generalValues: "",
};

export default function RescueTab() {
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [loginForm, setLoginForm] = React.useState<UserSession>({
    name: "",
    vehicle: "",
    qualification: "Rettungssanitäter",
    additionalQualification: "Keine"
  });
  const [data, setData] = React.useState<IncidentData>(initialData);
  const [protocol, setProtocol] = React.useState<HandoverProtocol | null>(null);
  const [measures, setMeasures] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isMeasuresLoading, setIsMeasuresLoading] = React.useState(false);
  const [useAi, setUseAi] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"incident" | "protocol" | "ai" | "measures">("incident");
  const [chatQuery, setChatQuery] = React.useState("");
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  const handleInputChange = (field: keyof IncidentData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleVitalChange = (field: keyof IncidentData['vitalSigns'], value: string) => {
    setData(prev => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value }
    }));
  };

  const handleAddFinding = (schema: 'xabcde' | 'sampler', field: string, label: string, value: string) => {
    if (!label || !value) return;
    const newFinding: Finding = { id: Math.random().toString(36).substr(2, 9), label, value };
    setData(prev => {
      const schemaData = prev[schema] as any;
      return {
        ...prev,
        [schema]: {
          ...schemaData,
          [field]: [...(schemaData[field] || []), newFinding]
        }
      };
    });
  };

  const handleRemoveFinding = (schema: 'xabcde' | 'sampler', field: string, id: string) => {
    setData(prev => {
      const schemaData = prev[schema] as any;
      return {
        ...prev,
        [schema]: {
          ...schemaData,
          [field]: schemaData[field].filter((f: Finding) => f.id !== id)
        }
      };
    });
  };

  const handleSchemaValueChange = (schema: 'xabcde' | 'sampler' | 'befast', field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [schema]: {
        ...(prev[schema] as any),
        [field]: value
      }
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.name && loginForm.vehicle) {
      setSession(loginForm);
    }
  };

  const handleGenerateProtocol = async () => {
    setIsGenerating(true);
    setActiveTab("protocol");
    
    let content = "";
    if (useAi) {
      content = await generateHandoverProtocol(data);
    } else {
      // Manual generation fallback
      content = `Übergabeprotokoll - ${new Date().toLocaleString()}\n\n` +
        `Personal: ${session?.name} (${session?.qualification})\n` +
        `Fahrzeug: ${session?.vehicle}\n\n` +
        `Patient: ${data.patientName}, Alter: ${data.patientAge}\n` +
        `Ort: ${data.location}\n` +
        `Probleme: ${data.problems}\n` +
        `XABCDE: ${JSON.stringify(data.xabcde)}\n` +
        `Vitalwerte: BP ${data.vitalSigns.bloodPressure}, HR ${data.vitalSigns.heartRate}, SpO2 ${data.vitalSigns.oxygenSaturation}\n` +
        `Medikamente: ${data.medicationsAdministered}`;
    }

    setProtocol({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      content,
      isAiGenerated: useAi
    });
    setIsGenerating(false);
  };

  const handleImportMeasures = async () => {
    setIsMeasuresLoading(true);
    const result = await suggestMeasures(data);
    setMeasures(result);
    setIsMeasuresLoading(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMessage = chatQuery;
    setChatQuery("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    const aiResponse = await getAiAssistance(userMessage, data);
    setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsChatLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-blue-600 p-8 text-center">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Activity className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white">RescueTab AI</h1>
              <p className="text-blue-100 text-sm mt-1">Bitte melden Sie sich an</p>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-name" className="text-slate-600">Vollständiger Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      id="login-name" 
                      placeholder="Max Mustermann" 
                      className="pl-10 h-12"
                      value={loginForm.name}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-vehicle" className="text-slate-600">Fahrzeug-Funkrufname</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      id="login-vehicle" 
                      placeholder="RTW 7/83-1" 
                      className="pl-10 h-12"
                      value={loginForm.vehicle}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, vehicle: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Qualifikation</Label>
                    <Select 
                      value={loginForm.qualification} 
                      onValueChange={(v: any) => setLoginForm(prev => ({ ...prev, qualification: v }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rettungshelfer">Rettungshelfer</SelectItem>
                        <SelectItem value="Rettungssanitäter">Rettungssanitäter</SelectItem>
                        <SelectItem value="Notfallsanitäter">Notfallsanitäter</SelectItem>
                        <SelectItem value="Notarzt">Notarzt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Zusatz</Label>
                    <Select 
                      value={loginForm.additionalQualification} 
                      onValueChange={(v: any) => setLoginForm(prev => ({ ...prev, additionalQualification: v }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Keine">Keine</SelectItem>
                        <SelectItem value="Praxisanleiter">Praxisanleiter</SelectItem>
                        <SelectItem value="OrgL">OrgL</SelectItem>
                        <SelectItem value="ELRD">ELRD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-4">
                  Anmelden
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-slate-500 text-xs mt-6">
            © 2024 RescueTab Digital Solutions | Sicher & Verschlüsselt
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">RescueTab AI</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Digitales Einsatz-Tablet</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            <p className="text-xs text-slate-500 font-mono">{new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{session.vehicle}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 space-y-2 flex-1">
            <NavButton 
              active={activeTab === "incident"} 
              onClick={() => setActiveTab("incident")}
              icon={<ClipboardList className="w-5 h-5" />}
              label="Einsatzdaten"
            />
            <NavButton 
              active={activeTab === "measures"} 
              onClick={() => setActiveTab("measures")}
              icon={<Lightbulb className="w-5 h-5" />}
              label="Maßnahmen"
            />
            <NavButton 
              active={activeTab === "protocol"} 
              onClick={() => setActiveTab("protocol")}
              icon={<Stethoscope className="w-5 h-5" />}
              label="Übergabe"
            />
            <NavButton 
              active={activeTab === "ai"} 
              onClick={() => setActiveTab("ai")}
              icon={<BrainCircuit className="w-5 h-5" />}
              label="KI-Assistent"
            />
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="hidden md:block overflow-hidden">
                <p className="text-sm font-bold truncate">{session.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-white">{session.qualification}</Badge>
                  {session.additionalQualification !== "Keine" && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">{session.additionalQualification}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "incident" && (
                <motion.div
                  key="incident"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Einsatzdatenerfassung</h2>
                      <p className="text-slate-500">Erfassen Sie alle relevanten Informationen zum aktuellen Einsatz.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 px-2">
                        <Label htmlFor="ai-toggle" className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">KI-Unterstützung</Label>
                        <Switch 
                          id="ai-toggle" 
                          checked={useAi} 
                          onCheckedChange={setUseAi}
                        />
                      </div>
                      <Button 
                        onClick={handleGenerateProtocol}
                        disabled={isGenerating || !data.patientName}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Protokoll erstellen
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Patient & Location */}
                    <Card className="shadow-sm border-slate-200 md:col-span-1">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          Patient
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="name">Name</Label>
                            <Input 
                              id="name" 
                              placeholder="Vorname Nachname" 
                              value={data.patientName}
                              onChange={(e) => handleInputChange("patientName", e.target.value)}
                              className="bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="age">Alter</Label>
                            <Input 
                              id="age" 
                              placeholder="z.B. 45" 
                              value={data.patientAge}
                              onChange={(e) => handleInputChange("patientAge", e.target.value)}
                              className="bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Standort</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                              <Input 
                                id="location" 
                                placeholder="Ort" 
                                value={data.location}
                                onChange={(e) => handleInputChange("location", e.target.value)}
                                className="pl-10 bg-slate-50 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vital Signs */}
                    <Card className="shadow-sm border-slate-200 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <HeartPulse className="w-5 h-5 text-red-600" />
                          Vitalwerte (C - Zirkulation)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <VitalInput type="bp" label="Blutdruck" icon={<Droplets className="w-4 h-4 text-red-400" />} placeholder="120/80" value={data.vitalSigns.bloodPressure} onChange={(v) => handleVitalChange("bloodPressure", v)} />
                        <VitalInput type="hr" label="Puls" icon={<Activity className="w-4 h-4 text-red-400" />} placeholder="72" value={data.vitalSigns.heartRate} onChange={(v) => handleVitalChange("heartRate", v)} />
                        <VitalInput type="spo2" label="SpO2" icon={<Wind className="w-4 h-4 text-blue-400" />} placeholder="98" value={data.vitalSigns.oxygenSaturation} onChange={(v) => handleVitalChange("oxygenSaturation", v)} />
                        <VitalInput type="temp" label="Temp" icon={<Thermometer className="w-4 h-4 text-orange-400" />} placeholder="36.5" value={data.vitalSigns.temperature} onChange={(v) => handleVitalChange("temperature", v)} />
                        <VitalInput type="af" label="AF" icon={<Wind className="w-4 h-4 text-slate-400" />} placeholder="14" value={data.vitalSigns.respiratoryRate} onChange={(v) => handleVitalChange("respiratoryRate", v)} />
                        <VitalInput type="bz" label="BZ" icon={<Droplets className="w-4 h-4 text-purple-400" />} placeholder="100" value={data.vitalSigns.glucose} onChange={(v) => handleVitalChange("glucose", v)} />
                      </CardContent>
                    </Card>

                    {/* XABCDE Schema */}
                    <Card className="shadow-sm border-slate-200 md:col-span-3">
                      <CardHeader className="pb-3 bg-slate-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-600" />
                          XABCDE-Schema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* X - Critical Bleeding */}
                          <FindingList 
                            title="X - Kritische Blutung"
                            findings={data.xabcde.criticalBleeding}
                            onAdd={(l, v) => handleAddFinding('xabcde', 'criticalBleeding', l, v)}
                            onRemove={(id) => handleRemoveFinding('xabcde', 'criticalBleeding', id)}
                            color="red"
                          />

                          {/* A - Airway */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">A - Atemwege</Label>
                            <div className="flex gap-2">
                              <Button 
                                variant={data.xabcde.airway === 'free' ? 'default' : 'outline'}
                                onClick={() => handleSchemaValueChange('xabcde', 'airway', 'free')}
                                className={cn("flex-1", data.xabcde.airway === 'free' && "bg-green-600 hover:bg-green-700")}
                              >
                                Frei
                              </Button>
                              <Button 
                                variant={data.xabcde.airway === 'obstructed' ? 'destructive' : 'outline'}
                                onClick={() => handleSchemaValueChange('xabcde', 'airway', 'obstructed')}
                                className="flex-1"
                              >
                                Blockiert
                              </Button>
                            </div>
                          </div>

                          {/* B - Breathing */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">B - Belüftung</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-500">Atemfrequenz</Label>
                                <Input 
                                  type="number"
                                  placeholder="AF" 
                                  value={data.xabcde.breathing.rate}
                                  onChange={(e) => handleSchemaValueChange('xabcde', 'breathing', { ...data.xabcde.breathing, rate: e.target.value })}
                                  className="h-9 bg-slate-50"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] text-slate-500">Atemgeräusche</Label>
                                <Input 
                                  placeholder="z.B. Rasseln" 
                                  value={data.xabcde.breathing.sounds}
                                  onChange={(e) => handleSchemaValueChange('xabcde', 'breathing', { ...data.xabcde.breathing, sounds: e.target.value })}
                                  className="h-9 bg-slate-50"
                                />
                              </div>
                            </div>
                          </div>

                          {/* D - Disability */}
                          <FindingList 
                            title="D - Defizite"
                            findings={data.xabcde.disability}
                            onAdd={(l, v) => handleAddFinding('xabcde', 'disability', l, v)}
                            onRemove={(id) => handleRemoveFinding('xabcde', 'disability', id)}
                            labelPlaceholder="Bereich (z.B. Rechter Arm)"
                            valuePlaceholder="Defizit (z.B. Zittert)"
                            color="orange"
                          />

                          {/* E - Exposure */}
                          <div className="md:col-span-2">
                            <FindingList 
                              title="E - Exposition"
                              findings={data.xabcde.exposure}
                              onAdd={(l, v) => handleAddFinding('xabcde', 'exposure', l, v)}
                              onRemove={(id) => handleRemoveFinding('xabcde', 'exposure', id)}
                              labelPlaceholder="Bereich"
                              valuePlaceholder="Befund (z.B. Kratzer)"
                              color="blue"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SAMPLER & BEFAST */}
                    <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 bg-slate-50/50">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-purple-600" />
                            SAMPLER-Schema
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <FindingList title="S - Symptome" findings={data.sampler.symptoms} onAdd={(l, v) => handleAddFinding('sampler', 'symptoms', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'symptoms', id)} color="purple" />
                          <FindingList title="A - Allergien" findings={data.sampler.allergies} onAdd={(l, v) => handleAddFinding('sampler', 'allergies', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'allergies', id)} color="purple" />
                          <FindingList title="M - Medikamente" findings={data.sampler.medication} onAdd={(l, v) => handleAddFinding('sampler', 'medication', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'medication', id)} color="purple" />
                          <FindingList title="P - Patientengeschichte" findings={data.sampler.pastHistory} onAdd={(l, v) => handleAddFinding('sampler', 'pastHistory', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'pastHistory', id)} color="purple" />
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">L - Letzte Mahlzeit</Label>
                            <Input 
                              placeholder="Wann? Was?" 
                              value={data.sampler.lastMeal}
                              onChange={(e) => handleSchemaValueChange("sampler", "lastMeal", e.target.value)}
                              className="bg-slate-50"
                            />
                          </div>

                          <FindingList title="E - Ereignis" findings={data.sampler.events} onAdd={(l, v) => handleAddFinding('sampler', 'events', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'events', id)} color="purple" />
                          <FindingList title="R - Risikofaktoren" findings={data.sampler.riskFactors} onAdd={(l, v) => handleAddFinding('sampler', 'riskFactors', l, v)} onRemove={(id) => handleRemoveFinding('sampler', 'riskFactors', id)} color="purple" />
                        </CardContent>
                      </Card>

                      <div className="space-y-6">
                        <Card className="shadow-sm border-slate-200">
                          <CardHeader className="pb-3 bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <BrainCircuit className="w-5 h-5 text-red-600" />
                              BEFAST-Schema (Schlaganfall)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <BefastInput label="B - Balance" value={data.befast.balance} onChange={(v) => handleSchemaValueChange("befast", "balance", v)} />
                              <BefastInput label="E - Eyes" value={data.befast.eyes} onChange={(v) => handleSchemaValueChange("befast", "eyes", v)} />
                              <BefastInput label="F - Face" value={data.befast.face} onChange={(v) => handleSchemaValueChange("befast", "face", v)} />
                              <BefastInput label="A - Arms" value={data.befast.arms} onChange={(v) => handleSchemaValueChange("befast", "arms", v)} />
                              <BefastInput label="S - Speech" value={data.befast.speech} onChange={(v) => handleSchemaValueChange("befast", "speech", v)} />
                              <BefastInput label="T - Time" value={data.befast.time} onChange={(v) => handleSchemaValueChange("befast", "time", v)} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Pill className="w-5 h-5 text-blue-600" />
                              Therapie & Sonstiges
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Verabreichte Medikamente</Label>
                              <Textarea 
                                placeholder="Medikamente, Dosierung, Zeitpunkt..." 
                                value={data.medicationsAdministered}
                                onChange={(e) => handleInputChange("medicationsAdministered", e.target.value)}
                                className="bg-slate-50 min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Allgemeine Bemerkungen</Label>
                              <Textarea 
                                placeholder="Weitere Beobachtungen..." 
                                value={data.generalValues}
                                onChange={(e) => handleInputChange("generalValues", e.target.value)}
                                className="bg-slate-50 min-h-[80px]"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "measures" && (
                <motion.div
                  key="measures"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Empfohlene Maßnahmen</h2>
                      <p className="text-slate-500">KI-gestützte Analyse und Handlungsempfehlungen.</p>
                    </div>
                    <Button 
                      onClick={handleImportMeasures}
                      disabled={isMeasuresLoading || !data.patientName}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {isMeasuresLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                      Daten importieren & analysieren
                    </Button>
                  </div>

                  <Card className="shadow-lg border-none bg-white min-h-[400px]">
                    <CardContent className="p-8">
                      {isMeasuresLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                          <p className="text-slate-500 font-medium animate-pulse">KI analysiert Einsatzdaten...</p>
                        </div>
                      ) : measures ? (
                        <div className="prose prose-slate max-w-none">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                            <p className="text-sm text-blue-800 leading-relaxed">
                              Diese Empfehlungen basieren auf einer KI-Analyse der erfassten Daten. Sie dienen als Unterstützung und ersetzen nicht die fachliche Beurteilung vor Ort.
                            </p>
                          </div>
                          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {measures}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                          <div className="bg-slate-100 p-6 rounded-full">
                            <Download className="w-12 h-12 text-slate-300" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-700">Keine Daten importiert</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">Klicken Sie auf "Daten importieren", um eine KI-Analyse der aktuellen Einsatzdaten zu starten.</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "protocol" && (
                <motion.div
                  key="protocol"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Übergabeprotokoll</h2>
                      <p className="text-slate-500">Generiertes Protokoll für die Klinikübergabe.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setActiveTab("incident")}>
                        Zurück zur Bearbeitung
                      </Button>
                      <Button 
                        onClick={handleGenerateProtocol}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isGenerating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Neu generieren
                      </Button>
                    </div>
                  </div>

                  <Card className="shadow-lg border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {protocol?.isAiGenerated ? "KI-Generiert" : "Manuell"}
                        </Badge>
                        <span className="text-slate-400 text-xs font-mono">ID: {protocol?.id}</span>
                      </div>
                      <span className="text-slate-400 text-xs font-mono">
                        {protocol ? new Date(protocol.timestamp).toLocaleString('de-DE') : ""}
                      </span>
                    </div>
                    <CardContent className="p-8">
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                          <p className="text-slate-500 font-medium animate-pulse">KI erstellt Übergabeprotokoll...</p>
                        </div>
                      ) : protocol ? (
                        <div className="prose prose-slate max-w-none">
                          <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-800">
                            {protocol.content}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-500">Noch kein Protokoll generiert.</p>
                          <Button 
                            variant="link" 
                            onClick={() => setActiveTab("incident")}
                            className="text-blue-600"
                          >
                            Jetzt Einsatzdaten eingeben
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                      <Button variant="outline" size="sm">Drucken</Button>
                      <Button variant="outline" size="sm">Exportieren (PDF)</Button>
                      <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">Senden an Klinik</Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-[calc(100vh-12rem)] flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BrainCircuit className="w-7 h-7 text-blue-600" />
                        KI-Assistent
                      </h2>
                      <p className="text-slate-500">Unterstützung bei medizinischen Fragen und Protokollierung.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChatHistory([])}>Verlauf löschen</Button>
                  </div>

                  <Card className="flex-1 flex flex-col shadow-sm border-slate-200 overflow-hidden">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatHistory.length === 0 && (
                          <div className="text-center py-10">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BrainCircuit className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Wie kann ich helfen?</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                              Fragen Sie nach Dosierungen, Differentialdiagnosen oder lassen Sie sich beim Ausfüllen helfen.
                            </p>
                            <div className="grid grid-cols-1 gap-2 mt-6 max-w-sm mx-auto">
                              <QuickQuestion 
                                text="Dosierung Adrenalin bei Reanimation?" 
                                onClick={() => setChatQuery("Dosierung Adrenalin bei Reanimation?")} 
                              />
                              <QuickQuestion 
                                text="Symptome eines Schlaganfalls?" 
                                onClick={() => setChatQuery("Symptome eines Schlaganfalls?")} 
                              />
                              <QuickQuestion 
                                text="Hilf mir beim Protokoll." 
                                onClick={() => setChatQuery("Hilf mir beim Protokoll.")} 
                              />
                            </div>
                          </div>
                        )}
                        {chatHistory.map((msg, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "flex gap-3 max-w-[85%]",
                              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              msg.role === 'user' ? "bg-slate-200" : "bg-blue-600"
                            )}>
                              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <BrainCircuit className="w-4 h-4 text-white" />}
                            </div>
                            <div className={cn(
                              "p-3 rounded-2xl text-sm shadow-sm",
                              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-200 rounded-tl-none text-slate-800"
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex gap-3 mr-auto">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                              <BrainCircuit className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                      <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <Input 
                          placeholder="Fragen Sie die KI..." 
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          className="bg-white shadow-inner"
                        />
                        <Button type="submit" size="icon" disabled={isChatLoading || !chatQuery.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-900 text-slate-400 px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            GPS: 52.5200° N, 13.4050° E
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Verschlüsselung: AES-256
          </div>
        </div>
        <div>
          System v2.4.0-AI | RescueTab Digital Solutions
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex flex-col md:flex-row items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] md:text-sm font-bold uppercase tracking-wider md:normal-case md:tracking-normal",
        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
      )}>
        {label}
      </span>
    </button>
  );
}

function VitalInput({ label, icon, placeholder, value, onChange, type }: { label: string, icon: React.ReactNode, placeholder: string, value: string, onChange: (v: string) => void, type?: 'bp' | 'hr' | 'spo2' | 'temp' | 'af' | 'bz' }) {
  const isAlert = React.useMemo(() => {
    if (!value) return false;
    const num = parseFloat(value);
    if (isNaN(num) && type !== 'bp') return false;

    switch (type) {
      case 'spo2': return num < 94;
      case 'bz': return num < 60 || num > 180;
      case 'temp': return num < 35 || num > 38.5;
      case 'af': return num < 8 || num > 25;
      case 'hr': return num < 50 || num > 120;
      case 'bp': {
        const sys = parseInt(value.split('/')[0]);
        return sys < 90 || sys > 180;
      }
      default: return false;
    }
  }, [value, type]);

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</Label>
      <div className="relative">
        <div className="absolute left-2.5 top-2.5 z-10">{icon}</div>
        <motion.div
          animate={isAlert ? { 
            backgroundColor: ["rgba(255,255,255,1)", "rgba(254,226,226,1)", "rgba(255,255,255,1)"],
            borderColor: ["rgba(226,232,240,1)", "rgba(239,68,68,1)", "rgba(226,232,240,1)"]
          } : {}}
          transition={isAlert ? { repeat: Infinity, duration: 2 } : {}}
          className="rounded-md"
        >
          <Input 
            placeholder={placeholder} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "pl-9 h-9 text-sm font-mono bg-transparent transition-colors",
              isAlert && "text-red-600 font-bold"
            )}
          />
        </motion.div>
        {isAlert && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1"
          >
            <AlertCircle className="w-4 h-4 text-red-600 fill-white" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FindingList({ 
  title, 
  findings, 
  onAdd, 
  onRemove, 
  labelPlaceholder = "Ort/Bereich", 
  valuePlaceholder = "Befund/Verletzung",
  color = "blue"
}: { 
  title: string, 
  findings: Finding[], 
  onAdd: (label: string, value: string) => void, 
  onRemove: (id: string) => void,
  labelPlaceholder?: string,
  valuePlaceholder?: string,
  color?: "blue" | "red" | "purple" | "orange"
}) {
  const [newLabel, setNewLabel] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 focus-visible:ring-blue-200",
    red: "text-red-600 bg-red-50 border-red-100 focus-visible:ring-red-200",
    purple: "text-purple-600 bg-purple-50 border-purple-100 focus-visible:ring-purple-200",
    orange: "text-orange-600 bg-orange-50 border-orange-100 focus-visible:ring-orange-200",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</Label>
        <Badge variant="outline" className="text-[10px] font-mono">{findings.length}</Badge>
      </div>
      
      <div className="flex gap-2">
        <Input 
          placeholder={labelPlaceholder} 
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="h-9 text-xs"
        />
        <Input 
          placeholder={valuePlaceholder} 
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-9 text-xs"
        />
        <Button 
          size="icon" 
          variant="outline" 
          className="h-9 w-9 shrink-0"
          onClick={() => {
            onAdd(newLabel, newValue);
            setNewLabel("");
            setNewValue("");
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {findings.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn("flex items-center justify-between p-2 rounded-lg border text-sm", colorClasses[color])}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-bold shrink-0">{f.label}:</span>
                <span className="truncate">{f.value}</span>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-slate-400 hover:text-red-600 shrink-0"
                onClick={() => onRemove(f.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BefastInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      <div className="flex gap-2">
        <Button 
          variant={value === 'Normal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('Normal')}
          className={cn("flex-1 h-8 text-xs", value === 'Normal' && "bg-green-600 hover:bg-green-700")}
        >
          Normal
        </Button>
        <Button 
          variant={value === 'Auffällig' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onChange('Auffällig')}
          className="flex-1 h-8 text-xs"
        >
          Auffällig
        </Button>
        <Input 
          placeholder="Details..." 
          value={value !== 'Normal' && value !== 'Auffällig' ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-[2] h-8 text-xs bg-slate-50"
        />
      </div>
    </div>
  );
}

function QuickQuestion({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-all text-slate-600"
    >
      {text}
    </button>
  );
}
