import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { PROFILE } from "@/lib/portfolio-data";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-jetbrains-mono",
	display: "swap",
	// The latin subset lacks box-drawing glyphs (█ ╗ ═ ║ ├ └). next/font's
	// default Arial-metric fallback renders them at ~0.95em advance instead of
	// the monospace 0.6em, breaking the banner/box width math. Disable the
	// metric-adjusted fallback and fall back to real monospaces instead (the
	// decorative glyphs also get .terminal-glyphs in globals.css).
	adjustFontFallback: false,
	fallback: ["ui-monospace", "Menlo", "Consolas", "monospace"],
});

const TITLE = "Raj D. Patel — Blockchain & Full-Stack Developer";
const DESCRIPTION =
	"Interactive terminal portfolio of Raj D. Patel — blockchain & full-stack developer. Explore projects, skills, experience and contact info.";

export const metadata: Metadata = {
	metadataBase: new URL("https://patel96.live"),
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "https://patel96.live" },
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		type: "website",
		url: "https://patel96.live",
	},
	twitter: {
		title: TITLE,
		description: DESCRIPTION,
		card: "summary",
	},
};

export const viewport: Viewport = {
	themeColor: "#0d1117",
	// resizes-visual (not resizes-content): opening the keyboard shrinks
	// ONLY the visual viewport — the layout viewport keeps its height, so
	// window.innerHeight is stable and the Terminal's --vvh sizing +
	// keyboardOpen comparison stay meaningful.
	interactiveWidget: "resizes-visual",
};

// https://schema.org/Person — built from the shared data module
const personJsonLd = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: PROFILE.name,
	url: "https://patel96.live",
	sameAs: [PROFILE.github],
	jobTitle: PROFILE.jobTitle,
	address: {
		"@type": "PostalAddress",
		addressLocality: "Navsari",
		addressRegion: "Gujarat",
		addressCountry: "IN",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={jetbrainsMono.variable}>
			<body>
				{children}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(personJsonLd),
					}}
				/>
			</body>
		</html>
	);
}
