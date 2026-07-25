"use client";

import { QRCodeCanvas } from "qrcode.react";

interface LoginCardTemplateProps {
  studentName: string;
  username: string;
  password?: string;
}

/**
 * Neo-Brutalist Login Card Template
 * Designed for 85mm x 55mm business card size.
 * Uses system fonts and basic CSS to ensure high reliability when captured by html2canvas.
 */
export function LoginCardTemplate({
  studentName,
  username,
  password,
}: LoginCardTemplateProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kelas.aiforteacher.id";
  
  // Clean username if it contains @domain
  const cleanUsername = username.split('@')[0];

  // Construct a login URL that can be scanned to auto-fill or auto-login
  // Format: baseUrl?u=username&p=password
  const loginUrl = new URL(baseUrl);
  loginUrl.searchParams.set("u", cleanUsername);
  if (password) loginUrl.searchParams.set("p", password);

  // Determine font size based on name length
  const nameFontSize = studentName.length > 25 ? "12px" : studentName.length > 18 ? "14px" : "16px";

  return (
    <div
      id="login-card-template"
      style={{
        width: "85mm",
        height: "55mm",
        backgroundColor: "#ffffff",
        border: "1px solid #e4e4e7",
        boxSizing: "border-box",
        padding: "5mm",
        display: "flex",
        flexDirection: "column",
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: "#000000",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0px",
      }}
    >
      {/* Top Border Accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", backgroundColor: "#000000" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3mm", flexShrink: 0 }}>
        <div style={{ fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Kelas Guru
        </div>
        <div style={{ fontSize: "9px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>
          Kartu Akses Siswa
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: "5mm", flex: 1, minHeight: 0 }}>
        {/* Left Side: QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm", flexShrink: 0 }}>
          <div style={{ border: "1px solid #e4e4e7", padding: "1.5mm", backgroundColor: "#ffffff" }}>
            <QRCodeCanvas
              value={loginUrl.toString()}
              size={60}
              level="H"
              includeMargin={false}
            />
          </div>
          <span style={{ fontSize: "7px", fontWeight: "700", color: "#71717a", textTransform: "uppercase" }}>Scan untuk Login</span>
        </div>

        {/* Right Side: Details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center" }}>
          <div 
            style={{ 
              fontWeight: "700", 
              fontSize: nameFontSize, 
              lineHeight: "1.1",
              marginBottom: "1.5mm",
              color: "#000000",
              borderBottom: "1px solid #f4f4f5",
              paddingBottom: "1mm",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {studentName}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1mm" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "7px", fontWeight: "600", color: "#a1a1aa", textTransform: "uppercase", marginBottom: "0.1mm" }}>Username</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: "700", color: "#000000", wordBreak: "break-all", lineHeight: "1.1" }}>{cleanUsername}</span>
            </div>
            
            {password && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "7px", fontWeight: "600", color: "#a1a1aa", textTransform: "uppercase", marginBottom: "0.1mm" }}>Password</span>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: "700", color: "#000000", wordBreak: "break-all", lineHeight: "1.1" }}>{password}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f4f4f5", paddingTop: "1.5mm", flexShrink: 0 }}>
        <div style={{ fontSize: "8px", color: "#71717a", fontStyle: "normal", maxWidth: "70%", wordBreak: "break-word", overflowWrap: "break-word" }}>
          Simpan kartu ini dengan baik. Jangan berikan password Anda kepada orang lain.
        </div>
        <div style={{ fontSize: "8px", fontWeight: "700", color: "#000000" }}>
          kelas.aiforteacher.id
        </div>
      </div>
    </div>

  );
}
