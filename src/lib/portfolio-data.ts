// Single source of truth for portfolio content.
// The terminal COMMANDS output (src/components/Terminal.tsx), the crawlable
// fallback section and the <noscript> block (src/app/page.tsx) all derive
// from this module so they cannot drift. URLs and personal data are verbatim
// from the original Terminal.tsx implementation.

export const PROFILE = {
	name: "Raj D. Patel",
	jobTitle: "Blockchain & Full-Stack Developer",
	email: "contact@patel96.live",
	phone: "+91 70432 42657",
	phoneHref: "+917043242657",
	github: "https://github.com/PATEL96",
	website: "https://patel96.live/",
	resume:
		"https://docs.google.com/document/d/1T0PwDsZDwEvq9X0I8buh91rWCcOYysVV3VDnqIbMr9k/edit?tab=t.0",
	location: "Navsari, Gujarat, 396445",
};

export const ABOUT = {
	headline: `${PROFILE.name} — independent blockchain & full-stack developer`,
	blurb:
		"Proficient in blockchain technology and web development,\nwith a passion for innovation and clean code.",
	stack: [
		{ label: "Blockchain", items: ["Solidity", "HardhatJS", "EtherJS"] },
		{ label: "Frontend", items: ["ReactJS", "NextJS", "ThreeJS"] },
		{ label: "Backend", items: ["Python"] },
		{ label: "Design", items: ["TailwindCSS", "Framer Motion"] },
	],
};

export const SKILLS = [
	{
		group: "Frontend Development",
		items: [
			"ReactJS & NextJS",
			"TailwindCSS & Framer Motion",
			"ThreeJS (3D Graphics)",
			"Responsive Web Design",
		],
	},
	{
		group: "Blockchain Development",
		items: [
			"Solidity Smart Contracts",
			"HardhatJS Testing & Deployment",
			"EtherJS & Web3 Integration",
			"DApp Development",
		],
	},
	{
		group: "Backend & Tools",
		items: ["Python", "Git & GitHub", "Full-Stack Architecture"],
	},
];

export type ProjectLink = { label: string; url: string };

export type Project = {
	name: string;
	description: string;
	links?: ProjectLink[];
	stack?: string;
};

export const PROJECTS: readonly Project[] = [
	{
		name: "Dotify — Image Modifier",
		description: "Image editor for halftone dotted patterns",
		links: [
			{ label: "Live", url: "https://dotify-client.vercel.app/" },
			{ label: "Source", url: "https://github.com/PATEL96/dotify-client" },
		],
	},
	{
		name: "create-rainbow-app — NPM Package",
		description: "Deployment-ready DAPP template with NextJS",
		links: [
			{
				label: "NPM",
				url: "https://www.npmjs.com/package/create-rainbow-app",
			},
			{
				label: "Source",
				url: "https://github.com/PATEL96/create-rainbow-app",
			},
		],
		stack: "NextJS · TailwindCSS · RainbowKit · Wagmi",
	},
	{
		name: "AnyChat — Anonymous Platform",
		description: "Complete anonymous posting platform",
		links: [
			{ label: "Live", url: "https://any-chat.live" },
			{ label: "Source", url: "https://github.com/PATEL96/anyChat" },
		],
	},
	{
		name: "Password Generator",
		description: "Instant password generation in the browser",
		// TODO(owner): the "Live" link was removed from the terminal output and
		// fallback — it pointed at the portfolio root, not the project. Add the
		// real deployed URL here once available.
	},
	{
		name: "TechFest Website",
		description: "Informational site for college TechFest event",
		// TODO(owner): no dedicated TechFest repo yet — this links to the
		// GitHub profile instead. Point it at the real repo once it exists.
		links: [{ label: "GitHub profile", url: "https://github.com/PATEL96" }],
	},
	{
		name: "Blog",
		description: "Personal blog site",
		links: [{ label: "Live", url: "https://blog.patel96.live" }],
	},
	{
		name: "Personal Portfolio",
		description: "This terminal — you're already here.",
	},
];

export const EXPERIENCE = [
	{
		company: "DROPD Network",
		role: "Junior Blockchain Developer",
		duration: "December 2022 – December 2024",
		location: "Navsari",
		focus: "Smart contract development, DApp integration",
	},
	{
		company: "CGPIT",
		role: "Lead Front-end Developer",
		duration: "March 2022 – June 2022",
		location: "Surat",
		focus: "React development, UI/UX implementation",
	},
];

export const EDUCATION = [
	{
		degree: "B.Tech in Information Technology",
		institution: "Uka Tarsadia University, Bardoli, Gujarat",
	},
	{
		degree: "Higher Secondary",
		institution: "Ashramshala Bhaktashram, Navsari, Gujarat",
	},
	{
		degree: "Secondary",
		institution: "Ashramshala Bhaktashram, Navsari, Gujarat",
	},
];

export type ContactEntry = {
	label: string;
	value: string;
	href?: string;
	linkLabel?: string;
};

export const CONTACT: readonly ContactEntry[] = [
	{ label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}` },
	{ label: "Phone", value: PROFILE.phone, href: `tel:${PROFILE.phoneHref}` },
	{
		label: "GitHub",
		value: PROFILE.github,
		href: PROFILE.github,
		linkLabel: "github.com/PATEL96",
	},
	{
		label: "Website",
		value: PROFILE.website,
		href: PROFILE.website,
		linkLabel: "patel96.live",
	},
	{ label: "Location", value: PROFILE.location },
];

export const HOBBIES = [
	{
		name: "Music",
		description: "composing and producing original music across genres",
	},
	{
		name: "Gaming",
		description: "enthusiastic gamer across platforms and genres",
	},
	{ name: "DJ", description: "mixing music and creating immersive experiences" },
	{
		name: "Football",
		description: "active player, fostering teamwork and fitness",
	},
	{ name: "Anime", description: "exploring diverse themes and art styles" },
];

function esc(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Semantic HTML string shared by the crawlable (sr-only) fallback section and
// the visible <noscript> block. Inline styles only, so the markup renders
// correctly for no-JS visitors without depending on any client CSS scanning.
export function fallbackSectionsHtml(): string {
	const link = (href: string, label: string) =>
		`<a href="${esc(href)}" rel="noopener noreferrer" style="color:#58a6ff;text-decoration:underline;text-underline-offset:2px;">${esc(label)}</a>`;
	const h2 = (text: string) =>
		`<h2 style="margin:1.5rem 0 0.5rem;font-size:1rem;font-weight:700;">${esc(text)}</h2>`;
	const list = (items: string[]) =>
		`<ul style="margin:0.5rem 0 0;padding-left:1.25rem;">${items
			.map((item) => `<li style="margin:0.25rem 0;">${item}</li>`)
			.join("")}</ul>`;
	const p = (text: string) =>
		`<p style="margin:0.5rem 0;">${text}</p>`;

	const about = p(
		`${esc(ABOUT.headline)} based in ${esc(PROFILE.location)}. ${esc(
			ABOUT.blurb,
		)}`,
	);

	const skills = list(
		SKILLS.map(
			(group) => `${esc(group.group)}: ${group.items.map(esc).join(", ")}`,
		),
	);

	const projects = list(
		PROJECTS.map((project) => {
			let item = `${esc(project.name)}: ${esc(project.description)}`;
			for (const { label, url } of project.links ?? []) {
				item += ` ${link(url, label)}`;
			}
			return item;
		}),
	);

	const experience = list(
		EXPERIENCE.map(
			(job) =>
				`${esc(job.company)} — ${esc(job.role)}, ${esc(job.duration)}, ${esc(job.location)}. ${esc(job.focus)}.`,
		),
	);

	const education = list(
		EDUCATION.map(
			(entry) => `${esc(entry.degree)} — ${esc(entry.institution)}`,
		),
	);

	const contact = list(
		CONTACT.map((entry) =>
			entry.href
				? `${esc(entry.label)}: ${link(entry.href, entry.linkLabel ?? entry.value)}`
				: `${esc(entry.label)}: ${esc(entry.value)}`,
		),
	);

	const hobbies = list(
		HOBBIES.map((hobby) => `${esc(hobby.name)} — ${esc(hobby.description)}`),
	);

	return [
		h2("About") + about,
		h2("Skills") + skills,
		h2("Projects") + projects,
		h2("Experience") + experience,
		h2("Education") + education,
		h2("Contact") + contact,
		h2("Hobbies") + hobbies,
	].join("");
}
