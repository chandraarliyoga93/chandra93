-- CreateTable
CREATE TABLE "CourseStudentFirstAccess" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseStudentFirstAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseStudentFirstAccess_courseId_studentId_key" ON "CourseStudentFirstAccess"("courseId", "studentId");

CREATE INDEX "CourseStudentFirstAccess_courseId_idx" ON "CourseStudentFirstAccess"("courseId");

-- AddForeignKey
ALTER TABLE "CourseStudentFirstAccess" ADD CONSTRAINT "CourseStudentFirstAccess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseStudentFirstAccess" ADD CONSTRAINT "CourseStudentFirstAccess_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
