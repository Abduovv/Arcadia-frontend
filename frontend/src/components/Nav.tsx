import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWallet, shortAddr } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import {
    Wallet, Menu, X, ChevronDown, LogOut, Globe2,
    Bell, TrendingDown, ShieldAlert, AlertTriangle, Zap, Award,
    DollarSign, ExternalLink, Check, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArcadiaLogo, ArcadiaWordmark } from "@/components/ArcadiaLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectModal } from "@/components/ConnectModal";
import { DevnetUsdcFaucet } from "@/components/DevnetUsdcFaucet";
import { DemoTriggerButton } from "@/components/DemoRunner";
import { useRealtimeStatus } from "@/hooks/realtimeContext";
import type { Alert } from "@/lib/mockData";
import { mockStore } from "@/lib/mockStore";
import { formatDistanceToNow } from "date-fns";

const KIND_META: Record<Alert["kind"], { icon: React.ElementType; color: string }> = {
    cooldown:       { icon: TrendingDown,  color: "text-warning" },
    freeze:         { icon: ShieldAlert,   color: "text-destructive" },
    junior_low:     { icon: AlertTriangle, color: "text-warning" },
    instant_exit:   { icon: Zap,          color: "text-primary" },
    graduate:       { icon: Award,         color: "text-success" },
    fee:            { icon: DollarSign,    color: "text-success" },
    launchpad_complete: { icon: Award,     color: "text-success" },
};

const baseNavlink = cn(
    "relative px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
    "after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:origin-center",
    "after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export const Nav = () => {
    const { connected, address, publicKey, role, network, walletName, setRole, disconnect } = useWallet();
    const { status } = useRealtimeStatus();
    const [open, setOpen] = useState(false);
    const [connectOpen, setConnectOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const [, forceRender] = useState(0);
    const [readSet, setReadSet] = useState<Set<string>>(
        () => new Set(mockStore.alerts.filter((a) => a.read).map((a) => a.id))
    );
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => forceRender(n => n + 1);
        window.addEventListener("arcadia:mock-update", handler);
        return () => window.removeEventListener("arcadia:mock-update", handler);
    }, []);

    const alerts = mockStore.alerts.map((a) => ({ ...a, read: readSet.has(a.id) }))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const unread = alerts.filter((a) => !a.read).length;

    const markRead = (id: string) => setReadSet((prev) => new Set([...prev, id]));
    const markAllRead = () => setReadSet(new Set(mockStore.alerts.map((a) => a.id)));

    const isActive = (to: string) =>
        location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

    const switchRole = (nextRole: typeof role) => {
        if (nextRole === role) return;
        setRole(nextRole);
        navigate("/");
        toast.success(`Switched to ${nextRole === "trader" ? "Trader" : "Investor"} mode`);
    };

    const publicLinks = [
        { to: "/vaults", label: "Marketplace" },
        { to: "/traders", label: "Traders" },
        { to: "/how-it-works", label: "How It Works" },
    ];

    const traderLinks = [
        { to: "/trader", label: "Dashboard" },
        { to: "/trade", label: "Trade" },
        { to: "/vaults", label: "Marketplace" },
    ];

    const investorLinks = [
        { to: "/vaults", label: "Marketplace" },
        { to: "/portfolio", label: "Portfolio" },
        { to: "/traders", label: "Traders" },
    ];

    const links = !connected ? publicLinks : role === "trader" ? traderLinks : investorLinks;

    const realtimeLabel =
        status === "live" ? "Live" : status === "reconnecting" ? "Syncing" :
        status === "connecting" ? "Connecting" : status === "polling" ? "Polling" : "Demo";

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-border/30 bg-background/82 backdrop-blur-xl">
                <div className="container flex h-14 items-center gap-4">
                    <Link to="/" className="flex shrink-0 items-center gap-2 group mr-2">
                        <ArcadiaLogo className="transition-transform duration-200 group-hover:scale-105" />
                        <ArcadiaWordmark className="w-[120px]" />
                    </Link>

                    <nav className="hidden items-center gap-0.5 lg:flex">
                        {links.map((l) => (
                            <Link key={l.to} to={l.to}
                                className={cn(
                                    baseNavlink,
                                    isActive(l.to)
                                        ? "text-foreground after:scale-x-100"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                                )}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center gap-1.5 ml-auto">
                        <DemoTriggerButton />
                        <ThemeToggle />

                        {connected && (
                            <Popover open={bellOpen} onOpenChange={setBellOpen}>
                                <PopoverTrigger asChild>
                                    <button aria-label="Notifications"
                                        className={cn(
                                            "relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                                            "text-muted-foreground hover:text-foreground hover:bg-accent/5",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            bellOpen && "bg-accent/5 text-foreground"
                                        )}
                                    >
                                        <Bell className="h-4 w-4" />
                                        {unread > 0 && (
                                            <span className="t-badge" data-open={String(unread > 0)}>
                                              <span className="t-badge-dot flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 font-mono text-[8px] font-bold text-primary-foreground">
                                                {unread > 9 ? "9+" : unread}
                                              </span>
                                            </span>
                                        )}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" sideOffset={6} className="w-[360px] p-0 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display text-[13px] font-semibold text-foreground">Notifications</span>
                                            {unread > 0 && (
                                                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">{unread}</span>
                                            )}
                                        </div>
                                        {unread > 0 && (
                                            <button onClick={markAllRead} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors">
                                                <CheckCheck className="h-3 w-3" /> Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {alerts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                                                <p className="text-[13px] text-muted-foreground">No notifications yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {alerts.map((alert) => {
                                                    const meta = KIND_META[alert.kind] ?? KIND_META.fee;
                                                    const Icon = meta.icon;
                                                    const ago = formatDistanceToNow(new Date(alert.time), { addSuffix: true });
                                                    return (
                                                        <div key={alert.id}
                                                            className={cn(
                                                                "relative flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/30",
                                                                !alert.read && "bg-primary/[0.03]"
                                                            )}
                                                        >
                                                            {!alert.read && <div className="absolute left-0 inset-y-2 w-[2px] rounded-r-full bg-primary" />}
                                                            <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", !alert.read ? "bg-primary/10" : "bg-secondary/60")}>
                                                                <Icon className={cn("h-3.5 w-3.5", !alert.read ? meta.color : "text-muted-foreground")} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <span className={cn("text-[12px] font-semibold leading-snug", alert.read ? "text-foreground/70" : "text-foreground")}>{alert.title}</span>
                                                                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{ago}</span>
                                                                </div>
                                                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{alert.description}</p>
                                                                <div className="mt-1.5 flex items-center gap-3">
                                                                    {alert.vaultId && (
                                                                        <Link to={`/vault/${alert.vaultId}`} onClick={() => setBellOpen(false)} className="inline-flex items-center gap-1 font-mono text-[10px] text-primary/80 hover:text-primary transition-colors">
                                                                            View vault <ExternalLink className="h-2.5 w-2.5" />
                                                                        </Link>
                                                                    )}
                                                                    {!alert.read && (
                                                                        <button onClick={() => markRead(alert.id)} className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                                                            <Check className="h-2.5 w-2.5" /> Mark read
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        {!connected ? (
                            <Button
                                onClick={() => setConnectOpen(true)}
                                size="sm"
                                className="h-8 border-0 bg-primary text-primary-foreground shadow-signal hover:bg-primary-glow font-display font-semibold text-[12px]"
                            >
                                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                                Connect
                            </Button>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm"
                                        className="h-8 justify-between gap-2 border-border/40 px-2.5 font-mono text-[11px] hover:bg-accent/5 hover:border-border-strong"
                                    >
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-active animate-pulse-glow" />
                                        <span className="truncate max-w-[80px]">{shortAddr(address!)}</span>
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 p-0">
                                    <div className="border-b border-border/40 px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-display text-[13px] font-semibold">{walletName ?? "Wallet"}</p>
                                                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{address}</p>
                                            </div>
                                            <span className="inline-flex h-6 shrink-0 items-center rounded-md bg-primary/10 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">{role}</span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                                            <div className="rounded-md bg-secondary/50 px-2 py-1.5">
                                                <span className="block text-muted-foreground">Network</span>
                                                <span className="mt-0.5 flex items-center gap-1 font-mono capitalize"><Globe2 className="h-2.5 w-2.5 text-primary/70" />{network}</span>
                                            </div>
                                            <div className="rounded-md bg-secondary/50 px-2 py-1.5">
                                                <span className="block text-muted-foreground">Data</span>
                                                <span className="mt-0.5 flex items-center gap-1 font-mono">
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", status === "live" ? "bg-primary" : "bg-warning")} />{realtimeLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {publicKey && (
                                        <div className="border-b border-border/40 px-4 py-2">
                                            <DevnetUsdcFaucet compact />
                                        </div>
                                    )}
                                    <div className="p-1">
                                        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Account</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => switchRole("investor")}>Switch to Investor</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => switchRole("trader")}>Switch to Trader</DropdownMenuItem>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="p-1">
                                        <DropdownMenuItem asChild><Link to="/portfolio">Portfolio</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link to="/vaults">Marketplace</Link></DropdownMenuItem>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="p-1">
                                        <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive">
                                            <LogOut className="mr-2 h-4 w-4" /> Disconnect
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="flex lg:hidden items-center gap-1.5 ml-auto">
                        <ThemeToggle className="sm:inline-flex" />
                        {!connected ? (
                            <Button onClick={() => setConnectOpen(true)} size="sm" className="h-8 border-0 bg-primary text-primary-foreground font-display font-semibold text-[12px]">
                                <Wallet className="w-3.5 h-3.5 mr-1" /> Connect
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border/40 px-2 font-mono text-[10px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-status-active animate-pulse-glow" />
                                {shortAddr(address!)}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"
                            onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}
                        >
                            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            {open && (
                <div className="border-b border-border/30 bg-background/95 backdrop-blur-xl lg:hidden">
                    <div className="container py-3 flex flex-col gap-0.5">
                        <DemoTriggerButton />
                        {links.map((l) => (
                            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                                className="rounded-md px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} />
        </>
    );
};