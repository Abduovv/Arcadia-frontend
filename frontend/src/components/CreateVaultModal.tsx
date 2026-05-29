import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/Banner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useKilnTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@/lib/wallet";
import { getVaultConfigPDA, getManagerProfilePDA } from "@/lib/solana/pdas";
import { parseUsdcToUnits } from "@/lib/solana/amounts";
import { useDataMode } from "@/hooks/useDataMode";
import { mockStore } from "@/lib/mockStore";

const STEPS = ["Identity", "Risk", "Capital", "Launchpad", "Review"];
const RISK_PROFILES = {
  conservative: { feeBps: 1500, maxSlippageBps: 100 },
  balanced: { feeBps: 2000, maxSlippageBps: 200 },
  aggressive: { feeBps: 2000, maxSlippageBps: 300 },
} as const;

export const CreateVaultModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [risk, setRisk] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [reserveAllocBps, setReserveAllocBps] = useState(1000);
  const [junior, setJunior] = useState("1");
  const [accept, setAccept] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { initManager, createVault, depositJunior } = useKilnTransactions();
  const { publicKey, connection } = useWallet();
  const { isMock } = useDataMode();

  const reset = () => { setStep(0); setName(""); setRisk("balanced"); setJunior("1"); setAccept(false); setSending(false); };
  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const handleCreate = async () => {
    const juniorUsdcUnits = parseUsdcToUnits(junior);
    const juniorUsdc = parseFloat(junior || "0");
    if (!Number.isFinite(juniorUsdc) || !juniorUsdcUnits || juniorUsdcUnits <= 0n) { toast.error("Enter a valid junior deposit amount"); return; }

    setSending(true);
    try {
      if (isMock) {
        const profile = RISK_PROFILES[risk];
        await new Promise(r => setTimeout(r, 800));
        toast.info("Initialising trader profile…");
        await new Promise(r => setTimeout(r, 900));
        toast.info("Creating vault on-chain…");
        await new Promise(r => setTimeout(r, 700));
        mockStore.createVault({ name: name.slice(0, 32), feeBps: profile.feeBps, maxSlippageBps: profile.maxSlippageBps, juniorAmount: juniorUsdc });
        toast.success("Vault created & funded!", { description: `${juniorUsdc.toFixed(2)} USDC junior capital posted. Trader Launchpad begins now.` });
        onOpenChange(false);
        reset();
        navigate("/trader");
        return;
      }

      if (!publicKey || !connection) { toast.error("Wallet not connected"); return; }
      try { await initManager(); } catch { /* profile may exist */ }
      const profile = RISK_PROFILES[risk];
      await createVault({ name: name.slice(0, 32), feeBps: profile.feeBps, maxSlippageBps: profile.maxSlippageBps, paperWindowSecs: 30 * 24 * 60 * 60 });
      const [profilePda] = getManagerProfilePDA(publicKey);
      const profileInfo = await connection.getAccountInfo(profilePda);
      const vaultIndex = profileInfo ? Buffer.from(profileInfo.data).readUInt16LE(56) - 1 : 0;
      const [configPda] = getVaultConfigPDA(publicKey, vaultIndex);
      await depositJunior(configPda, juniorUsdcUnits);
      toast.success("Vault created & funded!");
      onOpenChange(false);
      reset();
      navigate("/trader");
    } catch (e) {
      toast.error("Create vault failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="surface-elevated border-border-strong max-w-lg p-0 overflow-hidden">
        {/* Stepper */}
        <div className="flex items-center gap-1.5 px-6 pt-5 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium",
                i === step ? "border-primary text-primary bg-primary/10" :
                i < step ? "border-success/30 text-success bg-success/10" : "border-border text-muted-foreground")}>
                {i < step ? <Check className="w-3 h-3" /> : <span className="tabular">{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="p-6 min-h-[300px]">
          {step === 0 && (
            <div className="space-y-4">
              <DialogHeader><DialogTitle className="font-display text-xl">Vault identity</DialogTitle></DialogHeader>
              <div>
                <label className="text-sm font-medium">Name (max 32 chars)</label>
                <Input className="mt-1.5" value={name} onChange={e => setName(e.target.value.slice(0, 32))} placeholder="e.g. Signal Macro III" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <DialogHeader><DialogTitle className="font-display text-xl">Risk setup</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Fee, slippage, and reserve parameters.</p>
              <div>
                <label className="text-sm font-medium mb-2 block">Risk profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["conservative", "balanced", "aggressive"] as const).map(r => (
                    <button key={r} onClick={() => setRisk(r)} className={cn("p-3 rounded-lg border text-left text-sm", risk === r ? "border-primary bg-primary/5" : "border-border hover:bg-secondary")}>
                      <div className="font-semibold capitalize">{r}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {r === "conservative" && "15% fee · 1% slip"}
                        {r === "balanced" && "20% fee · 2% slip"}
                        {r === "aggressive" && "20% fee · 3% slip"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Reserve allocation</label>
                <p className="text-xs text-muted-foreground mb-2">% of your fees routed into reserve pool for investor protection.</p>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 1500, 2000].map(bps => (
                    <button key={bps} onClick={() => setReserveAllocBps(bps)} className={cn("p-2 rounded-lg border text-center text-sm", reserveAllocBps === bps ? "border-primary bg-primary/5" : "border-border hover:bg-secondary")}>
                      {(bps / 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <DialogHeader><DialogTitle className="font-display text-xl">Junior capital</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Your first-loss USDC. Required to back the vault.</p>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <label className="text-sm font-medium">Junior deposit (USDC)</label>
                  <span>Base asset: USDC</span>
                </div>
                <Input className="mt-1.5 text-lg tabular h-12" value={junior} onChange={e => setJunior(e.target.value)} type="number" step="0.01" min="0" />
              </div>
              <Banner variant="info" title="Capacity preview">
                With {parseFloat(junior || "0").toFixed(2)} USDC junior, your vault can support up to {(parseFloat(junior || "0") * 4).toFixed(2)} USDC TVL.
              </Banner>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <DialogHeader><DialogTitle className="font-display text-xl">Trader Launchpad</DialogTitle></DialogHeader>
              <ul className="space-y-2.5 text-sm">
                {["30-day track record required", "Investor deposits disabled until graduation", "All trades publicly recorded on-chain", "Performance affects future investor trust"].map(t => (
                  <li key={t} className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />{t}</li>
                ))}
              </ul>
              <label className="flex items-start gap-2 mt-4 p-3 rounded-lg border border-border cursor-pointer">
                <input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)} className="mt-1 accent-primary" />
                <span className="text-sm">I understand this vault starts in Trader Launchpad and cannot accept investor deposits until graduation.</span>
              </label>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <DialogHeader><DialogTitle className="font-display text-xl">Review</DialogTitle></DialogHeader>
              <dl className="text-sm space-y-2 surface rounded-lg p-4">
                <Row label="Name" value={name || "—"} />
                <Row label="Risk profile" value={<span className="capitalize">{risk}</span>} />
                <Row label="Fee" value={`${RISK_PROFILES[risk].feeBps / 100}% above HWM`} />
                <Row label="Reserve allocation" value={`${reserveAllocBps / 100}% of fees → reserve`} />
                <Row label="Max slippage" value={`${RISK_PROFILES[risk].maxSlippageBps / 100}%`} />
                <Row label="Junior deposit" value={`${parseFloat(junior || "0")} USDC`} />
                <Row label="Launchpad window" value="30 days" />
              </dl>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={back} disabled={step === 0}>Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="bg-gradient-signal text-primary-foreground border-0" disabled={(step === 0 && !name) || (step === 3 && !accept)}>Continue</Button>
            ) : (
              <Button onClick={handleCreate} disabled={sending} className="bg-gradient-signal text-primary-foreground border-0">
                {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create & fund vault
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);
