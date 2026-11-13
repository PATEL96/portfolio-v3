import Terminal from "@/components/Terminal";
import { fallbackSectionsHtml } from "@/lib/portfolio-data";

// One shared markup string so the crawlable section and the <noscript> block
// always match the terminal's data (see src/lib/portfolio-data.ts).
const FALLBACK_HTML = fallbackSectionsHtml();

// Visible page chrome for no-JS visitors. Inline styles only: this markup is
// injected as raw HTML and must not depend on Tailwind class scanning. The
// content is fixed over everything (z-index 50) because the JS terminal is
// painted on top of the static markup; the inline <style> also hides the
// terminal wrapper entirely so nothing intercepts scroll/clicks.
const NOSCRIPT_HTML =
	`<style>#terminal-root{display:none!important}</style>` +
	`<div style="position:fixed;inset:0;z-index:50;height:100dvh;overflow-y:auto;background:#0d1117;color:#c9d1d9;padding:2rem 1.5rem;font-family:monospace;">` +
	// Visible page heading for no-JS visitors (the sr-only h1 above serves
	// JS users; inside <noscript> only this one renders for them).
	`<h1 style="margin:0 0 1.5rem;font-size:1.25rem;line-height:1.4;color:#c9d1d9;">Raj D. Patel — Blockchain &amp; Full-Stack Developer</h1>` +
	FALLBACK_HTML +
	`</div>`;

export default function Home() {
	return (
		<main>
			<h1 className="sr-only">
				Raj D. Patel — Blockchain &amp; Full-Stack Developer
			</h1>
			<Terminal />
			{/* Crawlable fallback: same content the terminal serves, derived from
			    the shared data module. `inert` keeps its links out of the tab
			    order (the terminal is the accessible UI); crawlers still see it. */}
			<section
				className="sr-only"
				aria-label="Portfolio content"
				inert
				dangerouslySetInnerHTML={{ __html: FALLBACK_HTML }}
			/>
			{/* Readable, styled plain content for sighted no-JS users */}
			<noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_HTML }} />
		</main>
	);
}
