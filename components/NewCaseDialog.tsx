"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CLAIM_TYPES = [
  { value: "Breach of Contract", label: "Breach of Contract" },
  { value: "Commercial Fraud", label: "Commercial Fraud" },
  { value: "Breach of Fiduciary Duty", label: "Breach of Fiduciary Duty" },
  { value: "Securities Fraud", label: "Securities Fraud" },
  { value: "Employment Discrimination", label: "Employment Discrimination" },
  { value: "Wrongful Termination", label: "Wrongful Termination" },
  { value: "Whistleblower Retaliation", label: "Whistleblower Retaliation" },
  { value: "Medical Malpractice", label: "Medical Malpractice" },
  { value: "Wrongful Death", label: "Wrongful Death" },
  { value: "Personal Injury", label: "Personal Injury" },
  {
    value: "Intellectual Property Infringement",
    label: "IP Infringement",
  },
  { value: "Civil Rights (§ 1983)", label: "Civil Rights (§ 1983)" },
  { value: "Real Estate Dispute", label: "Real Estate Dispute" },
  { value: "Insurance Bad Faith", label: "Insurance Bad Faith" },
  { value: "Product Liability", label: "Product Liability" },
  { value: "General Litigation", label: "General Litigation" },
];

const CURRENT_STAGES = [
  { value: "Pre-Litigation", label: "Pre-Litigation" },
  { value: "Pleadings", label: "Pleadings" },
  { value: "Discovery", label: "Discovery" },
  { value: "Motion Practice", label: "Motion Practice" },
  { value: "Settlement Negotiations", label: "Settlement Negotiations" },
  { value: "Trial Preparation", label: "Trial Preparation" },
  { value: "Trial", label: "Trial" },
  { value: "Post-Trial", label: "Post-Trial" },
  { value: "Appeal", label: "Appeal" },
  {
    value: "Active - Litigation in progress",
    label: "Active - Litigation in progress",
  },
];

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "Washington D.C.",
].map((s) => ({ value: s, label: s }));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCase?: (data: NewCaseFormData) => void;
}

export interface NewCaseFormData {
  caseName: string;
  claimType: string;
  currentStage: string;
  plaintiffName: string;
  plaintiffCounsel: string;
  defenseName: string;
  defenseCounsel: string;
  state: string;
  court: string;
  county: string;
  trialDate: string;
  summary: string;
}

const DEFAULT_FORM: NewCaseFormData = {
  caseName: "",
  claimType: "",
  currentStage: "Active - Litigation in progress",
  plaintiffName: "",
  plaintiffCounsel: "",
  defenseName: "",
  defenseCounsel: "",
  state: "",
  court: "",
  county: "",
  trialDate: "",
  summary: "",
};

export default function NewCaseDialog({ open, onOpenChange, onCreateCase }: Props) {
  const [step, setStep] = useState("case");
  const selectClasses =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark] md:text-sm";

  const [form, setForm] = useState<NewCaseFormData>(DEFAULT_FORM);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const next = () => {
    if (step === "case") setStep("parties");
    else if (step === "parties") setStep("jurisdiction");
  };

  const back = () => {
    if (step === "parties") setStep("case");
    else if (step === "jurisdiction") setStep("parties");
  };

  const submit = () => {
    const payload: NewCaseFormData = { ...form };
    console.log(JSON.stringify(payload, null, 2));
    onCreateCase?.(payload);
    setForm(DEFAULT_FORM);
    setStep("case");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Case</DialogTitle>
          <DialogDescription className="text-gray-500">
            Step {step === "case" ? "1" : step === "parties" ? "2" : "3"} of 3
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="mt-4">
          {/* Stepper */}
          <TabsList className="grid grid-cols-3 h-auto gap-4 bg-transparent p-0 mb-8">
            <TabsTrigger
              value="case"
              onClick={() => setStep("case")}
              className="data-[state=active]:bg-muted flex flex-col items-start p-3 rounded-lg border text-left"
            >
              <span className="text-xs text-muted-foreground font-normal">1</span>
              <span className="font-semibold">Case Identity</span>
            </TabsTrigger>

            <TabsTrigger
              value="parties"
              disabled={step === "case"}
              onClick={() => setStep("parties")}
              className="data-[state=active]:bg-muted flex flex-col items-start p-3 rounded-lg border text-left"
            >
              <span className="text-xs text-muted-foreground font-normal">2</span>
              <span className="font-semibold">Parties</span>
            </TabsTrigger>

            <TabsTrigger
              value="jurisdiction"
              disabled={step === "case" || step === "parties"}
              onClick={() => setStep("jurisdiction")}
              className="data-[state=active]:bg-muted flex flex-col items-start p-3 rounded-lg border text-left"
            >
              <span className="text-xs text-muted-foreground font-normal">3</span>
              <span className="font-semibold">Jurisdiction</span>
            </TabsTrigger>
          </TabsList>

          {/* STEP 1 */}
          <TabsContent value="case" className="space-y-6 outline-none">
            <div className="space-y-2">
              <Label htmlFor="caseName">Case Name *</Label>
              <Input
                id="caseName"
                placeholder="e.g. Harrington v. Meridian Financial Group"
                value={form.caseName}
                onChange={(e) => updateField("caseName", e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use the format Plaintiff v. Defendant, or a short matter name.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="claimType">Claim Type *</Label>
                <select
                  id="claimType"
                  value={form.claimType}
                  onChange={(e) => updateField("claimType", e.target.value)}
                  className={selectClasses}
                >
                  <option className="bg-background text-foreground" value="">
                    Select a claim type
                  </option>
                  {CLAIM_TYPES.map((claim) => (
                    <option
                      className="bg-background text-foreground"
                      key={claim.value}
                      value={claim.value}
                    >
                      {claim.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStage">Current Stage</Label>
                <select
                  id="currentStage"
                  value={form.currentStage}
                  onChange={(e) => updateField("currentStage", e.target.value)}
                  className={selectClasses}
                >
                  {CURRENT_STAGES.map((stage) => (
                    <option
                      className="bg-background text-foreground"
                      key={stage.value}
                      value={stage.value}
                    >
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* STEP 2 */}
          <TabsContent value="parties" className="space-y-8 outline-none">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-1">Plaintiff</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plaintiffName">Plaintiff Name *</Label>
                  <Input
                    id="plaintiffName"
                    placeholder="Full legal name or entity"
                    value={form.plaintiffName}
                    onChange={(e) => updateField("plaintiffName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plaintiffCounsel">Plaintiff Counsel</Label>
                  <Input
                    id="plaintiffCounsel"
                    placeholder="Lead attorney or firm"
                    value={form.plaintiffCounsel}
                    onChange={(e) => updateField("plaintiffCounsel", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-1">Defense</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defenseName">Defense Name *</Label>
                  <Input
                    id="defenseName"
                    placeholder="Full legal name or entity"
                    value={form.defenseName}
                    onChange={(e) => updateField("defenseName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defenseCounsel">Defense Counsel</Label>
                  <Input
                    id="defenseCounsel"
                    placeholder="Lead attorney or firm"
                    value={form.defenseCounsel}
                    onChange={(e) => updateField("defenseCounsel", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* STEP 3 */}
          <TabsContent value="jurisdiction" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={selectClasses}
                >
                  <option className="bg-background text-foreground" value="">
                    Select a state
                  </option>
                  {US_STATES.map((state) => (
                    <option
                      className="bg-background text-foreground"
                      key={state.value}
                      value={state.value}
                    >
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Court / District</Label>
                <select
                  id="court"
                  value={form.court}
                  onChange={(e) => updateField("court", e.target.value)}
                  className={selectClasses}
                >
                  <option className="bg-background text-foreground" value="">
                    Select court type
                  </option>
                  <option className="bg-background text-foreground" value="State Court">
                    State Court
                  </option>
                  <option className="bg-background text-foreground" value="District Court">
                    District Court
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  placeholder="e.g. Manhattan, Cook"
                  value={form.county}
                  onChange={(e) => updateField("county", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDate">Trial Date</Label>
                <Input
                  id="trialDate"
                  type="text"
                  placeholder="mm/dd/yyyy"
                  value={form.trialDate}
                  onChange={(e) => updateField("trialDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Case Summary (Optional)</Label>
              <Textarea
                id="summary"
                rows={6}
                placeholder="Brief description of the facts and legal theories..."
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Navigation */}
        <div className="mt-6 flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={back}
            disabled={step === "case"}
          >
            ← Back
          </Button>

          {step !== "jurisdiction" ? (
            <Button onClick={next}>
              Continue →
            </Button>
          ) : (
            <Button onClick={submit}>
              Create Case
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}