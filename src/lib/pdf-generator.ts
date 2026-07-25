import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { LoginCardTemplate } from "@/components/students/LoginCardTemplate";

interface Student {
  name: string;
  username: string;
  password?: string;
}

/**
 * Generates a PDF containing login cards for a list of students.
 * 8 cards per A4 page (2 columns x 4 rows).
 */
export async function generateLoginCardPDF(students: Student[]) {
  if (typeof window === "undefined") return;

  try {
    // 1. Create a temporary container for rendering
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "auto";
    container.style.height = "auto";
    document.body.appendChild(container);

    // 2. Render cards in groups of 8 (1 page per capture)
    const cardsPerPage = 8;
    const pages = [];
    for (let i = 0; i < students.length; i += cardsPerPage) {
      pages.push(students.slice(i, i + cardsPerPage));
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const cardWidth = 85;
    const cardHeight = 55;
    
    // Layout: 2 columns, 4 rows = 8 cards per page
    const marginX = (pageWidth - (cardWidth * 2)) / 3;
    const marginY = (pageHeight - (cardHeight * 4)) / 5;

    const root = createRoot(container);

    for (let p = 0; p < pages.length; p++) {
      const pageStudents = pages[p];
      
      root.render(
        React.createElement("div", { 
          id: `pdf-page-${p}`,
          style: {
            width: "210mm",
            height: "297mm",
            backgroundColor: "#ffffff",
            position: "relative",
            padding: `${marginY}mm ${marginX}mm`,
            boxSizing: "border-box"
          }
        },
          pageStudents.map((student, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = col * (cardWidth + marginX);
            const y = row * (cardHeight + marginY);
            
            return React.createElement("div", { 
              key: index, 
              style: { 
                position: "absolute",
                left: `${marginX + x}mm`,
                top: `${marginY + y}mm`,
                width: `${cardWidth}mm`,
                height: `${cardHeight}mm`
              } 
            },
              React.createElement(LoginCardTemplate, {
                studentName: student.name,
                username: student.username,
                password: student.password
              })
            );
          })
        )
      );

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 600));

      const pageElement = container.firstChild as HTMLElement;
      if (!pageElement) continue;
      
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root, .dark, * { 
              --background: #ffffff !important;
              --foreground: #000000 !important;
              --border: #e4e4e7 !important;
              --card: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      if (p > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    }

    // 4. Save the PDF
    const timestamp = new Date().toISOString().split("T")[0];
    pdf.save(`kartu-login-siswa-${timestamp}.pdf`);

    // 5. Final Cleanup
    root.unmount();
    document.body.removeChild(container);
    
    return { success: true };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
