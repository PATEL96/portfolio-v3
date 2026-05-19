import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Raj D. Patel — Portfolio",
	description:
		"Interactive terminal portfolio of Raj D. Patel — blockchain developer & full-stack engineer.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<link
					href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fira+Code:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body>{children}</body>
		</html>
	);
}
