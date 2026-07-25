import PageContainer from "@/components/layout/PageContainer";
import ImportClient from "./ImportClient";

export const metadata = {
  title: "Import Siswa | Kelas Guru",
  description: "Bulk student registration via Excel.",
};

export default function StudentImportPage() {
  return (
    <PageContainer>
      <ImportClient />
    </PageContainer>
  );
}
