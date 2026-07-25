"use client"

import * as React from "react"
import { ClassData, deleteClassSupabase as deleteClass } from "@/actions/classes-supabase"
import { V2ClassCard } from "@/components/classes/V2ClassCard"
import { UpdateClassDialog } from "@/components/classes/UpdateClassDialog"
import { DataPagination } from "@/components/ui/data-pagination"
import { useModal } from "@/hooks/use-modal"
import { toast } from "sonner"

interface V2ClassGridProps {
  data: ClassData[]
  totalPages: number
  currentPage: number
}

export function V2ClassGrid({ data, totalPages, currentPage }: V2ClassGridProps) {
  const [editingClass, setEditingClass] = React.useState<ClassData | null>(null)
  const { onOpen } = useModal()

  const handleEdit = (classData: ClassData) => {
    setEditingClass(classData)
  }

  const handleDelete = (classData: ClassData) => {
    onOpen("alert", {
      title: "Hapus Kelas",
      description: `Apakah Anda yakin ingin menghapus kelas "${classData.name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteClass(classData.id)
          if (result.success) {
            toast.success("Berhasil!", { description: "Kelas berhasil dihapus" })
          } else {
            toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus kelas" })
          }
        } catch (_error) {
          toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" })
        }
      },
    })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((classItem) => (
          <V2ClassCard
            key={classItem.id}
            classData={classItem}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <DataPagination totalPages={totalPages} currentPage={currentPage} />

      {editingClass && (
        <UpdateClassDialog
          classData={editingClass}
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
        />
      )}
    </div>
  )
}
