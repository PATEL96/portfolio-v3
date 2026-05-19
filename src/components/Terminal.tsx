"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type HistoryEntry =
	| { type: "input"; content: string; path: string }
	| { type: "output"; content: string }
	| { type: "error"; content: string };

const ASCII_ART = `
██████╗  █████╗      ██╗    ██████╗  █████╗ ████████╗███████╗██╗
██╔══██╗██╔══██╗     ██║    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║
██████╔╝███████║     ██║    ██████╔╝███████║   ██║   █████╗  ██║
██╔══██╗██╔══██║██   ██║    ██╔═══╝ ██╔══██║   ██║   ██╔══╝  ██║
██║  ██║██║  ██║╚█████╔╝    ██║     ██║  ██║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝     ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝`;

const COMMANDS: Record<string, { description: string; action: () => string }> =
	{
		help: {
			description: "Show available commands",
			action: () => {
				const list = Object.entries(COMMANDS)
					.map(
						([cmd, { description }]) =>
							`  ${cmd.padEnd(15)} ${description}`,
					)
					.join("\n");
				return `Available commands:\n\n${list}\n\nType any command to get started.`;
			},
		},
		about: {
			description: "Learn about Raj",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                     ABOUT RAJ D. PATEL                     ║
╚════════════════════════════════════════════════════════════╝

Raj D. Patel — independent blockchain & full-stack developer
based in Navsari, Gujarat, 396445.

Proficient in blockchain technology and web development,
with a passion for innovation and clean code.

Blockchain : Solidity · HardhatJS · EtherJS
Frontend   : ReactJS · NextJS · ThreeJS
Backend    : Python
Design     : TailwindCSS · Framer Motion

Email    : contact@patel96.live
GitHub   : https://github.com/PATEL96

Type 'skills' to see technical expertise.
`,
		},
		skills: {
			description: "View technical skills",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                      TECHNICAL SKILLS                      ║
╚════════════════════════════════════════════════════════════╝

Frontend Development
├─ ReactJS & NextJS
├─ TailwindCSS & Framer Motion
├─ ThreeJS (3D Graphics)
└─ Responsive Web Design

Blockchain Development
├─ Solidity Smart Contracts
├─ HardhatJS Testing & Deployment
├─ EtherJS & Web3 Integration
└─ DApp Development

Backend & Tools
├─ Python
├─ Git & GitHub
└─ Full-Stack Architecture

Type 'projects' to see what I've built.
`,
		},
		projects: {
			description: "Browse project portfolio",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                         PROJECTS                           ║
╚════════════════════════════════════════════════════════════╝

[1] Dotify — Image Modifier
    Image editor for halftone dotted patterns
    Live   : https://dotify-client.vercel.app/
    Source : https://github.com/PATEL96/dotify-client

[2] create-rainbow-app — NPM Package
    Deployment-ready DAPP template with NextJS
    NPM    : https://www.npmjs.com/package/create-rainbow-app
    Source : https://github.com/PATEL96/create-rainbow-app
    Stack  : NextJS · TailwindCSS · RainbowKit · Wagmi

[3] AnyChat — Anonymous Platform
    Complete anonymous posting platform
    Live   : https://any-chat.live
    Source : https://github.com/PATEL96/anyChat

[4] Password Generator
    Instant password generation in the browser
    Live   : https://patel96.live/

[5] TechFest Website
    Informational site for college TechFest event
    Source : https://github.com/PATEL96

[6] Blog
    Personal blog site
    Live   : https://blog.patel96.live

[7] Personal Portfolio
    https://patel96.live/

Type 'experience' for work history.
`,
		},
		experience: {
			description: "View work experience",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                      WORK EXPERIENCE                       ║
╚════════════════════════════════════════════════════════════╝

DROPD Network
Role     : Junior Blockchain Developer
Duration : December 2022 – December 2024
Location : Navsari
Focus    : Smart contract development, DApp integration

────────────────────────────────────────────────────────────

CGPIT
Role     : Lead Front-end Developer
Duration : March 2022 – June 2022
Location : Surat
Focus    : React development, UI/UX implementation

Type 'education' for academic background.
`,
		},
		education: {
			description: "Academic background",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                        EDUCATION                           ║
╚════════════════════════════════════════════════════════════╝

B.Tech in Information Technology
  Uka Tarsadia University, Bardoli, Gujarat

Higher Secondary
  Ashramshala Bhaktashram, Navsari, Gujarat

Secondary
  Ashramshala Bhaktashram, Navsari, Gujarat
`,
		},
		contact: {
			description: "Get in touch",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                      CONTACT INFO                          ║
╚════════════════════════════════════════════════════════════╝

Email    : contact@patel96.live
Phone    : +91 70432 42657
GitHub   : https://github.com/PATEL96
Website  : https://patel96.live/
Location : Navsari, Gujarat, 396445
`,
		},
		hobbies: {
			description: "Personal interests",
			action: () => `
╔════════════════════════════════════════════════════════════╗
║                      BEYOND CODE                           ║
╚════════════════════════════════════════════════════════════╝

Music  — composing and producing original music across genres
Gaming — enthusiastic gamer across platforms and genres
DJ     — mixing music and creating immersive experiences
Football — active player, fostering teamwork and fitness
Anime  — exploring diverse themes and art styles
`,
		},
		github: {
			description: "Open GitHub profile",
			action: () => {
				if (typeof window !== "undefined")
					window.open("https://github.com/PATEL96", "_blank");
				return "Opening GitHub profile...";
			},
		},
		// portfolio: {
		// 	description: "Visit portfolio site",
		// 	action: () => {
		// 		if (typeof window !== "undefined")
		// 			window.open("https://patel96.live/", "_blank");
		// 		return "Opening portfolio website...";
		// 	},
		// },
		resume: {
			description: "Open resume",
			action: () => {
				if (typeof window !== "undefined")
					window.open(
						"https://docs.google.com/document/d/1T0PwDsZDwEvq9X0I8buh91rWCcOYysVV3VDnqIbMr9k/edit?tab=t.0",
						"_blank",
					);
				return "Opening resume...";
			},
		},
		clear: {
			description: "Clear terminal screen",
			action: () => "CLEAR_SCREEN",
		},
		refresh: {
			description: "Reset terminal to initial state",
			action: () => "REFRESH",
		},
	};

const WELCOME: HistoryEntry = {
	type: "output",
	content: `${ASCII_ART}\nWelcome to Raj D. Patel's Terminal Portfolio\nType 'help' to see available commands.\n`,
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text: string) {
	const parts = text.split(URL_REGEX);
	return parts.map((part, i) =>
		URL_REGEX.test(part) ? (
			<Link
				key={i}
				href={part}
				target="_blank"
				rel="noopener noreferrer"
				className="text-[#58a6ff] underline underline-offset-2 hover:text-[#79c0ff] cursor-pointer"
				onClick={(e) => e.stopPropagation()}
			>
				{part}
			</Link>
		) : (
			<span key={i}>{part}</span>
		),
	);
}

function Prompt() {
	return (
		<span className="shrink-0 flex items-baseline gap-1 text-sm select-none">
			<span className="text-[#8b949e]">~/</span>
			<span className="text-[#58a6ff] font-bold">patel96-portfolio</span>
			<span className="text-[#3fb950]"> main</span>
			<span className="text-[#3fb950]"> ❯</span>
		</span>
	);
}

export default function Terminal() {
	const [input, setInput] = useState("");
	const [history, setHistory] = useState<HistoryEntry[]>([WELCOME]);
	const [cmdHistory, setCmdHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const DEFAULT_SIZE = { w: 860, h: 560 };
	const [isMaximized, setIsMaximized] = useState(true);
	const [size, setSize] = useState(() =>
		typeof window !== "undefined"
			? { w: window.innerWidth, h: window.innerHeight }
			: { w: 1280, h: 800 },
	);
	const [pos, setPos] = useState({ x: 0, y: 0 });
	const prevState = useRef<{
		size: { w: number; h: number };
		pos: { x: number; y: number };
	} | null>({
		size: DEFAULT_SIZE,
		pos:
			typeof window !== "undefined"
				? {
						x: Math.round((window.innerWidth - DEFAULT_SIZE.w) / 2),
						y: Math.round(
							(window.innerHeight - DEFAULT_SIZE.h) / 2,
						),
					}
				: { x: 0, y: 0 },
	});

	const inputRef = useRef<HTMLInputElement>(null);
	const mirrorRef = useRef<HTMLSpanElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const resizeRef = useRef<{
		startX: number;
		startY: number;
		startW: number;
		startH: number;
	} | null>(null);
	const dragRef = useRef<{
		startX: number;
		startY: number;
		startPX: number;
		startPY: number;
	} | null>(null);
	const [cursorLeft, setCursorLeft] = useState(0);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [history]);

	useEffect(() => {
		setCursorLeft(mirrorRef.current?.offsetWidth ?? 0);
	}, [input]);

	const runCommand = useCallback((raw: string) => {
		const cmd = raw.trim().toLowerCase();
		const inputEntry: HistoryEntry = {
			type: "input",
			content: raw,
			path: "~",
		};

		if (!cmd) {
			setHistory((h) => [...h, inputEntry]);
			return;
		}

		setCmdHistory((h) => [raw, ...h]);
		setHistoryIndex(-1);

		if (cmd === "clear") {
			setHistory([]);
			return;
		}

		if (cmd === "refresh") {
			setHistory([WELCOME]);
			setCmdHistory([]);
			setHistoryIndex(-1);
			return;
		}

		const command = COMMANDS[cmd];
		const outputEntry: HistoryEntry = command
			? { type: "output", content: command.action() }
			: {
					type: "error",
					content: `Command not found: ${cmd}\nType 'help' for available commands.`,
				};

		setHistory((h) => [...h, inputEntry, outputEntry]);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		runCommand(input);
		setInput("");
	};

	const onTitleDoubleClick = () => {
		if (!isMaximized) {
			prevState.current = { size, pos };
			setPos({ x: 0, y: 0 });
			setSize({ w: window.innerWidth, h: window.innerHeight });
			setIsMaximized(true);
		} else {
			if (prevState.current) {
				setSize(prevState.current.size);
				setPos(prevState.current.pos);
			}
			setIsMaximized(false);
		}
	};

	const onDragStart = (e: React.MouseEvent) => {
		e.preventDefault();
		dragRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			startPX: pos.x,
			startPY: pos.y,
		};
		const onMove = (ev: MouseEvent) => {
			if (!dragRef.current) return;
			const { startX, startY, startPX, startPY } = dragRef.current;
			setPos({
				x: startPX + ev.clientX - startX,
				y: startPY + ev.clientY - startY,
			});
		};
		const onUp = () => {
			dragRef.current = null;
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	const onResizeStart = (e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		resizeRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			startW: size.w,
			startH: size.h,
		};

		const onMove = (ev: PointerEvent) => {
			if (!resizeRef.current) return;
			const { startX, startY, startW, startH } = resizeRef.current;
			setSize({
				w: Math.max(400, startW + ev.clientX - startX),
				h: Math.max(300, startH + ev.clientY - startY),
			});
		};
		const onUp = () => {
			resizeRef.current = null;
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowUp") {
			e.preventDefault();
			const next = Math.min(historyIndex + 1, cmdHistory.length - 1);
			setHistoryIndex(next);
			setInput(cmdHistory[next] ?? "");
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			const next = historyIndex - 1;
			if (next < 0) {
				setHistoryIndex(-1);
				setInput("");
			} else {
				setHistoryIndex(next);
				setInput(cmdHistory[next] ?? "");
			}
		}
	};

	return (
		<div className="w-screen h-screen bg-[#0d1117]">
			<motion.div
				data-terminal
				initial={{ scale: 0.96, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				style={{
					position: "fixed",
					left: pos.x,
					top: pos.y,
					width: size.w,
					height: size.h,
				}}
				className={`scanline bg-[#0d1117] flex flex-col border border-[#30363d] select-none ${isMaximized ? "rounded-none shadow-none" : "rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.8)]"}`}
			>
				{/* Header — drag handle */}
				<div
					className={`shrink-0 relative flex items-center justify-center bg-[#161b22] border-b border-[#30363d] px-4 h-10 ${isMaximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
					onMouseDown={isMaximized ? undefined : onDragStart}
					onDoubleClick={onTitleDoubleClick}
				>
					<div className="absolute left-4 flex items-center gap-2">
						<span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
						<span className="w-3 h-3 rounded-full bg-[#febc2e]" />
						<span className="w-3 h-3 rounded-full bg-[#28c840]" />
					</div>
					<span className="text-sm text-[#8b949e]">
						rajdpatel — zsh — {Math.floor(size.w / 7)}×
						{Math.floor(size.h / 15)}
					</span>
				</div>

				{/* Scrollable area: history + live input row */}
				<div
					className="flex-1 overflow-y-auto overflow-x-hidden pl-10 pr-8 py-6 space-y-0.5 cursor-text"
					onClick={() => inputRef.current?.focus()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<AnimatePresence initial={false}>
						{history.map((entry, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.15 }}
							>
								{entry.type === "input" && (
									<div className="flex items-baseline gap-2 text-sm">
										<Prompt />
										<span className="text-[#c9d1d9]">
											{entry.content}
										</span>
									</div>
								)}
								{entry.type === "output" && (
									<pre className="pre-wrap text-[#c9d1d9] text-sm leading-relaxed max-w-full overflow-x-hidden">
										{renderWithLinks(entry.content)}
									</pre>
								)}
								{entry.type === "error" && (
									<pre className="pre-wrap text-[#f85149] text-sm leading-relaxed max-w-full overflow-x-hidden">
										{renderWithLinks(entry.content)}
									</pre>
								)}
							</motion.div>
						))}
					</AnimatePresence>

					{/* Live input row — scrolls with content */}
					<form
						onSubmit={handleSubmit}
						className="flex items-center gap-2"
					>
						<Prompt />
						<div className="relative flex-1 flex items-center">
							<span
								ref={mirrorRef}
								aria-hidden
								className="invisible absolute left-0 text-[#c9d1d9] text-sm whitespace-pre"
							>
								{input}
							</span>
							<input
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full bg-transparent border-none outline-none text-[#c9d1d9] text-sm caret-transparent"
								autoFocus
								spellCheck={false}
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
							/>
							<span
								aria-hidden
								style={{ left: cursorLeft }}
								className="cursor-blink absolute text-[#58a6ff] text-sm select-none pointer-events-none leading-none"
							>
								&#x258A;
							</span>
						</div>
					</form>

					<div ref={bottomRef} />
				</div>

				{/* Footer */}
				<div className=" flex items-center justify-center bg-[#161b22] border-t border-[#30363d] px-6 py-2 select-none">
					<div className="flex items-center gap-2">
						{/* Logo placeholder — replace /logo.png with your actual file */}
						<span className="text-[#58a6ff] font-bold text-sm tracking-wide">
							PATEL96
						</span>
						<span className="text-[#30363d]">|</span>
						<span className="text-[#484f58] text-xs">
							&copy; 2026 PATEL96. All rights reserved.
						</span>
					</div>
				</div>

				{/* Resize grip */}
				<div
					onPointerDown={onResizeStart}
					className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
					style={{
						background:
							"linear-gradient(135deg, transparent 50%, #30363d 50%)",
					}}
				/>
			</motion.div>
		</div>
	);
}
