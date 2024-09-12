import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Trump Pet Rescue",
	description: "Rescue pets before they get eaten by illegal immigrants!",
	openGraph: {
		title: "Trump Pet Rescue",
		description: "Rescue pets before they get eaten by illegal immigrants!",
		images: [
			{
				url: "/hero-image.jpg",
				width: 1024,
				height: 768,
				alt: "Trump Pet Rescue",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Trump Pet Rescue",
		description: "Rescue pets before they get eaten by illegal immigrants!",
		images: ["/hero-image.jpg"],
	},
	icons: null, // This line removes the default favicon
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
