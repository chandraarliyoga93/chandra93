/** Ukuran maksimum file gambar sampul sebelum di-base64 (≈2,5 MB). */
export const MAX_COURSE_COVER_FILE_BYTES = 2_500_000;

/**
 * Ubah link bagikan (Drive/Dropbox) menjadi URL yang bisa dipakai sebagai src gambar.
 * Catatan: file Drive/Dropbox harus bisa diakses publik / "siapa pun dengan tautan".
 */
export function normalizeCoverImageUrl(raw: string): string {
	const input = raw.trim();
	if (!input) return input;
	if (input.startsWith("data:image/")) return input;

	try {
		const u = new URL(input);
		const host = u.hostname.replace(/^www\./, "");

		if (host === "drive.google.com") {
			const openId = u.searchParams.get("id");
			if (u.pathname === "/open" && openId) {
				return `https://drive.google.com/uc?export=view&id=${openId}`;
			}
			const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
			if (fileMatch?.[1]) {
				return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
			}
		}

		if (host === "dropbox.com" || host.endsWith(".dropbox.com")) {
			if (u.searchParams.get("dl") === "0") {
				u.searchParams.set("dl", "1");
				return u.toString();
			}
			if (u.pathname.includes("/s/") && !u.searchParams.has("raw")) {
				u.searchParams.set("raw", "1");
				return u.toString();
			}
		}
	} catch {
		return input;
	}

	return input;
}

export function readImageFileAsDataUrl(
	file: File,
	maxBytes = MAX_COURSE_COVER_FILE_BYTES,
): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			reject(new Error("File harus berupa gambar (JPG, PNG, WebP, dll.)"));
			return;
		}
		if (file.size > maxBytes) {
			reject(
				new Error(
					`Ukuran gambar maksimal ${Math.round(maxBytes / 1_000_000)} MB. Pilih file yang lebih kecil.`,
				),
			);
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") resolve(result);
			else reject(new Error("Gagal membaca file gambar"));
		};
		reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
		reader.readAsDataURL(file);
	});
}
