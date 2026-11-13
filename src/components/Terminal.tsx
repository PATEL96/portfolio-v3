"use client";

import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	memo,
} from "react";
import Link from "next/link";
import {
	ABOUT,
	CONTACT,
	EDUCATION,
	EXPERIENCE,
	HOBBIES,
	PROFILE,
	PROJECTS,
	SKILLS,
} from "@/lib/portfolio-data";

let entryCounter = 0;
function nextEntryId() {
	entryCounter += 1;
	return entryCounter;
}

type HistoryEntry =
	| { id: number; type: "input"; content: string }
	| { id: number; type: "error"; content: string }
	| { id: number; type: "banner"; content: string }
	| {
			id: number;
			type: "output";
			title?: string;
			content: string;
			/** Tab-completion candidate list — never a real command result */
			candidates?: true;
	  };

const ASCII_ART = `
██████╗  █████╗      ██╗    ██████╗  █████╗ ████████╗███████╗██╗
██╔══██╗██╔══██╗     ██║    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║
██████╔╝███████║     ██║    ██████╔╝███████║   ██║   █████╗  ██║
██╔══██╗██╔══██║██   ██║    ██╔═══╝ ██╔══██║   ██║   ██╔══╝  ██║
██║  ██║██║  ██║╚█████╔╝    ██║     ██║  ██║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝     ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝`;

// Decorative box header for section outputs. aria-hidden when rendered —
// the accessible title is a real <h2 className="sr-only"> instead.
function boxBanner(title: string): string {
	const inner = title.toUpperCase();
	const width = 38;
	const pad = Math.max(width - inner.length, 3);
	const left = Math.floor(pad / 2);
	const right = pad - left;
	return [
		`╔${"═".repeat(width)}╗`,
		`║${" ".repeat(left)}${inner}${" ".repeat(right)}║`,
		`╚${"═".repeat(width)}╝`,
	].join("\n");
}

const COMMANDS: Record<
	string,
	{ description: string; title?: string; run: () => string }
> = {
	help: {
		description: "Show available commands",
		run: () => {
			const list = Object.entries(COMMANDS)
				.map(
					([cmd, { description }]) =>
						`  ${cmd.padEnd(15)} ${description}`,
				)
				.join("\n");
			return `Available commands:\n\n${list}\n\nType any command to get started.\nTab autocompletes commands · ↑/↓ cycles command history.`;
		},
	},
	about: {
		description: "Learn about me",
		title: "About Raj D. Patel",
		run: () => [
			ABOUT.headline,
			`based in ${PROFILE.location}.`,
			"",
			ABOUT.blurb,
			"",
			...ABOUT.stack.map(
				({ label, items }) => `${label.padEnd(11)}: ${items.join(" · ")}`,
			),
			"",
			`Email    : ${PROFILE.email}`,
			`GitHub   : ${PROFILE.github}`,
			"",
			"Type 'skills' to see technical expertise.",
		].join("\n"),
	},
	skills: {
		description: "View technical skills",
		title: "Technical Skills",
		run: () => [
			...SKILLS.flatMap(({ group, items }, groupIndex) => [
				...(groupIndex === 0 ? [] : [""]),
				group,
				...items.map(
					(item, i) => `${i === items.length - 1 ? "└─" : "├─"} ${item}`,
				),
			]),
			"",
			"Type 'projects' to see what I've built.",
		].join("\n"),
	},
	projects: {
		description: "Browse project portfolio",
		title: "Projects",
		run: () => [
			...PROJECTS.flatMap((project, index) => {
				const lines =
					index === 0
						? [
								`[1] ${project.name}`,
								`    ${project.description}`,
							]
						: [
								"",
								`[${index + 1}] ${project.name}`,
								`    ${project.description}`,
							];
				for (const { label, url } of project.links ?? []) {
					lines.push(`    ${label.padEnd(7)}: ${url}`);
				}
				if (project.stack) {
					lines.push(`    ${"Stack".padEnd(7)}: ${project.stack}`);
				}
				return lines;
			}),
			"",
			"Type 'experience' for work history.",
		].join("\n"),
	},
	experience: {
		description: "View work experience",
		title: "Work Experience",
		run: () => [
			...EXPERIENCE.flatMap((job, index) => [
				...(index === 0 ? [] : ["", "─".repeat(30), ""]),
				job.company,
				`${"Role".padEnd(9)}: ${job.role}`,
				`${"Duration".padEnd(9)}: ${job.duration}`,
				`${"Location".padEnd(9)}: ${job.location}`,
				`${"Focus".padEnd(9)}: ${job.focus}`,
			]),
			"",
			"Type 'education' for academic background.",
		].join("\n"),
	},
	education: {
		description: "Academic background",
		title: "Education",
		run: () =>
			EDUCATION.map(
				(entry) => `${entry.degree}\n  ${entry.institution}`,
			).join("\n\n"),
	},
	contact: {
		description: "Get in touch",
		title: "Contact Info",
		run: () =>
			CONTACT.map((entry) => `${entry.label.padEnd(9)}: ${entry.value}`).join(
				"\n",
			),
	},
	hobbies: {
		description: "Personal interests",
		title: "Beyond Code",
		run: () =>
			HOBBIES.map(
				(hobby) => `${hobby.name.padEnd(9)}— ${hobby.description}`,
			).join("\n"),
	},
	github: {
		description: "Open GitHub profile",
		run: () => {
			if (typeof window !== "undefined")
				window.open(PROFILE.github, "_blank", "noopener,noreferrer");
			return `Opening ${PROFILE.github} ...`;
		},
	},
	resume: {
		description: "Open resume",
		run: () => {
			if (typeof window !== "undefined")
				window.open(PROFILE.resume, "_blank", "noopener,noreferrer");
			return `Opening resume — ${PROFILE.resume} ...`;
		},
	},
	clear: {
		description: "Clear terminal screen",
		run: () => "CLEAR_SCREEN",
	},
	refresh: {
		description: "Reset terminal to initial state",
		run: () => "REFRESH",
	},
};

// Commands that get a URL hash for deep links and Back/Forward support
const SECTION_COMMANDS = new Set([
	"about",
	"skills",
	"projects",
	"experience",
	"education",
	"contact",
	"hobbies",
	"help",
]);

const MAX_HISTORY = 200;
const MAX_CMD_HISTORY = 100;

const INITIAL_HISTORY: HistoryEntry[] = [
	{ id: nextEntryId(), type: "banner", content: ASCII_ART },
	{
		id: nextEntryId(),
		type: "output",
		content:
			"Welcome to Raj D. Patel's Terminal Portfolio\nType 'help' to see available commands.\nTip: Tab autocompletes commands · ↑/↓ cycles command history.\n",
	},
];

// https URLs, emails, phone numbers. Phone alternative requires 10+ chars
// of digits separated by single spaces/hyphens, so date ranges ("2022 – 2024")
// and multi-space runs never match; digit count is re-validated in isPhone().
const LINK_REGEX =
	/(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]{2,}|\+?\d(?:[\d-]|\s(?!\s)){8,}\d)/g;

function isPhone(token: string) {
	return token.replace(/\D/g, "").length >= 10;
}

// non-global copy of LINK_REGEX for cheap "does this content contain a
// link?" tests — a global regex's lastIndex leaks between .test() calls
const HAS_LINK_REGEX = new RegExp(LINK_REGEX.source);

// synchronous touch-capable snapshot for mount-time decisions (autofocus)
// and callbacks that must not rely on state freshness: a coarse primary
// OR secondary pointer, or a touch screen on a currently-narrow window.
// The any-pointer: coarse term already matches every device with a
// touchscreen (including touch laptops at desktop width), so this and
// the CSS-only [@media(any-pointer:coarse)] first-paint variants in the
// JSX agree — a touch laptop is touch-capable on BOTH first paint and
// hydration, with no shift between them.
function isTouchCapableNow() {
	return (
		window.matchMedia("(pointer: coarse)").matches ||
		window.matchMedia("(any-pointer: coarse)").matches ||
		(navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
	);
}

function linkHref(part: string) {
	if (part.startsWith("http")) return part;
	if (part.includes("@")) return `mailto:${part}`;
	return `tel:${part.replace(/[\s-]/g, "")}`;
}

const LINK_CLASS =
	"inline-block max-w-full break-all align-bottom py-1 -my-1 text-accent underline underline-offset-2 hover:text-accent-bright cursor-pointer";

function renderWithLinks(text: string, focusable: boolean) {
	// split with a capturing regex: odd indices are links
	const parts = text.split(LINK_REGEX);
	return parts.map((part, i) => {
		if (i % 2 === 0 || !part) return <span key={i}>{part}</span>;
		const isHttp = part.startsWith("http");
		const isEmail = !isHttp && part.includes("@");
		if (!isHttp && !isEmail && !isPhone(part)) {
			return <span key={i}>{part}</span>;
		}
		// trailing punctuation stays outside the link
		const linkText = part.replace(/[.,;:]+$/, "");
		const trailing = part.slice(linkText.length);
		const href = linkHref(linkText);
		// stale output must not cost 15 tab stops — links outside the most
		// recent output entry are removed from the tab order (the scrollback
		// region itself stays tabbable so history is still reachable)
		const tabIndex = focusable ? undefined : -1;
		// mailto:/tel: are plain anchors; only http(s) uses next/link + noopener
		const anchor = isHttp ? (
			<Link
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={LINK_CLASS}
				tabIndex={tabIndex}
				onClick={(e) => e.stopPropagation()}
			>
				{linkText}
			</Link>
		) : (
			<a
				href={href}
				className={LINK_CLASS}
				tabIndex={tabIndex}
				onClick={(e) => e.stopPropagation()}
			>
				{linkText}
			</a>
		);
		return (
			<span key={i}>
				{anchor}
				{trailing}
			</span>
		);
	});
}

// ariaHidden: history echoes repeat the live prompt — hide them from screen
// readers so the prompt isn't announced twice (the live form prompt stays
// accessible).
function Prompt({ ariaHidden = false }: { ariaHidden?: boolean }) {
	return (
		<span
			aria-hidden={ariaHidden || undefined}
			className="shrink-0 flex items-baseline gap-1 text-sm select-none"
		>
			<span className="text-muted">~/</span>
			<span className="text-accent font-bold">patel96</span>
			<span className="text-ok max-sm:hidden"> main</span>
			<span className="text-ok transition-colors group-focus-within:text-accent-bright">
				{" "}
				❯
			</span>
		</span>
	);
}

const HistoryItem = memo(function HistoryItem({
	entry,
	focusable,
}: {
	entry: HistoryEntry;
	focusable: boolean;
}) {
	if (entry.type === "input") {
		return (
			<div className="flex items-baseline gap-2 text-sm min-w-0">
				<Prompt ariaHidden />
				<span className="text-fg min-w-0 break-all">{entry.content}</span>
			</div>
		);
	}
	if (entry.type === "banner") {
		return (
			<pre
				aria-hidden="true"
				className="terminal-glyphs terminal-banner-fit whitespace-pre overflow-x-auto max-w-full text-fg leading-tight"
			>
				{entry.content}
			</pre>
		);
	}
	if (entry.type === "error") {
		return (
			<pre className="whitespace-pre-wrap break-words max-w-full text-sm leading-relaxed text-err">
				{entry.content}
			</pre>
		);
	}
	return (
		<div>
			{entry.title ? <h2 className="sr-only">{entry.title}</h2> : null}
			{entry.title ? (
				<pre
					aria-hidden="true"
					className="terminal-glyphs whitespace-pre overflow-x-auto max-w-full text-muted text-[10px] leading-tight sm:text-xs"
				>
					{boxBanner(entry.title)}
				</pre>
			) : null}
			<pre className="whitespace-pre-wrap break-words max-w-full text-sm leading-relaxed text-fg">
				{renderWithLinks(entry.content, focusable)}
			</pre>
		</div>
	);
});

type WinGeom = { w: number; h: number; x: number; y: number };

const DEFAULT_SIZE = { w: 860, h: 560 };

function clampGeom(g: WinGeom): WinGeom {
	const maxW = window.innerWidth;
	const maxH = window.innerHeight;
	const w = Math.min(Math.max(400, g.w), maxW);
	const h = Math.min(Math.max(300, g.h), maxH);
	// the whole window stays inside the viewport
	const x = Math.min(Math.max(g.x, 0), Math.max(maxW - w, 0));
	const y = Math.min(Math.max(g.y, 0), Math.max(maxH - h, 0));
	return { w, h, x, y };
}

function centeredGeom(): WinGeom {
	// clamp size to the viewport with a 24px margin per side, then center
	// in the remaining space. The margin keeps a restored window visibly
	// different from the maximized state even in short desktop viewports
	// where the raw 860x560 default would already fill the screen. The
	// same minimum rules as clampGeom apply (400x300 wherever the
	// viewport allows it) so a later clamp never snaps the size.
	const availW = window.innerWidth - 48;
	const availH = window.innerHeight - 48;
	const w = Math.max(Math.min(400, availW), Math.min(DEFAULT_SIZE.w, availW));
	const h = Math.max(Math.min(300, availH), Math.min(DEFAULT_SIZE.h, availH));
	return {
		w,
		h,
		x: Math.round((window.innerWidth - w) / 2),
		y: Math.round((window.innerHeight - h) / 2),
	};
}

function shallowEqualGeom(a: WinGeom, b: WinGeom): boolean {
	return a.w === b.w && a.h === b.h && a.x === b.x && a.y === b.y;
}

function commonPrefix(options: string[]) {
	let prefix = options[0] ?? "";
	for (const option of options) {
		while (!option.startsWith(prefix)) {
			prefix = prefix.slice(0, -1);
		}
	}
	return prefix;
}

export default function Terminal() {
	const [input, setInput] = useState("");
	const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
	const [cmdHistory, setCmdHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [isMaximized, setIsMaximized] = useState(true);
	const [announcement, setAnnouncement] = useState("");
	// floating windows are pointless on phones — force maximized < 640px
	const [isCompact, setIsCompact] = useState(false);
	// touch-capable (coarse or hybrid), tracked from BOTH pointer media
	// queries plus a touch-screen-on-narrow-window fallback, each
	// re-evaluated live via media-query change listeners. On
	// touch-capable devices the terminal is ALWAYS maximized — no
	// floating window, no drag/resize — so there is no floating geometry
	// to protect and no keyboard clamp-freeze logic is needed.
	const [isTouchCapable, setIsTouchCapable] = useState(false);
	// whether the command input currently has focus.
	const [inputFocused, setInputFocused] = useState(false);
	// true only while a touch keyboard is actually open: touch-capable +
	// focused input + a visual viewport that really shrank (or no
	// visualViewport support to ask). Derived state, updated on focus
	// changes and visualViewport resize events — no timers, no height
	// baselines; vv.height and window.innerHeight are compared at the
	// same instant, and only at scale 1 so pinch zoom cannot skew it.
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	// never read window during render — geometry is computed after mount
	const [win, setWin] = useState<WinGeom>({
		w: DEFAULT_SIZE.w,
		h: DEFAULT_SIZE.h,
		x: 0,
		y: 0,
	});
	const prevState = useRef<WinGeom | null>(null);
	// the user's preferred floating size/position — written only when a
	// drag/resize interaction actually moves the pointer (the produced
	// geometry is committed on pointer-up), never by viewport clamping,
	// maximize/restore, or cancellation. The DISPLAYED geometry (win) is
	// derived from this by clamping against the current viewport, so a
	// window that shrank to fit a 320px viewport recovers its preferred
	// size when the viewport grows back instead of staying shrunk.
	const preferredWinRef = useRef<WinGeom>({
		w: DEFAULT_SIZE.w,
		h: DEFAULT_SIZE.h,
		x: 0,
		y: 0,
	});
	const draftRef = useRef("");
	const scrolledRef = useRef(false);
	const dragCleanupRef = useRef<(() => void) | null>(null);
	// drag and resize each own their cleanup — starting one during the other
	// can never leak the other's listeners
	const resizeCleanupRef = useRef<(() => void) | null>(null);
	const announceTimerRef = useRef<number | null>(null);
	// last input value whose ambiguous Tab candidates were listed — a second
	// Tab on the same input lets focus move on instead of re-listing
	const lastListedInputRef = useRef<string | null>(null);
	// hash currently reflected in the URL — dedupes popstate/hashchange and
	// avoids pushing duplicate history entries for repeated commands
	const appliedHashRef = useRef<string>("");
	const scrollbackRef = useRef<HTMLDivElement>(null);
	// id of the input echo to scroll to after a command (block: "start")
	const pendingScrollRef = useRef<number | null>(null);
	// live prompt row — kept in view while typing and when the keyboard opens
	const promptRowRef = useRef<HTMLDivElement>(null);

	const inputRef = useRef<HTMLInputElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const resizeRef = useRef<{
		x: number;
		y: number;
		w: number;
		h: number;
	} | null>(null);

	const isEffMax = isMaximized || isCompact || isTouchCapable;

	// only the most recent real output entry keeps its links in the tab
	// order — older entries' links get tabIndex -1 so keyboard users reach
	// the prompt without tabbing through every stale URL. Untitled
	// Tab-completion candidate lists are skipped: a Tab-list must not
	// demote the previous section's links (errors are a separate type and
	// never qualify).
	let lastOutputId: number | null = null;
	for (let i = history.length - 1; i >= 0; i--) {
		const entry = history[i];
		if (entry.type === "output" && !entry.candidates) {
			lastOutputId = entry.id;
			break;
		}
	}

	// does any output entry OLDER than the latest focusable one actually
	// contain a link (http(s), mailto or tel)? Gates the "Enter: browse
	// earlier links" hint — with nothing older to browse (welcome screen,
	// first section) the hint would be a lie. Memoized on history; the
	// non-global HAS_LINK_REGEX copy avoids lastIndex leakage between
	// .test() calls.
	const hasEarlierLinks = useMemo(() => {
		for (let i = history.length - 1; i >= 0; i--) {
			const entry = history[i];
			if (entry.type !== "output" || entry.candidates) continue;
			// i is the latest focusable output — test everything older
			for (let j = 0; j < i; j++) {
				const older = history[j];
				if (older.type !== "output" || older.candidates) continue;
				if (HAS_LINK_REGEX.test(older.content)) return true;
			}
			return false;
		}
		return false;
	}, [history]);

	// roving tabindex for the command chips toolbar: exactly one chip (the
	// last focused, initially the first) is tabbable; arrows move focus
	const [chipIndex, setChipIndex] = useState(0);
	const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
	// chips scroller — drives the data-fade attribute that gates the
	// right-edge fade mask
	const chipsRef = useRef<HTMLDivElement>(null);
	const commandNames = Object.keys(COMMANDS);
	const onChipsKeyDown = (e: React.KeyboardEvent) => {
		let next: number | null = null;
		// derive the base index from the actually focused chip — chipIndex
		// can lag focus (a focus that happened without a matching state
		// update). Fall back to chipIndex only when focus is outside the
		// toolbar's chips.
		const focusedIndex = chipRefs.current.findIndex(
			(el) => el === document.activeElement,
		);
		const current = focusedIndex === -1 ? chipIndex : focusedIndex;
		if (e.key === "ArrowRight") next = (current + 1) % commandNames.length;
		else if (e.key === "ArrowLeft")
			next = (current - 1 + commandNames.length) % commandNames.length;
		else if (e.key === "Home") next = 0;
		else if (e.key === "End") next = commandNames.length - 1;
		if (next === null) return;
		e.preventDefault();
		setChipIndex(next);
		chipRefs.current[next]?.focus();
	};

	// right-edge fade tracking: data-fade is true only while the chips
	// strip is horizontally scrollable AND not scrolled fully to the end —
	// the CSS keeps the mask off on :focus-within regardless. Scroll +
	// ResizeObserver cover user scrolling, viewport changes, and keyboard
	// show/hide (the strip is display:none while the keyboard is open).
	useEffect(() => {
		const el = chipsRef.current;
		if (!el) return;
		const update = () => {
			const scrollable = el.scrollWidth > el.clientWidth;
			const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
			el.setAttribute(
				"data-fade",
				scrollable && !atEnd ? "true" : "false",
			);
		};
		update();
		el.addEventListener("scroll", update, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", update);
			ro.disconnect();
		};
	}, []);

	// history-links mode: while the scrollback region itself is focused,
	// pressing Enter makes ALL history links tabbable (older sections are
	// normally tabIndex -1); Escape, or focus leaving the scroller
	// entirely, resets it. Toggling re-renders entries whose focusable
	// prop changed (one-off full pass on toggle — memo keeps the steady
	// state cheap).
	const [allLinksFocusable, setAllLinksFocusable] = useState(false);
	// synchronous mirror of allLinksFocusable, readable inside callbacks
	// that may run with a stale render closure (runCommand via effects,
	// window blur). Assigned at every toggle — never derived.
	const allLinksFocusableRef = useRef(false);

	useEffect(() => {
		// window geometry is only known on the client — apply it after paint
		// (avoids both hydration mismatches and cascading synchronous renders)
		const raf = requestAnimationFrame(() => {
			const geom = centeredGeom();
			preferredWinRef.current = geom;
			setWin(geom);
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	// commit a drag/resize-produced geometry as the preferred floating
	// geometry. The geometry is computed in the interaction handler from
	// its start snapshot plus pointer deltas and passed in — nothing is
	// read or written inside a setState updater. Viewport resizes
	// re-derive the displayed geometry from the preference without
	// overwriting it, so the preference always outlives a narrow viewport.
	const commitPreferredWin = useCallback((g: WinGeom) => {
		preferredWinRef.current = g;
		setWin((prev) => (shallowEqualGeom(prev, g) ? prev : g));
	}, []);

	// cleanup-only cancellation of an active drag/resize — viewport
	// resizes and touch-capable mode flips use this. Unlike the normal
	// end handlers it never commits, so preferredWinRef stays untouched.
	// The cleanup refs hold the cancel closures (listeners removed, no
	// commit), which also makes unmount and "one interaction at a time"
	// cleanup-only.
	const cancelInteraction = useCallback(() => {
		dragCleanupRef.current?.();
		dragCleanupRef.current = null;
		resizeCleanupRef.current?.();
		resizeCleanupRef.current = null;
	}, []);

	// touch-capable tracking (change listeners on both pointer media
	// queries AND the narrow-viewport query so the maxTouchPoints
	// fallback re-evaluates live while a hybrid window is resized across
	// the 1024px boundary — same inputs as isTouchCapableNow()). On
	// touch-capable devices the terminal is always maximized, so there is
	// no floating geometry to re-clamp from here.
	useEffect(() => {
		const coarseMq = window.matchMedia("(pointer: coarse)");
		const anyCoarseMq = window.matchMedia("(any-pointer: coarse)");
		const narrowMq = window.matchMedia("(max-width: 1023px)");
		const update = () =>
			setIsTouchCapable(
				coarseMq.matches ||
					anyCoarseMq.matches ||
					(navigator.maxTouchPoints > 0 && narrowMq.matches),
			);
		update();
		coarseMq.addEventListener("change", update);
		anyCoarseMq.addEventListener("change", update);
		narrowMq.addEventListener("change", update);
		return () => {
			coarseMq.removeEventListener("change", update);
			anyCoarseMq.removeEventListener("change", update);
			narrowMq.removeEventListener("change", update);
		};
	}, []);

	// fine pointers only: floating window stays available. Entering
	// floating mode (device flips touch-capable → fine, e.g. a mouse is
	// unplugged from a tablet) re-derives the DISPLAYED geometry once from
	// the preferred geometry, clamped against the CURRENT window size —
	// deferred one frame like the mount geometry above to avoid a
	// cascading synchronous render. The resize listener does the same on
	// later window changes; neither ever writes the clamped result back to
	// the preference, so growing the viewport restores the preferred size.
	// No keyboard logic at all.
	useEffect(() => {
		// a touch-capable flip mid-interaction cancels it without
		// committing (no-op when nothing is active, e.g. on mount)
		cancelInteraction();
		if (isTouchCapable) return;
		const raf = requestAnimationFrame(() =>
			setWin(clampGeom(preferredWinRef.current)),
		);
		const onResize = () => {
			// a viewport resize mid-interaction makes the start snapshot
			// stale — cancel without committing, then re-derive the
			// displayed geometry from the (untouched) preference
			cancelInteraction();
			const next = clampGeom(preferredWinRef.current);
			setWin((prev) => (shallowEqualGeom(prev, next) ? prev : next));
		};
		window.addEventListener("resize", onResize);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
		};
	}, [isTouchCapable, cancelInteraction]);

	// touch-capable devices: size the terminal from the visual viewport
	// (--vvh / --vvt) so the keyboard-shrunk, offset viewport is
	// respected. With the page's resizes-visual policy the layout
	// viewport keeps its height while the keyboard is open, so only the
	// visual viewport shrinks and --vvh keeps the terminal above it.
	// Values are recomputed from vv.height / vv.offsetTop on every
	// resize/scroll — no baseline, no heuristics — and only applied at
	// scale 1: while pinch-zoomed the visual viewport no longer
	// describes the layout, so the properties are removed and the layout
	// falls back to 100dvh / 0px. Geometry is never re-clamped while
	// touch-capable (the terminal is always maximized); the only clamp
	// happens once, when a device turns fine-pointer-only and floating
	// mode returns (effect above). Cleanup removes the properties on
	// that transition or on unmount.
	useEffect(() => {
		if (!isTouchCapable) return;
		const vv = window.visualViewport;
		const rootStyle = document.documentElement.style;
		const update = () => {
			if (!vv || vv.scale !== 1) {
				rootStyle.removeProperty("--vvh");
				rootStyle.removeProperty("--vvt");
				return;
			}
			rootStyle.setProperty("--vvh", `${vv.height}px`);
			rootStyle.setProperty("--vvt", `${vv.offsetTop}px`);
		};
		update();
		vv?.addEventListener("resize", update);
		vv?.addEventListener("scroll", update);
		return () => {
			vv?.removeEventListener("resize", update);
			vv?.removeEventListener("scroll", update);
			rootStyle.removeProperty("--vvh");
			rootStyle.removeProperty("--vvt");
		};
	}, [isTouchCapable]);

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 639px)");
		const update = () => setIsCompact(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	// remove any drag/resize listeners left active at unmount, and any
	// pending announcement timer
	useEffect(
		() => () => {
			dragCleanupRef.current?.();
			dragCleanupRef.current = null;
			resizeCleanupRef.current?.();
			resizeCleanupRef.current = null;
			if (announceTimerRef.current !== null)
				clearTimeout(announceTimerRef.current);
		},
		[],
	);

	// autofocus except on touch-capable devices, where it opens the keyboard
	useEffect(() => {
		if (!isTouchCapableNow()) {
			inputRef.current?.focus();
		}
	}, []);

	// keyboardOpen: touch-capable + focused input + a visual viewport that
	// really shrank (a keyboard covers ≥100px) — or no visualViewport to
	// ask, in which case focus alone decides. With the page's
	// resizes-visual policy only the visual viewport shrinks when the
	// keyboard opens, so vv.height < innerHeight is a reliable signal;
	// the scale === 1 guard keeps pinch zoom out of the comparison.
	// Re-evaluated when focus or touch-capability changes and on every
	// visualViewport resize. Both heights are read at the same instant —
	// no timers, no baselines.
	useEffect(() => {
		const vv = window.visualViewport;
		const update = () => {
			if (!isTouchCapable || !inputFocused) {
				setKeyboardOpen(false);
				return;
			}
			if (!vv) {
				setKeyboardOpen(true);
				return;
			}
			setKeyboardOpen(vv.scale === 1 && vv.height < window.innerHeight - 100);
		};
		update();
		vv?.addEventListener("resize", update);
		return () => vv?.removeEventListener("resize", update);
	}, [isTouchCapable, inputFocused]);

	// while the input is focused on touch-capable devices, keep the live
	// prompt visible as the keyboard shifts the visual viewport: run the
	// guarded scroll (block: "nearest", only when the row is not fully
	// visible inside the scroller) once after focus, then after each
	// visualViewport resize — rAF-coalesced so a resize burst scrolls once.
	useEffect(() => {
		if (!isTouchCapable || !inputFocused) return;
		const vv = window.visualViewport;
		let raf = 0;
		const requestScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const row = promptRowRef.current;
				const scroller = scrollbackRef.current;
				if (!row || !scroller) return;
				const rowRect = row.getBoundingClientRect();
				const scRect = scroller.getBoundingClientRect();
				if (rowRect.top < scRect.top || rowRect.bottom > scRect.bottom) {
					row.scrollIntoView({ block: "nearest" });
				}
			});
		};
		requestScroll();
		vv?.addEventListener("resize", requestScroll);
		return () => {
			vv?.removeEventListener("resize", requestScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, [isTouchCapable, inputFocused]);

	useEffect(() => {
		// don't scroll on first mount — only when history actually changes
		if (!scrolledRef.current) {
			scrolledRef.current = true;
			return;
		}
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
		// after a command: if everything from the new echo down to the end
		// of the prompt row fits in the scroller, anchor the echo at the top
		// so long output starts readable — otherwise follow the bottom so
		// the command ends ON the prompt, like a real terminal (the user can
		// scroll up to read). Works for touch too, where focusInput is a
		// no-op — the prompt stays findable.
		const targetId = pendingScrollRef.current;
		pendingScrollRef.current = null;
		const scroller = scrollbackRef.current;
		if (targetId !== null && scroller) {
			const echoEl = scroller.querySelector(
				`[data-entry-id="${targetId}"]`,
			);
			if (echoEl instanceof HTMLElement) {
				// echo's content-space offset from the scroller's top
				const echoTop =
					echoEl.getBoundingClientRect().top -
					scroller.getBoundingClientRect().top +
					scroller.scrollTop;
				const fits =
					scroller.scrollHeight - echoTop <= scroller.clientHeight;
				if (fits) {
					echoEl.scrollIntoView({ block: "start", behavior });
				} else {
					scroller.scrollTo({ top: scroller.scrollHeight, behavior });
				}
				return;
			}
		}
		if (targetId !== null) return;
		bottomRef.current?.scrollIntoView({ behavior });
	}, [history]);

	// clear first, then re-set on the next tick so identical messages
	// re-announce to screen readers
	const announce = useCallback((text: string) => {
		if (announceTimerRef.current !== null)
			clearTimeout(announceTimerRef.current);
		setAnnouncement("");
		announceTimerRef.current = window.setTimeout(() => {
			setAnnouncement(text);
			announceTimerRef.current = null;
		}, 50);
	}, []);

	// collapse links mode — announces only when the mode was actually on.
	// Used on input focus, on any command run, and on Escape inside the
	// scroller.
	const resetLinksMode = useCallback(() => {
		if (!allLinksFocusableRef.current) return;
		allLinksFocusableRef.current = false;
		setAllLinksFocusable(false);
		announce("Earlier output links removed from tab order");
	}, [announce]);

	// on touch-capable devices, don't programmatically open the keyboard.
	// preventScroll: clicking around the scrollback must focus the input
	// without the browser scrolling the prompt into view.
	const focusInput = useCallback(() => {
		if (isTouchCapableNow()) return;
		inputRef.current?.focus({ preventScroll: true });
	}, []);

	const runCommand = useCallback(
		(raw: string, options?: { fromHistory?: boolean }) => {
			// a fresh command supersedes links mode — stale URLs must not
			// stay in the tab order once new output arrives
			resetLinksMode();
			const cmd = raw.trim().toLowerCase();

			if (!cmd) {
				// empty Enter: reset history navigation and keep the draft intact
				setHistoryIndex(-1);
				draftRef.current = "";
				const inputEntry: HistoryEntry = {
					id: nextEntryId(),
					type: "input",
					content: raw,
				};
				setHistory((h) => [...h, inputEntry].slice(-MAX_HISTORY));
				return;
			}

			setCmdHistory((h) => [raw, ...h].slice(0, MAX_CMD_HISTORY));
			setHistoryIndex(-1);
			draftRef.current = "";

			if (cmd === "clear") {
				pendingScrollRef.current = null;
				setHistory([]);
				announce("Terminal cleared");
				// clear is not an addressable section — drop the hash without
				// adding a history entry
				window.history.replaceState(
					null,
					"",
					window.location.pathname + window.location.search,
				);
				appliedHashRef.current = "";
				return;
			}

			if (cmd === "refresh") {
				pendingScrollRef.current = null;
				setHistory(INITIAL_HISTORY);
				setCmdHistory([]);
				setHistoryIndex(-1);
				announce("Terminal reset");
				window.history.replaceState(
					null,
					"",
					window.location.pathname + window.location.search,
				);
				appliedHashRef.current = "";
				return;
			}

			const command = Object.hasOwn(COMMANDS, cmd)
				? COMMANDS[cmd]
				: undefined;
			const outputEntry: HistoryEntry = command
				? {
						id: nextEntryId(),
						type: "output",
						title: command.title,
						content: command.run(),
					}
				: {
						id: nextEntryId(),
						type: "error",
						content: `Command not found: ${cmd}\nType 'help' for available commands.`,
					};

			// addressable sections get a history entry so Back/Forward walk
			// through them; re-running the command already at the hash must not
			// push a duplicate entry
			if (!options?.fromHistory && SECTION_COMMANDS.has(cmd)) {
				if (appliedHashRef.current !== cmd) {
					window.history.pushState(null, "", `#${cmd}`);
				}
				appliedHashRef.current = cmd;
			}

			const inputEntry: HistoryEntry = {
				id: nextEntryId(),
				type: "input",
				content: raw,
			};
			// long responses: scroll the echo to the top of the viewport
			pendingScrollRef.current = inputEntry.id;
			setHistory((h) => [...h, inputEntry, outputEntry].slice(-MAX_HISTORY));
		},
		[announce, resetLinksMode],
	);

	// Normalize the URL hash the same way for the initial deep link and for
	// Back/Forward: known section commands are returned as-is; unknown
	// hashes are dropped from the URL (no history entry) and null is
	// returned, so stale content is never left on screen.
	const normalizeHash = useCallback((): string | null => {
		const hash = window.location.hash.replace(/^#/, "").toLowerCase();
		if (hash && SECTION_COMMANDS.has(hash)) return hash;
		if (hash) {
			window.history.replaceState(
				null,
				"",
				window.location.pathname + window.location.search,
			);
		}
		return null;
	}, []);

	// Deep link: if the URL carries a known command hash, run it once after
	// the welcome message (effect only — no window access during render).
	// The run is deferred a frame (like the geometry effect above) so the
	// setState it triggers isn't synchronous within the effect.
	useEffect(() => {
		const hash = normalizeHash();
		if (!hash) return;
		appliedHashRef.current = hash;
		const raf = requestAnimationFrame(() => {
			runCommand(hash, { fromHistory: true });
		});
		return () => cancelAnimationFrame(raf);
	}, [runCommand, normalizeHash]);

	// Back/Forward: re-run the section command for the restored hash, or
	// reset to the welcome screen when the hash is empty or unknown
	// (normalized exactly like the initial deep link above). Neither event
	// is fired by our own pushState/replaceState, and the applied-hash ref
	// dedupes popstate + hashchange firing for the same navigation.
	useEffect(() => {
		const applyHash = () => {
			const hash = normalizeHash();
			if (hash === appliedHashRef.current) return;
			if (hash) {
				appliedHashRef.current = hash;
				runCommand(hash, { fromHistory: true });
			} else {
				appliedHashRef.current = "";
				pendingScrollRef.current = null;
				setHistory(INITIAL_HISTORY);
				announce("Terminal welcome screen");
			}
		};
		window.addEventListener("popstate", applyHash);
		window.addEventListener("hashchange", applyHash);
		return () => {
			window.removeEventListener("popstate", applyHash);
			window.removeEventListener("hashchange", applyHash);
		};
	}, [runCommand, announce, normalizeHash]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// fresh command line: the next Tab may list candidates again
		lastListedInputRef.current = null;
		runCommand(input);
		setInput("");
	};

	const toggleMaximize = useCallback(() => {
		// touch-capable devices are always effectively maximized — the
		// button is not even rendered, so a stray invocation is a no-op
		if (isTouchCapable || isCompact) return;
		// floating geometry already within 2px of the viewport on BOTH axes
		// IS the maximized state visually — a "maximize" click would
		// produce no visible change, so treat the window as already
		// maximized and make this click restore instead
		const nearFull =
			win.w >= window.innerWidth - 2 && win.h >= window.innerHeight - 2;
		if (!isMaximized && !nearFull) {
			// save the PREFERENCE — never the displayed geometry, which the
			// viewport clamp may have shrunk — so restore brings back what
			// the user actually chose
			prevState.current = preferredWinRef.current;
			setWin({ w: window.innerWidth, h: window.innerHeight, x: 0, y: 0 });
			setIsMaximized(true);
		} else {
			// restore from the preference captured at maximize time. A
			// clamped candidate within 2px of the viewport on BOTH axes is
			// the maximized state — restoring it would look dead (nothing
			// appears to happen); fall back to the centred default. Full on
			// only ONE axis is fine: it is clamped and kept (600x900 in a
			// 1440x900 viewport stays). The clamped/centred result is
			// display only — preferredWinRef keeps the user's preference.
			const prev = prevState.current;
			const candidate = prev ? clampGeom(prev) : null;
			const candidateNearFull =
				candidate !== null &&
				candidate.w >= window.innerWidth - 2 &&
				candidate.h >= window.innerHeight - 2;
			const next =
				candidate && !candidateNearFull ? candidate : centeredGeom();
			setWin(next);
			setIsMaximized(false);
		}
	}, [isTouchCapable, isCompact, isMaximized, win]);

	const onHeaderDoubleClick = (e: React.MouseEvent) => {
		// the traffic-light buttons handle their own clicks — don't double-toggle
		if ((e.target as HTMLElement).closest("button")) return;
		toggleMaximize();
	};

	const onDragStart = (e: React.PointerEvent) => {
		if (isEffMax) return;
		if ((e.target as HTMLElement).closest("button")) return;
		e.preventDefault();
		// cancel any active drag/resize first — one interaction at a time
		dragCleanupRef.current?.();
		resizeCleanupRef.current?.();
		// only this pointer drives the interaction
		const pointerId = e.pointerId;
		const startX = e.clientX;
		const startY = e.clientY;
		// start snapshot: the produced geometry is computed from this plus
		// pointer deltas — never from state inside a setState updater
		const start = win;
		// a plain click (pointer moved ≤2px) must NOT overwrite the
		// preferred geometry — commit only after real movement
		let moved = false;
		let latest: WinGeom = start;
		const onMove = (ev: PointerEvent) => {
			if (ev.pointerId !== pointerId) return;
			if (
				!moved &&
				Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 2
			)
				return;
			moved = true;
			latest = clampGeom({
				w: start.w,
				h: start.h,
				x: start.x + ev.clientX - startX,
				y: start.y + ev.clientY - startY,
			});
			setWin((g) => (shallowEqualGeom(g, latest) ? g : latest));
		};
		const detach = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onEnd);
			window.removeEventListener("pointercancel", onEnd);
			dragCleanupRef.current = null;
		};
		// ev is optional so the same function works as a pointerup/pointercancel
		// listener and as the stored cleanup (invoked with no event)
		let active = true;
		const onEnd = (ev?: PointerEvent) => {
			if (ev && ev.pointerId !== pointerId) return;
			if (!active) return;
			active = false;
			detach();
			// drag finished — only a real drag commits; the geometry the
			// user produced (start snapshot + deltas, clamped) becomes the
			// preferred geometry, and a plain click leaves it untouched
			if (!moved) return;
			commitPreferredWin(latest);
		};
		// cleanup-only cancellation (viewport resize / mode flip / another
		// interaction starting): same listeners removed, nothing committed
		const onCancel = () => {
			if (!active) return;
			active = false;
			detach();
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onEnd);
		window.addEventListener("pointercancel", onEnd);
		dragCleanupRef.current = onCancel;
	};

	const onResizeStart = (e: React.PointerEvent) => {
		if (isEffMax) return;
		e.preventDefault();
		e.stopPropagation();
		// cancel any active drag/resize first — one interaction at a time
		dragCleanupRef.current?.();
		resizeCleanupRef.current?.();
		// only this pointer drives the interaction
		const pointerId = e.pointerId;
		(e.target as HTMLElement).setPointerCapture(pointerId);
		const start = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
		resizeRef.current = start;
		// a plain click (pointer moved ≤2px) must NOT overwrite the
		// preferred geometry — commit only after real movement
		let moved = false;
		let latest: WinGeom = win;

		const onMove = (ev: PointerEvent) => {
			if (ev.pointerId !== pointerId) return;
			if (!resizeRef.current) return;
			if (
				!moved &&
				Math.hypot(ev.clientX - start.x, ev.clientY - start.y) <= 2
			)
				return;
			moved = true;
			// start snapshot + deltas, clamped — computed in the handler,
			// never inside a setState updater
			latest = {
				w: Math.min(
					Math.max(400, start.w + ev.clientX - start.x),
					window.innerWidth - win.x,
				),
				h: Math.min(
					Math.max(300, start.h + ev.clientY - start.y),
					window.innerHeight - win.y,
				),
				x: win.x,
				y: win.y,
			};
			setWin((g) => (shallowEqualGeom(g, latest) ? g : latest));
		};
		const detach = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onEnd);
			window.removeEventListener("pointercancel", onEnd);
			resizeCleanupRef.current = null;
		};
		// ev is optional so the same function works as a pointerup/pointercancel
		// listener and as the stored cleanup (invoked with no event)
		let active = true;
		const onEnd = (ev?: PointerEvent) => {
			if (ev && ev.pointerId !== pointerId) return;
			if (!active) return;
			active = false;
			resizeRef.current = null;
			detach();
			// resize finished — only a real resize commits; the geometry
			// the user produced (start snapshot + deltas, clamped) becomes
			// the preferred geometry, and a plain click leaves it untouched
			if (!moved) return;
			commitPreferredWin(latest);
		};
		// cleanup-only cancellation (viewport resize / mode flip / another
		// interaction starting): same listeners removed, nothing committed
		const onCancel = () => {
			if (!active) return;
			active = false;
			resizeRef.current = null;
			detach();
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onEnd);
		window.addEventListener("pointercancel", onEnd);
		resizeCleanupRef.current = onCancel;
	};

	const scrollScrollback = (direction: number) => {
		const el = scrollbackRef.current;
		if (!el) return;
		el.scrollBy({ top: direction * el.clientHeight * 0.9 });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// scroll the output area without leaving the input
		if (e.key === "PageUp") {
			e.preventDefault();
			scrollScrollback(-1);
			return;
		}
		if (e.key === "PageDown") {
			e.preventDefault();
			scrollScrollback(1);
			return;
		}
		if (e.key === "Tab") {
			// Shift+Tab always moves focus backwards
			if (e.shiftKey) return;
			const token = input.trim().toLowerCase();
			if (!token) return;
			const matches = Object.keys(COMMANDS).filter((cmd) =>
				cmd.startsWith(token),
			);
			if (matches.length === 0) return;
			// typed text already is the single exact match: let Tab move focus
			if (matches.length === 1 && input === matches[0]) return;
			const completion =
				matches.length === 1 ? matches[0] : commonPrefix(matches);
			if (completion === input) {
				// ambiguous prefix: list the candidates only once per unchanged
				// input value; a second Tab on the same input moves focus on
				// normally (no preventDefault)
				if (lastListedInputRef.current === input) return;
				e.preventDefault();
				lastListedInputRef.current = input;
				// echo the typed text, then list the candidates
				// (focus stays in the input)
				const echoEntry: HistoryEntry = {
					id: nextEntryId(),
					type: "input",
					content: input,
				};
				const listEntry: HistoryEntry = {
					id: nextEntryId(),
					type: "output",
					content: matches.join("  "),
					candidates: true,
				};
				pendingScrollRef.current = null;
				setHistory((h) =>
					[...h, echoEntry, listEntry].slice(-MAX_HISTORY),
				);
				return;
			}
			e.preventDefault();
			lastListedInputRef.current = null;
			setInput(completion);
			return;
		}
		if (e.key === "ArrowUp") {
			if (cmdHistory.length === 0) return;
			e.preventDefault();
			// programmatic input change → Tab may list candidates again
			lastListedInputRef.current = null;
			// remember the typed draft before leaving the empty prompt
			if (historyIndex === -1) draftRef.current = input;
			const next = Math.min(historyIndex + 1, cmdHistory.length - 1);
			setHistoryIndex(next);
			setInput(cmdHistory[next] ?? "");
		} else if (e.key === "ArrowDown") {
			// never at the live prompt — must not erase the typed draft
			if (historyIndex === -1) return;
			if (cmdHistory.length === 0) return;
			e.preventDefault();
			// programmatic input change → Tab may list candidates again
			lastListedInputRef.current = null;
			const next = historyIndex - 1;
			if (next < 0) {
				setHistoryIndex(-1);
				setInput(draftRef.current);
				draftRef.current = "";
			} else {
				setHistoryIndex(next);
				setInput(cmdHistory[next] ?? "");
			}
		}
	};

	return (
		// #terminal-root: hidden via the inline <style> inside <noscript> so
		// no-JS visitors get the readable fallback instead of the dead terminal
		<div id="terminal-root" className="h-[var(--vvh,100dvh)] w-dvw bg-bg">
			<div
				data-terminal
				style={
					isEffMax
						? undefined
						: {
								position: "fixed",
								left: win.x,
								top: win.y,
								width: win.w,
								height: win.h,
							}
				}
				className={`terminal-enter fixed bg-bg flex flex-col border border-border ${isEffMax ? "translate-y-[var(--vvt,0px)] inset-0 h-[var(--vvh,100dvh)] w-dvw rounded-none shadow-none" : "rounded-xl shadow-window"}`}
			>
				{/* Header — drag handle. The media-query h-12 is a
				    first-paint guard only: the server render cannot
				    know isTouchCapable, so coarse-pointer devices
				    would otherwise paint the 40px desktop header and
				    shift on hydration. The other touch sizes below
				    (traffic-light gaps, hit areas, glyphs, prompt
				    height) carry the same CSS-only
				    [@media(any-pointer:coarse)] variants for the same
				    reason: CSS and JS both key on any-pointer: coarse,
				    so first paint and hydration always agree — a touch
				    laptop (fine primary, coarse touchscreen) gets the
				    touch layout with no shift. */}
				<div
					className={`shrink-0 flex items-center justify-between gap-2 bg-surface border-b border-border pl-2 pr-4 ${isTouchCapable ? "h-12" : "h-10"} [@media(any-pointer:coarse)]:h-12 ${isEffMax ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"}`}
					onPointerDown={isEffMax ? undefined : onDragStart}
					onDoubleClick={onHeaderDoubleClick}
				>
					{/* macOS traffic lights: 12px layout boxes — dot centres
					    sit 24px apart on fine pointers. The 44px hit area
					    lives on an absolutely-positioned ::before —
					    -inset-x-[6px] makes each hit area 24px wide so they
					    abut exactly on desktop; on touch-capable devices
					    gap-5 (20px + 12px dot = 32px centre spacing) with
					    -inset-x-[10px] (32px wide) keeps the same abutting,
					    non-overlapping arrangement. -inset-y-4 reaches 44px
					    tall without inflating the header height. Sizes come
					    from the isTouchCapable state AND matching CSS-only
					    [@media(any-pointer:coarse)] first-paint variants —
					    the server render cannot know the state, so the
					    media query paints the touch layout pre-hydration;
					    both key on any-pointer: coarse and agree. */}
					<div
						className={`flex shrink-0 items-center ${isTouchCapable ? "gap-5" : "gap-3"} [@media(any-pointer:coarse)]:gap-5`}
					>
						<button
							type="button"
							aria-label="Reset terminal"
							title="Reset terminal"
							onClick={() => runCommand("refresh")}
							className={`group relative grid h-3 w-3 place-items-center rounded-full before:absolute before:-inset-y-4 before:content-[''] ${isTouchCapable ? "before:-inset-x-[10px]" : "before:-inset-x-[6px]"} [@media(any-pointer:coarse)]:before:-inset-x-[10px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
						>
							<span className="w-3 h-3 rounded-full bg-err grid place-items-center">
								<span
									aria-hidden="true"
									className={`text-[8px] leading-none font-bold text-bg ${isTouchCapable ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"} [@media(any-pointer:coarse)]:opacity-100`}
								>
									↺
								</span>
							</span>
						</button>
						<button
							type="button"
							aria-label="Clear terminal"
							title="Clear terminal"
							onClick={() => runCommand("clear")}
							className={`group relative grid h-3 w-3 place-items-center rounded-full before:absolute before:-inset-y-4 before:content-[''] ${isTouchCapable ? "before:-inset-x-[10px]" : "before:-inset-x-[6px]"} [@media(any-pointer:coarse)]:before:-inset-x-[10px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
						>
							<span className="w-3 h-3 rounded-full bg-warn grid place-items-center">
								<span
									aria-hidden="true"
									className={`text-[8px] leading-none font-bold text-bg ${isTouchCapable ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"} [@media(any-pointer:coarse)]:opacity-100`}
								>
									⌫
								</span>
							</span>
						</button>
						{/* Not rendered on touch-capable devices: they are
						    always effectively maximized, so toggling could
						    only break the layout — hidden by JS state, not a
						    CSS pointer query, so fine-primary hybrids hide it
						    too. Small fine-pointer screens keep it hidden below
						    sm via the scoped hidden/sm:grid pair. On coarse
						    pointers the media-query hidden keeps the first
						    server render (pre-hydration, isTouchCapable is
						    still false) from flashing the button before JS
						    removes it. */}
						{!isTouchCapable && (
							<button
								type="button"
								aria-label="Toggle maximize"
								title="Toggle maximize"
								onClick={toggleMaximize}
								className="group hidden sm:grid relative h-3 w-3 place-items-center rounded-full before:absolute before:-inset-x-[6px] before:-inset-y-4 before:content-[''] [@media(any-pointer:coarse)]:hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
							>
								<span className="w-3 h-3 rounded-full bg-ok grid place-items-center">
									<span
										aria-hidden="true"
										className="text-[8px] leading-none font-bold text-bg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
									>
										⤢
									</span>
								</span>
							</button>
						)}
					</div>
					<span className="min-w-0 truncate text-sm text-muted text-left">
						patel96 — zsh
					</span>
				</div>

				{/* Scrollable output area — keyboard-focusable for scrollback.
				    Like a real terminal, the live prompt line sits directly
				    after the last output line and scrolls WITH the history —
				    it is NOT pinned to the window bottom. The form stays
				    outside the role=log region but inside this scroller. */}
				<div
					ref={scrollbackRef}
					role="region"
					tabIndex={0}
					aria-label="Terminal scrollback"
					aria-describedby="terminal-scrollback-hint"
					onKeyDown={(e) => {
						// Escape works ANYWHERE inside the scroller (input,
						// links, region itself) — handled before the target
						// guard. The target check stays only for Enter.
						if (e.key === "Escape") {
							if (allLinksFocusable) {
								resetLinksMode();
								e.currentTarget.focus({ preventScroll: true });
							}
							return;
						}
						// only when the region ITSELF is focused — Enter on a
						// link or in the input must behave normally
						if (e.target !== e.currentTarget) return;
						if (e.key === "Enter") {
							e.preventDefault();
							const next = !allLinksFocusable;
							allLinksFocusableRef.current = next;
							setAllLinksFocusable(next);
							announce(
								next
									? "Links in earlier output are now keyboard focusable. Press Escape to leave."
									: "Earlier output links removed from tab order",
							);
						}
					}}
					onBlur={(e) => {
						// focus left the scroller entirely — links mode
						// resets. A blur with no relatedTarget while the
						// window itself lost focus (app switch, devtools) is
						// NOT a real focus move — ignore it.
						if (e.relatedTarget === null && !document.hasFocus())
							return;
						if (
							allLinksFocusable &&
							!e.currentTarget.contains(e.relatedTarget)
						) {
							resetLinksMode();
						}
					}}
					className="group/scroll @container relative flex-1 overflow-y-auto overflow-x-hidden px-4 sm:pl-10 sm:pr-8 py-6 space-y-0.5 cursor-text select-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/60"
					onClick={() => {
						if (window.getSelection()?.isCollapsed) {
							focusInput();
						}
					}}
				>
					{/* Visible links-mode hint for sighted keyboard users.
					    State-driven: while links mode is ON the Esc variant
					    shows no matter which element inside the scroller
					    holds focus (focus may sit on a link or the input,
					    so it cannot be gated on the region's
					    focus-visible); the Enter variant shows only while
					    the scrollback region ITSELF has keyboard focus AND
					    older output actually contains a link to browse.
					    Sticky so it stays readable while scrolled; m-0!
					    keeps the sticky wrapper from adding any gap above
					    the log (scroller uses space-y); pointer-events:
					    none so it never intercepts pointer events over
					    the history text. */}
					<div
						aria-hidden="true"
						className="pointer-events-none sticky top-0 z-10 m-0! h-0 flex items-start justify-end"
					>
						<span
							className={`text-xs text-muted bg-surface/80 rounded px-2 py-0.5 ${allLinksFocusable ? "block" : hasEarlierLinks ? "hidden group-focus-visible/scroll:block" : "hidden"}`}
						>
							{allLinksFocusable
								? "Esc: leave links mode"
								: "Enter: browse earlier links"}
						</span>
					</div>
					<div
						role="log"
						aria-live="polite"
						aria-relevant="additions"
						aria-label="Terminal output"
					>
						{history.map((entry) => (
							<div key={entry.id} data-entry-id={entry.id}>
								<HistoryItem
									entry={entry}
									focusable={
										entry.id === lastOutputId ||
										allLinksFocusable
									}
								/>
							</div>
						))}
					</div>

					{/* sr-only hints, split by consumer: the scrollback
					    region's aria-describedby points at the links-mode
					    instructions (Enter to enter, Escape to leave);
					    the input's points at the short typing hint below. */}
					<p id="terminal-scrollback-hint" className="sr-only">
						Press Enter on this region to make links in earlier
						output keyboard focusable. Press Escape to leave
						links mode.
					</p>
					<p id="terminal-input-hint" className="sr-only">
						Press Tab to autocomplete commands, Up and Down for
						history, Page Up and Page Down to scroll. Commands
						can also be typed directly.
					</p>

					<div role="status" aria-live="polite" className="sr-only">
						{announcement}
					</div>

					{/* Live prompt row — no focus box: focus is indicated
					    subtly by a faint row background and a 2px left
					    accent bar on the form (no outline/ring), plus the
					    brightening ❯. The row's scroll-mb-6 keeps breathing
					    room above the chips border on nearest scrolling.
					    The 44px touch height applies on touch-capable
					    devices (isTouchCapable state, so fine-primary
					    hybrids get it too), plus a CSS-only
					    [@media(any-pointer:coarse)]:min-h-11 first-paint
					    variant — the server render cannot know the state,
					    so coarse devices paint the 44px height before
					    hydration with no shift. */}
					<div
						ref={promptRowRef}
						className="pt-2 scroll-mb-6"
					>
						<form
							onSubmit={handleSubmit}
							className={`group -ml-2 flex items-center gap-2 rounded-md border-l-2 border-transparent pl-2 focus-within:border-accent focus-within:bg-surface/40 ${isTouchCapable ? "min-h-11" : ""} [@media(any-pointer:coarse)]:min-h-11`}
						>
							<Prompt />
							<label
								htmlFor="terminal-command"
								className="sr-only"
							>
								Terminal command input
							</label>
							<input
								ref={inputRef}
								id="terminal-command"
								value={input}
								onFocus={() => {
									// focus feeds the keyboardOpen derivation
									// (touch-capable + focused + shrunken visual
									// viewport), and a refocused input supersedes
									// links mode
									setInputFocused(true);
									resetLinksMode();
								}}
								onBlur={() => setInputFocused(false)}
								onChange={(e) => {
									// new input → Tab may list ambiguous
									// candidates again
									lastListedInputRef.current = null;
									setInput(e.target.value);
									// typing: keep the live row in view, but
									// only when it is not fully visible — a
									// keystroke must never scroll on its own
									const row = promptRowRef.current;
									const scroller = scrollbackRef.current;
									if (row && scroller) {
										const rowRect =
											row.getBoundingClientRect();
										const scRect =
											scroller.getBoundingClientRect();
										if (
											rowRect.top < scRect.top ||
											rowRect.bottom > scRect.bottom
										) {
											row.scrollIntoView({
												block: "nearest",
											});
										}
									}
								}}
								onKeyDown={handleKeyDown}
								aria-describedby="terminal-input-hint"
								className="min-w-0 flex-1 bg-transparent border-none outline-none text-fg text-base caret-accent py-2"
								enterKeyHint="send"
								spellCheck={false}
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
							/>
						</form>
					</div>

					<div ref={bottomRef} />
				</div>

				{/* Command chips — a compact, quiet bar pinned below the
				    scroller (above the footer): a single scrollable line of
				    shortcuts, deliberately not shaped like a second prompt.
				    Hidden only while the keyboard is open. */}
				<div
					className={`shrink-0 border-t border-border px-3 py-1.5 ${keyboardOpen ? "hidden" : ""}`}
				>
					{/* Roving-tabindex toolbar: exactly one chip is in the
					    tab order (the last focused, initially the first);
					    Arrow keys / Home / End move focus between chips. One
					    tab stop reaches the shortcuts instead of fourteen. */}
					<div
						role="toolbar"
						aria-label="Command shortcuts"
						onKeyDown={onChipsKeyDown}
						// px-1 keeps the 2px focus outline of the flush
						// first/last (and top/bottom on touch) chips inside
						// the scroller's clip box; chips-fade
						// is a 12px right-edge fade applied only while the
						// strip is horizontally scrollable AND not scrolled
						// to the end (data-fade, tracked below) and never
						// on :focus-within, so it cannot dim a focus
						// outline. On touch-capable devices the strip is
						// min-h-12
						// so the 44px chips keep their 2px focus outline
						// clear of the clip edges top/bottom without
						// vertical scrolling (overflow-y-hidden).
						className={`chips-fade flex items-center gap-1.5 px-1 overflow-x-auto overflow-y-hidden ${isTouchCapable ? "h-auto min-h-12 py-1" : "h-8"} [@media(any-pointer:coarse)]:h-auto [@media(any-pointer:coarse)]:min-h-12 [@media(any-pointer:coarse)]:py-1`}
						ref={chipsRef}
					>
						{commandNames.map((name, i) => (
							<button
								key={name}
								type="button"
								tabIndex={i === chipIndex ? 0 : -1}
								ref={(el) => {
									chipRefs.current[i] = el;
								}}
								onFocus={() => setChipIndex(i)}
								onClick={() => {
									setChipIndex(i);
									runCommand(name);
									focusInput();
								}}
								className={`shrink-0 px-2.5 rounded border border-border bg-surface text-xs text-muted hover:text-fg hover:border-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent ${isTouchCapable ? "min-h-11" : "h-6"} [@media(any-pointer:coarse)]:min-h-11`}
							>
								{name}
							</button>
						))}
					</div>
				</div>

				{/* Footer — centred, always a single line. Hidden while the
				    touch keyboard is open (keyboardOpen) so it doesn't
				    fight the keyboard for vertical space. */}
				<div
					className={`shrink-0 items-center justify-center gap-2 bg-surface border-t border-border px-6 py-2 select-none whitespace-nowrap ${keyboardOpen ? "hidden" : "flex"}`}
				>
					<span className="text-accent font-bold text-sm tracking-wide">
						PATEL96
					</span>
					<span
						aria-hidden="true"
						className="text-border max-sm:hidden"
					>
						|
					</span>
					<span
						className="text-muted text-xs text-center"
						suppressHydrationWarning
					>
						&copy; {new Date().getFullYear()} PATEL96.
						<span className="max-sm:hidden">
							{" "}
							All rights reserved.
						</span>
					</span>
				</div>

				{/* Resize grip */}
				<div
					onPointerDown={onResizeStart}
					aria-hidden="true"
					className={`absolute bottom-0 right-0 w-8 h-8 cursor-se-resize touch-none z-20 ${isEffMax ? "hidden" : "hidden sm:block"}`}
					style={{
						background:
							"linear-gradient(135deg, transparent 50%, var(--color-border) 50%)",
					}}
				/>
			</div>
		</div>
	);
}
